import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrandHeader, CardIcon, CheckIcon, Tello } from '../components/common/Header';
import script from '../mocks/messages.json';
import BigButton from '../components/common/BigButton';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { getOrderDetails } from '../api/order'; // 👈 주문 상태/결과 조회 API 임포트
import './OrderStatusPage.css';

// 단계마다 텔로 표정·자세와 문구가 달라요
const STAGES = {
    pending: { step: 0, face: 'smile', pose: 'none', eyebrow: '1단계 / 3단계', title: '주문이 들어갔어요', sub: '가게에 잘 전달됐어요' },
    preparing: { step: 1, face: 'focus', pose: 'brew', eyebrow: '2단계 / 3단계', title: '지금 만들고 있어요', sub: '조금만 기다려 주세요' },
    completed: { step: 2, face: 'happy', pose: 'done', eyebrow: '3단계 / 3단계', title: '메뉴가 나왔어요!', sub: '카운터로 와 주세요' },
    picked: { step: 3, face: 'happy', pose: 'done', eyebrow: '모두 끝났어요', title: '맛있게 드세요', sub: script.goodbye },
};

const STEP_LABELS = ['주문 완료', '만드는 중', '다 됐어요'];

export default function OrderStatusPage() {
    const navigate = useNavigate();
    const { orderId } = useParams(); // URL 파라미터로 전달된 orderId 활용 (예: /status/:orderId)
    const { speak } = useTextToSpeech();

    const [orderData, setOrderData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastSpokenStatus = useRef(null);

    // 서버에서 주문 상태 주기적 조회 (Polling 방식)
    const fetchOrderStatus = useCallback(async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');

            if (!sessionId || !sessionToken || !orderId) {
                setIsLoading(false);
                return;
            }

            // GET /api/orders/{orderId} 호출
            const data = await getOrderDetails(sessionId, sessionToken, orderId);
            setOrderData(data);
        } catch (error) {
            console.error("주문 상태 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    // 컴포넌트 마운트 시 조회 및 폴링(3초마다 상태 동기화) 설정
    useEffect(() => {
        fetchOrderStatus();
        const interval = setInterval(fetchOrderStatus, 3000); // 실시간 반영을 위한 폴링
        return () => clearInterval(interval);
    }, [fetchOrderStatus]);

    const status = orderData ? orderData.status : 'pending';
    const stage = STAGES[status] ?? STAGES.pending;
    const orderNumber = orderData ? orderData.orderNumber : '---';

    // 상태가 바뀔 때마다 소리로 알려주기
    useEffect(() => {
        if (!orderData || lastSpokenStatus.current === status) return;

        if (lastSpokenStatus.current === null) {
            speak(`주문이 들어갔어요. 주문 번호는 ${orderNumber}번이에요.`);
        } else if (status === 'preparing') {
            speak('지금 메뉴를 만들고 있어요.');
        } else if (status === 'completed') {
            speak('주문한 메뉴가 나왔어요. 카운터로 와 주세요.');
            try {
                navigator.vibrate?.([200, 100, 200]);
            } catch {
                // 진동 미지원 기기 무시
            }
        }
        lastSpokenStatus.current = status;
    }, [status, orderData, orderNumber, speak]);

    const goHome = () => {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('sessionToken');
        navigate('/');
    };

    if (isLoading) {
        return <div className="stage"><div className="phone"><p>주문 정보를 불러오는 중…</p></div></div>;
    }

    return (
        <div className="stage">
            <div className="phone">
                <div className="phone__scroll">
                <BrandHeader />

                {!orderData ? (
                    <main className="phone__body">
                        <h1 className="screen-title">아직 주문이 없어요</h1>
                        <p className="screen-desc">처음 화면에서 주문을 시작해 주세요.</p>
                    </main>
                ) : (
                    <main className="phone__body status-body">
                        <div className="status-hero glass" role="status">
                            <Tello face={stage.face} pose={stage.pose} size={100} />
                            <span className="eyebrow status-hero__eyebrow">{stage.eyebrow}</span>
                            <h1 className="status-hero__title">{stage.title}</h1>
                            <p className="status-hero__sub">{stage.sub}</p>
                        </div>

                        <ol className="status-steps" aria-label="주문 진행 상황">
                            {STEP_LABELS.map((label, i) => {
                                const state = i < stage.step ? 'past' : i === stage.step ? 'current' : 'future';
                                return (
                                    <li
                                        key={label}
                                        className={`status-step glass is-${state}`}
                                        aria-current={state === 'current' ? 'step' : undefined}
                                    >
                                        <span className="status-step__dot">
                                            {state === 'past' && <CheckIcon size={16} color="#FFFFFF" width={3.2} />}
                                            {state === 'current' && <span className="status-step__now" />}
                                        </span>
                                        <span className="status-step__label">{label}</span>
                                        <span className="status-step__tag">
                                            {state === 'current' ? '지금' : state === 'past' ? '끝났어요' : ''}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="status-ticket glass">
                            <div className="status-number">
                                <span className="status-number__label">주문 번호</span>
                                <span className="status-number__big">{orderNumber}</span>
                            </div>
                            <div className="status-pay">
                                <span className="status-pay__icon">
                                    <CardIcon />
                                </span>
                                <span className="status-pay__text">
                                    <b>계산</b>은
                                    <br />
                                    카운터에서
                                    <br />
                                    해 주세요
                                </span>
                            </div>
                        </div>
                    </main>
                )}

                <div className="phone__footer">
                    <BigButton variant="outline" onClick={goHome}>
                        처음으로
                    </BigButton>
                </div>
                </div>
            </div>
        </div>
    );
}