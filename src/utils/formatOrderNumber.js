// 서버 주문 번호(16진수 8자리, 예: 8A0D92F1)를 손님이 듣고 보기 쉬운 3자리 이하 숫자로 바꿔요
// 예: "8A0D92F1" → 2289930993 → 993
// 가게 화면과 손님 화면이 같은 함수를 써서 번호가 항상 똑같이 보여요
export default function formatOrderNumber(orderNumber) {
    if (orderNumber == null || orderNumber === '') return '';
    const value = parseInt(String(orderNumber), 16);
    if (Number.isNaN(value)) return String(orderNumber); // 16진수가 아니면 그대로
    return String((value % 999) + 1); // 1 ~ 999 (0번이 안 나오게)
}
