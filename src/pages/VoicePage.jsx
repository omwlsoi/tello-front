import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header, { BackIcon, BellIcon, MicIcon } from '../components/common/Header';
import BigButton from '../components/common/BigButton';
import BottomSheet from '../components/common/BottomSheet';
import Toast from '../components/common/Toast';
import CartBar from '../components/order/CartBar';
import useSpeechToText from '../hooks/useSpeechToText';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useIdleTimer from '../hooks/useIdleTimer';
import { findItem, useSessionStore } from '../stores/sessionStore';
import menu from '../mocks/menu.json';
import script from '../mocks/messages.json';
import './VoicePage.css';

// "더 필요한 게 있나요?" 다음에 나오는 버튼
const MORE_CHOICES = [
    { action: 'more', label: '네' },
    { action: 'done', label: '아니요' },
];

// 버튼으로 답해야 하는 질문 (이때는 마이크 대신 버튼을 눌러야 해요)
const BUTTON_ASKS = ['size', 'more'];

// 2. 말로 주문하기
// 메뉴 주문만 말로 받고, 크기·추가 여부 같은 나머지는 버튼으로 골라요.
// 마이크를 누를 때마다 대본(messages.json)대로 대화가 한 단계씩 진행돼요.
export default function VoicePage() {
    const navigate = useNavigate();
    const cart = useSessionStore((s) => s.cart);
    const chat = useSessionStore((s) => s.messages);
    const pushMessage = useSessionStore((s) => s.pushMessage);
    const setVoiceStep = useSessionStore((s) => s.setVoiceStep);
    const setFailCount = useSessionStore((s) => s.setFailCount);
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

    const askMore = useCallback(
        (text) => ai(text, { ask: 'more', choices: MORE_CHOICES }),
        [ai],
    );

    // 첫 인사 + 사용 방법 안내
    useEffect(() => {
        setFrom('voice');
        if (useSessionStore.getState().messages.length === 0) {
            ai(
                script.greeting,
                { guide: script.guide, guideTip: script.guideTip },
                [script.greeting, ...script.guide].join(' '),
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

            if (step.ask === 'size') {
                ai(step.ai, {
                    ask: 'size',
                    itemId: step.itemId,
                    choices: menu.sizes.map((size) => ({
                        action: 'size',
                        value: size.id,
                        label: size.extra ? `${size.label} (+${size.extra}원)` : size.label,
                    })),
                });
            } else if (step.itemId) {
                const item = findItem(step.itemId);
                addItem(step.itemId);
                askMore(script.added.replace('{name}', item.name));
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
                    { action: 'retry', label: '다시 말하기' },
                    { action: 'menu', label: '눌러서 주문하기' },
                    { action: 'call', label: '직원 부르기', full: true },
                ],
            });
        } else {
            ai(script.failOnce);
        }
    };

    const onChoice = (message, choice) => {
        if (choice.action === 'size') {
            const item = findItem(message.itemId);
            addItem(message.itemId, choice.value);
            me(choice.value);
            askMore(
                script.addedSized
                    .replace('{name}', item.name)
                    .replace('{size}', choice.value),
            );
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

    return (
        <div className="stage">
            <div className="phone">
                <Header
                    title="말로 주문하기"
                    left={
                        <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={() => navigate('/')}>
                            <BackIcon />
                        </button>
                    }
                    right={
                        <button type="button" className="pill-btn" onClick={() => navigate('/menu')}>
                            메뉴판
                        </button>
                    }
                />

                <div className="voice-chat" ref={chatRef} aria-live="polite">
                    {chat.map((m, i) => {
                        const locked = i !== lastIndex;
                        if (m.who === 'me') {
                            return (
                                <div key={m.id} className="voice-msg voice-msg--me">
                                    <span className="voice-msg__who">나</span>
                                    <div className={`voice-bubble voice-bubble--me ${m.unheard ? 'voice-bubble--unheard' : ''}`}>
                                        {m.text}
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div key={m.id} className="voice-msg">
                                <span className="voice-msg__who">AI 점원</span>
                                <div className={`voice-bubble ${m.warn ? 'voice-bubble--warn' : ''}`}>
                                    {m.text}
                                    {m.guide && (
                                        <>
                                            <ol className="voice-guide">
                                                {m.guide.map((line, n) => (
                                                    <li key={line} className="voice-guide__step">
                                                        <span className="voice-guide__num">{n + 1}</span>
                                                        <span>{line}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                            {m.guideTip && <p className="voice-guide__tip">{m.guideTip}</p>}
                                        </>
                                    )}
                                    {m.choices && (
                                        <div className="voice-choices">
                                            {m.choices.map((c) => (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    className={`voice-choice ${c.full ? 'voice-choice--full' : ''}`}
                                                    disabled={locked}
                                                    onClick={() => onChoice(m, c)}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="phone__footer">
                    <CartBar cart={cart} onConfirm={() => navigate('/confirm')} />
                    <div className="voice-mic">
                        <span className="voice-mic__label">
                            {listening ? '듣고 있어요…' : '누르고 말해 주세요'}
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
                    icon={<BellIcon />}
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
