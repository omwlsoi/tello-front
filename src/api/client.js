import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// 요청마다 손님 세션 토큰을 붙여요.
// 단, 이미 Authorization을 직접 넣은 요청(매장 화면의 관리자 idToken 등)은 덮어쓰지 않아요.
apiClient.interceptors.request.use(
  (config) => {
    if (!config.headers['Authorization']) {
      const token = localStorage.getItem('sessionToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);