// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import VoicePage from './pages/VoicePage';
import MenuPage from './pages/MenuPage';
import ConfirmPage from './pages/ConfirmPage';
import OrderStatusPage from './pages/OrderStatusPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/voice" element={<VoicePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/status" element={<OrderStatusPage />} />
    </Routes>
  );
}

export default App;