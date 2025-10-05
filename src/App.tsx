import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SearchPage from '@/pages/SearchPage';
import GameStoryPage from '@/pages/GameStoryPage';
import AdminPage from '@/pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 게임 페이지는 레이아웃 없이 전체 화면 */}
        <Route path="/game" element={<GameStoryPage />} />
        
        {/* 관리자 페이지는 별도 레이아웃 */}
        <Route path="/admin/*" element={<AdminPage />} />
        
        {/* 나머지 페이지는 MobileLayout 적용 */}
        <Route path="/*" element={
          <MobileLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/search" element={<SearchPage />} />
              {/* 추가 라우트들은 여기에 */}
            </Routes>
          </MobileLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;

