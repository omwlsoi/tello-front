import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
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