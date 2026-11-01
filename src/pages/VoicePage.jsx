import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VoicePage.css';

export default function VoicePage() {
  const navigate = useNavigate();
  
  // 시연 단계 상태 (0: 초기, 1: 메뉴 말함, 2: 주문 완료 선택지, 3: 잘 안 들림 상황)
  const [step, setStep] = useState(0);
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  // 30초 무응답 타이머 시뮬레이션 (실제 구현 시 액션이 있을 때마다 초기화 가능)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInactivityModal(true);
    }, 30000); // 30초

    return () => clearTimeout(timer);
  }, [step]);

  const handleMicClick = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleStaffCall = () => {
    alert('직원을 호출하였습니다. 잠시만 기다려주세요!');
    setShowInactivityModal(false);
  };

  return (
    <div className="voice-container">
      <div className="layout-wrapper">
        
        {/* 모바일 화면 프레임 */}
        <div className="mobile-frame">
          
          {/* 상단 헤더 */}
          <div className="voice-header">
            <button className="back-btn" onClick={() => navigate('/')}>&lt;</button>
            <h2 className="voice-title">말로 주문하기</h2>
            <button className="menu-link-btn" onClick={() => navigate('/menu')}>메뉴판</button>
          </div>

          {/* 채팅 대화 내용 영역 */}
          <div className="chat-scroll-area">
            <div className="ai-bubble">
              <div className="ai-name">AI 정원</div>
              무엇을 드릴까요? 편하게 말해 주세요.
            </div>

            {step === 3 && (
              <>
                <div className="user-bubble" style={{background: '#9ca3af'}}>(잘 안 들림)</div>
                <div className="ai-bubble">
                  <div className="ai-name">AI 정원</div>
                  잘 못 들었어요. 어떻게 도와드릴까요?[cite: 5]
                  <div className="error-action-box">
                    <div className="error-btn-row">
                      <button onClick={() => setStep(0)}>다시 말하기</button>
                      <button onClick={() => navigate('/menu')}>눌러서 주문하기</button>
                    </div>
                    <button className="staff-call-btn" onClick={handleStaffCall}>직원 부르기</button>
                  </div>
                </div>
              </>
            )}

            {step >= 1 && step < 3 && (
              <>
                <div className="user-bubble">
                  아이스 아메리카노 하나 줘요.
                </div>
                <div className="ai-bubble">
                  <div className="ai-name">AI 정원</div>
                  아이스 아메리카노 1잔이요. 주문을 확인할게요.
                </div>
              </>
            )}

            {step === 2 && (
              <div className="ai-bubble">
                <div className="ai-name">AI 정원</div>
                원하시는 주문이 맞나요? 아래 버튼을 선택해 주세요.
              </div>
            )}
          </div>

          {/* 하단 고정 영역 */}
          <div className="voice-footer">
            {step === 0 && (
              <p className="guide-text">음성 버튼을 꾹 누르고 말씀해 주세요!</p>
            )}

            <div className="cart-preview-bar">
              <span>담은 메뉴 <strong className="cart-count">{step > 0 && step < 3 ? '1개' : '0개'}</strong></span>
              {step > 0 && step < 3 ? <span>아이스 아메리카노</span> : <span style={{color: '#9ca3af'}}>아직 없어요</span>}
              <button className="check-order-btn" onClick={() => navigate('/confirm')}>주문 확인</button>
            </div>

            {step === 2 ? (
              <div className="action-btn-group">
                <button className="complete-order-btn" onClick={() => navigate('/confirm')}>주문 완료</button>
                <button className="add-order-btn" onClick={() => setStep(0)}>주문 추가</button>
              </div>
            ) : (
              <div className="mic-section">
                <button className="mic-btn" onClick={handleMicClick}>🎤</button>
                <span className="mic-subtext">누르고 말해 주세요</span>
              </div>
            )}
          </div>

          {/* 30초 이상 무응답 팝업 모달 */}
          {showInactivityModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>주문이 어려우신가요?</h3>
                <p>30초 동안 답변이 감지되지 않았어요.</p>
                <div className="modal-btn-group">
                  <button className="modal-continue-btn" onClick={() => setShowInactivityModal(false)}>계속할게요</button>
                  <button className="modal-staff-btn" onClick={handleStaffCall}>직원 부르기</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 🎬 시연용 테스트 패널 (발표 시 유용) */}
        <div className="demo-control-panel">
          <h4>🧪 시연 테스트 패널</h4>
          <button className="demo-btn" onClick={() => setStep(3)}>
            1. 음성 인식 실패 (잘 안 들림)
          </button>
          <button className="demo-btn" onClick={() => setShowInactivityModal(true)}>
            2. 30초 무응답 팝업 띄우기
          </button>
          <button className="demo-btn" onClick={() => { setStep(0); setShowInactivityModal(false); }}>
            3. 초기화
          </button>
        </div>

      </div>
    </div>
  );
}