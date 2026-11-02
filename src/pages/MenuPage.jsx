import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { ArrowIcon, BackIcon, MicIcon, TapIcon, Tello } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import MenuCard, { FoodTile } from '../components/order/MenuCard';
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
    const [optionPick, setOptionPick] = useState(null); // { item, picked } 옵션 고르는 중인 메뉴
    const [sheet, setSheet] = useState(null); // null | 'idle'

    useEffect(() => {
        setFrom('menu');
    }, [setFrom]);

    useIdleTimer(() => {
        if (!sheet && !optionPick) {
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
        if (nextOption(item)) {
            // 기본값: 크기 보통 (온도는 손님이 직접 골라요)
            const picked = item.options.includes('size') ? { size: OPTIONS.size.default } : {};
            setOptionPick({ item, picked });
            return;
        }
        addItem(item.id);
        added(item.name);
    };

    // 크기·온도·얼음을 한 화면에서 고르고 [담기]
    const onOption = (key, value) =>
        setOptionPick((prev) => {
            const picked = { ...prev.picked, [key]: value };
            if (key === 'temperature') {
                if (value === 'ice') picked.ice = prev.picked.ice ?? OPTIONS.ice.default; // 아이스면 얼음 보통
                else delete picked.ice; // 핫이면 얼음 없음
            }
            return { ...prev, picked };
        });

    const onAddWithOptions = () => {
        const { item, picked } = optionPick;
        addItem(item.id, picked);
        added(item.name, getOptionLabel(picked));
        setOptionPick(null);
    };

    // 지금 보여줄 옵션 묶음 (얼음은 아이스를 골랐을 때만)
    const optionKeys = optionPick
        ? optionPick.item.options.filter(
              (key) => key !== 'ice' || optionPick.picked.temperature === 'ice',
          )
        : [];
    const optionsDone = optionPick ? !nextOption(optionPick.item, optionPick.picked) : false;

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
                >
                    <span className="app-header__title">
                        메뉴 고르기
                        <TapIcon />
                    </span>
                </Header>

                <div className="menu-tabs glass" role="tablist">
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
                        {count ? `담은 메뉴 보기 · ${count}개` : '메뉴를 먼저 골라 주세요'}
                        <ArrowIcon size={20} />
                    </BigButton>
                </div>

                <Toast message={toast} onDone={clearToast} />

                <BottomSheet open={!!optionPick} label="옵션 고르기">
                    {optionPick && (
                        <div className="menu-options">
                            <div className="menu-options__head">
                                <FoodTile
                                    icon={getItemIcon(optionPick.item, optionPick.picked)}
                                    size={120}
                                    iconSize={96}
                                    radius={32}
                                />
                                <h2 className="menu-options__name">{optionPick.item.name}</h2>
                                <p className="sheet__desc">옵션을 골라 주세요</p>
                            </div>

                            {optionKeys.map((key) => (
                                <div key={key} className="menu-opt" role="group" aria-label={OPTIONS[key].label}>
                                    <span className="menu-opt__label">{OPTIONS[key].label}</span>
                                    <div
                                        className={`menu-sizes ${OPTIONS[key].choices.length > 2 ? 'menu-sizes--three' : ''}`}
                                    >
                                        {OPTIONS[key].choices.map((choice) => {
                                            const on = optionPick.picked[key] === choice.id;
                                            return (
                                                <button
                                                    key={choice.id}
                                                    type="button"
                                                    aria-pressed={on}
                                                    className={`menu-size ${on ? 'is-selected' : ''}`}
                                                    onClick={() => onOption(key, choice.id)}
                                                >
                                                    {choice.label}
                                                    {key === 'size' && (
                                                        <span>{formatPrice(optionPick.item.price + choice.extra)}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <BigButton disabled={!optionsDone} onClick={onAddWithOptions}>
                                {optionsDone ? '담기' : '온도를 골라 주세요'}
                            </BigButton>
                            <BigButton variant="outline" onClick={() => setOptionPick(null)}>
                                닫기
                            </BigButton>
                        </div>
                    )}
                </BottomSheet>

                <BottomSheet
                    open={sheet === 'idle'}
                    icon={<Tello face="sad" size={96} />}
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
