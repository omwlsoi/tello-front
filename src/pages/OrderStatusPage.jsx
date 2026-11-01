import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderStatusPage.css';

export default function OrderStatusPage() {
  const navigate = useNavigate();

  return (
    <div className="status-container">
      <div className="mobile-frame">
        
        {/* 상단 헤더 */}
        <div className="status-header">
          <div style={{width: '40px'}}></div>
          <h2 className="status-title">주문 완료</h2>
          <button className="home-btn" onClick={() => navigate('/')}>처음으로</button>
        </div>

        {/* 메인 내용 영역 */}
        <div className="status-body">
          <div className="complete-icon-box">
            ✓
          </div>
          
          <h1 className="status-main-msg">준비가 완료되었습니다.</h1>
          <p className="status-sub-msg">카운터에서 상품을 수령해 주세요.</p>

          <div className="order-number-box">
            <div className="number-label">고객님 주문번호</div>
            <div className="number-value">No. 12</div>
          </div>
        </div>

        {/* 하단 처음으로 버튼 */}
        <div className="status-footer">
          <button 
            className="go-home-main-btn"
            onClick={() => navigate('/')}
          >
            첫 화면으로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
}