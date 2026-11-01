import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BellIcon, CheckIcon, MarkIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useSessionStore } from '../stores/sessionStore';
import storeInfo from '../mocks/store.json';
import './OrderStatusPage.css';

function CupIcon({ size = 38 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
            <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
            <path d="M8 2.5c0 1.5 1.5 1.5 1.5 3M12 2.5c0 1.5 1.5 1.5 1.5 3" />
        </svg>
    );
}

// 상태마다 색·그림·문구가 모두 달라서 어르신도 한눈에 구분돼요
// step: 진행바에서 지금 몇 번째인지 (3 = 모두 끝)
const STAGES = {
    new: { step: 0, tone: 'new', title: '주문이 들어갔어요', sub: '가게에 잘 전달됐어요', icon: <CheckIcon size={40} /> },
    prep: { step: 1, tone: 'prep', title: '지금 만들고 있어요', sub: '조금만 기다려 주세요', icon: <CupIcon /> },
    ready: { step: 2, tone: 'ready', title: '메뉴가 나왔어요!', sub: '카운터로 와 주세요', icon: <BellIcon size={38} /> },
    picked: { step: 3, tone: 'ready', title: '맛있게 드세요', sub: '메뉴를 받아 가셨어요', icon: <CheckIcon size={40} /> },
};

const STEP_LABELS = ['주문 완료', '만드는 중', '다 됐어요'];

// 5. 주문 완료: 번호표 역할. 매장 화면에서 상태를 바꾸면 여기에 바로 반영돼요.
export default function OrderStatusPage() {
    const navigate = useNavigate();
    const myOrder = useSessionStore((s) => s.myOrder);
    const orders = useSessionStore((s) => s.orders);
    const setOrderStatus = useSessionStore((s) => s.setOrderStatus);
    const startOver = useSessionStore((s) => s.startOver);
    const { speak } = useTextToSpeech();

    const live = myOrder ? orders.find((o) => o.no === myOrder.no) : null;
    // 매장에서 "손님이 받아 갔어요"를 누르면 목록에서 빠져요
    const status = live ? live.status : myOrder ? 'picked' : null;
    const stage = STAGES[status] ?? STAGES.new;

    // 상태가 바뀔 때마다 소리로 알려줘요
    const lastSpoken = useRef(null);
    useEffect(() => {
        if (!myOrder || lastSpoken.current === status) return;
        if (lastSpoken.current === null) {
            speak(`주문이 들어갔어요. 주문 번호는 ${myOrder.no}번, ${myOrder.mark.name}이에요.`);
        } else if (status === 'prep') {
            speak('지금 메뉴를 만들고 있어요.');
        } else if (status === 'ready') {
            speak('주문한 메뉴가 나왔어요. 카운터로 와 주세요.');
            try {
                navigator.vibrate?.([200, 100, 200]);
            } catch {
                // 진동을 지원하지 않는 기기
            }
        }
        lastSpoken.current = status;
    }, [status, myOrder, speak]);

    const goHome = () => {
        startOver();
        navigate('/');
    };

    return (
        <div className="stage">
            <div className="phone">
                <Header title={storeInfo.name} />

                {!myOrder ? (
                    <main className="phone__body">
                        <h1 className="screen-title">아직 주문이 없어요</h1>
                        <p className="screen-desc">처음 화면에서 주문을 시작해 주세요.</p>
                    </main>
                ) : (
                    <main className="phone__body">
                        <div className={`status-banner status-banner--${stage.tone}`} role="status">
                            <span className="status-banner__icon">{stage.icon}</span>
                            <h1 className="status-banner__title">{stage.title}</h1>
                            <p className="status-banner__sub">{stage.sub}</p>
                        </div>

                        <ol className="status-steps" aria-label="주문 진행 상황">
                            {STEP_LABELS.map((label, i) => {
                                const state =
                                    i < stage.step ? 'past' : i === stage.step ? 'current' : 'future';
                                return (
                                    <li
                                        key={label}
                                        className={`status-step is-${state} status-step--${stage.tone}`}
                                        aria-current={state === 'current' ? 'step' : undefined}
                                    >
                                        <span className="status-step__dot">
                                            {state === 'past' ? <CheckIcon size={20} /> : i + 1}
                                        </span>
                                        <span className="status-step__label">{label}</span>
                                        <span className="status-step__tag">
                                            {state === 'current' ? '지금' : state === 'past' ? '끝났어요' : ''}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="status-number">
                            <span className="status-number__text">
                                <span className="status-number__label">주문 번호</span>
                                <span className="status-number__big">{myOrder.no}</span>
                            </span>
                            <span className="status-number__mark">
                                <MarkIcon mark={myOrder.mark} size={52} />
                                <span>{myOrder.mark.name}</span>
                            </span>
                        </div>

                        <div className="status-pay">
                            <b>계산 안내</b>
                            <span>계산은 카운터에서 해 주세요 (시연용)</span>
                        </div>
                    </main>
                )}

                <div className="phone__footer">
                    <BigButton variant="outline" onClick={goHome}>
                        처음으로
                    </BigButton>
                </div>
            </div>

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>매장에서 상태 바꾸기</h3>
                    <p>매장 화면 탭에서 바꿔도 여기에 바로 반영돼요.</p>
                    <a className="demo-btn" href="/boss" target="_blank" rel="noreferrer">
                        매장 화면 열기
                    </a>
                    {live && (
                        <>
                            <button
                                type="button"
                                className="demo-btn"
                                onClick={() => setOrderStatus(live.no, 'prep')}
                            >
                                만드는 중으로 바꾸기
                            </button>
                            <button
                                type="button"
                                className="demo-btn"
                                onClick={() => setOrderStatus(live.no, 'ready')}
                            >
                                메뉴 나옴으로 바꾸기
                            </button>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}
