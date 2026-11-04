// 문장이 끝날 때마다(. ? !) 줄을 바꿔요 — 말풍선·안내 창에서 한 문장씩 읽히게
// 예: "아이스 아메리카노 1잔이요. 크기를 골라 주세요." → "아이스 아메리카노 1잔이요.\n크기를 골라 주세요."
export default function breakLines(text = '') {
    return text.replace(/([.?!])\s+(?=\S)/g, '$1\n');
}
