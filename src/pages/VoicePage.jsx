import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BookIcon, CheckIcon, MicIcon, Tello, WaveIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import CartBar from '../components/order/CartBar';
import { FoodTile } from '../components/order/MenuCard';
import useSpeechToText from '../hooks/useSpeechToText';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import formatPrice from '../utils/formatPrice';
import {
    OPTIONS,
    findItem,
    getItemIcon,
    getOptionLabel,
    nextOption,
    useSessionStore,
} from '../stores/sessionStore';
import script from '../mocks/messages.json';
import './VoicePage.css';

// "더 필요한 게 있나요?" 다음에 나오는 버튼
// kind: lime(파랑 채움) | gbtn(흰 바탕) | staff(직원 부르기), sub: 버튼 안 작은 설명
const MORE_CHOICES = [
    { action: 'more', label: '네', sub: '더 주문할게요', kind: 'gbtn' },
    { action: 'done', label: '아니요', sub: '주문 확인하기', kind: 'lime' },
];

// 텔로 상태 (이름 옆 점 색 + 표정)
const STATUS = {
    wait: { label: '대기 중', tone: 'gray', face: 'smile' },
    listen: { label: '듣는 중', tone: 'blue', face: 'listen' },
    check: { label: '확인 중', tone: 'yellow', face: 'think' },
    added: { label: '담았어요', tone: 'blue', face: 'happy' },
    fail: { label: '잘 못 들었어요', tone: 'orange', face: 'sad' },
    idle: { label: '기다리는 중', tone: 'gray', face: 'sad' },
};

// 버튼으로 답해야 하는 질문 (이때는 마이크 대신 버튼을 눌러야 해요)
const BUTTON_ASKS = ['option', 'more'];

const fill = (text, values) =>
    Object.entries(values).reduce((out, [k, v]) => out.replace(`{${k}}`, v), text);

