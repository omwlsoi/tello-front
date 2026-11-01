import { useEffect } from 'react';

// 잠깐 떴다 사라지는 알림 ("아이스 아메리카노 담았어요")
export default function Toast({ message, onDone, duration = 1800 }) {
    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(() => onDone?.(), duration);
        return () => clearTimeout(timer);
    }, [message, onDone, duration]);

    if (!message) return null;
    return (
        <div className="toast" role="status">
            {message}
        </div>
    );
}
