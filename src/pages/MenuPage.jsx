import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { ArrowIcon, BackIcon, CartIcon, MicIcon, TapIcon, Tello, ZoomButton } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import MenuCard, { FoodTile } from '../components/order/MenuCard';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useIdleSteps } from '../hooks/useIdleTimer';
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

// 수량 (1개가 기본 ★, 4개 이상은 주문 확인 화면의 [+]로)
const QTY_CHOICES = [1, 2, 3];

// 3. 눌러서 주문하기: 큰 사진 메뉴판 (어르신도 읽기 쉽게 글자를 크게)
export default function MenuPage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const addItem = useSessionStore((s) => s.addItem);
    const setFrom = useSessionStore((s) => s.setFrom);
    const callStaff = useSessionStore((s) => s.callStaff);
    const startOver = useSessionStore((s) => s.startOver);
    const bigText = useSessionStore((s) => s.bigText);
    const { speak } = useTextToSpeech();

    const [tab, setTab] = useState(menu.categories[0].id);
    const [toast, setToast] = useState('');
    const [optionPick, setOptionPick] = useState(null); // { item, picked } 옵션 고르는 중인 메뉴
    const [sheet, setSheet] = useState(null); // null | 'idle' | 'leave'
    const [idleStage, setIdleStage] = useState(0); // 무응답 몇 번째 안내인지 (0 · 1 · 2)

    useEffect(() => {
        setFrom('menu');
    }, [setFrom]);

    // 무응답 3단계 (30초 · 1분 · 1분 30초) — 명세서 STEP 10-3
    const onIdleStep = useCallback(
        (stage) => {
            setIdleStage(stage);
            setSheet('idle');
            speak(script.idleSteps[stage]);
        },
        [speak],
    );
    const nextIdle = useIdleSteps(onIdleStep, script.idleSteps.length);

    const clearToast = useCallback(() => setToast(''), []);
    const count = getCartCount(cart);
    const items = menu.items.filter((item) => item.category === tab);

    const added = (name, opt, qty) => {
        setToast(`${name} ${qty}개 담았어요`);
        speak(`${name}${opt ? ` ${opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ')}` : ''} ${qty}개 담았어요`);
    };

    // 메뉴를 누르면 옵션 창: 크기 · 온도 · 얼음 · 수량 (빵·디저트는 수량만)
    // 기본값: 크기 보통, 수량 1개 (온도는 손님이 직접 골라요)
    const onPick = (item) => {
        const picked = { qty: 1 };
        if (item.options.includes('size')) picked.size = OPTIONS.size.default;
        setOptionPick({ item, picked });
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
        const { qty, ...options } = picked;
        addItem(item.id, options, qty);
        added(item.name, getOptionLabel(options), qty);
        setOptionPick(null);
    };

    // 지금 보여줄 옵션 묶음 (얼음은 아이스를 골랐을 때만)
    const optionKeys = optionPick
        ? optionPick.item.options.filter(
              (key) => key !== 'ice' || optionPick.picked.temperature === 'ice',
          )
        : [];
    const optionsDone = optionPick ? !nextOption(optionPick.item, optionPick.picked) : false;

    // 직원 호출: 누르면 바로 매장 화면에 알림이 가요
    const notify = (msg) => {
        setSheet(null);
        setToast(msg);
        speak(msg);
    };
    const callNow = (reason) => {
        callStaff(reason);
        notify(useSessionStore.getState().cart.length ? script.calledWithCart : script.called);
    };

    // 뒤로가기: 담은 메뉴가 있으면 한 번 더 물어봐요
    const goBack = () => {
        if (cart.length) {
            setSheet('leave');
            speak(`${script.leaveTitle}. ${script.leaveDesc}`);
        } else {
            navigate('/');
        }
    };
    const leave = () => {
        notify(script.leaveBye);
        startOver();
        setTimeout(() => navigate('/'), 900);
    };

    return (
        <div className="stage">
            <div className={`phone menu-phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                <Header
                    left={
                        <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={goBack}>
                            <BackIcon />
                        </button>
                    }
                    right={
                        <>
                            <ZoomButton />
                            <button
                                type="button"
                                className="icon-btn icon-btn--blue"
                                aria-label="말로 주문하기"
                                onClick={() => navigate('/voice')}
                            >
                                <MicIcon size={22} />
                            </button>
                        </>
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
                </div>

                <Toast message={toast} onDone={clearToast} />

                <BottomSheet open={!!optionPick} label="옵션 고르기">
                    {optionPick && (
                        <div className="menu-options">
                            <div className="menu-options__head">
                                <FoodTile
                                    icon={getItemIcon(optionPick.item, optionPick.picked)}
                                    size={bigText ? 84 : 120}
                                    iconSize={bigText ? 70 : 96}
                                    radius={bigText ? 24 : 32}
                                />
                                <span className="menu-options__title">
                                    <h2 className="menu-options__name">{optionPick.item.name}</h2>
                                    <p className="sheet__desc">옵션을 골라 주세요</p>
                                </span>
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

                            <div className="menu-opt" role="group" aria-label="수량">
                                <span className="menu-opt__label">수량</span>
                                <div className="menu-sizes menu-sizes--three">
                                    {QTY_CHOICES.map((n) => {
                                        const on = optionPick.picked.qty === n;
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                aria-pressed={on}
                                                className={`menu-size ${on ? 'is-selected' : ''}`}
                                                onClick={() => onOption('qty', n)}
                                            >
                                                {n}개
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <BigButton
                                disabled={!optionsDone}
                                icon={optionsDone ? <CartIcon /> : null}
                                onClick={onAddWithOptions}
                            >
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
                    className="sheet--long"
                    icon={<Tello face="sad" size={bigText ? 100 : 96} />}
                    title={script.idleSteps[idleStage]}
                >
                    <BigButton onClick={() => setSheet(null)}>계속할게요</BigButton>
                    {idleStage === 1 && (
                        <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
                            직원 호출
                        </BigButton>
                    )}
                </BottomSheet>

                <BottomSheet
                    open={sheet === 'leave'}
                    icon={<Tello face="think" size={bigText ? 100 : 96} />}
                    title={script.leaveTitle}
                    desc={script.leaveDesc}
                >
                    <BigButton onClick={() => setSheet(null)}>계속 주문할게요</BigButton>
                    <BigButton variant="outline" onClick={leave}>
                        그만할게요
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
                        onClick={nextIdle}
                    >
                        가만히 있음 (30초 · 1분 · 1분 30초)
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
