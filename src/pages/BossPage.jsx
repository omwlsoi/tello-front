import React, { useState } from 'react';
import './BossPage.css';

export default function BossPage() {
  // 사장님 창에서 관리하는 주문 리스트 상태 (실제 연동 시 백엔드 DB와 연동됨)
  const [orders, setOrders] = useState([
    { id: 27, menu: '아이스 아메리카노, 초코우유', time: '방금 전', status: 1 }, // 1: 주문 완료, 2: 만드는 중, 3: 다 됐어요
  ]);

  const handleStatusChange = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
    
    // (참고) 실제 백엔드 연동 시 이 함수 안에서 서버로 PATCH 요청을 보냄
    // 예: axios.patch(`/api/orders/${id}/status`, { status: newStatus });
  };

  return (
    <div className="boss-container">
      <div className="boss-frame">
        {/* 상단 헤더 */}
        <div className="boss-header">
          <h2>👨‍🍳 덕성카페 사장님 관리 뷰</h2>
          <span className="live-badge">실시간 연동중</span>
        </div>

        {/* 주문 목록 카드 영역 */}
        <div className="boss-body">
          {orders.map(order => (
            <div key={order.id} className={`order-card ${order.status > 1 ? 'active' : ''}`}>
              <div className="order-top-row">
                <span className="order-num">주문 번호 No. {order.id}</span>
                <span className="order-time">{order.time}</span>
              </div>
              <div className="order-menu-list">
                📦 {order.menu}
              </div>

              <div className="status-action-group">
                <span className="action-label">주문 상태 변경 (클릭 시 손님 화면에 즉시 반영)</span>
                <div className="btn-grid">
                  <button 
                    className={`status-ctrl-btn ${order.status === 1 ? 'active-blue' : ''}`}
                    onClick={() => handleStatusChange(order.id, 1)}
                  >
                    주문 완료
                  </button>
                  <button 
                    className={`status-ctrl-btn ${order.status === 2 ? 'active-orange' : ''}`}
                    onClick={() => handleStatusChange(order.id, 2)}
                  >
                    만드는 중
                  </button>
                  <button 
                    className={`status-ctrl-btn ${order.status === 3 ? 'active-green' : ''}`}
                    onClick={() => handleStatusChange(order.id, 3)}
                  >
                    다 됐어요
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="boss-footer">
          카페 덕성 관리자 시스템 v1.0
        </div>
      </div>
    </div>
  );
}