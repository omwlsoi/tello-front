import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '') // '.' = 프로젝트 폴더 (.env.local 위치)
  // 개발 서버가 /api 요청을 백엔드로 대신 보내줘요 (CORS·ngrok 경고 페이지 걱정 없음)
  // .env.local: VITE_API_BASE_URL=/api, VITE_API_PROXY_TARGET=https://xxxx.ngrok-free.dev
  const target = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            '/api': {
              target,
              changeOrigin: true,
              headers: { 'ngrok-skip-browser-warning': 'true' },
            },
          },
        }
      : undefined,
  }
})
