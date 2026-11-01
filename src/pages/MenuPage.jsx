import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BellIcon, MicIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import MenuCard, { FoodIcon } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import { getCartCount, useSessionStore } from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import menu from '../mocks/menu.json';
import script from '../mocks/messages.json';
import './MenuPage.css';

// 3. 눌러서 주문하기: 큰 사진 메뉴판 (어르신도 읽기 쉽게 글자를 크게)
export default function MenuPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const addItem = useSessionStore((s) => s.addItem);
    const setFrom = useSessionStore((s) => s.setFrom);
    const callStaff = useSessionStore((s) => s.callStaff);
    const { speak } = useTextToSpeech();

    const [tab, setTab] = useState(menu.categories[0].id);
    const [toast, setToast] = useState('');
    const [sizeItem, setSizeItem] = useState(null); // 크기를 고를 메뉴
    const [sheet, setSheet] = useState(null); // null | 'idle'

    useEffect(() => {
        setFrom('menu');
    }, [setFrom]);

    useIdleTimer(() => {
        if (!sheet && !sizeItem) {
            setSheet('idle');
            speak(script.idle);
        }
    });

    const clearToast = useCallback(() => setToast(''), []);
    const count = getCartCount(cart);
    const items = menu.items.filter((item) => item.category === tab);

    const added = (name, opt = '') => {
        setToast(`${name} 담았어요`);
        speak(`${name}${opt ? ` ${opt}` : ''} 담았어요`);
    };

    const onPick = (item) => {
        if (item.sized) {
            setSizeItem(item);
            return;
        }
        addItem(item.id);
        added(item.name);
    };

    const onSize = (size) => {
        addItem(sizeItem.id, size);
        added(sizeItem.name, size);
        setSizeItem(null);
    };

    // 직원 부르기: 누르면 바로 매장 화면에 알림이 가요
    const callNow = (reason) => {
        callStaff(reason);
        setSheet(null);
        setToast(script.called);
        speak(script.called);
    };

    return (
        <div className="stage">
            <div className="phone menu-phone">
                <Header
                    title="메뉴 고르기"
                    left={
                        <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={() => navigate('/')}>
                            <BackIcon />
                        </button>
                    }
                    right={
                        <button
                            type="button"
                            className="icon-btn icon-btn--blue"
                            aria-label="말로 주문하기"
                            onClick={() => navigate('/voice')}
                        >
                            <MicIcon size={22} />
                        </button>
                    }
                />

                <div className="menu-tabs" role="tablist">
                    {menu.categories.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === c.id}
                            className={`menu-tab ${tab === c.id ? 'is-active' : ''}`}
                            onClick={() => setTab(c.id)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <main className="phone__body">
                    <div className="menu-grid">
                        {items.map((item) => (
                            <MenuCard key={item.id} item={item} onClick={onPick} />
                        ))}
                    </div>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!count} onClick={() => navigate('/confirm')}>
                        담은 메뉴 보기 ({count})
                    </BigButton>
                </div>

                <Toast message={toast} onDone={clearToast} />

                <BottomSheet open={!!sizeItem} label="크기 고르기">
                    {sizeItem && (
                        <>
                            <FoodIcon icon={sizeItem.icon} size={72} />
                            <h2 className="sheet__title">{sizeItem.name}</h2>
                            <p className="sheet__desc">크기를 골라 주세요</p>
                            <div className="menu-sizes">
                                {menu.sizes.map((size) => (
                                    <button
                                        key={size.id}
                                        type="button"
                                        className="menu-size"
                                        onClick={() => onSize(size.id)}
                                    >
                                        {size.label}
                                        <span>{formatPrice(sizeItem.price + size.extra)}</span>
                                    </button>
                                ))}
                            </div>
                            <BigButton variant="outline" onClick={() => setSizeItem(null)}>
                                닫기
                            </BigButton>
                        </>
                    )}
                </BottomSheet>

                <BottomSheet
                    open={sheet === 'idle'}
                    icon={<BellIcon />}
                    title="도와드릴까요?"
                    desc={script.idleDesc}
                >
                    <BigButton onClick={() => setSheet(null)}>계속할게요</BigButton>
                    <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
                        직원 부르기
                    </BigButton>
                </BottomSheet>
            </div>

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>막혔을 때 보여주기</h3>
                    <button
                        type="button"
                        className="demo-btn"
                        onClick={() => {
                            setSheet('idle');
                            speak(script.idle);
                        }}
                    >
                        30초 동안 가만히 있음
                    </button>
                </div>
                <div className="demo-panel__box">
                    <a className="demo-btn" href="/boss" target="_blank" rel="noreferrer">
                        매장 화면 열기
                    </a>
                </div>
            </aside>
        </div>
    );
}
