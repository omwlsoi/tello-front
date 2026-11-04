// 화면 상단 헤더 + 여러 화면에서 함께 쓰는 아이콘·캐릭터
import storeInfo from '../../mocks/store.json';
import { useSessionStore } from '../../stores/sessionStore';

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

// 확장 아이콘: 작은 네모에서 큰 네모로 커지는 화살표
export function ExpandIcon({ size = 18 }) {
    return (
        <svg {...stroke(size, 'currentColor', 2.4)}>
            <path d="M3 9V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M12 12l6-6M13.5 6H18v4.5" />
        </svg>
    );
}

export function CartIcon({ size = 24 }) {
    return (
        <svg {...stroke(size, 'currentColor', 2.2)}>
            <path d="M3 4h2.2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
            <circle cx="9.5" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
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
    eL: 'M42.5 68.5 l0 0.01',
    eR: 'M57.5 68.5 l0 0.01',
    ew: 6,
    gLx: 43.6,
    gRx: 58.6,
    gy: 67.2,
    gOp: 1,
    b: '',
    tearOp: 0,
};
const FACES = {
    smile: { ...DOT_EYES, m: 'M46.5 74.5 q3.5 3 7 0', mFill: 'none' },
    listen: { ...DOT_EYES, ew: 6.5, m: 'M47.6 75.6 a2.4 2.9 0 1 0 4.8 0 a2.4 2.9 0 1 0 -4.8 0', mFill: '#14213D' },
    think: { ...DOT_EYES, eL: 'M44 66.5 l0 0.01', eR: 'M59 66.5 l0 0.01', gLx: 45.1, gRx: 60.1, gy: 65.2, m: 'M47 77 q3 1 6 -1.5', mFill: 'none' },
    happy: { ...DOT_EYES, eL: 'M38.8 69.5 q3.7 -4 7.4 0', eR: 'M53.8 69.5 q3.7 -4 7.4 0', ew: 2.4, gOp: 0, m: 'M45 74 q5 5.5 10 0', mFill: 'none' },
    sad: { ...DOT_EYES, eL: 'M42.5 69.5 l0 0.01', eR: 'M57.5 69.5 l0 0.01', gy: 68.2, m: 'M46.5 78 q3.5 -2.6 7 0', mFill: 'none', b: 'M37.5 64 l5 -1.8 M62.5 64 l-5 -1.8', tearOp: 1 },
    focus: { ...DOT_EYES, eL: 'M42.5 70 l0 0.01', eR: 'M57.5 70 l0 0.01', gy: 68.7, m: 'M47.5 76.5 q2.5 1.8 5 0', mFill: 'none' },
};
const POSES = {
    none: { aL: [30, 90, 35], aR: [70, 90, -35], brew: 0, done: 0 },
    brew: { aL: [38, 93, 62], aR: [62, 93, -62], brew: 1, done: 0 },
    done: { aL: [13, 80, -40], aR: [87, 80, 40], brew: 0, done: 1 },
};
const LOOP = 'M50 30 C 60 22, 63 9, 54 4.5 C 45 0, 38 9, 45 15 C 51 20, 59 15, 57 9';

function Arm({ at }) {
    const [x, y, r] = at;
    return (
        <ellipse cx={x} cy={y} rx="4.6" ry="8.6" fill="#FFFFFF" stroke="#D5DEEF" strokeWidth="1" transform={`rotate(${r} ${x} ${y})`} />
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
                <linearGradient id="tr-hood" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0" stopColor="#C3D5FB" />
                    <stop offset="1" stopColor="#7E9FEA" />
                </linearGradient>
                <linearGradient id="tr-loop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#B9CEFA" />
                    <stop offset="1" stopColor="#86A6EE" />
                </linearGradient>
                <radialGradient id="tr-halo" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#FFE27A" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#FFE27A" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="66" r="52" fill="url(#tr-halo)" />
            <g opacity={p.done}>
                <path d="M12 26 l1.4 -4.2 l1.4 4.2 l4.2 1.4 l-4.2 1.4 l-1.4 4.2 l-1.4 -4.2 l-4.2 -1.4 z" fill="#F5C400" />
                <path d="M24 12 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 z" fill="#5B8CFF" />
                <path d="M74 6 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 z" fill="#5B8CFF" />
            </g>
            <ellipse cx="50" cy="115" rx="22" ry="3.4" fill="#14213D" opacity="0.1" />
            {/* 다리 · 몸 */}
            <rect x="39" y="94" width="9" height="19" rx="4.5" fill="#FFFFFF" stroke="#D5DEEF" strokeWidth="1" />
            <rect x="52" y="94" width="9" height="19" rx="4.5" fill="#FFFFFF" stroke="#D5DEEF" strokeWidth="1" />
            <rect x="35" y="84" width="30" height="17" rx="10" fill="#8FAFF1" />
            {/* 머리 위 고리 + 후드 */}
            <path d={LOOP} fill="none" stroke="#7E9FEA" strokeWidth="10" strokeLinecap="round" />
            <path d={LOOP} fill="none" stroke="url(#tr-loop)" strokeWidth="7.4" strokeLinecap="round" />
            <path d="M50 24 C 64 30, 87 44, 86 66 C 85 86, 69 93, 50 93 C 31 93, 15 86, 14 66 C 13 44, 36 30, 50 24 Z" fill="url(#tr-hood)" />
            <ellipse cx="29" cy="44" rx="5" ry="10" fill="#FFFFFF" opacity="0.35" transform="rotate(35 29 44)" />
            {/* 얼굴 · 앞머리 · 볼 */}
            <ellipse cx="50" cy="67" rx="24" ry="20" fill="#9BB8F4" />
            <ellipse cx="50" cy="67.5" rx="21.5" ry="17.5" fill="#FFFFFF" />
            <path
                d="M28.6 66 C 26.5 51, 37 45.5, 50 45.5 C 63 45.5, 73.5 51, 71.4 66 C 67 59.5, 61 57, 55.5 56 C 53.5 58.5, 51.5 59.5, 50 59.5 C 48.5 58, 46 56.5, 44 56.5 C 38 57.5, 32.5 61, 28.6 66 Z"
                fill="#2B4DB5"
            />
            <path d="M36 52 C 40 48.5, 45 47.5, 49 47.8" fill="none" stroke="#5D7FDB" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="36" cy="75" rx="4.8" ry="3.2" fill="#F6C343" opacity="0.9" />
            <ellipse cx="64" cy="75" rx="4.8" ry="3.2" fill="#F6C343" opacity="0.9" />
            {/* 표정 */}
            <path d={f.eL} fill="none" stroke="#14213D" strokeWidth={f.ew} strokeLinecap="round" />
            <path d={f.eR} fill="none" stroke="#14213D" strokeWidth={f.ew} strokeLinecap="round" />
            <circle cx={f.gLx} cy={f.gy} r="1" fill="#FFFFFF" opacity={f.gOp} />
            <circle cx={f.gRx} cy={f.gy} r="1" fill="#FFFFFF" opacity={f.gOp} />
            <path d={f.m} fill={f.mFill} stroke="#14213D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {f.b && <path d={f.b} fill="none" stroke="#14213D" strokeWidth="1.8" strokeLinecap="round" />}
            <path d="M40.5 72 q-2 3 0 4.6 q2 -1.6 0 -4.6 z" fill="#A9DDF7" stroke="#6CBDE6" strokeWidth="0.7" opacity={f.tearOp} />
            {/* 헤드셋 */}
            <path d="M16 63 C 13 33, 87 33, 84 63" fill="none" stroke="#2A3F8F" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
            <rect x="11.5" y="58" width="7" height="14" rx="3.5" fill="#2A3F8F" />
            <path d="M81 72 Q 78 82 64 81" fill="none" stroke="#2A3F8F" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="62.5" cy="81" rx="3" ry="2.4" fill="#2A3F8F" />
            <circle cx="84" cy="65" r="8.5" fill="#2A3F8F" />
            <circle cx="84" cy="65" r="5.8" fill="#FFF4CF" />
            <path d="M81.2 62.6 h5.6 M84 62.6 v5.6" fill="none" stroke="#F0B400" strokeWidth="1.9" strokeLinecap="round" />
            {/* 커피 만드는 중 */}
            <g opacity={p.brew}>
                <path d="M46 84 q-2 -3 0 -6 M54 84 q-2 -3 0 -6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M40 87 h20 l-2.4 16 h-15.2 z" fill="#FFFFFF" stroke="#C3CFE6" strokeWidth="1.2" />
                <rect x="41.2" y="92" width="17.6" height="5" fill="#FFC93C" />
                <rect x="38.5" y="85" width="23" height="3.6" rx="1.8" fill="#EEF2FA" stroke="#C3CFE6" strokeWidth="1" />
            </g>
            <Arm at={p.aL} />
            <Arm at={p.aR} />
            <g opacity={p.done}>
                <circle cx="90" cy="30" r="8" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M86.2 30.3 l2.6 2.6 l5.1 -5.3" fill="none" stroke="#14213D" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
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

// 큰 글씨 모드 켜기·끄기 버튼 (켜면 노랑)
export function ZoomButton() {
    const on = useSessionStore((st) => st.bigText);
    const toggle = useSessionStore((st) => st.toggleBigText);
    return (
        <button
            type="button"
            className={`zoom-btn ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            aria-label={on ? '큰 글씨 끄기' : '큰 글씨로 보기'}
            onClick={toggle}
        >
            <ExpandIcon />
            큰 글씨
        </button>
    );
}

// 로고 + 가게 이름 + 큰 글씨 버튼 (시작 화면 · 주문 완료 화면)
export function BrandHeader() {
    return (
        <header className="brand-header">
            <Logo />
            <span className="brand-header__store">
                <span className="brand-dot" />
                {storeInfo.name}
            </span>
            <ZoomButton />
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