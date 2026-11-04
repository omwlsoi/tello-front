import { useCallback, useEffect, useState } from 'react';
import { Tello } from '../components/common/Header';
import Toast from '../components/common/Toast';
import {
    getAdminOrders,
    changeOrderStatus,
    getAdminHelpRequests,
    completeHelpRequest,
} from '../api/admin';
import storeInfo from '../mocks/store.json';
import './BossPage.css';

// 상태별 안내·버튼 맵핑 (백엔드 status: pending, preparing, completed 대응)
const STATE = {
    pending: { label: '새 주문', hint: '눌러서 만들기 시작', btn: '준비 시작', primary: true, nextStatus: 'preparing' },
    preparing: { label: '만드는 중', hint: '다 되면 손님 폰에 알려요', btn: '준비 완료', primary: true, nextStatus: 'completed' },
    completed: { label: '완료됨', hint: '손님 폰에 알림 보냄', btn: '받아 갔어요', primary: false, nextStatus: null },
};

const ago = (createdAt, now) => {
    const diffMs = now - (typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime());
    const minutes = Math.floor(diffMs / 60000);
    return minutes < 1 ? '방금' : `${minutes}분 전`;
};

// 6. 매장 화면 (태블릿): 주문과 직원 호출을 실시간으로 받아요.
export default function BossPage() {
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);
    const [now, setNow] = useState(() => Date.now());
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);

    const adminToken = localStorage.getItem('adminToken') || 'mock-admin-token';

    // 1. 주문 목록 및 직원 호출 데이터 불러오기 (Polling 3초 주기)
    const fetchData = useCallback(async () => {
        try {
            if (!adminToken) return;

            const orderRes = await getAdminOrders(adminToken);
            if (orderRes && orderRes.orders) {
                setOrders(orderRes.orders);
            }

            const callRes = await getAdminHelpRequests(adminToken);
            if (callRes && Array.isArray(callRes)) {
                setCalls(callRes);
            }
        } catch (error) {
            console.error("매장 현황 데이터 동기화 실패:", error);
        }
    }, [adminToken]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            setNow(Date.now());
            fetchData();
        }, 3000);

        return () => clearInterval(interval);
    }, [fetchData]);

    // 2. 주문 상태 변경 핸들러
    const handleAdvanceOrder = async (orderId, currentStatus) => {
        const nextStatus = STATE[currentStatus]?.nextStatus;
        if (!nextStatus) return;

        try {
            await changeOrderStatus(adminToken, orderId, nextStatus);
            setToast(nextStatus === 'preparing' ? '조리를 시작합니다.' : '준비 완료 알림을 보냈습니다.');
            fetchData();
        } catch (error) {
            console.error("주문 상태 변경 실패:", error);
            setToast("상태 변경에 실패했습니다.");
        }
    };

    // 3. 직원 호출 완료 처리 핸들러
    const handleAckCall = async (requestId) => {
        try {
            await completeHelpRequest(adminToken, requestId);
            setToast('직원이 가고 있어요');
            fetchData();
        } catch (error) {
            console.error("직원 호출 처리 실패:", error);
        }
    };

    const nNew = orders.filter((o) => o.status === 'pending').length;
    const nPrep = orders.filter((o) => o.status === 'preparing').length;

    return (
        <div className="boss-stage">
            <div className="boss-tools">
                <a className="demo-btn" href="/" target="_blank" rel="noreferrer">
                    손님 화면 열기
                </a>
                <button type="button" className="demo-btn" onClick={fetchData}>
                    새로고침
                </button>
            </div>

            <div className="boss-tablet">
                <header className="boss-header glass">
                    <span className="boss-header__title">
                        <span className="brand-dot" />
                        {storeInfo.name} 주문 현황
                        <span className="boss-header__badge">백엔드 API 연동 실시간 POS</span>
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
                    <div key={call.requestId || call.id} className="boss-call glass" role="alert">
                        <span className="boss-call__main">
                            <Tello face="sad" size={46} />
                            <span className="boss-call__text">
                                <span className="boss-call__eyebrow">
                                    <span className="boss-dot boss-dot--orange" />
                                    직원 호출 · {ago(call.createdAt, now) === '방금' ? '지금' : ago(call.createdAt, now)}
                                </span>
                                <span className="boss-call__title">
                                    {call.orderNumber ? `${call.orderNumber}번 손님이` : '주문 중인 손님이'} 도움을 요청했어요
                                </span>
                            </span>
                            <span className="boss-call__reason">세션 ID: {call.sessionId?.slice(0, 8)}...</span>
                        </span>
                        <button
                            type="button"
                            className="pill-btn"
                            onClick={() => handleAckCall(call.requestId || call.id)}
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
                        const st = STATE[order.status] || STATE.pending;
                        return (
                            <article key={order.orderId} className={`boss-card glass is-${order.status}`}>
                                <span className="boss-card__stripe" />
                                <div className="boss-card__body">
                                    <div className="boss-card__top">
                                        <span className="boss-card__tag">
                                            매장 주문
                                        </span>
                                        <span className="boss-card__time">
                                            {ago(order.createdAt, now)}
                                        </span>
                                    </div>
                                    <span className="boss-card__no">
                                        {order.orderNumber}
                                        <small>번</small>
                                    </span>
                                    <div className="boss-card__items">
                                        {order.items && order.items.map((it, i) => (
                                            <div key={i}>
                                                {it.name} ×{it.quantity}
                                                {it.selectedOptions ? ` · ${Object.values(it.selectedOptions).filter(Boolean).join(', ')}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="boss-card__foot">
                                        <span className="boss-card__state">
                                            <b>{st.label}</b>
                                            <span>{st.hint}</span>
                                        </span>
                                        {st.nextStatus && (
                                            <button
                                                type="button"
                                                className={`boss-card__btn ${st.primary ? '' : 'is-outline'}`}
                                                onClick={() => handleAdvanceOrder(order.orderId, order.status)}
                                            >
                                                {st.btn}
                                            </button>
                                        )}
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