import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon, CheckCircleIcon, InfoIcon, Tello, ZoomButton } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import { FoodTile } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import { getCartCount, getCartTotal, useSessionStore } from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import script from '../mocks/messages.json';
import './ConfirmPage.css';

// 소리로 읽을 때: "핫" → "따뜻하게", 가운뎃점 → 쉼표
const toSpoken = (opt) => opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

// 메뉴별로 하나씩 읽어 줘요 (STEP 8)
const readCart = (cart) =>
    [
        '주문 내용을 읽어 드릴게요.',
        ...cart.map(
            (line) =>
                `${line.name}${line.opt ? `, ${toSpoken(line.opt)}` : ''} ${line.qty}개. ${formatPrice(line.price * line.qty)}이에요.`,
        ),
        `모두 ${getCartCount(cart)}개, ${formatPrice(getCartTotal(cart))}이에요. 맞으면 '맞아요, 주문할게요'를 눌러 주세요.`,
    ].join(' ');

// 4. 주문 확인: 들어오면 소리로 한 번 읽어주고, 바로 고칠 수 있는 화면
export default function ConfirmPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const from = useSessionStore((s) => s.from);
    const changeQty = useSessionStore((s) => s.changeQty);
    const placeOrder = useSessionStore((s) => s.placeOrder);
    const callStaff = useSessionStore((s) => s.callStaff);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();

    const [sheet, setSheet] = useState(null); // null | 'idle' | 'remove'
    const [removeLine, setRemoveLine] = useState(null); // 뺄지 물어보는 메뉴
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

    // [−]로 마지막 1개를 빼려고 하면 한 번 더 물어봐요 (STEP 7)
    const minus = (line) => {
        if (line.qty > 1) {
            changeQty(line.key, -1);
            return;
        }
        const label = `${line.name}${line.opt ? ` ${line.opt.replace(/ · /g, ' ')}` : ''} 1개`;
        setRemoveLine({ ...line, label });
        setSheet('remove');
        speak(`${line.name}${line.opt ? `, ${line.opt.replace(/ · /g, ', ')}` : ''} 1개를 뺄까요?`);
    };
    const confirmRemove = () => {
        changeQty(removeLine.key, -1);
        setSheet(null);
        setRemoveLine(null);
    };

    const notify = (msg) => {
        setSheet(null);
        setToast(msg);
        speak(msg);
    };

    // 직원 호출: 누르면 바로 매장 화면에 알림이 가요
    const callNow = (reason) => {
        callStaff(reason);
        notify(useSessionStore.getState().cart.length ? script.calledWithCart : script.called);
    };

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                <header className="confirm-header">
                    <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={() => navigate(backTo)}>
                        <BackIcon />
                    </button>
                    <span className="app-header__title">
                        주문 확인
                        <CheckCircleIcon />
                    </span>
                    <ZoomButton />
                </header>

                <main className="phone__body">
                    <h1 className="screen-title confirm-title">이렇게 주문할까요?</h1>

                    {cart.length === 0 && (
                        <p className="screen-desc">담은 메뉴가 없어요. 메뉴를 먼저 골라 주세요.</p>
                    )}

                    {/* 메뉴 하나 = 카드 하나: 1줄 그림·이름·금액 / 2줄 옵션 / 3줄 수량 */}
                    {cart.map((line) => (
                        <section key={line.key} className="confirm-row glass">
                            <div className="confirm-row__main">
                                <FoodTile icon={line.icon} size={bigText ? 66 : 60} iconSize={bigText ? 58 : 54} radius={bigText ? 17 : 16} />
                                <span className="confirm-row__text">
                                    <span className="confirm-row__head">
                                        <b>{line.name}</b>
                                        <span className="confirm-row__price">
                                            {formatPrice(line.price * line.qty)}
                                        </span>
                                    </span>
                                    <span className="confirm-row__opt">{line.opt || '기본'}</span>
                                </span>
                            </div>
                            <div className="confirm-row__qty">
                                <span className="confirm-row__qty-label">수량</span>
                                <span className="confirm-qty">
                                    <button
                                        type="button"
                                        className="confirm-qty__btn"
                                        aria-label={`${line.name} 하나 빼기`}
                                        onClick={() => minus(line)}
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
                        </section>
                    ))}

                    <div className="confirm-total">
                        <span>모두</span>
                        <b>{formatPrice(total)}</b>
                    </div>
                    <p className="ai-note">
                        <InfoIcon />
                        <span>
                            텔로가 잘못 알아들을 수 있어요.{' '}
                            <br />
                            확인해 주세요
                        </span>
                    </p>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!cart.length} onClick={submit}>
                        맞아요, 주문할게요
                    </BigButton>
                    <BigButton variant="outline" onClick={() => navigate(backTo)}>
                        고칠래요
                    </BigButton>
                </div>
                </div>

                <BottomSheet
                    open={sheet === 'idle'}
                    icon={<Tello face="sad" size={bigText ? 100 : 96} />}
                    title="도와드릴까요?"
                    desc={script.idleDesc}
                >
                    <BigButton onClick={() => setSheet(null)}>계속할게요</BigButton>
                    <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
                        직원 호출
                    </BigButton>
                </BottomSheet>

                <BottomSheet
                    open={sheet === 'remove' && !!removeLine}
                    icon={<Tello face="think" size={bigText ? 100 : 96} />}
                    title="이 메뉴를 뺄까요?"
                    desc={removeLine?.label}
                >
                    <BigButton onClick={confirmRemove}>네 · 뺄게요</BigButton>
                    <BigButton variant="outline" onClick={() => setSheet(null)}>
                        아니요
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
