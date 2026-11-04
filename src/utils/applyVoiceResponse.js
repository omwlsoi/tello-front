// 말로 주문: 백엔드 POST /api/sessions/{sessionId}/messages 응답을 화면에 반영해요
// 응답 모양: { intent, items, issues, needsClarification, question, cart, nextAction, candidates? }
//  - question  : 텔로링이 할 말 (되묻기·안내)
//  - cart      : 담기·빼기 뒤의 서버 장바구니 ({ items: [...] }) → 화면 장바구니를 맞춰요
//  - nextAction: 다음에 할 일
//
// 사용 예 (VoicePage.jsx handleSpeech 안):
//   const response = await analyzeMessage(sessionId, sessionToken, spokenText);
//   applyVoiceResponse(response, {
//       say: ai,
//       setCartFromServer,
//       goMenu: () => navigate('/menu'),
//       goConfirm: () => navigate('/confirm'),
//       moreChoices: MORE_CHOICES,
//       yesNoChoices: YES_NO_CHOICES,
//   });

// 네/아니요로 답하는 질문에 붙일 버튼 (누르면 그 글자를 그대로 백엔드에 다시 보내요)
// VoicePage onChoice 에서 action === 'reply' 이면 handleSpeech(choice.said) 를 부르면 돼요
export const YES_NO_CHOICES = [
    { action: 'reply', label: '네', kind: 'lime', said: '네' },
    { action: 'reply', label: '아니요', kind: 'gbtn', said: '아니요' },
    { action: 'mic', label: '말로 답하기', kind: 'gbtn', mic: true },
];

const FALLBACK = '말씀하신 내용을 잘 이해하지 못했어요. 다시 한 번 말씀해 주세요.';

export default function applyVoiceResponse(
    response,
    { say, setCartFromServer, goMenu, goConfirm, moreChoices = [], yesNoChoices = YES_NO_CHOICES },
) {
    if (!response) {
        say(FALLBACK);
        return;
    }

    // 1. 서버 장바구니가 바뀌었으면 화면도 맞춰요
    if (Array.isArray(response.cart?.items)) setCartFromServer?.(response.cart.items);

    const question = response.question || '';

    switch (response.nextAction) {
        // 담기·빼기 끝 → "더 필요한 게 있나요?" + [네][아니요]
        case 'ask_more':
        case 'cart_updated':
        case 'continue_order':
            say(question || '더 필요한 게 있나요?', { ask: 'more', choices: moreChoices });
            return;

        // 네/아니요로 답할 질문 (빼기 확인, 전체 비우기, 디저트 추천, 가격 안내 뒤 담기 확인)
        case 'confirm_remove':
        case 'confirm_clear':
        case 'confirm_pairing':
        case 'confirm_menu_selection':
            say(question || FALLBACK, { choices: yesNoChoices });
            return;

        // 메뉴판으로
        case 'show_menu':
            say(question || '메뉴판을 열어 드릴게요.');
            setTimeout(() => goMenu?.(), 1200);
            return;

        // 주문 확인으로
        case 'review_cart':
            say(question || '주문 내용을 확인할게요.');
            setTimeout(() => goConfirm?.(), 900);
            return;

        // 되묻기 (크기·온도·수량 등), 어떤 메뉴를 뺄지 고르기, 그 밖의 안내
        case 'clarification':
        case 'select_cart_item':
        default:
            say(question || FALLBACK);
    }
}
