import { apiClient } from './client';

// 1. 음성 주문 및 메시지 분석 (POST /api/sessions/{sessionId}/messages)[cite: 1]
export async function sendOrderMessage(sessionId, sessionToken, text) {
  const response = await apiClient.post(
    `/sessions/${sessionId}/messages`,
    { text },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}

// 2. 미완성 음성 주문 취소 (DELETE /api/sessions/{sessionId}/pending-order)[cite: 1]
export async function cancelPendingOrder(sessionId, sessionToken) {
  const response = await apiClient.delete(`/sessions/${sessionId}/pending-order`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}

// 3. 최종 주문 확정 (POST /api/orders)[cite: 1]
export async function confirmOrder(sessionId, sessionToken, idempotencyKey) {
  const response = await apiClient.post(
    '/orders',
    { sessionId },
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  return response.data; // { orderId, orderNumber, status, totalPrice, ... }
}

// 4. 본인 주문 상태 조회 (GET /api/orders/{orderId})[cite: 1]
export async function getOrderDetails(orderId, sessionToken) {
  const response = await apiClient.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer {sessionToken}`.replace('{sessionToken}', sessionToken) },
  });
  return response.data;
}

// 5. 직원 호출 요청 (POST /api/help-requests)[cite: 1]
export async function createHelpRequest(sessionId, sessionToken) {
  const response = await apiClient.post(
    '/help-requests',
    { sessionId },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}