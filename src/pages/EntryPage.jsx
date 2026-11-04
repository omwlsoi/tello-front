import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowIcon, BrandHeader, HandIcon, MicIcon, Tello, WaveIcon } from '../components/common/Header';
import { useSessionStore } from '../stores/sessionStore';
import { createSession } from '../api/session'; // 👈 백엔드 세션 생성 API 임포트
import './EntryPage.css';

// 1. 시작 화면: QR로 들어와 주문 방법을 고르는 화면
export default function EntryPage() {
    const navigate = useNavigate();
    const setFrom = useSessionStore((s) => s.setFrom);
    const soundOn = useSessionStore((s) => s.soundOn);
    const toggleSound = useSessionStore((s) => s.toggleSound);
    const resetDemo = useSessionStore((s) => s.resetDemo);
    const bigText = useSessionStore((s) => s.bigText);

    // 🚀 서버 연동: 주문 방식 선택 시 백엔드 세션 생성 API 호출
    const [starting, setStarting] = useState(null); // 'voice' | 'menu' | null (세션 만드는 중)
    const startingRef = useRef(false);

    const start = async (mode) => {
        if (startingRef.current) return; // 여러 번 눌러도 세션은 하나만
        startingRef.current = true;
        setStarting(mode);
        try {
            // 기본 매장 ID (필요에 따라 변경 가능)
            const storeId = "store_001"; 

            // 백엔드 세션 생성 API 호출 (POST /api/sessions)
            const sessionData = await createSession(storeId);
            
            if (sessionData && sessionData.sessionId && sessionData.sessionToken) {
                // 브라우저 저장소에 세션 정보 안전하게 적재
                localStorage.setItem('sessionId', sessionData.sessionId);
                localStorage.setItem('sessionToken', sessionData.sessionToken);
            }
        } catch (error) {
            console.error("세션 생성 실패 (로컬 목업 모드로 전환될 수 있습니다):", error);
        }

        setFrom(mode);
        navigate(mode === 'voice' ? '/voice' : '/menu');
    };

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                    <BrandHeader />

                    {bigText ? (
                        <section className="entry-hero entry-hero--big glass" aria-label="텔로링 인사">
                            <div className="entry-hero__row">
                                <Tello face="happy" size={96} />
                                <span className="entry-hero__hello">
                                    안녕하세요,
                                    <br />
                                    저는 <b>텔로링</b>이에요
                                </span>
                            </div>
                            <h1 className="entry-hero__ask entry-hero__ask--bubble">어떻게 주문할까요?</h1>
                        </section>
                    ) : (
                        <section className="entry-hero glass" aria-label="텔로링 인사">
                            <Tello face="happy" size={236} className="entry-hero__tello" />
                            <div className="entry-hero__bubble glass">
                                <span className="entry-hero__hello">
                                    안녕하세요,
                                    <br />
                                    저는 <b>텔로링</b>이에요
                                </span>
                                <h1 className="entry-hero__ask">
                                    어떻게
                                    <br />
                                    주문할까요?
                                </h1>
                            </div>
                        </section>
                    )}

                    {bigText ? (
                        <main className="entry-options">
                            <button type="button" className="entry-card entry-card--voice glass" onClick={() => start('voice')} disabled={!!starting} aria-busy={starting === 'voice'}>
                                <span className="entry-card__tag">추천</span>
                                <span className="entry-card__row">
                                    <span className="entry-card__name">
                                        <span className="entry-card__mark">말로</span>
                                        <br />
                                        주문하기
                                        <WaveIcon width={36} height={30} color="#FFC93C" />
                                    </span>
                                </span>
                                <span className="entry-card__quote">“아이스 아메리카노 하나요!”</span>
                                <span className="entry-card__desc">
                                    처럼 말하면
                                    <br />
                                    텔로링이 알아들어요
                                </span>
                                <span className="entry-pill entry-pill--white">
                                    <MicIcon size={28} />
                                    {starting === 'voice' ? '준비 중…' : '텔로링에게 말하기'}
                                </span>
                            </button>

                            <button type="button" className="entry-card entry-card--menu glass" onClick={() => start('menu')} disabled={!!starting} aria-busy={starting === 'menu'}>
                                <span className="entry-card__name entry-card__name--menu">
                                    <span className="entry-card__mark entry-card__mark--blue">눌러서</span> 주문하기
                                </span>
                                <span className="entry-card__desc entry-card__desc--menu">
                                    큰 <b>사진</b>만 보고
                                    <br />
                                    <b className="entry-card__em">콕!</b> 누르면 돼요
                                </span>
                                <span className="entry-pill entry-pill--blue">
                                    <HandIcon size={28} />
                                    {starting === 'menu' ? '준비 중…' : '메뉴판 보기'}
                                </span>
                            </button>
                        </main>
                    ) : (
                        <main className="entry-options">
                            <button type="button" className="entry-card entry-card--voice glass" onClick={() => start('voice')} disabled={!!starting} aria-busy={starting === 'voice'}>
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
                                    텔로링이 알아들어요
                                </span>
                                <span className="entry-card__foot">
                                    <span className="entry-pill entry-pill--white">
                                        {starting === 'voice' ? '준비 중…' : '텔로링에게 말하기'}
                                        <ArrowIcon />
                                    </span>
                                    <span className="entry-round entry-round--white">
                                        <MicIcon size={24} color="#1D4ED8" />
                                    </span>
                                </span>
                            </button>

                            <button type="button" className="entry-card entry-card--menu glass" onClick={() => start('menu')} disabled={!!starting} aria-busy={starting === 'menu'}>
                                <span className="entry-card__name entry-card__name--menu">
                                    <span className="entry-card__mark entry-card__mark--blue">눌러서</span> 주문하기
                                </span>
                                <span className="entry-card__desc entry-card__desc--menu">
                                    큰 <b>사진</b>만 보고 <b className="entry-card__em">콕!</b> 누르면 돼요
                                </span>
                                <span className="entry-card__foot">
                                    <span className="entry-pill entry-pill--blue">
                                        {starting === 'menu' ? '준비 중…' : '메뉴판 보기'}
                                        <ArrowIcon />
                                    </span>
                                    <span className="entry-round entry-round--blue">
                                        <HandIcon size={24} color="#FFFFFF" />
                                    </span>
                                </span>
                            </button>
                        </main>
                    )}
                </div>
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
                    <p>텔로링의 안내를 소리로 읽어줘요.</p>
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