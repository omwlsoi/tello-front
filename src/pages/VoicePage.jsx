import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BookIcon, CheckIcon, MicIcon, Tello, WaveIcon, ZoomButton } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import CartBar from '../components/order/CartBar';
import { FoodTile } from '../components/order/MenuCard';
import useSpeechToText from '../hooks/useSpeechToText';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useIdleSteps } from '../hooks/useIdleTimer';
import breakLines from '../utils/breakLines';
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
import { addCartItem, analyzeMessage } from '../api/session';
import { createHelpRequest } from '../api/order';
import applyVoiceResponse, { YES_NO_CHOICES } from '../utils/applyVoiceResponse';
import './VoicePage.css';

const MORE_CHOICES = [
    { action: 'more', label: '네', sub: '더 주문할게요', kind: 'gbtn', said: '네' },
    { action: 'done', label: '아니요', sub: '주문 확인하기', kind: 'lime', said: '아니요' },
];

const QTY_CHOICES = [
    { action: 'option', value: 1, said: '1개', label: '1개', kind: 'lime' },
    { action: 'option', value: 2, said: '2개', label: '2개', kind: 'gbtn' },
    { action: 'mic', label: '말로 답하기', kind: 'gbtn', mic: true },
];

const STATUS = {
    wait: { label: '대기 중', tone: 'gray', face: 'smile' },
    listen: { label: '듣는 중', tone: 'blue', face: 'listen' },
    check: { label: '확인 중', tone: 'yellow', face: 'think' },
    added: { label: '담았어요', tone: 'blue', face: 'happy' },
    fail: { label: '잘 못 들었어요', tone: 'orange', face: 'sad' },
    idle: { label: '기다리는 중', tone: 'gray', face: 'sad' },
};

const ASKS = ['option', 'more', 'recommend'];

const fill = (text, values) =>
    Object.entries(values).reduce((out, [k, v]) => out.replace(`{${k}}`, v), text);

const withYo = (word) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
    return `${word}${hasBatchim ? '이요' : '요'}`;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toSpoken = (opt) => opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

