import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuPage.css';

// 카테고리별 메뉴 데이터 정의 (가격 및 이미지 아이콘 포함)[cite: 6]
const menuData = {
  coffee: [
    { id: 1, name: '아메리카노', price: 3000, icon: '☕' },
    { id: 2, name: '아이스 아메리카노', price: 3000, icon: '🧊' },
    { id: 3, name: '카페라테', price: 3500, icon: '🥛' },
    { id: 4, name: '바닐라라테', price: 4000, icon: '🧋' },
  ],
  drink: [
    { id: 5, name: '초코우유', price: 3500, icon: '🍫' },
    { id: 6, name: '딸기우유', price: 3500, icon: '🍓' },
    { id: 7, name: '사과주스', price: 3000, icon: '🧃' },
  ],
  dessert: [
    { id: 8, name: '초코쿠키', price: 2000, icon: '🍪' },
    { id: 9, name: '크루아상', price: 3000, icon: '🥐' },
  ],
};

export default function MenuPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('coffee');
  const [cartCount, setCartCount] = useState(0);
  
  // 메뉴 클릭 시 옵션 모달(사이즈 선택 등) 띄우기 위한 상태
  const [selectedMenu, setSelectedMenu] = useState(null);

  const handleAddToCart = (menuName) => {
    setCartCount(cartCount + 1);
    setSelectedMenu(null);
    alert(`"${menuName}"이(가) 장바구니에 담겼습니다!`);
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

          {/* 카테고리 탭 (고령자 맞춤형 큼직한 버튼) */}
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
                onClick={() => setSelectedMenu(item)}
              >
                <div className="menu-img-box">{item.icon}</div>
                <div className="menu-name">{item.name}</div>
                <div className="menu-price">{item.price.toLocaleString()}원</div>
              </div>
            ))}
          </div>

          {/* 하단 장바구니 확인 버튼 */}
          <div className="menu-footer">
            <button 
              className="view-cart-main-btn"
              onClick={() => navigate('/confirm')}
            >
              담은 메뉴 보기 ({cartCount})
            </button>
          </div>

          {/* 옵션 선택 팝업 모달 (시안의 2번째 화면 반영)[cite: 6] */}
          {selectedMenu && (
            <div className="modal-overlay">
              <div className="modal-content-sheet">
                <div className="menu-img-box" style={{width: '90px', height: '90px', fontSize: '42px'}}>
                  {selectedMenu.icon}
                </div>
                <h3 className="selected-item-title">{selectedMenu.name}</h3>
                <p className="option-guide">원하시는 크기를 골라주세요</p>
                
                <div className="option-btn-group">
                  <button className="option-select-btn" onClick={() => handleAddToCart(selectedMenu.name)}>
                    보통 <span>{selectedMenu.price.toLocaleString()}원</span>
                  </button>
                  <button className="option-select-btn" onClick={() => handleAddToCart(`${selectedMenu.name} (큰 사이즈)`)}>
                    큰 사이즈 <span>{(selectedMenu.price + 500).toLocaleString()}원 (+500원)</span>
                  </button>
                </div>

                <button className="modal-close-btn" onClick={() => setSelectedMenu(null)}>
                  닫기
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}