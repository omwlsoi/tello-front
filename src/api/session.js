import { apiClient } from './client';

// 1. 주문 세션 생성 (POST /api/sessions)[cite: 1]
export async function createSession(storeId) {
  const response = await apiClient.post('/sessions', { storeId });
  return response.data; // { sessionId, storeId, sessionToken }
}

// 2. 장바구니 조회 (GET /api/sessions/{sessionId}/cart)[cite: 1]
export async function getSessionCart(sessionId, sessionToken) {
  const response = await apiClient.get(`/sessions/${sessionId}/cart`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}

// 3. 장바구니 메뉴 추가 (POST /api/sessions/{sessionId}/cart/items)[cite: 1]
export async function addCartItem(sessionId, sessionToken, menuId, quantity, selectedOptions) {
  const response = await apiClient.post(
    `/sessions/${sessionId}/cart/items`,
    { menuId, quantity, selectedOptions },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}

// 4. 장바구니 항목 수정 (PATCH /api/sessions/{sessionId}/cart/items/{itemId})[cite: 1]
export async function updateCartItem(sessionId, sessionToken, itemId, quantity, selectedOptions) {
  const response = await apiClient.patch(
    `/sessions/${sessionId}/cart/items/${itemId}`,
    { quantity, selectedOptions },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}

// 5. 장바구니 항목 삭제 (DELETE /api/sessions/{sessionId}/cart/items/{itemId})[cite: 1]
export async function deleteCartItem(sessionId, sessionToken, itemId) {
  const response = await apiClient.delete(`/sessions/${sessionId}/cart/items/${itemId}`, {
    headers: { Authorization: `Bearer {sessionToken}`.replace('{sessionToken}', sessionToken) },
  });
  return response.data;
}

// 6. 장바구니 전체 비우기 (DELETE /api/sessions/{sessionId}/cart)[cite: 1]
export async function clearCart(sessionId, sessionToken) {
  const response = await apiClient.delete(`/sessions/${sessionId}/cart`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}

// 7. 세션 명시적 종료 (POST /api/sessions/{sessionId}/end)[cite: 1]
export async function endSession(sessionId, sessionToken) {
  const response = await apiClient.post(
    `/sessions/${sessionId}/end`,
    {},
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}