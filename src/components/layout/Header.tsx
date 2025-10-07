import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';

interface HeaderProps {
  showMenu?: boolean;
}

const Header = ({ showMenu = true }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
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

  // 시간 제한 확인 함수 (2025-10-09부터 00시-11시 비활성화)
  const isSearchDisabled = () => {
    const now = new Date();
    const restrictionStartDate = new Date('2025-10-09');
    
    // 2025-10-09 이후이고 현재 시간이 00시-11시인지 확인
    if (now >= restrictionStartDate) {
      const currentHour = now.getHours();
      return currentHour >= 0 && currentHour < 12; // 00시-11시
    }
    
    return false;
  };

  const handleSearchClick = () => {
    if (isSearchDisabled()) {
      setShowTimeModal(true);
    } else {
      navigate('/search');
      setIsMenuOpen(false);
    }
  };

  const commonMenuItems = [
    { label: 'HOME', path: '/' },
    { label: 'MY', path: '/my' },
  ];

  const authenticatedMenuItems = [
    { label: 'SEARCH', path: '/search' },
    { label: 'RAIDSEARCH', path: '/raidsearch' },
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
                {menuItems.map((item) => {
                  const isSearchItem = item.path === '/search';
                  const isDisabled = isSearchItem && isSearchDisabled();
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        if (isSearchItem) {
                          handleSearchClick();
                        } else {
                          navigate(item.path);
                          setIsMenuOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 font-medium ${
                        isDisabled 
                          ? 'text-gray-500 cursor-not-allowed bg-gray-800/30' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                      {isDisabled && <span className="text-xs ml-2 text-gray-400">(비활성화)</span>}
                    </button>
                  );
                })}

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

      {/* 러닝타임 안내 모달 */}
      {showTimeModal && (
        <>
          {/* 모달 오버레이 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity"
            onClick={() => setShowTimeModal(false)}
          />
          
          {/* 모달 콘텐츠 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md z-70 rounded-2xl shadow-2xl border border-gray-700 max-w-sm w-full mx-4">
            <div className="p-6 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-yellow-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                러닝타임이 아닙니다
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                검색 기능은 오전 11시부터 이용 가능합니다.
                <br />
                (00시 ~ 11시 제한)
              </p>
              
              <button
                onClick={() => setShowTimeModal(false)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;

