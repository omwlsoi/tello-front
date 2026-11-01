import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderStatusPage.css';

export default function OrderStatusPage() {
  const navigate = useNavigate();
  
  // 시연을 위해 단계 상태 관리 (1: 주문 완료, 2: 만드는 중, 3: 다 됐어요)
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="status-container">
      <div className="layout-wrapper">
        
        {/* 모바일 화면 프레임 */}
        <div className="mobile-frame">
          
          {/* 상단 헤더 */}
          <div className="status-header">
            <div style={{width: '24px'}}></div>
            <h2 className="status-brand">카페 덕성</h2>
            <div style={{width: '24px'}}></div>
          </div>

          {/* 상단 메인 안내 배너 (단계별 디자인 변경)[cite: 8] */}
          <div className={`status-banner ${
            currentStep === 1 ? 'banner-blue' : currentStep === 2 ? 'banner-orange' : 'banner-green'
          }`}>
            <div className="banner-icon">
              {currentStep === 1 ? '✓' : currentStep === 2 ? '☕' : '🔔'}
            </div>
            <h1 className="banner-title">
              {currentStep === 1 && '주문이 들어었어요'}
              {currentStep === 2 && '지금 만들고 있어요'}
              {currentStep === 3 && '메뉴가 나왔어요!'}
            </h1>
            <p className="banner-desc">
              {currentStep === 1 && '가게에 잘 전달됐어요'}
              {currentStep === 2 && '조금만 기다려 주세요'}
              {currentStep === 3 && '카운터로 와 주세요'}
            </p>
          </div>

          {/* 단계별 리스트 영역[cite: 8] */}
          <div className="status-body">
            
            {/* 1단계: 주문 완료 */}
            <div className={`step-item-card ${currentStep === 1 ? 'active-step-blue' : 'done'}`}>
              <div className="step-left">
                <div className="step-num-badge">1</div>
                <span className="step-name">주문 완료</span>
              </div>
              <div className="step-right">
                {currentStep === 1 ? '지금' : '끝났어요'}
              </div>
            </div>

            {/* 2단계: 만드는 중 */}
            <div className={`step-item-card ${
              currentStep === 2 ? 'active-step-orange' : currentStep > 2 ? 'done' : ''
            }`}>
              <div className="step-left">
                <div className="step-num-badge">2</div>
                <span className="step-name">만드는 중</span>
              </div>
              <div className="step-right">
                {currentStep === 2 ? '지금' : currentStep > 2 ? '끝났어요' : '대기중'}
              </div>
            </div>

            {/* 3단계: 다 됐어요 */}
            <div className={`step-item-card ${currentStep === 3 ? 'active-step-green' : ''}`}>
              <div className="step-left">
                <div className="step-num-badge">3</div>
                <span className="step-name">다 됐어요</span>
              </div>
              <div className="step-right">
                {currentStep === 3 ? '지금' : '대기중'}
              </div>
            </div>

            {/* 주문 번호표 박스[cite: 8] */}
            <div className="order-number-box">
              <div>
                <div className="num-label">주문 번호</div>
                <div className="num-value">27</div>
              </div>
              <div className="star-badge">
                ⭐ 노란 별
              </div>
            </div>

            {/* 계산 안내 (시연용)[cite: 8] */}
            <div className="calc-notice-box">
              <div className="calc-title">계산 안내</div>
              계산은 카운터에서 해 주세요 (시연용)
            </div>

          </div>

          {/* 하단 처음으로 버튼[cite: 8] */}
          <div className="status-footer">
            <button className="go-home-btn" onClick={() => navigate('/')}>
              처음으로
            </button>
          </div>

        </div>

        {/* 🎬 시연용 테스트 패널 */}
        <div className="demo-control-panel">
          <h4>🧪 시연 상태 변경 패널</h4>
          <button className="demo-btn" onClick={() => setCurrentStep(1)}>
            1단계: 주문 완료 상태
          </button>
          <button className="demo-btn" onClick={() => setCurrentStep(2)}>
            2단계: 만드는 중 상태
          </button>
          <button className="demo-btn" onClick={() => setCurrentStep(3)}>
            3단계: 다 됐어요 상태
          </button>
        </div>

      </div>
    </div>
  );
}