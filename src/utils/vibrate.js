// 메뉴가 나왔을 때 손님 폰을 울려요
// - 안드로이드: Vibration API (길게 3번)
// - 아이폰: 웹 진동을 막아둬서, iOS 18+ 사파리의 스위치 햅틱으로 "톡" 하고 3번 울려요 (약한 진동)
//   (iOS 17 이하는 울리지 않아요 → 소리 안내·화면 표시로 알려줘요)
const PATTERN = [400, 150, 400, 150, 400];

const iosHaptic = () => {
    try {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        label.appendChild(input);
        label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-9999px;';
        document.body.appendChild(label);
        label.click();
        label.remove();
    } catch {
        // 지원하지 않으면 무시
    }
};

export default function vibrate() {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(PATTERN);
            return;
        }
    } catch {
        // 진동 미지원 기기 무시
    }
    // 아이폰: 0.55초 간격으로 3번
    [0, 550, 1100].forEach((delay) => setTimeout(iosHaptic, delay));
}
