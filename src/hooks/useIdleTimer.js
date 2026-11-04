import { useCallback, useEffect, useRef } from 'react';

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

// 무응답 단계 (STEP 10-3): 30초 → 1분 → 1분 30초 마다 onStep(0 · 1 · 2) 을 불러요.
// 손님이 화면을 만지면 처음부터 다시 세요 (시연 버튼은 제외). 돌려주는 next() 로 시연 때 바로 다음 단계를 띄워요.
// enabled 가 false 인 동안은 멈춰요 (예: 듣는 중·확인 중·실패 안내 중). 다시 true 가 되면 30초부터 새로 세요.
export function useIdleSteps(onStep, steps = 3, timeout = 30000, enabled = true) {
    const stage = useRef(0);
    const stepRef = useRef(onStep);

    useEffect(() => {
        stepRef.current = onStep;
    }, [onStep]);

    useEffect(() => {
        const onTouch = (e) => {
            if (!e.target.closest?.('.demo-panel')) stage.current = 0;
        };
        window.addEventListener('pointerdown', onTouch);
        return () => window.removeEventListener('pointerdown', onTouch);
    }, []);

    const next = useCallback(() => {
        if (stage.current >= steps) return;
        const now = stage.current;
        stage.current += 1;
        stepRef.current?.(now);
    }, [steps]);

    useIdleTimer(next, timeout, enabled, true);
    return next;
}