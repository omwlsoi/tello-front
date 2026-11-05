import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BrandHeader, CardIcon, CheckIcon, Tello } from '../components/common/Header';
import script from '../mocks/messages.json';
import BigButton from '../components/common/BigButton';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useSessionStore } from '../stores/sessionStore';
import { getOrderDetails } from '../api/order'; // 👈 백엔드 주문 상태 조회 API 연동
import formatOrderNumber from '../utils/formatOrderNumber';
import vibrate from '../utils/vibrate';
import './OrderStatusPage.css';

// 단계별 텔로 표정·자세와 문구 맵핑 (백엔드 status: pending, preparing, completed 대응)
const STAGES = {
    pending: { step: 0, face: 'smile', pose: 'none', eyebrow: '1단계 / 3단계', title: '주문이 들어갔어요', sub: '가게에 잘 전달됐어요' },
    preparing: { step: 1, face: 'focus', pose: 'brew', eyebrow: '2단계 / 3단계', title: '지금 만들고 있어요', sub: '조금만 기다려 주세요' },
    completed: { step: 2, face: 'happy', pose: 'done', eyebrow: '3단계 / 3단계', title: '메뉴가 나왔어요!', sub: '카운터로 와 주세요' },
    picked: { step: 3, face: 'happy', pose: 'done', eyebrow: '모두 끝났어요', title: '맛있게 드세요', sub: script.goodbye },
};

const STEP_LABELS = ['주문 완료', '만드는 중', '다 됐어요'];

// 5. 주문 상태 페이지 (백엔드 API 연동 버전)
export default function OrderStatusPage() {
    const navigate = useNavigate();
    const { orderId } = useParams(); // URL에 포함된 orderId 경로 파라미터
    const location = useLocation();
    const startOver = useSessionStore((s) => s.startOver);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();

    // 초기 주문 데이터 (ConfirmPage에서 넘어올 때 state로 전달받은 데이터 활용 가능)
    const [orderData, setOrderData] = useState(location.state?.orderData || null);
    const [status, setStatus] = useState(orderData?.status || 'pending');
    
    const stage = STAGES[status] ?? STAGES.pending;
    const lastSpoken = useRef(null);

    // 🚀 서버 연동: 3초 주기로 본인 주문 상태 조회 API(Polling) 호출
    const fetchOrderStatus = useCallback(async () => {
        if (!orderId) return;
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            if (!sessionToken) return;

            // 백엔드 주문 상태 조회 API 호출 (GET /api/orders/{orderId})
            const res = await getOrderDetails(orderId, sessionToken);
            if (res && res.status) {
                setOrderData(res);
                setStatus(res.status);
            }
        } catch (error) {
            console.error("주문 상태 동기화 실패:", error);
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;

        const first = setTimeout(fetchOrderStatus, 0); // 첫 진입 시 바로 조회
        const interval = setInterval(fetchOrderStatus, 3000); // 3초마다 폴링

        return () => {
            clearTimeout(first);
            clearInterval(interval);
        };
    }, [orderId, fetchOrderStatus]);

    // 상태가 바뀔 때마다 소리로 알려줘요
    useEffect(() => {
        if (!orderData || lastSpoken.current === status) return;

        if (lastSpoken.current === null) {
            speak(`주문이 들어갔어요. 주문 번호는 ${formatOrderNumber(orderData.orderNumber)}번이에요.`);
        } else if (status === 'preparing') {
            speak('지금 메뉴를 만들고 있어요.');
        } else if (status === 'completed') {
            speak('주문한 메뉴가 나왔어요. 카운터로 와 주세요.');
            vibrate(); // 안드로이드 진동 / 아이폰 햅틱
        } else if (status === 'picked') {
            speak(script.goodbye);
        }
        lastSpoken.current = status;
    }, [status, orderData, speak]);

    const goHome = () => {
        startOver(); // 서버 세션 종료 + 저장된 세션 정보 삭제까지 해요
        navigate('/');
    };

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                <BrandHeader />

                {!orderData ? (
                    <main className="phone__body">
                        <h1 className="screen-title">주문 정보를 불러오는 중...</h1>
                        <p className="screen-desc">잠시만 기다려 주세요.</p>
                    </main>
                ) : (
                    <main className="phone__body status-body">
                        <div className="status-hero glass" role="status">
                            <Tello face={stage.face} pose={stage.pose} size={bigText ? 116 : 100} />
                            <span className="eyebrow status-hero__eyebrow">{stage.eyebrow}</span>
                            <h1 className="status-hero__title">{stage.title}</h1>
                            <p className="status-hero__sub">{stage.sub}</p>
                        </div>

                        <ol className="status-steps" aria-label="주문 진행 상황">
                            {STEP_LABELS.map((label, i) => {
                                const state =
                                    i < stage.step ? 'past' : i === stage.step ? 'current' : 'future';
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
                                <span className="status-number__big">{formatOrderNumber(orderData.orderNumber)}</span>
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

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>매장 화면</h3>
                    <p>새 탭에서 매장 화면을 열어 상태를 바꿔보세요.</p>
                    <a className="demo-btn" href="/boss" target="_blank" rel="noreferrer">
                        매장 화면 열기
                    </a>
                </div>
            </aside>
        </div>
    );
}