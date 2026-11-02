// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. 라우터 임포트
// 공통 스타일(index.css)을 먼저 불러와야 화면별 CSS가 덮어쓸 수 있어요
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 2. App을 감싸주기 */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)