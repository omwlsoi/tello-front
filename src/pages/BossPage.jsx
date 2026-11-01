import { useCallback, useEffect, useState } from 'react';
import { BellIcon, MarkIcon } from '../components/common/Header';
import Toast from '../components/common/Toast';
import {
    MODE_LABELS,
    STATUS_LABELS,
    useSessionStore,
} from '../stores/sessionStore';
import storeInfo from '../mocks/store.json';
import './BossPage.css';

const BUTTON = {
    new: { label: '준비 시작', className: 'boss-card__btn--dark' },
    prep: { label: '준비 완료', className: 'boss-card__btn--blue' },
    ready: { label: '손님이 받아 갔어요', className: 'boss-card__btn--green' },
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
                <header className="boss-header">
                    <span className="boss-header__title">
                        {storeInfo.name} 주문 현황
                        <span className="boss-header__badge">MVP 가상 화면 · POS 미연동</span>
                    </span>
                    <span className="boss-header__count">
                        새 주문 {nNew} · 준비 중 {nPrep}
                    </span>
                </header>

                {calls.length > 0 && (
                    <div className="boss-calls">
                        {calls.map((call) => (
                            <div key={call.id} className="boss-call" role="alert">
                                <span className="boss-call__text">
                                    <BellIcon size={24} />
                                    직원 호출 —{' '}
                                    {call.orderNo ? `${call.orderNo}번 손님이` : '주문 중인 손님이'} 도움을
                                    요청했어요
                                    <span className="boss-call__reason">이유: {call.reason}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        ackCall(call.id);
                                        setToast('직원이 가고 있어요');
                                    }}
                                >
                                    확인했어요
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="boss-grid">
                    {orders.length === 0 && (
                        <p className="boss-empty">
                            아직 주문이 없어요. 손님 폰에서 주문하면 여기에 떠요.
                        </p>
                    )}
                    {orders.map((order) => {
                        const voice = order.mode === 'voice';
                        return (
                            <article
                                key={order.no}
                                className={`boss-card ${order.status === 'new' ? 'is-new' : ''} ${order.status === 'ready' ? 'is-ready' : ''}`}
                            >
                                <div className="boss-card__top">
                                    <span className="boss-card__no">
                                        {order.no}
                                        <MarkIcon mark={order.mark} size={28} />
                                    </span>
                                    <span className="boss-card__time">
                                        {order.sample && <span className="boss-card__sample">예시</span>}
                                        {ago(order.createdAt, now)}
                                    </span>
                                </div>
                                <span className={`boss-card__tag ${voice ? 'is-voice' : ''}`}>
                                    {MODE_LABELS[order.mode]}
                                </span>
                                <div className="boss-card__items">
                                    {order.items.map((it, i) => (
                                        <div key={i}>
                                            {it.name} ×{it.qty}
                                            {it.opt ? ` · ${it.opt}` : ''}
                                        </div>
                                    ))}
                                </div>
                                {voice && <div className="boss-card__hint">번호를 크게 불러주세요</div>}
                                <span className="boss-card__state">{STATUS_LABELS[order.status]}</span>
                                <button
                                    type="button"
                                    className={`boss-card__btn ${BUTTON[order.status].className}`}
                                    onClick={() => advanceOrder(order.no)}
                                >
                                    {BUTTON[order.status].label}
                                </button>
                            </article>
                        );
                    })}
                </div>

                <Toast message={toast} onDone={clearToast} />
            </div>
        </div>
    );
}
