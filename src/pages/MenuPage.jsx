import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuPage.css';

// 메뉴 데이터 정의
const menuData = {
  coffee: [
    { id: 1, name: '아메리카노', price: 3000, icon: '☕', hasTemp: true },
    { id: 2, name: '아이스 아메리카노', price: 3000, icon: '🧊', hasTemp: false },
    { id: 3, name: '카페라테', price: 3500, icon: '🥛', hasTemp: true },
    { id: 4, name: '바닐라라테', price: 4000, icon: '🧋', hasTemp: true },
  ],
  drink: [
    { id: 5, name: '초코우유', price: 3500, icon: '🍫', hasTemp: false },
    { id: 6, name: '딸기우유', price: 3500, icon: '🍓', hasTemp: false },
    { id: 7, name: '사과주스', price: 3000, icon: '🧃', hasTemp: false },
  ],
  dessert: [
    { id: 8, name: '초코쿠키', price: 2000, icon: '🍪', hasTemp: false },
    { id: 9, name: '크루아상', price: 3000, icon: '🥐', hasTemp: false },
  ],
};

export default function MenuPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('coffee');
  const [cartCount, setCartCount] = useState(0);
  
  // 모달 및 상세 옵션 상태 관리
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [tempOption, setTempOption] = useState('아이스'); // '핫' 또는 '아이스'
  const [sizeOption, setSizeOption] = useState('보통'); // '보통' 또는 '큰 사이즈'
  const [iceOption, setIceOption] = useState('보통');     // '많이', '보통', '적게'

  const handleOpenModal = (item) => {
    setSelectedMenu(item);
    // 초기 옵션 기본값 설정
    setTempOption(item.name.includes('아이스') ? '아이스' : '핫');
    setSizeOption('보통');
    setIceOption('보통');
  };

  const handleAddToCart = () => {
    let finalName = selectedMenu.name;
    let addPrice = 0;

    if (sizeOption === '큰 사이즈') {
      finalName += ' (큰 사이즈)';
      addPrice += 500;
    }
    if (selectedMenu.hasTemp || selectedMenu.name.includes('아이스')) {
      finalName = `[${tempOption}] ` + finalName;
      if (tempOption === '아이스') {
        finalName += ` (얼음:${iceOption})`;
      }
    }

    setCartCount(cartCount + 1);
    setSelectedMenu(null);
    alert(`"${finalName}"이(가) 장바구니에 담겼습니다!`);
  };

  return (
    <div className="menu-container">
      <div className="layout-wrapper">
        
        {/* 모바일 화면 프레임 */}
        <div className="mobile-frame">
          
          {/* 상단 헤더 */}
          <div className="menu-header">
            <button className="back-btn" onClick={() => navigate('/')}>&lt;</button>
            <h2 className="menu-title">메뉴 고르기</h2>
            <button className="back-btn" onClick={() => navigate('/voice')} style={{fontSize: '14px', color: '#2563eb'}}>말하기</button>
          </div>

          {/* 카테고리 탭 */}
          <div className="category-tab-bar">
            <button 
              className={`category-btn ${activeTab === 'coffee' ? 'active' : ''}`}
              onClick={() => setActiveTab('coffee')}
            >
              커피
            </button>
            <button 
              className={`category-btn ${activeTab === 'drink' ? 'active' : ''}`}
              onClick={() => setActiveTab('drink')}
            >
              음료
            </button>
            <button 
              className={`category-btn ${activeTab === 'dessert' ? 'active' : ''}`}
              onClick={() => setActiveTab('dessert')}
            >
              빵·디저트
            </button>
          </div>

          {/* 메뉴 카드 목록 영역 */}
          <div className="menu-grid-area">
            {menuData[activeTab].map((item) => (
              <div 
                key={item.id} 
                className="menu-card"
                onClick={() => handleOpenModal(item)}
              >
                <div className="menu-img-box">{item.icon}</div>
                <div className="menu-name">{item.name}</div>
                <div className="menu-price">{item.price.toLocaleString()}원</div>
              </div>
            ))}
          </div>

          {/* 하단 장바구니 버튼 */}
          <div className="menu-footer">
            <button 
              className="view-cart-main-btn"
              onClick={() => navigate('/confirm')}
            >
              담은 메뉴 보기 ({cartCount})
            </button>
          </div>

          {/* 상세 옵션 선택 팝업 모달 */}
          {selectedMenu && (
            <div className="modal-overlay">
              <div className="modal-content-sheet">
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                  <div className="menu-img-box" style={{width: '60px', height: '60px', fontSize: '28px', margin: 0}}>
                    {selectedMenu.icon}
                  </div>
                  <div>
                    <h3 className="selected-item-title" style={{textAlign: 'left'}}>{selectedMenu.name}</h3>
                    <div style={{fontSize: '15px', color: '#2563eb', fontWeight: '700'}}>
                      기본 {selectedMenu.price.toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* 1. 온도 선택 (핫 / 아이스) - 커피류 등에 적용 */}
                {selectedMenu.hasTemp && (
                  <>
                    <div className="option-section-title">온도 선택</div>
                    <div className="option-btn-group">
                      <button 
                        className={`option-btn ${tempOption === '핫' ? 'selected' : ''}`}
                        onClick={() => setTempOption('핫')}
                      >
                        🔥 따뜻하게 (핫)
                      </button>
                      <button 
                        className={`option-btn ${tempOption === '아이스' ? 'selected' : ''}`}
                        onClick={() => setTempOption('아이스')}
                      >
                        🧊 시원하게 (아이스)
                      </button>
                    </div>
                  </>
                )}

                {/* 2. 사이즈 선택 (보통 / 큰 사이즈) */}
                <div className="option-section-title">크기 선택</div>
                <div className="option-btn-group">
                  <button 
                    className={`option-btn ${sizeOption === '보통' ? 'selected' : ''}`}
                    onClick={() => setSizeOption('보통')}
                  >
                    보통 <span>기본</span>
                  </button>
                  <button 
                    className={`option-btn ${sizeOption === '큰 사이즈' ? 'selected' : ''}`}
                    onClick={() => setSizeOption('큰 사이즈')}
                  >
                    큰 사이즈 <span>+500원</span>
                  </button>
                </div>

                {/* 3. 아이스 선택 시 얼음 양 선택 (많이 / 보통 / 적게) */}
                {(!selectedMenu.hasTemp || tempOption === '아이스') && (
                  <>
                    <div className="option-section-title">얼음 양 선택</div>
                    <div className="option-btn-group">
                      <button 
                        className={`option-btn ${iceOption === '많이' ? 'selected' : ''}`}
                        onClick={() => setIceOption('많이')}
                      >
                        많이
                      </button>
                      <button 
                        className={`option-btn ${iceOption === '보통' ? 'selected' : ''}`}
                        onClick={() => setIceOption('보통')}
                      >
                        보통
                      </button>
                      <button 
                        className={`option-btn ${iceOption === '적게' ? 'selected' : ''}`}
                        onClick={() => setIceOption('적게')}
                      >
                        적게
                      </button>
                    </div>
                  </>
                )}

                {/* 하단 확인/닫기 버튼 */}
                <div className="modal-action-row">
                  <button className="modal-close-btn" onClick={() => setSelectedMenu(null)}>
                    취소
                  </button>
                  <button className="modal-add-cart-btn" onClick={handleAddToCart}>
                    담기 완료
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}