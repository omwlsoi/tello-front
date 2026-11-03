import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BellIcon, MicIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import MenuCard, { FoodIcon } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import {
    OPTIONS,
    getCartCount,
    getItemIcon,
    getOptionLabel,
    nextOption,
    useSessionStore,
} from '../stores/sessionStore';
import formatPrice from '../utils/formatPrice';
import script from '../mocks/messages.json';
import { getStoreMenus } from '../api/storeApi'; // 👉 방금 만든 API 함수 불러오기
import './MenuPage.css';

export default function MenuPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const addItem = useSessionStore((s) => s.addItem);
    const setFrom = useSessionStore((s) => s.setFrom);
    const callStaff = useSessionStore((s) => s.callStaff);
    const { speak } = useTextToSpeech();

    // 👉 로컬 JSON 대신 서버에서 받아올 데이터를 담을 상태(State) 선언
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('');
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState('');
    const [optionPick, setOptionPick] = useState(null); 
    const [sheet, setSheet] = useState(null); 

    const storeId = "store_sample_id_123"; // 💡 실제 서비스에 맞는 storeId로 변경 필요

    useEffect(() => {
        setFrom('menu');

        // 👉 백엔드에서 매장 메뉴 데이터 불러오기
        const fetchMenus = async () => {
            try {
                setLoading(true);
                const response = await getStoreMenus(storeId);
                
                // 백엔드 응답 구조에 맞추어 메뉴 설정
                // (예시: response.menus 안에 전체 메뉴가 들어있다고 가정)
                const fetchedMenus = response.menus || [];
                setItems(fetchedMenus);

                // 카테고리 추출 (메뉴들의 category 속성을 모아서 중복 제거하거나 백엔드 카테고리 활용)
                // 만약 백엔드에서 카테고리 목록도 따로 준다면 그것을 쓰셔도 됩니다!
                const uniqueCategories = Array.from(new Set(fetchedMenus.map(m => m.category)))
                    .map(cat => ({ id: cat, label: cat })); // 임시 매핑
                
                setCategories(uniqueCategories);
                if (uniqueCategories.length > 0) {
                    setTab(uniqueCategories[0].id); // 첫 번째 카테고리를 기본 탭으로 설정
                }
            } catch (err) {
                console.error("메뉴를 불러오지 못했습니다:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMenus();
    }, [setFrom, storeId]);

    useIdleTimer(() => {
        if (!sheet && !optionPick) {
            setSheet('idle');
            speak(script.idle);
        }
    });

    const clearToast = useCallback(() => setToast(''), []);
    const count = getCartCount(cart);

    // 👉 현재 선택된 탭(카테고리)에 해당하는 메뉴만 필터링
    const filteredItems = items.filter((item) => item.category === tab);

    const added = (name, opt = '') => {
        setToast(`${name} 담았어요`);
        speak(`${name}${opt ? ` ${opt}` : ''} 담았어요`);
    };

    const onPick = (item) => {
        if (nextOption(item)) {
            const picked = item.options.includes('size') ? { size: OPTIONS.size.default } : {};
            setOptionPick({ item, picked });
            return;
        }
        addItem(item.id);
        added(item.name);
    };

    const onOption = (key, value) =>
        setOptionPick((prev) => {
            const picked = { ...prev.picked, [key]: value };
            if (key === 'temperature') {
                if (value === 'ice') picked.ice = prev.picked.ice ?? OPTIONS.ice.default;
                else delete picked.ice;
            }
            return { ...prev, picked };
        });

    const onAddWithOptions = () => {
        const { item, picked } = optionPick;
        addItem(item.id, picked);
        added(item.name, getOptionLabel(picked));
        setOptionPick(null);
    };

    const optionKeys = optionPick
        ? optionPick.item.options.filter(
              (key) => key !== 'ice' || optionPick.picked.temperature === 'ice',
          )
        : [];
    const optionsDone = optionPick ? !nextOption(optionPick.item, optionPick.picked) : false;

    const callNow = (reason) => {
        callStaff(reason);
        setSheet(null);
        setToast(script.called);
        speak(script.called);
    };

    if (loading) {
        return <div className="stage"><div className="phone menu-phone">메뉴 불러오는 중...</div></div>;
    }

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
                    {categories.map((c) => (
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
                        {filteredItems.map((item) => (
                            <MenuCard key={item.id || item.menuId} item={item} onClick={onPick} />
                        ))}
                    </div>
                </main>

                <div className="phone__footer">
                    <BigButton disabled={!count} onClick={() => navigate('/confirm')}>
                        담은 메뉴 보기 ({count})
                    </BigButton>
                </div>

                <Toast message={toast} onDone={clearToast} />

                <BottomSheet open={!!optionPick} label="옵션 고르기">
                    {/* ... (옵션 바텀시트 관련 코드는 기존과 동일하게 유지) ... */}
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

            {/* 시연 패널 등 기존 코드 유지 */}
            <aside className="demo-panel" aria-label="시연 버튼">
                {/* ... */}
            </aside>
        </div>
    );
}