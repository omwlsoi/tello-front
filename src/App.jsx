// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import VoicePage from './pages/VoicePage';
import MenuPage from './pages/MenuPage';
import ConfirmPage from './pages/ConfirmPage';
import OrderStatusPage from './pages/OrderStatusPage';
import BossPage from './pages/BossPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/voice" element={<VoicePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/status" element={<OrderStatusPage />} />
      <Route path="/status/:orderId" element={<OrderStatusPage />} />
      <Route path="/boss" element={<BossPage />} />
    </Routes>
  );
}

export default App;