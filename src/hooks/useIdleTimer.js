import { useEffect, useRef } from 'react';

// 일정 시간(기본 30초) 동안 아무것도 누르지 않으면 onIdle 을 불러요.
// repeat 이 true 면 그 뒤에도 가만히 있으면 timeout 마다 다시 불러요 (30초 → 1분 → 1분 30초).
export default function useIdleTimer(onIdle, timeout = 30000, enabled = true, repeat = false) {
    const callbackRef = useRef(onIdle);

    useEffect(() => {
        callbackRef.current = onIdle;
    }, [onIdle]);

    useEffect(() => {
        if (!enabled) return undefined;
        let timer;
        const arm = () => {
            timer = setTimeout(() => {
                callbackRef.current?.();
                if (repeat) arm();
            }, timeout);
        };
        const reset = () => {
            clearTimeout(timer);
            arm();
        };
        const events = ['pointerdown', 'keydown', 'touchstart'];
        events.forEach((name) => window.addEventListener(name, reset));
        reset();
        return () => {
            clearTimeout(timer);
            events.forEach((name) => window.removeEventListener(name, reset));
        };
    }, [timeout, enabled, repeat]);
}