export default function VoicePage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const chat = useSessionStore((s) => s.messages);
    const pushMessage = useSessionStore((s) => s.pushMessage);
    const setFailCount = useSessionStore((s) => s.setFailCount);
    const failCount = useSessionStore((s) => s.failCount);
    const addItem = useSessionStore((s) => s.addItem);
    const setFrom = useSessionStore((s) => s.setFrom);
    const callStaff = useSessionStore((s) => s.callStaff);
    const startOver = useSessionStore((s) => s.startOver);
    const bigText = useSessionStore((s) => s.bigText);
    const setCartFromServer = useSessionStore((s) => s.setCartFromServer);

    const { speak, cancel: cancelSpeech } = useTextToSpeech();
    const { listening, listen } = useSpeechToText();

    const [sheet, setSheet] = useState(null);
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);
    const chatRef = useRef(null);
    const [thinking, setThinking] = useState(false);

    // [수정 1] AI가 말하는 중인지 추적해요. 말하는 동안은 무응답 타이머를 멈춰서 답변이 끊기지 않게 해요.
    const [speaking, setSpeaking] = useState(false);
    const speakIdRef = useRef(0);
    // [수정 3] 가장 최근에 시작한 말(Promise)을 기억해 둬요. 화면 이동 전에 이게 끝나길 기다려요.
    const lastSpeechRef = useRef(Promise.resolve());

    // [수정 1] 말하기 + 상태 추적. 끝까지 읽으면 true, 중간에 끊기면 false 로 끝나는 Promise 를 돌려줘요.
    const talk = useCallback(
        (spoken) => {
            const id = ++speakIdRef.current;
            setSpeaking(true);
            const speech = Promise.resolve(speak(spoken)).then((done) => {
                if (speakIdRef.current === id) setSpeaking(false);
                return done;
            });
            lastSpeechRef.current = speech; // [수정 3]
            return speech;
        },
        [speak],
    );

    // [수정 3] 말을 다 끝낸 뒤(최소 minMs 는 기다린 뒤) 화면을 옮겨요.
    // 화면이 먼저 바뀌면 VoicePage 가 사라지면서 읽던 말이 끊기기 때문이에요.
    // setTimeout 0: 화면 이동 함수가 말하기보다 먼저 불려도, 같은 순간에 시작한 말까지 기다리게 해요.
    const goAfterSpeech = useCallback(
        (path, minMs = 0) => {
            setTimeout(() => {
                Promise.all([lastSpeechRef.current, wait(minMs)]).then(() => navigate(path));
            }, 0);
        },
        [navigate],
    );

    const ai = useCallback(
        (text, extra = {}, spoken = text) => {
            pushMessage({ who: 'ai', text, ...extra });
            return talk(spoken); // [수정 1] speak → talk
        },
        [pushMessage, talk],
    );
    const me = useCallback((text, extra = {}) => pushMessage({ who: 'me', text, ...extra }), [pushMessage]);

    const addAndAskMore = useCallback(
        async (item, picked) => {
            const { qty = 1, ...options } = picked;
            addItem(item.id, options, qty);

            try {
                const sessionId = localStorage.getItem('sessionId');
                const sessionToken = localStorage.getItem('sessionToken');
                if (sessionId && sessionToken) {
                    await addCartItem(sessionId, sessionToken, item.id, qty, options);
                }
            } catch (error) {
                console.error("음성 주문 서버 장바구니 담기 실패:", error);
            }

            const opt = getOptionLabel(options);
            const extra = OPTIONS.size.choices.find((c) => c.id === options.size)?.extra ?? 0;
            const card = {
                icon: getItemIcon(item, options),
                name: item.name,
                opt: [opt, `${qty}개`].filter(Boolean).join(' · '),
                price: (item.price + extra) * qty,
            };
            const spoken = fill(opt ? script.addedOpt : script.added, { name: item.name, opt: toSpoken(opt), qty });
            ai(script.addedLead, { ask: 'more', card, followUp: script.addedAsk, choices: MORE_CHOICES }, spoken);
        },
        [addItem, ai],
    );

    const askOption = useCallback(
        (item, picked, lead = '') => {
            const key = nextOption(item, picked) ?? (picked.qty == null ? 'qty' : null);
            if (!key) {
                addAndAskMore(item, picked);
                return;
            }
            const choices =
                key === 'qty'
                    ? QTY_CHOICES
                    : OPTIONS[key].choices.map((c) => ({
                        action: 'option',
                        value: c.id,
                        said: c.label,
                        label: c.label,
                        sub: key === 'size' ? (c.extra ? `+${formatPrice(c.extra)}` : '기본 가격') : '',
                        kind: c.id === OPTIONS[key].default ? 'lime' : 'gbtn',
                      }));
            ai(lead ? `${lead} ${script.ask[key]}` : script.ask[key], {
                ask: 'option',
                option: key,
                itemId: item.id,
                picked,
                choices,
            });
        },
        [addAndAskMore, ai],
    );

    const recommend = useCallback(
        (round) => {
            const rec = script.recommend[round];
            if (!rec) {
                ai(script.recommendMenu);
                goAfterSpeech('/menu', 1200); // [수정 3]
                return;
            }
            ai(rec.text, {
                ask: 'recommend',
                round,
                choices: [
                    ...rec.items.map((id) => {
                        const item = findItem(id);
                        return { action: 'pick', value: id, label: item.name, sub: formatPrice(item.price), kind: 'gbtn' };
                    }),
                    { action: 'rec-next', label: '다른 추천', kind: 'gbtn', full: true },
                ],
            });
        },
        [ai, goAfterSpeech],
    );

    useEffect(() => {
        setFrom('voice');
        if (useSessionStore.getState().messages.length === 0) {
            ai(
                script.greeting,
                { guide: script.guide, guideTip: script.guideTip },
                [script.greeting, ...script.guide.map((g) => g.a + g.b + g.c), script.guideTip].join(' '),
            );
        }
    }, [ai, setFrom]);

    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = chat.length > 1 ? el.scrollHeight : 0;
    }, [chat.length, bigText]);

    const onIdleStep = useCallback(
        (stage) => {
            // [수정 1] 안전장치: AI가 말하는 중이면 무응답 안내로 답변을 끊지 않아요
            if (window.speechSynthesis?.speaking) return;
            const extra =
                stage === 1
                    ? { idle: true, choices: [{ action: 'call', label: '직원 호출', kind: 'staff', full: true, reason: '오래 머무름' }] }
                    : { idle: true };
            ai(script.idleSteps[stage], extra);
        },
        [ai],
    );
    // [수정 1] 말하는 중(!speaking)에도 무응답 타이머를 멈춰요
    const nextIdle = useIdleSteps(
        onIdleStep,
        script.idleSteps.length,
        30000,
        !listening && !thinking && !speaking && failCount < 3,
    );

    const callNow = async (reason) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');
            if (sessionId && sessionToken) {
                await createHelpRequest(sessionId, sessionToken);
            }
        } catch (error) {
            console.error("직원 호출 서버 전송 실패:", error);
        }
        callStaff(reason);
        ai(useSessionStore.getState().cart.length ? script.calledWithCart : script.called);
    };

    const answerByVoice = (message) => {
        if (message.ask === 'recommend') return false;
        const choice =
            message.option === 'qty'
                ? { action: 'option', value: 1, label: '1개' }
                : message.choices.find((c) => c.kind === 'lime') ?? message.choices[message.choices.length - 1];
        let said = withYo(choice.said ?? choice.label);
        if (message.ask === 'more') said = choice.said;
        onChoice(message, choice, said);
        return true;
    };

    const onMic = () => {
        if (thinking) return;
        // [수정 2] 손님이 말하려고 하면 AI 말은 멈추고 들어요 (마이크가 AI 목소리를 손님 말로 듣지 않게)
        cancelSpeech();
        listen((transcript) => {
            setThinking(true);
            setTimeout(() => {
                setThinking(false);
                handleSpeech(transcript);
            }, 700);
        });
    };

    const handleSpeech = async (transcript = '') => {
        const { messages } = useSessionStore.getState();
        const last = messages[messages.length - 1];
        setFailCount(0);

        if (!transcript && last?.who === 'ai' && ASKS.includes(last.ask) && answerByVoice(last)) return;
        const spokenText = transcript;
        if (!spokenText) {
            ai("말씀하신 내용을 잘 듣지 못했어요. 다시 말씀해 주세요.");
            return;
        }
        me(spokenText);

        try {
            const sessionId = localStorage.getItem('sessionId');
            const sessionToken = localStorage.getItem('sessionToken');

            if (sessionId && sessionToken) {
                setThinking(true);
                const response = await analyzeMessage(sessionId, sessionToken, spokenText);
                setThinking(false);

                // 파트너가 제공한 공통 응답 처리 유틸 적용
                applyVoiceResponse(response, {
                    say: ai,
                    setCartFromServer,
                    goMenu: () => goAfterSpeech('/menu'), // [수정 3] 말 끝난 뒤 이동
                    goConfirm: () => goAfterSpeech('/confirm'), // [수정 3]
                    moreChoices: MORE_CHOICES,
                    yesNoChoices: YES_NO_CHOICES,
                });
            } else {
                setThinking(false);
                ai("세션 정보를 찾을 수 없습니다. 다시 시도해 주세요.");
            }
        } catch (error) {
            setThinking(false);
            console.error("음성 메시지 서버 전송 실패:", error);
            ai("서버와 통신하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
        }
    };

    const onFail = () => {
        const { messages } = useSessionStore.getState();
        const pending = [...messages].reverse().find((m) => m.who === 'ai' && m.ask === 'option');
        const last = messages[messages.length - 1];
        const waiting = last?.who === 'ai' && last.ask === 'option' ? pending : null;

        me(script.unheard, { unheard: true });
        const count = useSessionStore.getState().failCount + 1;
        setFailCount(count);
        if (count >= 3) {
            ai(script.failThird, {
                warn: true,
                choices: [
                    { action: 'menu', label: '메뉴판', kind: 'gbtn', book: true },
                    { action: 'call', label: '직원 호출', kind: 'staff' },
                ],
            });
            return;
        }
        ai(count === 1 ? script.failOnce : script.failTwice);
        if (waiting) {
            const again = { ...waiting };
            delete again.id;
            pushMessage(again);
        }
    };

    const onChoice = (message, choice, said) => {
        if (choice.action === 'reply') {
            handleSpeech(choice.said); // handleSpeech 안에서 me()로 말풍선을 띄워요
            return;
        }

        if (choice.action === 'option') {
            me(said ?? choice.said);
            askOption(findItem(message.itemId), {
                ...message.picked,
                [message.option]: choice.value,
            });
        } else if (choice.action === 'pick') {
            const item = findItem(choice.value);
            me(said ?? choice.label);
            askOption(item, {}, fill(script.picked, { name: item.name }));
        } else if (choice.action === 'rec-next') {
            me(choice.label);
            recommend(message.round + 1);
        } else if (choice.action === 'more') {
            me(said ?? choice.label);
            // [수정 2] AI가 말을 다 끝낸 뒤에 마이크를 켜요 (중간에 끊겼으면 자동으로 켜지 않아요)
            ai(script.moreYes).then((done) => {
                if (done) onMic();
            });
        } else if (choice.action === 'done') {
            me(said ?? choice.label);
            ai(script.moreNo);
            goAfterSpeech('/confirm', 900); // [수정 3]
        } else if (choice.action === 'menu') {
            navigate('/menu');
        } else if (choice.action === 'call') {
            callNow(choice.reason ?? '음성 인식 실패');
        }
    };

    const goBack = () => {
        if (cart.length) {
            setSheet('leave');
            speak(`${script.leaveTitle}. ${script.leaveDesc}`);
        } else {
            navigate('/');
        }
    };
    const leave = () => {
        speak(script.leaveBye);
        setToast(script.leaveBye);
        startOver();
        setTimeout(() => navigate('/'), 900);
    };

    const lastIndex = chat.length - 1;
    const last = chat[lastIndex];

    let statusKey = 'wait';
    if (listening) statusKey = 'listen';
    else if (thinking) statusKey = 'check';
    else if (last?.who === 'ai' && last.idle) statusKey = 'idle';
    else if (last?.who === 'ai' && last.warn) statusKey = 'fail';
    else if (last?.who === 'ai' && (last.ask === 'option' || last.ask === 'recommend')) statusKey = 'check';
    else if (last?.who === 'ai' && last.ask === 'more') statusKey = 'added';
    else if (failCount > 0) statusKey = 'fail';
    const status = STATUS[statusKey];

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
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
                                aria-label="메뉴판 보기"
                                onClick={() => navigate('/menu')}
                            >
                                <BookIcon />
                            </button>
                        </>
                    }
                >
                    {bigText ? (
                        <span className="app-header__title voice-title--big">
                            <span className="voice-title__name">
                                말로 주문
                                <WaveIcon />
                            </span>
                            <span className={`voice-title__status voice-title__status--${status.tone}`}>
                                <span className={`voice-dot voice-dot--${status.tone}`} />
                                {status.label}
                            </span>
                        </span>
                    ) : (
                        <span className="app-header__title voice-title">
                            말로 주문
                            <WaveIcon />
                        </span>
                    )}
                </Header>

                <div className="voice-who">
                    <Tello face={status.face} size={66} />
                    <span className="voice-who__text">
                        <span className="voice-who__status">
                            <span className={`voice-dot voice-dot--${status.tone}`} />
                            <span className="eyebrow">{status.label}</span>
                        </span>
                        <span className="voice-who__name">주문 받는 점원, 텔로링</span>
                    </span>
                </div>

                <div className="voice-chat glass" ref={chatRef} aria-live="polite">
                    <div className="voice-chat__list">
                        {chat.map((m, i) => {
                            const locked = chat.slice(i + 1).some((next) => next.who === 'me');
                            if (m.who === 'me') {
                                return (
                                    <div
                                        key={m.id}
                                        className={`voice-bubble voice-bubble--me ${m.unheard ? 'voice-bubble--unheard' : ''}`}
                                    >
                                        {breakLines(m.text)}
                                    </div>
                                );
                            }
                            return (
                                <div key={m.id} className="voice-msg">
                                    <div className={`voice-bubble ${m.warn ? 'voice-bubble--warn' : ''}`}>
                                        <span>
                                            {breakLines(m.guide && bigText ? m.text.replace(', ', ',\n') : m.text)}
                                        </span>
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
                                        {m.followUp && <span>{breakLines(m.followUp)}</span>}
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
                                                    뭘 먹을지 모르겠으면
                                                    <br />
                                                    <b>"추천해 줘"</b>라고 말해 보세요.
                                                    <br />
                                                    말이 어려우면 위의{' '}
                                                    <span className="voice-guide__chip">
                                                        <BookIcon size={16} color="#FFFFFF" />
                                                        메뉴판
                                                    </span>
                                                    을 눌러 사진으로 골라도 돼요.
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
                                                    className={`voice-choice voice-choice--${c.kind ?? 'gbtn'} ${c.full ? 'voice-choice--full' : ''} ${c.mic ? 'voice-choice--mic' : ''}`}
                                                    disabled={locked || (c.mic && (listening || thinking))}
                                                    aria-label={c.mic ? c.label : undefined}
                                                    onClick={c.mic ? onMic : () => onChoice(m, c)}
                                                >
                                                    <span className="voice-choice__main">
                                                        {c.book && <BookIcon size={20} />}
                                                        {c.mic ? <MicIcon size={bigText ? 40 : 30} color="currentColor" /> : c.label}
                                                    </span>
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
                                {listening ? '듣고 있어요…' : thinking ? '확인하고 있어요…' : failCount > 0 ? '다시 말해 볼까요?' : '누르고 말해 주세요'}
                            </span>
                            <span className="voice-mic__sub">
                                {listening ? '천천히 말해 주세요' : '예: 아아 하나 주세요'}
                            </span>
                        </span>
                        <button
                            type="button"
                            className={`voice-mic__btn ${listening ? 'is-listening' : ''}`}
                            aria-label="말하기"
                            disabled={thinking}
                            onClick={onMic}
                        >
                            <MicIcon color="#fff" />
                        </button>
                    </div>
                </div>
                </div>

                <Toast message={toast} onDone={clearToast} />

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
                    <p>발표 중 오류 상황을 일부러 만들 때 눌러요.</p>
                    <button type="button" className="demo-btn" onClick={onFail}>
                        음성 인식 실패 (3번 누르기)
                    </button>
                    <button type="button" className="demo-btn" onClick={nextIdle}>
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
