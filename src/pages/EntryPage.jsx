import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EntryPage.css'; // CSS 파일 임포트

export default function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="entry-container">
      {/* 모바일 화면 프레임 */}
      <div className="mobile-frame">
        
        {/* 상단 헤더 영역 */}
        <div className="header">
          <div className="logo-area">
            <span className="badge">덕</span>
            <span className="brand-name">카페 덕성</span>
          </div>
          <button className="help-btn">?</button>
        </div>

        {/* 메인 타이틀 및 주문 버튼 영역 */}
        <div className="main-content">
          <div className="title-area">
            <h1>어떻게 주문하시겠어요?</h1>
            <p>주문 중에도 언제든 바꿀 수 있어요</p>
          </div>

          {/* 버튼 컨테이너 */}
          <div className="button-group">
            {/* 1. 말로 주문하기 버튼 */}
            <button
              onClick={() => navigate('/voice')}
              className="order-btn-voice"
            >
              <span className="recommend-badge">추천</span>
              <div className="btn-content">
                <div className="icon-box">🎤</div>
                <span className="btn-title">말로 주문하기</span>
              </div>
              <p className="btn-desc">"아이스 아메리카노 하나 주세요"처럼 말하면 돼요</p>
            </button>

            {/* 2. 눌러서 주문하기 버튼 */}
            <button
              onClick={() => navigate('/menu')}
              className="order-btn-touch"
            >
              <div className="btn-content">
                <div className="icon-box-gray">👆</div>
                <span className="btn-title">눌러서 주문하기</span>
              </div>
              <p className="btn-desc-gray">큰 사진을 보고 눌러서 골라요</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}