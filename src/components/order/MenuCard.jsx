import { useId } from 'react';
import { PlusIcon } from '../common/Header';
import formatPrice from '../../utils/formatPrice';

const SHADOW = <ellipse cx="32" cy="60.5" rx="16" ry="2.4" fill="#14213D" opacity="0.1" />;

// 따뜻한 컵 (아메리카노·라떼)
function Cup({ uid, fill }) {
    return (
        <>
            <defs>
                <linearGradient id={`${uid}cup`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#E3EAF8" />
                </linearGradient>
            </defs>
            {SHADOW}
            <path d="M28 9 q-3 -3 0 -6 M36 9 q-3 -3 0 -6" fill="none" stroke="#9FBCFF" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M17 19 h30 l-3.4 34.5 a4.5 4.5 0 0 1 -4.5 4 h-14.2 a4.5 4.5 0 0 1 -4.5 -4 z" fill={`url(#${uid}cup)`} stroke="#C9D3E6" strokeWidth="1.2" />
            <path d="M19.4 36 h25.2 l-1.2 12.5 h-22.8 z" fill={fill} />
            <path d="M21.4 37.5 h5 l-0.6 9.5 h-3.6 z" fill="#FFFFFF" opacity="0.3" />
            <path d="M21.5 22.5 l1.3 10" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="14" y="13" width="36" height="7.5" rx="3.75" fill="#FFFFFF" stroke="#C9D3E6" strokeWidth="1.2" />
            <rect x="22" y="9.5" width="20" height="5" rx="2.5" fill="#F3F6FC" stroke="#C9D3E6" strokeWidth="1.2" />
        </>
    );
}

// 얼음 든 투명 컵 (아이스 커피)
function IceGlass({ uid }) {
    return (
        <>
            <defs>
                <linearGradient id={`${uid}glass`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F4F8FF" />
                    <stop offset="1" stopColor="#D3E2FF" />
                </linearGradient>
                <linearGradient id={`${uid}cof`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#A86C46" />
                    <stop offset="1" stopColor="#5A3420" />
                </linearGradient>
            </defs>
            {SHADOW}
            <path d="M36 16 L42 1.5" stroke="#5B8CFF" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M17 20 h30 l-3.4 33.5 a4.5 4.5 0 0 1 -4.5 4 h-14.2 a4.5 4.5 0 0 1 -4.5 -4 z" fill={`url(#${uid}glass)`} stroke="#B9CBEE" strokeWidth="1.2" />
            <path d="M19.3 28 h25.4 l-2.5 25.3 a3.5 3.5 0 0 1 -3.5 3.1 h-13.4 a3.5 3.5 0 0 1 -3.5 -3.1 z" fill={`url(#${uid}cof)`} />
            <rect x="22" y="29" width="8" height="8" rx="2.2" fill="#FFFFFF" opacity="0.85" transform="rotate(-10 26 33)" />
            <rect x="33" y="31" width="8" height="8" rx="2.2" fill="#FFFFFF" opacity="0.75" transform="rotate(12 37 35)" />
            <path d="M21.3 23 l1.4 11" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
            <path d="M15 20 a17 10 0 0 1 34 0 z" fill="#F3F7FF" opacity="0.92" stroke="#B9CBEE" strokeWidth="1.2" />
            <rect x="13" y="18.5" width="38" height="4" rx="2" fill="#FFFFFF" stroke="#B9CBEE" strokeWidth="1.2" />
        </>
    );
}

// 우유 팩 (초코·딸기우유)
function Carton({ fill }) {
    return (
        <>
            {SHADOW}
            <rect x="18" y="24" width="28" height="34" rx="4.5" fill={fill} />
            <path d="M18 24.5 L24 12 h16 L46 24.5 z" fill="#FFFFFF" stroke="#C9D3E6" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="24" y="7.5" width="16" height="5.5" rx="1.8" fill="#FFFFFF" stroke="#C9D3E6" strokeWidth="1.2" />
            <rect x="20.5" y="26.5" width="3.4" height="28" rx="1.7" fill="#FFFFFF" opacity="0.32" />
            <rect x="21" y="31" width="22" height="17" rx="5" fill="#FFFFFF" opacity="0.96" />
        </>
    );
}

function Juice({ uid }) {
    return (
        <>
            <defs>
                <linearGradient id={`${uid}juice`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFE48A" />
                    <stop offset="1" stopColor="#F4B23A" />
                </linearGradient>
            </defs>
            {SHADOW}
            <path d="M34 22 L40 4" stroke="#5B8CFF" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M19 18 h26 l-2.5 36 a4 4 0 0 1 -4 3.6 h-13 a4 4 0 0 1 -4 -3.6 z" fill="#F4F8FF" opacity="0.9" stroke="#C9D3E6" strokeWidth="1.2" />
            <path d="M20.4 26 h23.2 l-1.9 28 a3 3 0 0 1 -3 2.6 h-13.4 a3 3 0 0 1 -3 -2.6 z" fill={`url(#${uid}juice)`} />
            <path d="M22.3 21 l1.2 13" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
            <circle cx="45.5" cy="18" r="6.5" fill="#F26D6D" />
            <circle cx="43.5" cy="16" r="1.7" fill="#FFFFFF" opacity="0.75" />
            <path d="M45.5 11.8 q3 -4.5 6.5 -2.4 q-3 3.4 -6.5 2.4 z" fill="#6CC28B" />
        </>
    );
}

function Cookie({ uid }) {
    return (
        <>
            <defs>
                <radialGradient id={`${uid}cookie`} cx="0.4" cy="0.35" r="0.7">
                    <stop offset="0" stopColor="#F6D29C" />
                    <stop offset="1" stopColor="#D49A5A" />
                </radialGradient>
            </defs>
            {SHADOW}
            <circle cx="32" cy="35" r="21" fill={`url(#${uid}cookie)`} stroke="#C88A4E" strokeWidth="1.2" />
            <ellipse cx="22" cy="27" rx="2.8" ry="2.3" fill="#6B3F24" />
            <ellipse cx="42" cy="25" rx="2.6" ry="2.2" fill="#6B3F24" />
            <ellipse cx="45" cy="42" rx="2.8" ry="2.3" fill="#6B3F24" />
            <ellipse cx="21" cy="44" rx="2.4" ry="2" fill="#6B3F24" />
            <ellipse cx="33" cy="49" rx="2.6" ry="2.1" fill="#6B3F24" />
            <ellipse cx="24" cy="23" rx="5" ry="2.6" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 24 23)" />
        </>
    );
}

function Bread({ uid }) {
    const fill = `url(#${uid}bread)`;
    return (
        <>
            <defs>
                <linearGradient id={`${uid}bread`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFDC92" />
                    <stop offset="1" stopColor="#E39E4A" />
                </linearGradient>
            </defs>
            {SHADOW}
            <ellipse cx="10" cy="45" rx="5" ry="5.5" fill={fill} stroke="#D08B3A" strokeWidth="1" />
            <ellipse cx="54" cy="45" rx="5" ry="5.5" fill={fill} stroke="#D08B3A" strokeWidth="1" />
            <ellipse cx="19" cy="41" rx="8" ry="9.5" fill={fill} stroke="#D08B3A" strokeWidth="1" transform="rotate(-25 19 41)" />
            <ellipse cx="45" cy="41" rx="8" ry="9.5" fill={fill} stroke="#D08B3A" strokeWidth="1" transform="rotate(25 45 41)" />
            <ellipse cx="32" cy="37" rx="11.5" ry="14" fill={fill} stroke="#D08B3A" strokeWidth="1" />
            <ellipse cx="27" cy="29" rx="3" ry="5.5" fill="#FFFFFF" opacity="0.4" transform="rotate(-15 27 29)" />
        </>
    );
}

const SHAPES = {
    hot: (uid) => <Cup uid={uid} fill="#8A5534" />,
    latte: (uid) => <Cup uid={uid} fill="#C89B72" />,
    vanilla: (uid) => <Cup uid={uid} fill="#EAC37E" />,
    ice: (uid) => <IceGlass uid={uid} />,
    choco: () => <Carton fill="#8B5A3C" />,
    straw: () => <Carton fill="#F49AB0" />,
    juice: (uid) => <Juice uid={uid} />,
    cookie: (uid) => <Cookie uid={uid} />,
    bread: (uid) => <Bread uid={uid} />,
};

// 메뉴 그림 (실제 사진이 생기면 이 컴포넌트만 <img> 로 바꾸면 돼요)
export function FoodIcon({ icon, size = 72 }) {
    // 그림마다 그라데이션 id 가 겹치지 않게
    const uid = useId().replace(/:/g, '');
    const draw = SHAPES[icon] ?? SHAPES.hot;
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
            {draw(uid)}
        </svg>
    );
}

// 그림 + 연한 크림색 타일
export function FoodTile({ icon, size = 60, iconSize = 54, radius = 16, className = '' }) {
    return (
        <span className={`food-tile ${className}`.trim()} style={{ width: size, height: size, borderRadius: radius }}>
            <FoodIcon icon={icon} size={iconSize} />
        </span>
    );
}

// 눌러서 주문 화면의 큰 사진 메뉴 카드
export default function MenuCard({ item, onClick }) {
    return (
        <button type="button" className="menu-card glass" onClick={() => onClick?.(item)}>
            <span className="menu-card__photo food-tile">
                <FoodIcon icon={item.icon} size={106} />
            </span>
            <span className="menu-card__name">{item.name}</span>
            <span className="menu-card__foot">
                <span className="menu-card__price">{formatPrice(item.price)}</span>
                <span className="menu-card__plus" aria-hidden="true">
                    <PlusIcon />
                </span>
            </span>
        </button>
    );
}
