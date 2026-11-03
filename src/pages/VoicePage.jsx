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
// kind: lime(파랑 채움 = 기본 ★) | gbtn(흰 바탕) | staff(직원 호출), sub: 버튼 안 작은 설명
const MORE_CHOICES = [
    { action: 'more', label: '네', sub: '더 주문할게요', kind: 'gbtn', said: '네' },
    { action: 'done', label: '아니요', sub: '주문 확인하기', kind: 'lime', said: '아니요' },
];

// 수량은 옵션을 다 고른 뒤 마지막에 물어요 (1개가 기본 ★, 4개 이상은 주문 확인 화면의 [+]로)
const QTY_CHOICES = [1, 2, 3];

// 텔로 상태 (제목 옆 점 색 + 표정)
const STATUS = {
    wait: { label: '대기 중', tone: 'gray', face: 'smile' },
    listen: { label: '듣는 중', tone: 'blue', face: 'listen' },
    check: { label: '확인 중', tone: 'yellow', face: 'think' },
    added: { label: '담았어요', tone: 'blue', face: 'happy' },
    fail: { label: '잘 못 들었어요', tone: 'orange', face: 'sad' },
    idle: { label: '기다리는 중', tone: 'gray', face: 'sad' },
};

// 답을 기다리는 질문 (버튼을 누르거나 말로 답해요)
const ASKS = ['option', 'more', 'recommend'];

const fill = (text, values) =>
    Object.entries(values).reduce((out, [k, v]) => out.replace(`{${k}}`, v), text);

// 받침이 있으면 "보통이요", 없으면 "아이스요"
const withYo = (word) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
    return `${word}${hasBatchim ? '이요' : '요'}`;
};

// 소리로 읽을 때: "핫" → "따뜻하게", 가운뎃점 → 쉼표
const toSpoken = (opt) => opt.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

