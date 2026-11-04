import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon, CheckCircleIcon, InfoIcon, Tello, ZoomButton } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import { FoodTile } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useIdleSteps } from '../hooks/useIdleTimer';
import { getCartCount, getCartTotal, getChoiceLabel, useSessionStore } from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import getErrorMessage from '../utils/getErrorMessage';
import script from '../mocks/messages.json';
import { confirmOrder, createHelpRequest } from '../api/order'; // 👈 백엔드 주문 확정 및 직원 호출 API 연동
import { deleteCartItem, getSessionCart, updateCartItem } from '../api/session';
import './ConfirmPage.css';

// 소리로 읽을 때: "핫" → "따뜻하게", 가운뎃점 → 쉼표
const toSpoken = (opt) => opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

// 뺄 메뉴 이름: "아이스 아메리카노 보통" (온도 · 메뉴 · 크기)
const removeName = (line) => {
    const { temperature, size } = line.options ?? {};
    const temp = temperature === 'ice' ? '아이스' : temperature === 'hot' ? '따뜻한' : '';
    return [temp, line.name, size && getChoiceLabel('size', size)].filter(Boolean).join(' ');
};

// 메뉴별로 하나씩 읽어 줘요
const readCart = (cart) =>
    [
        '주문 내용을 읽어 드릴게요.',
        ...cart.map(
            (line) =>
                `${line.name}${line.opt ? `, ${toSpoken(line.opt)}` : ''} ${line.qty}개. ${formatPrice(line.price * line.qty)}이에요.`,
        ),
        `모두 ${getCartCount(cart)}개, ${formatPrice(getCartTotal(cart))}이에요. 맞으면 '맞아요, 주문할게요'를 눌러 주세요.`,
    ].join(' ');

const readSession = () => {
    try {
        return {
            sessionId: localStorage.getItem('sessionId'),
            sessionToken: localStorage.getItem('sessionToken'),
        };
    } catch {
        return { sessionId: null, sessionToken: null };
    }
};

