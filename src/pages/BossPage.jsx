import { useCallback, useEffect, useRef, useState } from 'react';
import { Tello } from '../components/common/Header';
import Toast from '../components/common/Toast';
import {
    adminLogin,
    getAdminOrders,
    changeOrderStatus,
    getAdminHelpRequests,
    completeHelpRequest,
} from '../api/admin';
import storeInfo from '../mocks/store.json';
import formatOrderNumber from '../utils/formatOrderNumber';
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
    // 새로고침(처음 열 때 포함)하면 그때 이미 완료된 주문은 숨겨요
    // (방금 [준비 완료]한 주문은 다음 새로고침 전까지 '완료됨'으로 남아 있어요)
    const [hiddenIds, setHiddenIds] = useState(() => new Set());
    const hideCompletedRef = useRef(true);
    const [calls, setCalls] = useState([]);
    const [now, setNow] = useState(() => Date.now());
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);

    // 관리자 토큰 (POST /api/admin/login → Firebase idToken)
    const [adminToken, setAdminToken] = useState(() => {
        try {
            return localStorage.getItem('adminToken') || '';
        } catch {
            return '';
        }
    });
    const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');
    const autoTried = useRef(false);

    const saveToken = (token) => {
        try {
            if (token) localStorage.setItem('adminToken', token);
            else localStorage.removeItem('adminToken');
        } catch {
            // 저장소를 못 쓰는 환경이면 이번 화면에서만 써요
        }
        setAdminToken(token);
    };

    // 0. 관리자 로그인
    const login = useCallback(async (loginEmail, loginPassword) => {
        setLoggingIn(true);
        setLoginError('');
        try {
            const res = await adminLogin(loginEmail, loginPassword);
            if (!res?.idToken) throw new Error('NO_TOKEN');
            saveToken(res.idToken);
        } catch (error) {
            const code = error?.response?.data?.detail;
            setLoginError(
                code === 'LOGIN_FAILED'
                    ? '이메일 또는 비밀번호가 맞지 않아요.'
                    : code?.startsWith?.('ADMIN_')
                      ? '관리자 권한이 없는 계정이에요.'
                      : '로그인하지 못했어요. 서버가 켜져 있는지 확인해 주세요.',
            );
        } finally {
            setLoggingIn(false);
        }
    }, []);

    // 시연용: .env.local에 관리자 계정이 있으면 자동으로 로그인해요
    useEffect(() => {
        const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (adminToken || autoTried.current || !envEmail || !envPassword) return;
        autoTried.current = true;
        login(envEmail, envPassword);
    }, [adminToken, login]);

    // 1. 주문 목록 및 직원 호출 데이터 불러오기 (Polling 3초 주기)
    const fetchData = useCallback(async () => {
        try {
            if (!adminToken) return;

            const orderRes = await getAdminOrders(adminToken);
            if (orderRes && orderRes.orders) {
                setOrders(orderRes.orders);
                if (hideCompletedRef.current) {
                    hideCompletedRef.current = false;
                    setHiddenIds(
                        new Set(orderRes.orders.filter((o) => o.status === 'completed').map((o) => o.orderId)),
                    );
                }
            }

            const callRes = await getAdminHelpRequests(adminToken);
            if (callRes && Array.isArray(callRes)) {
                setCalls(callRes);
            }
        } catch (error) {
            // 토큰이 만료됐거나(1시간) 잘못됐으면 다시 로그인해요
            // (자동 로그인은 다시 시도하지 않아요 → 깜빡임 반복 방지)
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                const where = error?.config?.url ?? '';
                const detail = error?.response?.data?.detail ?? '';
                saveToken('');
                setLoginError(`다시 로그인해 주세요. (${status} ${detail} ${where})`.trim());
                return;
            }
            console.error("매장 현황 데이터 동기화 실패:", error);
        }
    }, [adminToken]);

    useEffect(() => {
        const first = setTimeout(fetchData, 0); // 들어오자마자 한 번 조회
        const interval = setInterval(() => {
            setNow(Date.now());
            fetchData();
        }, 3000);

        return () => {
            clearTimeout(first);
            clearInterval(interval);
        };
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

    const onSubmitLogin = (e) => {
        e.preventDefault();
        if (!email || !password || loggingIn) return;
        login(email, password);
    };

    if (!adminToken) {
        return (
            <div className="boss-stage">
                <form className="boss-login glass" onSubmit={onSubmitLogin}>
                    <Tello face="smile" size={88} />
                    <h1 className="boss-login__title">{storeInfo.name} 매장 화면</h1>
                    <p className="boss-login__desc">관리자 계정으로 로그인해 주세요.</p>
                    <label className="boss-login__field">
                        <span>이메일</span>
                        <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label className="boss-login__field">
                        <span>비밀번호</span>
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    {loginError && (
                        <p className="boss-login__error" role="alert">
                            {loginError}
                        </p>
                    )}
                    <button type="submit" className="boss-card__btn boss-login__btn" disabled={loggingIn}>
                        {loggingIn ? '로그인 중…' : '로그인'}
                    </button>
                </form>
            </div>
        );
    }

    const visibleOrders = orders.filter((o) => !hiddenIds.has(o.orderId));
    const nNew = orders.filter((o) => o.status === 'pending').length;
    const nPrep = orders.filter((o) => o.status === 'preparing').length;

    return (
        <div className="boss-stage">
            <div className="boss-tools">
                <a className="demo-btn" href="/" target="_blank" rel="noreferrer">
                    손님 화면 열기
                </a>
                <button
                    type="button"
                    className="demo-btn"
                    onClick={() => {
                        hideCompletedRef.current = true;
                        fetchData();
                    }}
                >
                    새로고침
                </button>
                <button type="button" className="demo-btn" onClick={() => saveToken('')}>
                    로그아웃
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
                                    {call.orderNumber ? `${formatOrderNumber(call.orderNumber)}번 손님이` : '주문 중인 손님이'} 도움을 요청했어요
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
                    {visibleOrders.length === 0 && (
                        <p className="boss-empty">
                            아직 주문이 없어요. 손님 폰에서 주문하면 여기에 떠요.
                        </p>
                    )}
                    {visibleOrders.map((order) => {
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
                                        {formatOrderNumber(order.orderNumber)}
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