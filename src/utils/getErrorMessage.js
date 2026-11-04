// 서버 에러를 손님이 읽을 수 있는 문장으로 바꿔요
// 백엔드 에러 형식: { code, message } 또는 { detail }
// 서버에 닿지 못했으면(네트워크·CORS) fallback 대신 연결 안내를 보여줘요
export default function getErrorMessage(error, fallback = '잠시 문제가 생겼어요. 다시 시도해 주세요.') {
    const data = error?.response?.data;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (!error?.response) return '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
    return fallback;
}
