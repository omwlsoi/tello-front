import { apiClient } from './client';

// 1. 주문 세션 생성 (매장 입장 시)
export async function createSession(storeId) {
  const response = await apiClient.post('/sessions', { storeId });
  return response.data; // { sessionId, storeId, sessionToken }
}

// 2. 장바구니 조회
export async function getSessionCart(sessionId, sessionToken) {
  const response = await apiClient.get(`/sessions/${sessionId}/cart`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data; // { sessionId, items, totalPrice, canCheckout }
}

// 3. 장바구니 메뉴 담기 (버튼/터치)
export async function addCartItem(sessionId, sessionToken, menuId, quantity, selectedOptions) {
  const response = await apiClient.post(
    `/sessions/${sessionId}/cart/items`,
    { menuId, quantity, selectedOptions },
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}

// 4. 장바구니 개별 항목 수정
export async function updateCartItem(sessionId, sessionToken, itemId, changes) {
  const response = await apiClient.patch(
    `/sessions/${sessionId}/cart/items/${itemId}`,
    changes,
    { headers: { Authorization: `Bearer ${sessionToken}` } }
  );
  return response.data;
}

// 5. 장바구니 개별 항목 삭제
export async function deleteCartItem(sessionId, sessionToken, itemId) {
  const response = await apiClient.delete(`/sessions/${sessionId}/cart/items/${itemId}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}

// 6. 장바구니 전체 비우기
export async function clearCart(sessionId, sessionToken) {
  const response = await apiClient.delete(`/sessions/${sessionId}/cart/items`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return response.data;
}