import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConfirmPage.css';

export default function ConfirmPage() {
  const navigate = useNavigate();
  
  // 장바구니에 담긴 메뉴 상태 관리
  const [items, setItems] = useState([
    { id: 1, name: '아이스 아메리카노', option: '보통', price: 3000, count: 1, icon: '🧊' },
    { id: 2, name: '초코우유', option: '기본', price: 3500, count: 1, icon: '🍫' }
  ]);

  // 네트워크 에러 시연용 모달 상태
  const [showNetworkError, setShowNetworkError] = useState(false);

  const handleCountChange = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newCount = item.count + delta;
        return newCount > 0 ? { ...item, count: newCount } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.count), 0);

  const handleOrderSubmit = () => {
    // 주문 완료 시 상태 페이지로 이동
    navigate('/status');
  };

  const handleStaffCall = () => {
    alert('직원을 호출하였습니다. 잠시만 기다려주세요!');
    setShowNetworkError(false);
  };

  return (
    <div className="confirm-container">
      <div className="layout-wrapper">
        
        {/* 모바일 화면 프레임 */}
        <div className="mobile-frame">
          
          {/* 상단 헤더 */}
          <div className="confirm-header">
            <button className="back-btn" onClick={() => navigate('/menu')}>&lt;</button>
            <h2 className="confirm-title">주문 확인</h2>
            <div style={{width: '24px'}}></div>
          </div>

          {/* 주문 목록 영역 */}
          <div className="confirm-body">
            <h3 className="section-label">이렇게 주문할까요?</h3>

            {items.map(item => (
              <div key={item.id} className="cart-item-card">
                <div className="item-info">
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-detail">
                    <h4>{item.name}</h4>
                    <p>{item.option} · {item.price.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="quantity-control">
                  <button className="qty-btn" onClick={() => handleCountChange(item.id, -1)}>-</button>
                  <span className="qty-num">{item.count}</span>
                  <button className="qty-btn" onClick={() => handleCountChange(item.id, 1)}>+</button>
                </div>
              </div>
            ))}

            <div className="ai-notice-box">
              AI가 잘못 알아들을 수 있어요. 확인해 주세요.
            </div>

            <div className="total-price-box">
              <span className="total-label">모두</span>
              <span className="total-value">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="confirm-footer">
            <button className="order-edit-btn" onClick={() => navigate('/menu')}>
              고칠래요
            </button>
            <button className="order-submit-btn" onClick={handleOrderSubmit}>
              맞아요, 주문할게요
            </button>
          </div>

          {/* 네트워크 오류 / 주문 안 감 팝업 모달 */}
          {showNetworkError && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="error-icon">⚠️</div>
                <h3>주문이 가게에 안 갔어요</h3>
                <p>인터넷이 잠깐 끊겼어요. 담은 메뉴는 그대로 있어요.</p>
                <div className="modal-btn-group">
                  <button className="retry-btn" onClick={() => setShowNetworkError(false)}>다시 보내기</button>
                  <button className="staff-modal-btn" onClick={handleStaffCall}>직원 부르기</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 🎬 시연용 테스트 패널 */}
        <div className="demo-control-panel">
          <h4>🧪 시연 테스트 패널</h4>
          <button className="demo-btn" onClick={() => setShowNetworkError(true)}>
            1. 인터넷 끊김 (주문 안 감) 팝업
          </button>
          <button className="demo-btn" onClick={() => navigate('/status')}>
            2. 바로 주문 완료 페이지로 이동
          </button>
        </div>

      </div>
    </div>
  );
}
