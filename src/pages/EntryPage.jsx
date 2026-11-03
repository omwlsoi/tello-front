import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowIcon, BrandHeader, HandIcon, MicIcon, Tello, WaveIcon } from '../components/common/Header';
import { useSessionStore } from '../stores/sessionStore';
import { createSession } from '../api/session'; // 👈 1. 세션 생성 API 임포트
import './EntryPage.css';

// 1. 시작 화면: QR로 들어와 주문 방법을 고르는 화면
export default function EntryPage() {
    const navigate = useNavigate();
    const setFrom = useSessionStore((s) => s.setFrom);
    const soundOn = useSessionStore((s) => s.soundOn);
    const toggleSound = useSessionStore((s) => s.toggleSound);
    const resetDemo = useSessionStore((s) => s.resetDemo);
    const bigText = useSessionStore((s) => s.bigText);

    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가 (중복 클릭 방지)

    // 👈 2. API 연동을 위한 start 함수 수정
    const start = async (mode) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // 임시 매장 ID (실제 서비스 환경이나 QR 파라미터에 맞게 수정 필요)
            const storeId = "store_1"; 

            // 백엔드에 주문 세션 생성 요청
            const sessionData = await createSession(storeId);
            const { sessionId, sessionToken } = sessionData;

            // 로컬 스토리지에 세션 정보 저장 (이후 API 요청 시 인증 등에 사용)
            localStorage.setItem('sessionId', sessionId);
            localStorage.setItem('sessionToken', sessionToken);

            // 전역 상태에 모드 설정 후 페이지 이동
            setFrom(mode);
            navigate(mode === 'voice' ? '/voice' : '/menu');

        } catch (error) {
            console.error("세션 생성 실패:", error);
            alert("주문 세션을 시작하는 데 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="stage">
            <div className={`phone ${bigText ? 'phone--big' : ''}`}>
                <div className="phone__scroll">
                    <BrandHeader />

                    {bigText ? (
                        <section className="entry-hero entry-hero--big glass" aria-label="텔로 인사">
                            <div className="entry-hero__row">
                                <Tello face="happy" size={96} />
                                <span className="entry-hero__hello">
                                    안녕하세요,
                                    <br />
                                    저는 <b>텔로</b>예요
                                </span>
                            </div>
                            <h1 className="entry-hero__ask">어떻게 주문할까요?</h1>
                        </section>
                    ) : (
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
                    )}

                    {bigText ? (
                        <main className="entry-options">
                            <button 
                                type="button" 
                                className="entry-card entry-card--voice glass" 
                                onClick={() => start('voice')}
                                disabled={isLoading} // 로딩 중 클릭 방지
                            >
                                <span className="entry-card__tag">추천</span>
                                <span className="entry-card__row">
                                    <span className="entry-card__name">
                                        <span className="entry-card__mark">말로</span>
                                        <br />
                                        주문하기
                                    </span>
                                    <WaveIcon width={42} height={34} color="#FFC93C" />
                                </span>
                                <span className="entry-card__quote">
                                    “아이스 아메리카노
                                    <br />
                                    하나요!”
                                </span>
                                <span className="entry-card__desc">
                                    처럼 말하면
                                    <br />
                                    텔로가 알아들어요
                                </span>
                                <span className="entry-pill entry-pill--white">
                                    <MicIcon size={28} />
                                    텔로에게 말하기
                                </span>
                            </button>

                            <button 
                                type="button" 
                                className="entry-card entry-card--menu glass" 
                                onClick={() => start('menu')}
                                disabled={isLoading} // 로딩 중 클릭 방지
                            >
                                <span className="entry-card__name entry-card__name--menu">
                                    <span className="entry-card__mark entry-card__mark--blue">눌러서</span>
                                    <br />
                                    주문하기
                                </span>
                                <span className="entry-card__desc entry-card__desc--menu">
                                    큰 <b>사진</b>만 보고
                                    <br />
                                    <b className="entry-card__em">콕!</b> 누르면 돼요
                                </span>
                                <span className="entry-pill entry-pill--blue">
                                    <HandIcon size={28} />
                                    메뉴판 보기
                                </span>
                            </button>
                        </main>
                    ) : (
                        <main className="entry-options">
                            <button 
                                type="button" 
                                className="entry-card entry-card--voice glass" 
                                onClick={() => start('voice')}
                                disabled={isLoading}
                            >
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

                            <button 
                                type="button" 
                                className="entry-card entry-card--menu glass" 
                                onClick={() => start('menu')}
                                disabled={isLoading}
                            >
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