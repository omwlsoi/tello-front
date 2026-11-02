// 화면 상단 헤더 + 여러 화면에서 함께 쓰는 아이콘·캐릭터
import storeInfo from '../../mocks/store.json';

const stroke = (size, color, width = 2.2) => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
});

export function BackIcon({ size = 24 }) {
    return (
        <svg {...stroke(size, 'currentColor')}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

export function ArrowIcon({ size = 18 }) {
    return (
        <svg {...stroke(size, 'currentColor', 2.4)}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

export function MicIcon({ size = 32, color = 'currentColor' }) {
    return (
        <svg {...stroke(size, color)}>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v4" />
        </svg>
    );
}

export function HandIcon({ size = 24, color = 'currentColor' }) {
    return (
        <svg {...stroke(size, color)}>
            <path d="M9 11V5a2 2 0 0 1 4 0v6" />
            <path d="M13 10.5V9a2 2 0 0 1 4 0v3" />
            <path d="M17 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-1a7 7 0 0 1-5.6-2.8L4 16a2 2 0 0 1 3-2.6l2 2" />
        </svg>
    );
}

// "메뉴 고르기" 제목 옆 손가락 그림
export function TapIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M9 11V5a2 2 0 0 1 4 0v6M13 10.5V9a2 2 0 0 1 4 0v3M17 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-1a7 7 0 0 1-5.6-2.8L4 16a2 2 0 0 1 3-2.6l2 2"
                fill="#DCE7FF"
                stroke="#1D4ED8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M5 4.5l1.5 1.5M3 9h2M15.5 3.5l-1 1.5" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export function BookIcon({ size = 24, color = 'currentColor' }) {
    return (
        <svg {...stroke(size, color, 2.2)}>
            <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
            <path d="M12 6.5v13" />
        </svg>
    );
}

// 소리 막대 (말로 주문 표시)
export function WaveIcon({ width = 26, height = 22, color = '#1D4ED8' }) {
    return (
        <svg width={width} height={height} viewBox="0 0 34 28" aria-hidden="true">
            <rect x="1" y="9" width="5" height="10" rx="2.5" fill={color} />
            <rect x="10" y="2" width="5" height="24" rx="2.5" fill={color} />
            <rect x="19" y="6" width="5" height="16" rx="2.5" fill={color} />
            <rect x="28" y="10" width="5" height="8" rx="2.5" fill={color} />
        </svg>
    );
}

export function CheckIcon({ size = 20, color = 'currentColor', width = 3 }) {
    return (
        <svg {...stroke(size, color, width)}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    );
}

export function CheckCircleIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#1D4ED8" />
            <path d="M7 12.5l3.3 3.3L17 9" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function PlusIcon({ size = 18 }) {
    return (
        <svg {...stroke(size, '#FFFFFF', 2.8)}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function InfoIcon({ size = 20 }) {
    return (
        <svg {...stroke(size, 'var(--warn-icon)')} style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v0.5" />
        </svg>
    );
}

export function CardIcon({ size = 26 }) {
    return (
        <svg {...stroke(size, '#FFFFFF')}>
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
            <path d="M2.5 10h19" />
            <path d="M6.5 15h4" />
        </svg>
    );
}

export function BellIcon({ size = 30, color = 'currentColor' }) {
    return (
        <svg {...stroke(size, color, 2)}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
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
            <g fill={mark.color} stroke="#14213D" strokeWidth="1">
                {MARK_PATHS[mark.shape]}
            </g>
        </svg>
    );
}

// ===== 텔로 캐릭터 =====
// face: smile | listen | think | happy | sad | focus
// pose: none | brew(커피 만드는 중) | done(다 됐어요)
const DOT_EYES = {
    eL: 'M39 50 l0 0.01',
    eR: 'M61 50 l0 0.01',
    ew: 9,
    gLx: 40.6,
    gRx: 62.6,
    gy: 48.3,
    gOp: 1,
    b: '',
    tearOp: 0,
};
const FACES = {
    smile: { ...DOT_EYES, m: 'M44.5 61 q5.5 5 11 0', mFill: 'none' },
    listen: { ...DOT_EYES, ew: 10, m: 'M46 61.5 a4 4.6 0 1 0 8 0 a4 4.6 0 1 0 -8 0', mFill: '#14213D' },
    think: { ...DOT_EYES, eL: 'M41 47 l0 0.01', eR: 'M63 47 l0 0.01', gLx: 42.6, gRx: 64.6, gy: 45.3, m: 'M45 64 q5 1.5 10 -2', mFill: 'none' },
    happy: { ...DOT_EYES, eL: 'M34.5 51.5 q4.5 -5 9 0', eR: 'M56.5 51.5 q4.5 -5 9 0', ew: 3.4, gOp: 0, m: 'M42.5 59.5 q7.5 8 15 0', mFill: 'none' },
    sad: { ...DOT_EYES, eL: 'M39 51 l0 0.01', eR: 'M61 51 l0 0.01', gy: 49.3, m: 'M44.5 65.5 q5.5 -4 11 0', mFill: 'none', b: 'M31 43.5 l8 -3.2 M69 43.5 l-8 -3.2', tearOp: 1 },
    focus: { ...DOT_EYES, eL: 'M39 53 l0 0.01', eR: 'M61 53 l0 0.01', gy: 51.3, m: 'M46 63.5 q4 2.6 8 0', mFill: 'none' },
};
const POSES = {
    none: { aL: [17, 70, 18], aR: [83, 70, -18], brew: 0, done: 0 },
    brew: { aL: [36, 85, 58], aR: [64, 85, -58], brew: 1, done: 0 },
    done: { aL: [6, 32, -28], aR: [94, 32, 28], brew: 0, done: 1 },
};

function Arm({ at }) {
    const [x, y, r] = at;
    return (
        <ellipse cx={x} cy={y} rx="5.8" ry="10.5" fill="#B7CDFF" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1" transform={`rotate(${r} ${x} ${y})`} />
    );
}

export function Tello({ face = 'smile', pose = 'none', size = 160, className = '' }) {
    const f = FACES[face] ?? FACES.smile;
    const p = POSES[pose] ?? POSES.none;
    return (
        <svg
            className={className}
            width={size}
            height={Math.round(size * 1.2)}
            viewBox="0 0 100 120"
            aria-hidden="true"
            style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}
        >
            <defs>
                <linearGradient id="tello-glass" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor="#FFF1C2" />
                    <stop offset="1" stopColor="#9CBCFF" />
                </linearGradient>
                <radialGradient id="tello-halo" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#FFE27A" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#FFE27A" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="58" r="56" fill="url(#tello-halo)" />
            <g opacity={p.done}>
                <path d="M14 10 l1.4 -4.2 l1.4 4.2 l4.2 1.4 l-4.2 1.4 l-1.4 4.2 l-1.4 -4.2 l-4.2 -1.4 z" fill="#F5C400" />
                <path d="M27 0 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 z" fill="#5B8CFF" />
                <path d="M72 -1 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 z" fill="#5B8CFF" />
            </g>
            <ellipse cx="50" cy="115" rx="27" ry="3.6" fill="#14213D" opacity="0.1" />
            <rect x="32" y="97" width="14" height="17" rx="7" fill="#86A9F5" />
            <rect x="54" y="97" width="14" height="17" rx="7" fill="#86A9F5" />
            <rect x="18" y="8" width="64" height="98" rx="32" fill="url(#tello-glass)" opacity="0.95" />
            <ellipse cx="33" cy="30" rx="7.5" ry="14" fill="#FFFFFF" opacity="0.5" transform="rotate(-18 33 30)" />
            <rect x="18.8" y="8.8" width="62.4" height="96.4" rx="31.2" fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.6" />
            <ellipse cx="30.5" cy="61" rx="6" ry="3.4" fill="#F59A97" opacity="0.6" />
            <ellipse cx="69.5" cy="61" rx="6" ry="3.4" fill="#F59A97" opacity="0.6" />
            <path d={f.eL} fill="none" stroke="#14213D" strokeWidth={f.ew} strokeLinecap="round" />
            <path d={f.eR} fill="none" stroke="#14213D" strokeWidth={f.ew} strokeLinecap="round" />
            <circle cx={f.gLx} cy={f.gy} r="1.5" fill="#FFFFFF" opacity={f.gOp} />
            <circle cx={f.gRx} cy={f.gy} r="1.5" fill="#FFFFFF" opacity={f.gOp} />
            <path d={f.m} fill={f.mFill} stroke="#14213D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {f.b && <path d={f.b} fill="none" stroke="#14213D" strokeWidth="2.6" strokeLinecap="round" />}
            <path d="M35.5 55 q-2.8 4.2 0 6.4 q2.8 -2.2 0 -6.4 z" fill="#A9DDF7" stroke="#6CBDE6" strokeWidth="0.8" opacity={f.tearOp} />
            <g opacity={p.brew}>
                <path d="M46 72 q-2 -3 0 -6 M54 72 q-2 -3 0 -6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M39 76 h22 l-2.6 20 h-16.8 z" fill="#FFFFFF" stroke="#C3CFE6" strokeWidth="1.2" />
                <rect x="40.3" y="82" width="19.4" height="6" fill="#FFC93C" />
                <rect x="37.5" y="73.5" width="25" height="4" rx="2" fill="#EEF2FA" stroke="#C3CFE6" strokeWidth="1" />
            </g>
            <Arm at={p.aL} />
            <Arm at={p.aR} />
            <path d="M17 46 C14 -3, 86 -3, 83 46" fill="none" stroke="#C9D3E6" strokeWidth="7" strokeLinecap="round" />
            <path d="M17 46 C14 -3, 86 -3, 83 46" fill="none" stroke="#FFFFFF" strokeWidth="4.6" strokeLinecap="round" />
            <rect x="11" y="38" width="11" height="21" rx="5.5" fill="#FFFFFF" stroke="#C9D3E6" strokeWidth="1.3" />
            <rect x="78" y="38" width="11" height="21" rx="5.5" fill="#FFFFFF" stroke="#C9D3E6" strokeWidth="1.3" />
            <path d="M15 57 Q17 70 33 70" fill="none" stroke="#DDE4F0" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="35" cy="70" r="3.2" fill="#2C3A5A" />
            <g opacity={p.done}>
                <circle cx="86" cy="18" r="8.5" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M82 18.3 l2.8 2.8 l5.4 -5.6" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

// tell 로고 (말풍선 + 소리 막대)
export function Logo({ height = 40 }) {
    return (
        <svg height={height} viewBox="0 0 808 300" role="img" aria-label="tell 로고" style={{ display: 'block', width: 'auto' }}>
            <text
                x="0"
                y="262"
                fontFamily="'Pretendard Variable', Pretendard, sans-serif"
                fontSize="330"
                fontWeight="900"
                letterSpacing="-14"
                textLength="500"
                lengthAdjust="spacingAndGlyphs"
                fill="#1D4ED8"
            >
                tell
            </text>
            <ellipse cx="664" cy="132" rx="142" ry="126" fill="#1D4ED8" />
            <path d="M568 214 L550 298 L622 250 Z" fill="#1D4ED8" />
            <g fill="#FFC93C">
                <rect x="598" y="92" width="22" height="72" rx="11" />
                <rect x="640" y="66" width="22" height="124" rx="11" />
                <rect x="682" y="84" width="22" height="88" rx="11" />
                <rect x="722" y="106" width="22" height="44" rx="11" />
            </g>
        </svg>
    );
}

// 로고 + 가게 이름 (시작 화면 · 주문 완료 화면)
export function BrandHeader() {
    return (
        <header className="brand-header">
            <Logo />
            <span className="brand-header__store">
                <span className="brand-dot" />
                {storeInfo.name}
            </span>
        </header>
    );
}

// 뒤로가기 같은 동그란 아이콘 버튼
export function IconButton({ label, tone, onClick, children }) {
    const className = ['icon-btn', tone && `icon-btn--${tone}`].filter(Boolean).join(' ');
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
