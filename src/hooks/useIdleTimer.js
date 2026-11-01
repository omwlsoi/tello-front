import { useEffect, useRef } from 'react';

// 일정 시간(기본 30초) 동안 아무것도 누르지 않으면 onIdle 을 불러요.
export default function useIdleTimer(onIdle, timeout = 30000, enabled = true) {
    const callbackRef = useRef(onIdle);

    useEffect(() => {
        callbackRef.current = onIdle;
    }, [onIdle]);

    useEffect(() => {
        if (!enabled) return undefined;
        let timer;
        const reset = () => {
            clearTimeout(timer);
            timer = setTimeout(() => callbackRef.current?.(), timeout);
        };
        const events = ['pointerdown', 'keydown', 'touchstart'];
        events.forEach((name) => window.addEventListener(name, reset));
        reset();
        return () => {
            clearTimeout(timer);
            events.forEach((name) => window.removeEventListener(name, reset));
        };
    }, [timeout, enabled]);
}