// 4. 주문 확인 페이지 (백엔드 API 연동 버전)
export default function ConfirmPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const from = useSessionStore((s) => s.from);
    const changeQty = useSessionStore((s) => s.changeQty);
    const setCartFromServer = useSessionStore((s) => s.setCartFromServer);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();

    const [sheet, setSheet] = useState(null); // null | 'idle' | 'remove'
    const [idleStage, setIdleStage] = useState(0); 
    const [removeLine, setRemoveLine] = useState(null); 
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);
    const spokeRef = useRef(false);
    const [syncing, setSyncing] = useState(false); // 수량 바꾸는 중 (버튼 잠깐 잠금)
    const [submitting, setSubmitting] = useState(false); // 주문 넣는 중 (두 번 요청 방지)
    const submittingRef = useRef(false);
    const idempotencyKeyRef = useRef(null); // 같은 주문은 다시 눌러도 같은 키로 보내요

    // 들어오면 서버 장바구니를 받아서 화면을 맞춰요 (말로 담은 메뉴도 itemId가 생겨요)
    useEffect(() => {
        const { sessionId, sessionToken } = readSession();
        if (!sessionId || !sessionToken) return;
        getSessionCart(sessionId, sessionToken)
            .then((res) => {
                if (res?.items) setCartFromServer(res.items);
            })
            .catch((error) => console.error('서버 장바구니 불러오기 실패:', error));
    }, [setCartFromServer]);

    // [−][+]: 화면을 먼저 바꾸고 서버 장바구니에도 반영해요
    const changeLine = async (line, delta) => {
        changeQty(line.key, delta);
        idempotencyKeyRef.current = null; // 주문 내용이 바뀌었으니 새 주문 키
        const { sessionId, sessionToken } = readSession();
        const parts = line.parts ?? [];
        if (!sessionId || !sessionToken || !parts.length) return;

        setSyncing(true);
        try {
            let res;
            if (delta > 0) {
                const part = parts[0];
                res = await updateCartItem(sessionId, sessionToken, part.itemId, part.qty + 1);
            } else {
                const part = parts[parts.length - 1];
                res =
                    part.qty > 1
                        ? await updateCartItem(sessionId, sessionToken, part.itemId, part.qty - 1)
                        : await deleteCartItem(sessionId, sessionToken, part.itemId);
            }
            if (res?.items) setCartFromServer(res.items);
        } catch (error) {
            console.error('장바구니 수량 변경 실패:', error);
            setToast(getErrorMessage(error, '수량을 바꾸지 못했어요. 다시 눌러 주세요.'));
            try {
                const res = await getSessionCart(sessionId, sessionToken);
                if (res?.items) setCartFromServer(res.items);
            } catch {
                // 서버에 닿지 않으면 화면 값을 그대로 둬요
            }
        } finally {
            setSyncing(false);
        }
    };

    const backTo = from === 'menu' ? '/menu' : '/voice';
    const total = getCartTotal(cart);

    // 들어오자마자 주문 내용을 한 번 읽어줘요
    useEffect(() => {
        if (spokeRef.current) return;
        spokeRef.current = true;
        const current = useSessionStore.getState().cart;
        if (current.length) speak(readCart(current));
    }, [speak]);

    // 무응답 3단계
    const onIdleStep = useCallback(
        (stage) => {
            setIdleStage(stage);
            setSheet('idle');
            speak(script.idleSteps[stage]);
        },
        [speak],
    );
    const nextIdle = useIdleSteps(onIdleStep, script.idleSteps.length);

    // 🚀 서버 연동: 최종 주문 확정 API 호출
    const submit = async () => {
        if (submittingRef.current) return; // 이미 주문을 넣는 중이면 무시
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');

            if (!sessionId || !sessionToken) {
                alert("세션 정보가 없습니다. 첫 화면부터 다시 시작해 주세요.");
                navigate('/');
                return;
            }

            // 중복 방지를 위한 Idempotency-Key 생성 (UUID 또는 고유 타임스탬프 기반)
            if (!idempotencyKeyRef.current) {
                idempotencyKeyRef.current = `key_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            }
            const idempotencyKey = idempotencyKeyRef.current;

            // 백엔드 주문 확정 API 호출 (POST /api/orders)[cite: 1]
            const res = await confirmOrder(sessionId, sessionToken, idempotencyKey);
            
            if (res && res.orderId) {
                // 주문 성공 시 주문 번호 및 ID와 함께 상태 페이지로 이동
                navigate(`/status/${res.orderId}`, { state: { orderData: res } });
            }
        } catch (error) {
            console.error("주문 확정 실패:", error);
            const msg = getErrorMessage(error, '주문을 넣지 못했어요. 다시 눌러 주세요.');
            setToast(msg);
            speak(msg);
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    // [−]로 마지막 1개를 빼려고 하면 한 번 더 물어봐요 (STEP 7)
    const minus = (line) => {
        if (line.qty > 1) {
            changeLine(line, -1);
            return;
        }
        const label = script.removeAsk.replace('{label}', removeName(line));
        setRemoveLine({ ...line, label });
        setSheet('remove');
        speak(label);
    };

    const confirmRemove = () => {
        changeLine(removeLine, -1);
        setSheet(null);
        setRemoveLine(null);
    };

    const notify = (msg) => {
        setSheet(null);
        setToast(msg);
        speak(msg);
    };

    // 🚀 서버 연동: 직원 호출 API 호출
    const callNow = async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');

            if (sessionId && sessionToken) {
                // 백엔드 직원 호출 API 호출 (POST /api/help-requests)[cite: 1]
                await createHelpRequest(sessionId, sessionToken);
            }
        } catch (error) {
            console.error("직원 호출 서버 전송 실패:", error);
        }
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
                                        disabled={syncing}
                                        onClick={() => minus(line)}
                                    >
                                        −
                                    </button>
                                    <span className="confirm-qty__num">{line.qty}</span>
                                    <button
                                        type="button"
                                        className="confirm-qty__btn"
                                        aria-label={`${line.name} 하나 더`}
                                        disabled={syncing}
                                        onClick={() => changeLine(line, 1)}
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
                            텔로링이 잘못 알아들을 수 있어요.
                            <br />
                            확인해 주세요.
                        </span>
                    </p>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!cart.length || submitting || syncing} onClick={submit}>
                        {submitting ? '주문 넣는 중…' : '맞아요, 주문할게요'}
                    </BigButton>
                    <BigButton variant="outline" onClick={() => navigate(backTo)}>
                        고칠래요
                    </BigButton>
                </div>
                </div>

                <BottomSheet
                    open={sheet === 'idle'}
                    className="sheet--long"
                    icon={<Tello face="sad" size={bigText ? 100 : 96} />}
                    title={script.idleSteps[idleStage]}
                >
                    <BigButton onClick={() => setSheet(null)}>계속할게요</BigButton>
                    {idleStage === 1 && (
                        <BigButton variant="dark" onClick={() => callNow()}>
                            직원 호출
                        </BigButton>
                    )}
                </BottomSheet>

                <BottomSheet
                    open={sheet === 'remove' && !!removeLine}
                    className="sheet--long"
                    icon={<Tello face="think" size={bigText ? 100 : 96} />}
                    title={removeLine?.label}
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
                        onClick={nextIdle}
                    >
                        가만히 있음 (30초 · 1분 · 1분 30초)
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