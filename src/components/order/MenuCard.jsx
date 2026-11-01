import formatPrice from '../../utils/formatPrice';

const TILE_BG = {
    hot: '#F6EDE5',
    ice: '#E8F1FA',
    latte: '#FBF2E8',
    choco: '#F3E8E1',
    straw: '#FDECF1',
    juice: '#FEF6DC',
    cookie: '#F8EEE2',
    bread: '#FBF1E1',
};

const STROKE = '#3A2A1E';

function Cup({ fill, top, ice }) {
    return (
        <>
            <path d="M16 18h32l-4 38H20z" fill={fill} stroke={STROKE} strokeWidth="2" />
            <rect x="13" y="13" width="38" height="6" rx="3" fill={top} stroke={STROKE} strokeWidth="2" />
            {ice && (
                <>
                    <rect x="24" y="26" width="7" height="7" rx="1.5" fill="#fff" opacity=".85" />
                    <rect x="33" y="31" width="7" height="7" rx="1.5" fill="#fff" opacity=".85" />
                    <path d="M38 13l6-10" stroke={STROKE} strokeWidth="2.5" />
                </>
            )}
        </>
    );
}

function Carton({ fill }) {
    return (
        <>
            <path d="M18 20l14-10 14 10v36H18z" fill={fill} stroke={STROKE} strokeWidth="2" />
            <rect x="22" y="30" width="20" height="14" rx="2" fill="#fff" opacity=".85" />
        </>
    );
}

const SHAPES = {
    hot: <Cup fill="#7A4A2A" top="#F2E6DA" />,
    ice: <Cup fill="#5A3420" top="#DDEBF7" ice />,
    latte: <Cup fill="#C89B72" top="#FFF6EC" />,
    choco: <Carton fill="#8B5A3C" />,
    straw: <Carton fill="#F49AB0" />,
    juice: (
        <>
            <path d="M20 16h24l-3 40H23z" fill="#F7C948" stroke={STROKE} strokeWidth="2" />
            <circle cx="44" cy="16" r="7" fill="#E04848" stroke={STROKE} strokeWidth="2" />
        </>
    ),
    cookie: (
        <>
            <circle cx="32" cy="34" r="20" fill="#D9A066" stroke={STROKE} strokeWidth="2" />
            <circle cx="25" cy="28" r="3" fill="#4A2C1A" />
            <circle cx="37" cy="36" r="3" fill="#4A2C1A" />
            <circle cx="28" cy="42" r="2.5" fill="#4A2C1A" />
            <circle cx="40" cy="26" r="2.5" fill="#4A2C1A" />
        </>
    ),
    bread: (
        <>
            <path d="M8 40c4-16 44-16 48 0-8 6-40 6-48 0z" fill="#E8B05C" stroke={STROKE} strokeWidth="2" />
            <path d="M24 30l4 12M34 28v14M44 30l-4 12" stroke={STROKE} strokeWidth="2" />
        </>
    ),
};

// 메뉴 그림 (실제 사진이 생기면 이 컴포넌트만 <img> 로 바꾸면 돼요)
export function FoodIcon({ icon, size = 72 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
            {SHAPES[icon] ?? SHAPES.hot}
        </svg>
    );
}

// 그림 + 연한 배경 타일
export function FoodTile({ icon, size = 64, iconSize = 44, radius = 12, className = '' }) {
    return (
        <span
            className={`food-tile ${className}`.trim()}
            style={{ width: size, height: size, borderRadius: radius, background: TILE_BG[icon] ?? '#F3F5F9' }}
        >
            <FoodIcon icon={icon} size={iconSize} />
        </span>
    );
}

// 눌러서 주문 화면의 큰 사진 메뉴 카드
export default function MenuCard({ item, onClick }) {
    return (
        <button type="button" className="menu-card" onClick={() => onClick?.(item)}>
            <span className="menu-card__photo" style={{ background: TILE_BG[item.icon] ?? '#F3F5F9' }}>
                <FoodIcon icon={item.icon} size={72} />
            </span>
            <span className="menu-card__name">{item.name}</span>
            <span className="menu-card__price">{formatPrice(item.price)}</span>
        </button>
    );
}
