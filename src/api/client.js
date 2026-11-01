import axios from 'axios';

// 백엔드 주소는 .env 의 VITE_API_BASE_URL 로 정해요.
// 비어 있으면 MVP 시연 모드(목업 데이터 + 브라우저 저장소)로 동작해요.
const baseURL = import.meta.env.VITE_API_BASE_URL;

export const USE_MOCK = !baseURL;

const client = axios.create({
    baseURL: baseURL || '/api',
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
});

// 백엔드 연동 시 사용할 요청 모음 (현재 화면은 sessionStore 로 시연)
export const orderApi = {
    getMenu: (storeId) => client.get(`/stores/${storeId}/menu`),
    createOrder: (payload) => client.post('/orders', payload),
    updateStatus: (orderNo, status) =>
        client.patch(`/orders/${orderNo}/status`, { status }),
    callStaff: (payload) => client.post('/staff-calls', payload),
};

export default client;
