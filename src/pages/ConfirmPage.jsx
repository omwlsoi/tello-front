import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon, CheckCircleIcon, InfoIcon, MicIcon, Tello, ZoomButton } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import { FoodTile } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useIdleSteps } from '../hooks/useIdleTimer';
import useSpeechToText from '../hooks/useSpeechToText';
import { getCartCount, getCartTotal, getChoiceLabel, useSessionStore } from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import script from '../mocks/messages.json';
import { confirmOrder } from '../api/order'; // 👈 1. 최종 주문 확정 API 임포트
import { v4 as uuidv4 } from 'uuid'; // 👈 2. 중복 방지 키 생성을 위한 uuid 임포트 (설치 안 되어 있다면 아래 안내 참고)
import './ConfirmPage.css';

// 소리로 읽을 때: "핫" → "따뜻하게", 가운뎃점 → 쉼표
const toSpoken = (opt) => opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

// 뺄 메뉴 이름: "아이스 아메리카노 보통" (온도 · 메뉴 · 크기)
const removeName = (line) => {
    const { temperature, size } = line.options ?? {};
    const temp = temperature === 'ice' ? '아이스' : temperature === 'hot' ? '따뜻한' : '';
    return [temp, line.name, size && getChoiceLabel('size', size)].filter(Boolean).join(' ');
};

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
    const startOver = useSessionStore((s) => s.startOver); // 필요시 초기화용
    const callStaff = useSessionStore((s) => s.callStaff);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();
    const { listening, listen } = useSpeechToText();

    const [sheet, setSheet] = useState(null); // null | 'idle' | 'remove'
    const [idleStage, setIdleStage] = useState(0); // 무응답 몇 번째 안내인지 (0 · 1 · 2)
    const [removeLine, setRemoveLine] = useState(null); // 뺄지 물어보는 메뉴
    const [toast, setToast] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // 👈 주문 요청 중 중복 클릭 방지
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

    // 무응답 3단계 (30초 · 1분 · 1분 30초) — 명세서 STEP 10-3
    const onIdleStep = useCallback(
        (stage) => {
            setIdleStage(stage);
            setSheet('idle');
            speak(script.idleSteps[stage]);
        },
        [speak],
    );
    const nextIdle = useIdleSteps(onIdleStep, script.idleSteps.length);

    // 👈 3. 백엔드 API 연동이 포함된 최종 주문 확정 함수 수정
    const submit = async () => {
        if (isSubmitting || cart.length === 0) return;
        setIsSubmitting(true);

        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');

            if (!sessionId || !sessionToken) {
                alert("세션 정보가 없습니다. 처음부터 다시 시작해 주세요.");
                navigate('/');
                return;
            }

            // 중복 방지용 Idempotency-Key 생성 (uuid가 없다면 Date.now() 등 대체 가능)
            const idempotencyKey = typeof uuidv4 === 'function' ? uuidv4() : `key_${Date.now()}`;

            // 백엔드로 최종 주문 확정 요청 전송 (POST /api/orders)[cite: 16]
            const response = await confirmOrder(sessionId, sessionToken, idempotencyKey);
            
            console.log("주문 확정 성공:", response);

            // 주문 성공 시 상태 페이지로 이동하면서 orderId 전달 (필요시 라우터 설정에 맞게 변경)
            navigate(`/status/${response.orderId}`);

        } catch (error) {
            console.error("주문 확정 실패:", error);
            const errCode = error.response?.data?.code;
            const errMsg = error.response?.data?.message;

            if (errCode === 'CART_EMPTY') {
                alert("장바구니가 비어 있습니다.");
            } else if (errCode === 'ORDER_ALREADY_CONFIRMED') {
                alert("이미 주문이 확정된 세션입니다.");
            } else {
                alert(errMsg || "주문 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 버튼 또는 말로 "맞아요" (STEP 8)
    const sayYes = () =>
        listen(() => {
            setToast(`"${script.confirmYes}"`);
            setTimeout(submit, 700);
        });

    // [−]로 마지막 1개를 빼려고 하면 한 번 더 물어봐요 (STEP 7)
    const minus = (line) => {
        if (line.qty > 1) {
            changeQty(line.key, -1);
            return;
        }
        // 명세서: "아이스 아메리카노 보통 1개를 뺄까요?"
        const label = script.removeAsk.replace('{label}', removeName(line));
        setRemoveLine({ ...line, label });
        setSheet('remove');
        speak(label);
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
                            텔로가 잘못 알아들 수 있어요.{' '}
                            <br />
                            확인해 주세요
                        </span>
                    </p>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!cart.length || isSubmitting} onClick={submit}>
                        {isSubmitting ? '주문 처리 중…' : '맞아요, 주문할게요'}
                    </BigButton>
                    <BigButton variant="outline" onClick={() => navigate(backTo)} disabled={isSubmitting}>
                        고칠래요
                    </BigButton>
                    {cart.length > 0 && (
                        <button type="button" className="sheet-mic confirm-mic" onClick={sayYes} disabled={isSubmitting}>
                            <MicIcon size={20} />
                            {listening ? '듣고 있어요…' : `말로 답해도 돼요 · "${script.confirmYes}"`}
                        </button>
                    )}
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
                        <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
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