// 2. 말로 주문하기
// 첫 주문은 말로, 옵션(크기 → 온도 → 얼음 → 수량)과 추가 주문 여부는 버튼을 누르거나 말로 답해요.
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
    const startOver = useSessionStore((s) => s.startOver);
    const bigText = useSessionStore((s) => s.bigText);

    const { speak } = useTextToSpeech();
    const { listening, listen } = useSpeechToText();

    const [sheet, setSheet] = useState(null); // null | 'leave'
    const [toast, setToast] = useState('');
    const clearToast = useCallback(() => setToast(''), []);
    const chatRef = useRef(null);
    const idleStage = useRef(0); // 아무 입력 없이 지난 단계 (0 · 1=30초 · 2=1분 · 3=1분 30초)

    const ai = useCallback(
        (text, extra = {}, spoken = text) => {
            pushMessage({ who: 'ai', text, ...extra });
            speak(spoken);
        },
        [pushMessage, speak],
    );
    const me = useCallback((text, extra = {}) => pushMessage({ who: 'me', text, ...extra }), [pushMessage]);

    // 옵션을 다 고르면 바로 담고, 담기 완료 카드 + "더 필요한 게 있나요?"
    const addAndAskMore = useCallback(
        (item, picked) => {
            const { qty = 1, ...options } = picked;
            addItem(item.id, options, qty);
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

    // 빠진 옵션만 하나씩 묻고(크기 → 온도 → 얼음 → 수량), 말에 들어 있던 옵션은 건너뛰어요
    const askOption = useCallback(
        (item, picked, lead = '') => {
            const key = nextOption(item, picked) ?? (picked.qty == null ? 'qty' : null);
            if (!key) {
                addAndAskMore(item, picked);
                return;
            }
            const choices =
                key === 'qty'
                    ? QTY_CHOICES.map((n) => ({
                          action: 'option',
                          value: n,
                          said: `${n}개`,
                          label: `${n}개`,
                          kind: n === 1 ? 'lime' : 'gbtn',
                      }))
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

    // 추천: 한 번에 2개까지 + [다른 추천]. 두 번 거절하면 메뉴판을 열어요
    const recommend = useCallback(
        (round) => {
            const rec = script.recommend[round];
            if (!rec) {
                ai(script.recommendMenu);
                setTimeout(() => navigate('/menu'), 1200);
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
        [ai, navigate],
    );

    // 첫 인사 + 사용 방법 안내
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

    // 새 말풍선이 생기면 맨 아래로 (첫 인사만 있을 땐 사용 방법을 위에서부터 읽게)
    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = chat.length > 1 ? el.scrollHeight : 0;
    }, [chat.length, bigText]);

    // 손님이 화면을 만지면 "기다리는 중" 단계를 처음부터 다시 세요 (시연 버튼은 제외)
    useEffect(() => {
        const onTouch = (e) => {
            if (!e.target.closest?.('.demo-panel')) idleStage.current = 0;
        };
        window.addEventListener('pointerdown', onTouch);
        return () => window.removeEventListener('pointerdown', onTouch);
    }, []);

    // 아무 입력이 없을 때: 30초 → 1분 → 1분 30초 (담은 메뉴는 그대로 둬요)
    const onIdle = useCallback(() => {
        if (idleStage.current >= script.idleSteps.length) return;
        const stage = idleStage.current;
        idleStage.current += 1;
        const extra =
            stage === 1
                ? { idle: true, choices: [{ action: 'call', label: '직원 호출', kind: 'staff', full: true, reason: '오래 머무름' }] }
                : { idle: true };
        ai(script.idleSteps[stage], extra);
    }, [ai]);
    useIdleTimer(onIdle, 30000, true, true);

    // 직원 호출: 매장 화면에 바로 알림이 가고, 텔로가 말풍선으로 알려줘요
    const callNow = (reason) => {
        callStaff(reason);
        ai(useSessionStore.getState().cart.length ? script.calledWithCart : script.called);
    };

    // 질문에 말로 답한 것처럼 진행 (시연용: 옵션은 기본값, 추천은 첫 번째 메뉴)
    const answerByVoice = (message) => {
        if (message.ask === 'more') {
            return false; // "더 필요한 게 있나요?" 뒤에 말하면 바로 다음 메뉴 주문으로 받아요
        }
        const choice =
            message.ask === 'recommend'
                ? message.choices[1]
                : message.choices.find((c) => c.kind === 'lime') ?? message.choices[message.choices.length - 1];
        const said = message.ask === 'recommend' ? `${choice.label}요` : withYo(choice.said ?? choice.label);
        onChoice(message, choice, said);
        return true;
    };

    const onMic = () => {
        listen(() => {
            const { voiceStep, messages } = useSessionStore.getState();
            const last = messages[messages.length - 1];
            setFailCount(0);

            // 답을 기다리는 질문이 있으면 말로 답한 걸로 처리
            if (last?.who === 'ai' && ASKS.includes(last.ask) && answerByVoice(last)) return;

            const lastStep = script.steps.length - 1;
            const step = script.steps[Math.min(voiceStep, lastStep)];
            me(step.user);

            if (step.recommend != null) {
                recommend(step.recommend);
            } else if (step.itemId) {
                // 말에서 알아들은 옵션(preset)과 수량(qty)은 건너뛰고 나머지만 물어봐요
                const picked = { ...(step.preset ?? {}), ...(step.qty ? { qty: step.qty } : {}) };
                askOption(findItem(step.itemId), picked, step.ai);
            } else {
                ai(step.ai);
            }
            setVoiceStep(Math.min(voiceStep + 1, lastStep));
        });
    };

    // 시연 버튼: 음성 인식 실패 (1·2번째는 다시 말해 달라고, 3번째는 메뉴판·직원 호출 버튼)
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
                    { action: 'menu', label: '메뉴판', kind: 'gbtn' },
                    { action: 'call', label: '직원 호출', kind: 'staff' },
                ],
            });
            return;
        }
        ai(count === 1 ? script.failOnce : script.failTwice);
        // 옵션 질문 중이었다면 같은 질문과 버튼을 다시 보여줘요
        if (waiting) {
            const again = { ...waiting };
            delete again.id;
            pushMessage(again);
        }
    };

    const onChoice = (message, choice, said) => {
        if (choice.action === 'option') {
            me(said ?? choice.said);
            askOption(findItem(message.itemId), {
                ...message.picked,
                [message.option]: choice.value,
            });
        } else if (choice.action === 'pick') {
            // 추천 메뉴를 고르면 옵션 흐름으로 (STEP 4)
            const item = findItem(choice.value);
            me(said ?? choice.label);
            askOption(item, {}, fill(script.picked, { name: item.name }));
        } else if (choice.action === 'rec-next') {
            me(choice.label);
            recommend(message.round + 1);
        } else if (choice.action === 'more') {
            // 네 → 바로 다음 메뉴를 말로 받아요
            me(said ?? choice.label);
            ai(script.moreYes);
            onMic();
        } else if (choice.action === 'done') {
            // 아니요 → 주문 확인으로
            me(said ?? choice.label);
            ai(script.moreNo);
            setTimeout(() => navigate('/confirm'), 900);
        } else if (choice.action === 'menu') {
            navigate('/menu');
        } else if (choice.action === 'call') {
            callNow(choice.reason ?? '음성 인식 실패');
        }
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
        speak(script.leaveBye);
        setToast(script.leaveBye);
        startOver();
        setTimeout(() => navigate('/'), 900);
    };

    const lastIndex = chat.length - 1;
    const last = chat[lastIndex];

    // 지금 텔로가 어떤 상태인지
    let statusKey = 'wait';
    if (listening) statusKey = 'listen';
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
                        // 큰 글씨 모드: [텔로] 말로 주문 / ● 지금 상태 (위쪽 텔로 줄 대신)
                        <span className="app-header__title voice-title--big">
                            <Tello face={status.face} size={44} className="voice-title__tello" />
                            <span className="voice-title__stack">
                                말로 주문
                                <span className="voice-title__status">
                                    <span className={`voice-dot voice-dot--${status.tone}`} />
                                    {status.label}
                                </span>
                            </span>
                        </span>
                    ) : (
                        <span className="app-header__title">
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
                        <span className="voice-who__name">주문 받는 점원, 텔로</span>
                    </span>
                </div>

                <div className="voice-chat glass" ref={chatRef} aria-live="polite">
                    <div className="voice-chat__list">
                        {chat.map((m, i) => {
                            // 손님이 답한 질문만 잠가요 (텔로 안내가 뒤에 와도 버튼은 계속 누를 수 있어요)
                            const locked = chat.slice(i + 1).some((next) => next.who === 'me');
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
                                                    뭘 먹을지 모르겠으면 <b>"추천해 줘"</b>라고 말해 보세요.{' '}
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
                    <button type="button" className="demo-btn" onClick={onIdle}>
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
