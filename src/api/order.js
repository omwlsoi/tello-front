import { apiClient } from './client';

// 1. 음성 주문 및 메뉴 추천 공통 메시지 API (POST /api/sessions/{sessionId}/messages)
// (사용자 발화 텍스트, 옵션 선택 버튼 텍스트, 추천 메뉴 선택 텍스트 모두 이 함수로 전달)[cite: 3, 11, 12]
export async function sendOrderMessage(sessionId, sessionToken, text) {
  const response = await apiClient.post(
    `/sessions/${sessionId}/messages`,
    { text },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data; // { intent, items, nextAction, candidates, question, cart, ... }[cite: 4, 11, 21]
}

// 2. 최종 주문 확정 및 저장 API (POST /api/orders)[cite: 16]
// (중복 방지용 Idempotency-Key 헤더 필수)[cite: 16]
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
  return response.data; // { orderId, orderNumber, status, totalPrice, ... }[cite: 18]
}

// 3. 확정된 주문 결과 조회 API (GET /api/orders/{orderId})[cite: 16]
export async function getOrderDetails(orderId, sessionToken) {
  const response = await apiClient.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}

// 4. 미완성 음성 주문 취소 및 사진 메뉴판 전환 API (DELETE /api/sessions/{sessionId}/pending-order)[cite: 7]
export async function cancelPendingOrder(sessionId, sessionToken) {
  const response = await apiClient.delete(`/sessions/${sessionId}/pending-order`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}