import { apiClient } from './client';

// 1. 관리자 로그인 (POST /api/admin/login)
export async function adminLogin(email, password) {
  const response = await apiClient.post('/admin/login', { email, password });
  return response.data; // 토큰 등 반환
}

// 2. 매장 전체 주문 목록 조회 (GET /api/admin/orders)[cite: 1]
export async function getAdminOrders(token) {
  const response = await apiClient.get('/admin/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // { orders: [...] }
}

// 3. 주문 상세 조회 (GET /api/admin/orders/{orderId})[cite: 1]
export async function getAdminOrderDetails(token, orderId) {
  const response = await apiClient.get(`/admin/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// 4. 주문 상태 변경 - 조리중/완료 (PATCH /api/admin/orders/{orderId}/status)
export async function changeOrderStatus(token, orderId, status) {
  // status: 'preparing' 또는 'completed'
  const response = await apiClient.patch(
    `/admin/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// 5. 직원 호출 목록 조회 (GET /api/admin/help-requests)[cite: 1]
export async function getAdminHelpRequests(token) {
  const response = await apiClient.get('/admin/help-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// 6. 직원 호출 완료 처리 (PATCH /api/admin/help-requests/{request_id})[cite: 1]
export async function completeHelpRequest(token, requestId) {
  const response = await apiClient.patch(
    `/admin/help-requests/${requestId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}