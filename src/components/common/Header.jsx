// 화면 상단 헤더 + 여러 화면에서 함께 쓰는 아이콘

export function BackIcon({ size = 26 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

export function MicIcon({ size = 34, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v4" />
        </svg>
    );
}

export function HandIcon({ size = 34, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11V5a2 2 0 0 1 4 0v6" />
            <path d="M13 10.5V9a2 2 0 0 1 4 0v3" />
            <path d="M17 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-1a7 7 0 0 1-5.6-2.8L4 16a2 2 0 0 1 3-2.6l2 2" />
        </svg>
    );
}

export function SpeakerIcon({ size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a10 10 0 0 1 0 14" />
        </svg>
    );
}

export function BellIcon({ size = 30, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
    );
}

export function CheckIcon({ size = 44, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    );
}

const MARK_PATHS = {
    star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />,
    circle: <circle cx="12" cy="12" r="9" />,
    heart: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />,
    tri: <path d="M12 3l9.5 17h-19z" />,
};

// 주문 번호 옆 그림 표시 (숫자를 잘 모르는 아이도 알아보게)
export function MarkIcon({ mark, size = 32 }) {
    if (!mark) return null;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={mark.name}>
            <g fill={mark.color} stroke="#1A1A1A" strokeWidth="1">
                {MARK_PATHS[mark.shape]}
            </g>
        </svg>
    );
}

// 뒤로가기 같은 아이콘 버튼
export function IconButton({ label, outline = false, tone, onClick, children }) {
    const className = ['icon-btn', outline && 'icon-btn--outline', tone && `icon-btn--${tone}`]
        .filter(Boolean)
        .join(' ');
    return (
        <button type="button" className={className} aria-label={label} onClick={onClick}>
            {children}
        </button>
    );
}

export default function Header({ title, left, right, children }) {
    return (
        <header className="app-header">
            <div className="app-header__side">{left}</div>
            {children ?? <span className="app-header__title">{title}</span>}
            <div className="app-header__side app-header__side--end">{right}</div>
        </header>
    );
}
