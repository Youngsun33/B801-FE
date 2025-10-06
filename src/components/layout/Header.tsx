import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';

interface HeaderProps {
  showMenu?: boolean;
}

const Header = ({ showMenu = true }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      setIsMenuOpen(false);
      navigate('/');
    }
  };

  const commonMenuItems = [
    { label: 'HOME', path: '/' },
  ];

  const authenticatedMenuItems = [
    { label: 'SEARCH', path: '/search' },
  ];

  const menuItems = isAuthenticated
    ? [...commonMenuItems, ...authenticatedMenuItems]
    : [...commonMenuItems, { label: 'LOGIN', path: '/login' }];

  return (
    <>
      {/* 헤더 */}
      {showMenu && (
        <header className="absolute top-0 left-0 right-0 z-50 safe-top">
          <div className="flex items-center justify-between p-4">
            {/* 햄버거 버튼 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all duration-200 active:scale-95"
              aria-label="메뉴"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* 사이드 메뉴 */}
      {isMenuOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 메뉴 패널 */}
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-md z-50 shadow-2xl safe-top safe-bottom">
            <div className="flex flex-col h-full">
              {/* 메뉴 헤더 */}
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">B801</h2>
                {isAuthenticated && user ? (
                  <p className="text-sm text-gray-400 mt-1">{user.username}</p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Menu</p>
                )}
              </div>

              {/* 메뉴 아이템 */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 font-medium"
                  >
                    {item.label}
                  </button>
                ))}

                {/* 로그아웃 버튼 (로그인된 경우에만 표시) */}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200 font-medium"
                  >
                    LOGOUT
                  </button>
                )}
              </nav>

              {/* 메뉴 푸터 */}
              <div className="p-6 border-t border-gray-700">
                <p className="text-xs text-gray-500">Version 0.0.1</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;

