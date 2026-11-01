import { useCallback, useEffect, useRef, useState } from 'react';

// MVP 시연용 음성 인식(STT)이에요.
// 마이크를 누르면 잠깐 "듣고 있어요" 상태가 된 뒤 onResult 를 불러요.
// 실제 연동 시 이 훅 안에서 Web Speech API 나 백엔드 STT 결과를 넘기면 돼요.
export default function useSpeechToText({ delay = 1100 } = {}) {
    const [listening, setListening] = useState(false);
    const timerRef = useRef(null);

    const listen = useCallback(
        (onResult) => {
            if (timerRef.current) return;
            setListening(true);
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                setListening(false);
                onResult?.();
            }, delay);
        },
        [delay],
    );

    useEffect(
        () => () => {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        },
        [],
    );

    return { listening, listen };
}
