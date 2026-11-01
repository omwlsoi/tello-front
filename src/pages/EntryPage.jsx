import { useNavigate } from 'react-router-dom';
import Header, { HandIcon, MicIcon } from '../components/common/Header';
import { useSessionStore } from '../stores/sessionStore';
import storeInfo from '../mocks/store.json';
import './EntryPage.css';

// 1. 시작 화면: QR로 들어와 주문 방법을 고르는 화면
// (사용 방법 안내는 말로 주문하기 첫 인사에서 해요)
export default function EntryPage() {
    const navigate = useNavigate();
    const setFrom = useSessionStore((s) => s.setFrom);
    const soundOn = useSessionStore((s) => s.soundOn);
    const toggleSound = useSessionStore((s) => s.toggleSound);
    const resetDemo = useSessionStore((s) => s.resetDemo);

    const start = (mode) => {
        setFrom(mode);
        navigate(mode === 'voice' ? '/voice' : '/menu');
    };

    return (
        <div className="stage">
            <div className="phone">
                <Header>
                    <div className="entry-brand">
                        <span className="entry-brand__badge">{storeInfo.badge}</span>
                        <span className="app-header__title">{storeInfo.name}</span>
                    </div>
                </Header>

                <main className="phone__body">
                    <h1 className="screen-title">어떻게 주문하시겠어요?</h1>
                    <p className="screen-desc entry-sub">주문 중에도 언제든 바꿀 수 있어요</p>

                    <button
                        type="button"
                        className="entry-card entry-card--voice"
                        onClick={() => start('voice')}
                    >
                        <span className="entry-card__tag">추천</span>
                        <span className="entry-card__row">
                            <span className="entry-card__icon">
                                <MicIcon color="#fff" />
                            </span>
                            <span className="entry-card__name">말로 주문하기</span>
                        </span>
                        <span className="entry-card__desc">
                            "아이스 아메리카노 하나 주세요"처럼 말하면 돼요
                        </span>
                    </button>

                    <button
                        type="button"
                        className="entry-card"
                        onClick={() => start('menu')}
                    >
                        <span className="entry-card__row">
                            <span className="entry-card__icon entry-card__icon--soft">
                                <HandIcon color="#1A1A1A" />
                            </span>
                            <span className="entry-card__name">눌러서 주문하기</span>
                        </span>
                        <span className="entry-card__desc entry-card__desc--sub">
                            큰 사진을 보고 눌러서 골라요
                        </span>
                    </button>
                </main>
            </div>

            <aside className="demo-panel" aria-label="시연 버튼">
                <p className="demo-panel__label">시연 버튼</p>
                <div className="demo-panel__box">
                    <h3>매장 화면</h3>
                    <p>새 탭에서 열어 두면 주문이 바로 떠요.</p>
                    <a className="demo-btn" href="/boss" target="_blank" rel="noreferrer">
                        매장 화면 열기
                    </a>
                </div>
                <div className="demo-panel__box">
                    <h3>소리</h3>
                    <p>AI 점원의 안내를 소리로 읽어줘요.</p>
                    <button type="button" className="demo-btn" onClick={toggleSound}>
                        {soundOn ? '소리 켜짐' : '소리 꺼짐'}
                    </button>
                </div>
                <div className="demo-panel__box">
                    <button type="button" className="demo-btn" onClick={resetDemo}>
                        처음부터 다시 시연
                    </button>
                </div>
            </aside>
        </div>
    );
}