// 2. 말로 주문하기
// 메뉴 주문만 말로 받고, 크기·온도·얼음·추가 여부는 버튼으로 골라요.
// 마이크를 누를 때마다 대본(messages.json)대로 대화가 한 단계씩 진행돼요.
export default function VoicePage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const chat = useSessionStore((s) => s.messages);
    const pushMessage = useSessionStore((s) => s.pushMessage);
    const setVoiceStep = useSessionStore((s) => s.setVoiceStep);
    const setFailCount = useSessionStore((s) => s.setFailCount);
    const failCount = useSessionStore((s) => s.failCount);
    const addItem = useSessionStore((s) => s.addItem);
    const setFrom = useSessionStore((s) => s.setFrom);
    const callStaff = useSessionStore((s) => s.callStaff);

    const { speak } = useTextToSpeech();
    const { listening, listen } = useSpeechToText();

    const [sheet, setSheet] = useState(null); // null | 'idle'
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);
    const chatRef = useRef(null);

    const ai = useCallback(
        (text, extra = {}, spoken = text) => {
            pushMessage({ who: 'ai', text, ...extra });
            speak(spoken);
        },
        [pushMessage, speak],
    );
    const me = useCallback((text, extra = {}) => pushMessage({ who: 'me', text, ...extra }), [pushMessage]);

    // 담은 메뉴를 그림 카드로 보여주고 "더 필요한 게 있나요?" (말은 메뉴 이름까지 읽어줘요)
    const askMore = useCallback(
        (spoken, card) =>
            ai(script.addedLead, { ask: 'more', card, followUp: script.addedAsk, choices: MORE_CHOICES }, spoken),
        [ai],
    );

    // 옵션을 하나씩 버튼으로 물어보고, 다 고르면 담아요
    const askOption = useCallback(
        (item, picked, lead = '') => {
            const key = nextOption(item, picked);
            if (!key) {
                addItem(item.id, picked);
                const opt = getOptionLabel(picked);
                const extra = OPTIONS.size.choices.find((c) => c.id === picked.size)?.extra ?? 0;
                askMore(fill(opt ? script.addedOpt : script.added, { name: item.name, opt }), {
                    icon: getItemIcon(item, picked),
                    name: item.name,
                    opt,
                    price: item.price + extra,
                });
                return;
            }
            ai(lead ? `${lead} ${script.ask[key]}` : script.ask[key], {
                ask: 'option',
                option: key,
                itemId: item.id,
                picked,
                choices: OPTIONS[key].choices.map((c) => ({
                    action: 'option',
                    value: c.id,
                    said: c.label,
                    label: c.label,
                    sub: key === 'size' ? (c.extra ? `+${formatPrice(c.extra)}` : '기본 가격') : '',
                    kind: c.id === OPTIONS[key].default ? 'lime' : 'gbtn',
                })),
            });
        },
        [addItem, ai, askMore],
    );

    // 첫 인사 + 사용 방법 안내
    useEffect(() => {
        setFrom('voice');
        if (useSessionStore.getState().messages.length === 0) {
            ai(
                script.greeting,
                { guide: script.guide, guideTip: script.guideTip },
                [script.greeting, ...script.guide.map((g) => g.a + g.b + g.c)].join(' '),
            );
        }
    }, [ai, setFrom]);

    // 새 말풍선이 생기면 맨 아래로
    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chat.length]);

    useIdleTimer(() => {
        if (!sheet) {
            setSheet('idle');
            speak(script.idle);
        }
    });

    // 직원 부르기: 누르면 바로 매장 화면에 알림이 가요
    const callNow = (reason) => {
        callStaff(reason);
        setSheet(null);
        setToast(script.called);
        speak(script.called);
    };

    const onMic = () => {
        listen(() => {
            const { voiceStep, messages } = useSessionStore.getState();

            // 버튼으로 답할 질문이 남아 있으면 버튼을 누르도록 안내
            const last = messages[messages.length - 1];
            if (last?.who === 'ai' && BUTTON_ASKS.includes(last.ask)) {
                setToast(script.pickButton);
                speak(script.pickButton);
                return;
            }

            const lastStep = script.steps.length - 1;
            const step = script.steps[Math.min(voiceStep, lastStep)];
            me(step.user);
            setFailCount(0);

            if (step.itemId) {
                // 말에서 알아들은 옵션(preset, 예: "아아" → 아이스)은 건너뛰고 나머지만 물어봐요
                askOption(findItem(step.itemId), step.preset ?? {}, step.ai);
            } else {
                ai(step.ai);
            }
            setVoiceStep(Math.min(voiceStep + 1, lastStep));
        });
    };

    // 시연 버튼: 음성 인식 실패 (2번 연속이면 도움 버튼 등장)
    const onFail = () => {
        me(script.unheard, { unheard: true });
        const count = useSessionStore.getState().failCount + 1;
        setFailCount(count);
        if (count >= 2) {
            ai(script.failTwice, {
                warn: true,
                choices: [
                    { action: 'retry', label: '다시 말하기', kind: 'lime' },
                    { action: 'menu', label: '눌러서 주문', kind: 'gbtn' },
                    { action: 'call', label: '직원 부르기', kind: 'staff', full: true },
                ],
            });
        } else {
            ai(script.failOnce);
        }
    };

    const onChoice = (message, choice) => {
        if (choice.action === 'option') {
            me(choice.said);
            askOption(findItem(message.itemId), {
                ...message.picked,
                [message.option]: choice.value,
            });
        } else if (choice.action === 'more') {
            // 네 → 바로 다음 메뉴를 말로 받아요
            me(choice.label);
            ai(script.moreYes);
            onMic();
        } else if (choice.action === 'done') {
            // 아니요 → 주문 확인으로
            me(choice.label);
            ai(script.moreNo);
            setTimeout(() => navigate('/confirm'), 900);
        } else if (choice.action === 'retry') {
            setFailCount(0);
            ai(script.retry);
        } else if (choice.action === 'menu') {
            navigate('/menu');
        } else if (choice.action === 'call') {
            callNow('음성 인식 실패');
        }
    };

    const lastIndex = chat.length - 1;
    const last = chat[lastIndex];

    // 지금 텔로가 어떤 상태인지
    let statusKey = 'wait';
    if (sheet === 'idle') statusKey = 'idle';
    else if (listening) statusKey = 'listen';
    else if (last?.who === 'ai' && last.warn) statusKey = 'fail';
    else if (last?.who === 'ai' && last.ask === 'option') statusKey = 'check';
    else if (last?.who === 'ai' && last.ask === 'more') statusKey = 'added';
    else if (failCount > 0) statusKey = 'fail';
    const status = STATUS[statusKey];

    return (
        <div className="stage">
            <div className="phone">
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
                            aria-label="메뉴판 보기"
                            onClick={() => navigate('/menu')}
                        >
                            <BookIcon />
                        </button>
                    }
                >
                    <span className="app-header__title">
                        말로 주문
                        <WaveIcon />
                    </span>
                </Header>

                <div className="voice-who">
                    <Tello face={status.face} size={66} />
                    <span className="voice-who__text">
                        <span className="voice-who__status">
                            <span className={`voice-dot voice-dot--${status.tone}`} />
                            <span className="eyebrow">{status.label}</span>
                        </span>
                        <span className="voice-who__name">주문 받는 점원, 텔로</span>
                    </span>
                </div>

                <div className="voice-chat glass" ref={chatRef} aria-live="polite">
                    <div className="voice-chat__list">
                        {chat.map((m, i) => {
                            const locked = i !== lastIndex;
                            if (m.who === 'me') {
                                return (
                                    <div
                                        key={m.id}
                                        className={`voice-bubble voice-bubble--me ${m.unheard ? 'voice-bubble--unheard' : ''}`}
                                    >
                                        {m.text}
                                    </div>
                                );
                            }
                            return (
                                <div key={m.id} className="voice-msg">
                                    <div className={`voice-bubble ${m.warn ? 'voice-bubble--warn' : ''}`}>
                                        <span>{m.text}</span>
                                        {m.card && (
                                            <div className="voice-card">
                                                <FoodTile icon={m.card.icon} size={60} iconSize={54} />
                                                <span className="voice-card__text">
                                                    <b className="voice-card__name">{m.card.name}</b>
                                                    {m.card.opt && <span className="voice-card__opt">{m.card.opt}</span>}
                                                    <span className="voice-card__price">{formatPrice(m.card.price)}</span>
                                                </span>
                                                <span className="voice-card__check" aria-label="담았어요">
                                                    <CheckIcon size={18} color="#FFFFFF" />
                                                </span>
                                            </div>
                                        )}
                                        {m.followUp && <span>{m.followUp}</span>}
                                    </div>
                                    {m.guide && (
                                        <>
                                            <ol className="voice-guide">
                                                {m.guide.map((g, n) => (
                                                    <li key={g.b} className="voice-guide__step">
                                                        <span className="voice-guide__num">{n + 1}</span>
                                                        <span className="voice-guide__text">
                                                            {g.a}
                                                            <b>{g.b}</b>
                                                            {g.c}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ol>
                                            {m.guideTip && (
                                                <p className="voice-guide__tip">
                                                    말이 어려우면 위의{' '}
                                                    <span className="voice-guide__chip">
                                                        <BookIcon size={16} color="#FFFFFF" />
                                                        메뉴판
                                                    </span>
                                                    을 눌러
                                                    <br />
                                                    사진으로 골라도 돼요.
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {m.choices && (
                                        <div
                                            className={`voice-choices ${m.choices.length === 3 && !m.choices.some((c) => c.full) ? 'voice-choices--three' : ''}`}
                                        >
                                            {m.choices.map((c) => (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    className={`voice-choice voice-choice--${c.kind ?? 'gbtn'} ${c.full ? 'voice-choice--full' : ''}`}
                                                    disabled={locked}
                                                    onClick={() => onChoice(m, c)}
                                                >
                                                    <span>{c.label}</span>
                                                    {c.sub && <span className="voice-choice__sub">{c.sub}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="voice-dock glass">
                    <CartBar cart={cart} onConfirm={() => navigate('/confirm')} />
                    <div className="voice-mic">
                        <span className="voice-mic__text">
                            <span className="voice-mic__label">
                                {listening ? '듣고 있어요…' : failCount > 0 ? '다시 말해 볼까요?' : '누르고 말해 주세요'}
                            </span>
                            <span className="voice-mic__sub">
                                {listening ? '천천히 말해 주세요' : '예: 아아 하나 주세요'}
                            </span>
                        </span>
                        <button
                            type="button"
                            className={`voice-mic__btn ${listening ? 'is-listening' : ''}`}
                            aria-label="말하기"
                            onClick={onMic}
                        >
                            <MicIcon color="#fff" />
                        </button>
                    </div>
                </div>

                <Toast message={toast} onDone={clearToast} />

                <BottomSheet
                    open={sheet === 'idle'}
                    icon={<Tello face="sad" size={96} />}
                    title={script.idle}
                    desc={script.idleDescVoice}
                >
                    <BigButton
                        onClick={() => {
                            setSheet(null);
                            onMic();
                        }}
                    >
                        다시 말할게요
                    </BigButton>
                    <BigButton variant="outline" onClick={() => navigate('/menu')}>
                        눌러서 주문하기
                    </BigButton>
                    <BigButton variant="dark" onClick={() => callNow('오래 머무름')}>
                        직원 부르기
                    </BigButton>
                </BottomSheet>
            </div>

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>막혔을 때 보여주기</h3>
                    <p>발표 중 오류 상황을 일부러 만들 때 눌러요.</p>
                    <button type="button" className="demo-btn" onClick={onFail}>
                        음성 인식 실패 (2번 누르기)
                    </button>
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
