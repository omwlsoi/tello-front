import { useCallback, useEffect, useState } from 'react';
import { Tello } from '../components/common/Header';
import Toast from '../components/common/Toast';
import {
    MODE_LABELS,
    STATUS_LABELS,
    useSessionStore,
} from '../stores/sessionStore';
import storeInfo from '../mocks/store.json';
import './BossPage.css';

// 상태별 안내·버튼 (stripe: 카드 왼쪽 색 막대)
const STATE = {
    new: { hint: '눌러서 만들기 시작', btn: '준비 시작', primary: true },
    prep: { hint: '다 되면 손님 폰에 알려요', btn: '준비 완료', primary: true },
    ready: { hint: '손님 폰에 알림 보냄', btn: '받아 갔어요', primary: false },
};

const ago = (createdAt, now) => {
    const minutes = Math.floor((now - createdAt) / 60000);
    return minutes < 1 ? '방금' : `${minutes}분 전`;
};

// 6. 매장 화면 (태블릿): 주문과 직원 호출을 실시간으로 받아요.
export default function BossPage() {
    const orders = useSessionStore((s) => s.orders);
    const calls = useSessionStore((s) => s.calls);
    const advanceOrder = useSessionStore((s) => s.advanceOrder);
    const ackCall = useSessionStore((s) => s.ackCall);
    const resetDemo = useSessionStore((s) => s.resetDemo);

    const [now, setNow] = useState(() => Date.now());
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);

    // "N분 전" 갱신
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const nNew = orders.filter((o) => o.status === 'new').length;
    const nPrep = orders.filter((o) => o.status === 'prep').length;

    return (
        <div className="boss-stage">
            <div className="boss-tools">
                <a className="demo-btn" href="/" target="_blank" rel="noreferrer">
                    손님 화면 열기
                </a>
                <button type="button" className="demo-btn" onClick={resetDemo}>
                    시연 처음부터
                </button>
            </div>

            <div className="boss-tablet">
                <header className="boss-header glass">
                    <span className="boss-header__title">
                        <span className="brand-dot" />
                        {storeInfo.name} 주문 현황
                        <span className="boss-header__badge">MVP 가상 화면 · POS 미연동</span>
                    </span>
                    <span className="boss-header__counts">
                        <span className="boss-count boss-count--new">
                            <span className="boss-dot boss-dot--yellow" />새 주문 {nNew}
                        </span>
                        <span className="boss-count">
                            <span className="boss-dot boss-dot--blue" />
                            만드는 중 {nPrep}
                        </span>
                    </span>
                </header>

                {calls.map((call) => (
                    <div key={call.id} className="boss-call glass" role="alert">
                        <span className="boss-call__main">
                            <Tello face="sad" size={46} />
                            <span className="boss-call__text">
                                <span className="boss-call__eyebrow">
                                    <span className="boss-dot boss-dot--orange" />
                                    직원 호출 · {ago(call.createdAt, now) === '방금' ? '지금' : ago(call.createdAt, now)}
                                </span>
                                <span className="boss-call__title">
                                    {call.orderNo ? `${call.orderNo}번 손님이` : '주문 중인 손님이'} 도움을 요청했어요
                                </span>
                            </span>
                            <span className="boss-call__reason">이유: {call.reason}</span>
                        </span>
                        <button
                            type="button"
                            className="pill-btn"
                            onClick={() => {
                                ackCall(call.id);
                                setToast('직원이 가고 있어요');
                            }}
                        >
                            확인했어요
                        </button>
                    </div>
                ))}

                <div className="boss-grid">
                    {orders.length === 0 && (
                        <p className="boss-empty">
                            아직 주문이 없어요. 손님 폰에서 주문하면 여기에 떠요.
                        </p>
                    )}
                    {orders.map((order) => {
                        const voice = order.mode === 'voice';
                        const st = STATE[order.status];
                        return (
                            <article key={order.no} className={`boss-card glass is-${order.status}`}>
                                <span className="boss-card__stripe" />
                                <div className="boss-card__body">
                                    <div className="boss-card__top">
                                        <span className={`boss-card__tag ${voice ? 'is-voice' : ''}`}>
                                            {MODE_LABELS[order.mode]}
                                        </span>
                                        <span className="boss-card__time">
                                            {order.sample && '예시 · '}
                                            {ago(order.createdAt, now)}
                                        </span>
                                    </div>
                                    <span className="boss-card__no">
                                        {order.no}
                                        <small>번</small>
                                    </span>
                                    <div className="boss-card__items">
                                        {order.items.map((it, i) => (
                                            <div key={i}>
                                                {it.name} ×{it.qty}
                                                {it.opt ? ` · ${it.opt}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                    {voice && <span className="boss-card__hint">번호를 크게 불러 주세요</span>}
                                    <div className="boss-card__foot">
                                        <span className="boss-card__state">
                                            <b>{STATUS_LABELS[order.status]}</b>
                                            <span>{st.hint}</span>
                                        </span>
                                        <button
                                            type="button"
                                            className={`boss-card__btn ${st.primary ? '' : 'is-outline'}`}
                                            onClick={() => advanceOrder(order.no)}
                                        >
                                            {st.btn}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <Toast message={toast} onDone={clearToast} />
            </div>
        </div>
    );
}
