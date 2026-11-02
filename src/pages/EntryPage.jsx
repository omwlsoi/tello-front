import { useNavigate } from 'react-router-dom';
import { ArrowIcon, BrandHeader, HandIcon, MicIcon, Tello, WaveIcon } from '../components/common/Header';
import { useSessionStore } from '../stores/sessionStore';
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
                <BrandHeader />

                <section className="entry-hero glass" aria-label="텔로 인사">
                    <Tello face="happy" size={236} className="entry-hero__tello" />
                    <div className="entry-hero__bubble glass">
                        <span className="entry-hero__hello">
                            안녕하세요,
                            <br />
                            저는 <b>텔로</b>예요
                        </span>
                        <h1 className="entry-hero__ask">
                            어떻게
                            <br />
                            주문할까요?
                        </h1>
                    </div>
                </section>

                <main className="entry-options">
                    <button type="button" className="entry-card entry-card--voice glass" onClick={() => start('voice')}>
                        <span className="entry-card__tag">추천</span>
                        <span className="entry-card__row">
                            <span className="entry-card__name">
                                <span className="entry-card__mark">말로</span> 주문하기
                            </span>
                            <WaveIcon width={34} height={28} color="#FFC93C" />
                        </span>
                        <span className="entry-card__desc">
                            <span className="entry-card__quote">“아이스 아메리카노 하나요!”</span>처럼 말하면
                            <br />
                            텔로가 알아들어요
                        </span>
                        <span className="entry-card__foot">
                            <span className="entry-pill entry-pill--white">
                                텔로에게 말하기
                                <ArrowIcon />
                            </span>
                            <span className="entry-round entry-round--white">
                                <MicIcon size={24} color="#1D4ED8" />
                            </span>
                        </span>
                    </button>

                    <button type="button" className="entry-card entry-card--menu glass" onClick={() => start('menu')}>
                        <span className="entry-card__name entry-card__name--menu">
                            <span className="entry-card__mark entry-card__mark--blue">눌러서</span> 주문하기
                        </span>
                        <span className="entry-card__desc entry-card__desc--menu">
                            큰 <b>사진</b>만 보고 <b className="entry-card__em">콕!</b> 누르면 돼요
                        </span>
                        <span className="entry-card__foot">
                            <span className="entry-pill entry-pill--blue">
                                메뉴판 보기
                                <ArrowIcon />
                            </span>
                            <span className="entry-round entry-round--blue">
                                <HandIcon size={24} color="#FFFFFF" />
                            </span>
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
                    <p>텔로의 안내를 소리로 읽어줘요.</p>
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
