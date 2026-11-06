import { useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '../stores/sessionStore';

// 긴 답변을 문장 단위(최대 maxLen자)로 잘라요.
// Chrome은 한 번에 긴 문장을 읽으면 약 15초 뒤에 말을 멈추는 문제가 있어서예요.
function splitText(text, maxLen = 50) {
    const clean = text.replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?。！？]+[.!?。！？]*/g) || [clean];
    const chunks = [];
    sentences.forEach((s) => {
        let rest = s.trim();
        while (rest.length > maxLen) {
            let idx = rest.lastIndexOf(',', maxLen);
            if (idx < maxLen / 2) idx = rest.lastIndexOf(' ', maxLen);
            const end = idx >= maxLen / 2 ? idx + 1 : maxLen;
            chunks.push(rest.slice(0, end).trim());
            rest = rest.slice(end).trim();
        }
        if (rest) chunks.push(rest);
    });
    return chunks;
}

// 브라우저 음성 합성(TTS)으로 안내 문장을 읽어줘요.
// speak(text) 는 Promise 를 돌려줘요: 끝까지 읽으면 true, 중간에 취소되면 false.
// 예) await speak(answer); listen(...)  → AI가 말을 다 끝낸 뒤에 마이크를 켜요.
export default function useTextToSpeech() {
    const soundOn = useSessionStore((s) => s.soundOn);
    const tokenRef = useRef(0); // speak/cancel 할 때마다 올려서 이전 재생을 무효화
    const currentRef = useRef(null); // 재생 중 utterance 참조 유지 (GC로 끊기는 것 방지)
    const resolveRef = useRef(null);
    const voiceRef = useRef(null);

    // 한국어 로컬 음성을 우선 사용 (온라인 음성이 길이 제한에 더 취약해요)
    useEffect(() => {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        if (!synth) return undefined;
        const pick = () => {
            const ko = synth.getVoices().filter((v) => v.lang?.replace('_', '-').startsWith('ko'));
            voiceRef.current = ko.find((v) => v.localService) || ko[0] || null;
        };
        pick();
        synth.addEventListener?.('voiceschanged', pick);
        return () => synth.removeEventListener?.('voiceschanged', pick);
    }, []);

    const cancel = useCallback(() => {
        tokenRef.current += 1;
        currentRef.current = null;
        try {
            window.speechSynthesis?.cancel();
        } catch {
            // 음성 합성을 지원하지 않는 브라우저
        }
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    const speak = useCallback(
        (text) =>
            new Promise((resolve) => {
                const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
                if (!soundOn || !text || !synth) {
                    resolve(true);
                    return;
                }
                cancel(); // 이전 재생 정리
                const myToken = tokenRef.current;
                resolveRef.current = resolve;

                const chunks = splitText(text);
                let i = 0;

                const done = (ok) => {
                    if (tokenRef.current !== myToken) return;
                    currentRef.current = null;
                    resolveRef.current = null;
                    resolve(ok);
                };

                const next = () => {
                    if (tokenRef.current !== myToken) return;
                    if (i >= chunks.length) {
                        done(true);
                        return;
                    }
                    const u = new SpeechSynthesisUtterance(chunks[i]);
                    i += 1;
                    u.lang = 'ko-KR';
                    u.rate = 0.92; // 어르신·아이도 알아듣게 천천히
                    if (voiceRef.current) u.voice = voiceRef.current;

                    let advanced = false;
                    // onend 가 안 오는 브라우저 버그 대비: 충분히 기다린 뒤 다음 문장으로
                    const guard = setTimeout(() => go(), u.text.length * 350 + 4000);
                    function go() {
                        if (advanced) return;
                        advanced = true;
                        clearTimeout(guard);
                        next();
                    }

                    u.onend = go;
                    u.onerror = (e) => {
                        clearTimeout(guard);
                        advanced = true;
                        if (e.error === 'interrupted' || e.error === 'canceled') {
                            done(false); // 다른 곳에서 speechSynthesis.cancel() 한 경우
                            return;
                        }
                        console.warn('[TTS error]', e.error);
                        next(); // 이 문장만 건너뛰고 계속
                    };

                    currentRef.current = u;
                    synth.speak(u);
                };

                next();
            }),
        [soundOn, cancel],
    );

    useEffect(() => cancel, [cancel]);

    return { speak, cancel };
}