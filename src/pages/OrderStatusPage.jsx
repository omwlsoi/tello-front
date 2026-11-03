import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandHeader, CardIcon, CheckIcon, Tello } from '../components/common/Header';
import script from '../mocks/messages.json';
import BigButton from '../components/common/BigButton';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useSessionStore } from '../stores/sessionStore';
import './OrderStatusPage.css';

// 단계마다 텔로 표정·자세와 문구가 달라서 한눈에 구분돼요
// step: 진행바에서 지금 몇 번째인지 (3 = 모두 끝)
const STAGES = {
    new: { step: 0, face: 'smile', pose: 'none', eyebrow: '1단계 / 3단계', title: '주문이 들어갔어요', sub: '가게에 잘 전달됐어요' },
    prep: { step: 1, face: 'focus', pose: 'brew', eyebrow: '2단계 / 3단계', title: '지금 만들고 있어요', sub: '조금만 기다려 주세요' },
    ready: { step: 2, face: 'happy', pose: 'done', eyebrow: '3단계 / 3단계', title: '메뉴가 나왔어요!', sub: '카운터로 와 주세요' },
    picked: { step: 3, face: 'happy', pose: 'done', eyebrow: '모두 끝났어요', title: '맛있게 드세요', sub: script.goodbye },
};

const STEP_LABELS = ['주문 완료', '만드는 중', '다 됐어요'];

// 5. 주문 완료: 번호표 역할. 매장 화면에서 상태를 바꾸면 여기에 바로 반영돼요.
export default function OrderStatusPage() {
    const navigate = useNavigate();
    const myOrder = useSessionStore((s) => s.myOrder);
    const orders = useSessionStore((s) => s.orders);
    const setOrderStatus = useSessionStore((s) => s.setOrderStatus);
    const startOver = useSessionStore((s) => s.startOver);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();

    const live = myOrder ? orders.find((o) => o.no === myOrder.no) : null;
    // 매장에서 "받아 갔어요"를 누르면 목록에서 빠져요
    const status = live ? live.status : myOrder ? 'picked' : null;
    const stage = STAGES[status] ?? STAGES.new;

    // 상태가 바뀔 때마다 소리로 알려줘요
    const lastSpoken = useRef(null);
    useEffect(() => {
        if (!myOrder || lastSpoken.current === status) return;
        if (lastSpoken.current === null) {
            speak(`주문이 들어갔어요. 주문 번호는 ${myOrder.no}번이에요.`);
        } else if (status === 'prep') {
            speak('지금 메뉴를 만들고 있어요.');
        } else if (status === 'ready') {
            speak('주문한 메뉴가 나왔어요. 카운터로 와 주세요.');
            try {
                navigator.vibrate?.([200, 100, 200]);
            } catch {
                // 진동을 지원하지 않는 기기
            }
        } else if (status === 'picked') {
            speak(script.goodbye);
        }
        lastSpoken.current = status;
    }, [status, myOrder, speak]);

    const goHome = () => {
        startOver();
        navigate('/');
    };

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                <BrandHeader />

                {!myOrder ? (
                    <main className="phone__body">
                        <h1 className="screen-title">아직 주문이 없어요</h1>
                        <p className="screen-desc">처음 화면에서 주문을 시작해 주세요.</p>
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
                                <span className="status-number__big">{myOrder.no}</span>
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
