import { ArrowIcon } from '../common/Header';
import { getCartCount } from '../../stores/sessionStore';

// 말로 주문 화면 아래쪽 "담은 메뉴" 요약 바
export default function CartBar({ cart, onConfirm }) {
    const count = getCartCount(cart);
    const names = cart.length
        ? cart.map((line) => (line.opt ? `${line.name} · ${line.opt}` : line.name)).join(', ')
        : '메뉴를 먼저 말해 주세요';

    return (
        <div className="cart-bar">
            <div className="cart-bar__text">
                <span className="cart-bar__count">담은 메뉴 {count}개</span>
                <span className="cart-bar__names">{names}</span>
            </div>
            <button type="button" className="pill-btn" disabled={!count} onClick={onConfirm}>
                주문 확인
                <ArrowIcon />
            </button>
        </div>
    );
}
