import { useCallback, useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';

// 브라우저 음성 합성(TTS)으로 안내 문장을 읽어줘요.
export default function useTextToSpeech() {
    const soundOn = useSessionStore((s) => s.soundOn);

    const cancel = useCallback(() => {
        try {
            window.speechSynthesis?.cancel();
        } catch {
            // 음성 합성을 지원하지 않는 브라우저
        }
    }, []);

    const speak = useCallback(
        (text) => {
            if (!soundOn || !text) return;
            try {
                const synth = window.speechSynthesis;
                if (!synth) return;
                synth.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ko-KR';
                utterance.rate = 0.92; // 어르신·아이도 알아듣게 천천히
                synth.speak(utterance);
            } catch {
                // 음성 합성을 지원하지 않는 브라우저
            }
        },
        [soundOn],
    );

    useEffect(() => cancel, [cancel]);

    return { speak, cancel };
}
