import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BellIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import { FoodTile } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import { getCartText, getCartTotal, useSessionStore } from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import script from '../mocks/messages.json';
import './ConfirmPage.css';

const readCart = (cart) =>
    `주문 내용이에요. ${getCartText(cart)}. 모두 ${formatPrice(getCartTotal(cart))}이에요.`;

// 4. 주문 확인: 들어오면 소리로 한 번 읽어주고, 바로 고칠 수 있는 화면
export default function ConfirmPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const from = useSessionStore((s) => s.from);
    const changeQty = useSessionStore((s) => s.changeQty);
    const placeOrder = useSessionStore((s) => s.placeOrder);
    const callStaff = useSessionStore((s) => s.callStaff);
    const { speak } = useTextToSpeech();

    const [sheet, setSheet] = useState(null); // null | 'idle'
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);
    const spokeRef = useRef(false);

    const backTo = from === 'menu' ? '/menu' : '/voice';
    const total = getCartTotal(cart);

    // 들어오자마자 주문 내용을 한 번 읽어줘요
    useEffect(() => {
        if (spokeRef.current) return;
        spokeRef.current = true;
        const current = useSessionStore.getState().cart;
        if (current.length) speak(readCart(current));
    }, [speak]);

    useIdleTimer(() => {
        if (!sheet) {
            setSheet('idle');
            speak(script.idle);
        }
    });

    const submit = () => {
        const order = placeOrder();
        if (order) navigate('/status');
    };

    // 직원 부르기: 누르면 바로 매장 화면에 알림이 가요
    const callNow = (reason) => {
        callStaff(reason);
        setSheet(null);
        setToast(script.called);
        speak(script.called);
    };

    return (
        <div className="stage">
            <div className="phone">
                <Header
                    title="주문 확인"
                    left={
                        <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={() => navigate(backTo)}>
                            <BackIcon />
                        </button>
                    }
                />

                <main className="phone__body">
                    <h1 className="screen-title">이렇게 주문할까요?</h1>

                    {cart.length === 0 && (
                        <p className="screen-desc">담은 메뉴가 없어요. 메뉴를 먼저 골라 주세요.</p>
                    )}

                    {cart.map((line) => (
                        <div key={line.key} className="confirm-row">
                            <FoodTile icon={line.icon} />
                            <span className="confirm-row__text">
                                <b>{line.name}</b>
                                <span>
                                    {line.opt || '기본'} · {formatPrice(line.price)}
                                </span>
                            </span>
                            <span className="confirm-qty">
                                <button
                                    type="button"
                                    className="confirm-qty__btn"
                                    aria-label={`${line.name} 하나 빼기`}
                                    onClick={() => changeQty(line.key, -1)}
                                >
                                    −
                                </button>
                                <span className="confirm-qty__num">{line.qty}</span>
                                <button
                                    type="button"
                                    className="confirm-qty__btn"
                                    aria-label={`${line.name} 하나 더`}
                                    onClick={() => changeQty(line.key, 1)}
                                >
                                    +
                                </button>
                            </span>
                        </div>
                    ))}

                    <div className="confirm-total">
                        <span>모두</span>
                        <b>{formatPrice(total)}</b>
                    </div>
                    <p className="ai-note">AI가 잘못 알아들을 수 있어요. 확인해 주세요</p>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!cart.length} onClick={submit}>
                        맞아요, 주문할게요
                    </BigButton>
                    <BigButton variant="outline" onClick={() => navigate(backTo)}>
                        고칠래요
                    </BigButton>
                </div>

                <BottomSheet
                    open={sheet === 'idle'}
                    icon={<BellIcon />}
                    title="도와드릴까요?"
                    desc={script.idleDesc}
                >
                    <BigButton onClick={() => setSheet(null)}>계속할게요</BigButton>
                    <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
                        직원 부르기
                    </BigButton>
                </BottomSheet>

                <Toast message={toast} onDone={clearToast} />
            </div>

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>막혔을 때 보여주기</h3>
                    <button
                        type="button"
                        className="demo-btn"
                        onClick={() => {
                            setSheet('idle');
                            speak(script.idle);
                        }}
                    >
                        30초 동안 가만히 있음
                    </button>
                </div>
                <div className="demo-panel__box">
                    <a className="demo-btn" href="/boss" target="_blank" rel="noreferrer">
                        매장 화면 열기
                    </a>
                </div>
            </aside>
        </div>
    );
}
