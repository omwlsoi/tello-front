import axios from 'axios';

// 백엔드 주소는 .env.local의 VITE_API_BASE_URL에서 읽어요 (없으면 로컬 서버)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    // ngrok 무료 주소의 경고 페이지 없이 바로 응답받기
    'ngrok-skip-browser-warning': 'true',
  },
});

// 요청 인터셉터 설정: 요청을 보내기 직전에 실행됨
apiClient.interceptors.request.use(
  (config) => {
    // 예: localStorage나 전역 상태에서 토큰을 동적으로 가져옴
    const token = localStorage.getItem('sessionToken'); 
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);