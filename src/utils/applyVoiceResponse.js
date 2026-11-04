import { OPTIONS, findItem, getItemIcon, getOptionLabel } from '../stores/sessionStore';
import script from '../mocks/messages.json';

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

// 되묻기(크기·온도·얼음·수량) 답 버튼 — 글자를 그대로 백엔드에 보내면 알아들어요
// 원래 VoicePage 디자인과 같게: 수량은 [1개][2개][마이크], 옵션은 마이크 칸 없이
const QTY_REPLY = [1, 2].map((n) => ({ action: 'reply', label: `${n}개`, said: `${n}개`, kind: n === 1 ? 'lime' : 'gbtn' }));
const MIC_REPLY = { action: 'mic', label: '말로 답하기', kind: 'gbtn', mic: true };

// 없는 메뉴를 말했을 때 "다른 메뉴를 추천해 드릴까요?" → 백엔드가 알아듣는 두 가지 답
const UNKNOWN_MENU_REPLY = [
    { action: 'reply', label: '추천해 주세요', said: '추천해 주세요', kind: 'lime' },
    { action: 'reply', label: '메뉴판 볼게요', said: '메뉴판 볼게요', kind: 'gbtn' },
];

function clarifyChoices(response) {
    const field = response?.issues?.[0]?.field;
    if (field === 'menuId') return /추천해 드릴까요/.test(response?.question ?? '') ? UNKNOWN_MENU_REPLY : undefined;
    if (field === 'quantity') return [...QTY_REPLY, MIC_REPLY];
    const option = OPTIONS[field];
    if (!option) return undefined;
    return [
        ...option.choices.map((c) => ({
            action: 'reply',
            label: c.label,
            said: c.label,
            sub: field === 'size' ? (c.extra ? `+${c.extra.toLocaleString()}원` : '기본 가격') : '',
            kind: c.id === option.default ? 'lime' : 'gbtn',
        })),
    ];
}

// 담은 메뉴 카드 (front-stability 화면과 같게: 그림 · 이름 · 옵션 · 개수 · 가격 · ✓)
// 백엔드 응답 items: [{ menu_id, menu_text, quantity, options: { size, temperature, ice } }]
function addedCard(response) {
    const lines = (response?.items ?? [])
        .map((it) => ({ item: findItem(it.menu_id), qty: it.quantity ?? 1, options: it.options ?? {} }))
        .filter((l) => l.item);
    if (!lines.length) return null;

    const price = (l) =>
        (l.item.price + (OPTIONS.size.choices.find((c) => c.id === l.options.size)?.extra ?? 0)) * l.qty;
    const [first] = lines;
    const opt = getOptionLabel(first.options);
    const toSpoken = (text) => text.replace(/핫/g, '따뜻하게').replace(/ · /g, ', ');

    return {
        card: {
            icon: getItemIcon(first.item, first.options),
            name: lines.length > 1 ? `${first.item.name} 외 ${lines.length - 1}개` : first.item.name,
            opt: lines.length > 1 ? '' : [opt, `${first.qty}개`].filter(Boolean).join(' · '),
            price: lines.reduce((sum, l) => sum + price(l), 0),
        },
        spoken:
            lines.length > 1
                ? `${lines.map((l) => `${l.item.name} ${l.qty}개`).join(', ')}를 담았어요. ${script.addedAsk}`
                : (opt ? script.addedOpt : script.added)
                      .replace('{name}', first.item.name)
                      .replace('{opt}', toSpoken(opt))
                      .replace('{qty}', first.qty),
    };
}

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
        case 'continue_order': {
            const added = addedCard(response);
            if (added) {
                // "이렇게 담았어요." + 메뉴 카드 + "더 필요한 게 있나요?" + [네][아니요]
                say(script.addedLead, { ask: 'more', card: added.card, followUp: question || script.addedAsk, choices: moreChoices }, added.spoken);
            } else {
                say(question || script.addedAsk, { ask: 'more', choices: moreChoices });
            }
            return;
        }

        // 네/아니요로 답할 질문 (빼기 확인, 전체 비우기, 디저트 추천, 가격 안내 뒤 담기 확인)
        case 'confirm_remove':
        case 'confirm_clear':
        case 'confirm_pairing':
        case 'confirm_menu_selection':
            say(question || FALLBACK, { choices: yesNoChoices });
            return;

        // 추천 메뉴 → 메뉴 버튼 + [다른 추천] (누르면 그 말을 백엔드에 보내요)
        case 'show_recommendations': {
            const picks = (response.candidates ?? []).map((c) => ({
                action: 'reply',
                label: c.name,
                said: `${c.name} 주세요`,
                sub: typeof c.price === 'number' ? `${c.price.toLocaleString()}원` : '',
                kind: 'gbtn',
            }));
            say(question || '이런 메뉴를 추천해 드릴게요.', {
                choices: [...picks, { action: 'reply', label: '다른 추천', said: '다른 추천', kind: 'gbtn', full: true }],
            });
            return;
        }

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

        // 되묻기 (크기·온도·얼음·수량) → 답 버튼도 같이
        case 'clarification': {
            const choices = clarifyChoices(response);
            say(question || FALLBACK, choices ? { choices } : undefined);
            return;
        }

        // 어떤 메뉴를 뺄지 고르기, 그 밖의 안내
        case 'select_cart_item':
        default:
            say(question || FALLBACK);
    }
}
