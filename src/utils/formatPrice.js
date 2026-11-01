// 숫자를 "3,000원" 형태로 바꿔요.
export default function formatPrice(value) {
    return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}
