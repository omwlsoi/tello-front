import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function useSpeechToText({ lang = 'ko-KR' } = {}) {
    const [listening, setListening] = useState(false);
    const recRef = useRef(null);

    const listen = useCallback(
        (onResult) => {
            if (recRef.current) return;

            if (!SpeechRecognition) {
                console.warn('[STT] 이 브라우저는 Web Speech API를 지원하지 않아요 (Chrome/Edge 사용)');
                onResult?.('');
                return;
            }

            const rec = new SpeechRecognition();
            rec.lang = lang;
            rec.interimResults = false;
            rec.continuous = false;
            rec.maxAlternatives = 1;

            let transcript = '';
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                recRef.current = null;
                // Safari는 끝난 뒤에도 마이크를 잡고 있어서 확실히 놓아줘요
                rec.onresult = rec.onerror = rec.onend = null;
                try {
                    rec.abort();
                } catch {
                    // 이미 끝난 상태면 무시
                }
                setListening(false);
                onResult?.(transcript.trim());
            };

            rec.onresult = (e) => {
                transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ');
            };
            rec.onerror = (e) => console.warn('[STT error]', e.error); // not-allowed, no-speech 등
            rec.onend = finish; // 성공/실패 모두 여기서 한 번만 마무리

            recRef.current = rec;
            setListening(true);
            try {
                rec.start();
            } catch (err) {
                console.error('[STT start 실패]', err);
                finish();
            }
        },
        [lang],
    );

    useEffect(
        () => () => {
            if (recRef.current) {
                recRef.current.onend = null;
                recRef.current.abort();
                recRef.current = null;
            }
        },
        [],
    );

    return { listening, listen };
}