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
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, clearAuth, updateUser } = useAuthStore();

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

  // 시간 제한 확인 함수 (매일 00시-11시 비활성화) - 한국 시간 기준
  const isSearchDisabled = () => {
    // 한국 시간으로 변환
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const currentHour = koreaTime.getHours();
    
    // 매일 00시-11시는 비활성화
    return currentHour >= 0 && currentHour < 12; // 00시-11시
  };

  // 레이드 조사 시간 제한 확인 함수 (21:00-21:40만 활성화) - 한국 시간 기준
  const isRaidSearchDisabled = () => {
    // 한국 시간으로 변환ㅎㅎ
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const currentHour = koreaTime.getHours();
    const currentMinute = koreaTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // 21:00 = 1260분, 21:40 = 1300분
    const raidStartTime = 21 * 60; // 21:00
    const raidEndTime = 21 * 60 + 40; // 21:40
    
    return currentTimeInMinutes < raidStartTime || currentTimeInMinutes >= raidEndTime;
  };

  const handleSearchClick = () => {
    if (isSearchDisabled()) {
      setShowTimeModal(true);
    } else {
      navigate('/search');
      setIsMenuOpen(false);
    }
  };

  const handleRaidSearchClick = () => {
    if (isRaidSearchDisabled()) {
      // 레이드 조사 시간 제한 알림 모달 표시
      alert('해당 시간이 아닙니다.\n레이드조사 21:00~21:40');
    } else {
      navigate('/raidsearch');
      setIsMenuOpen(false);
    }
  };

  const handleRechargeClick = () => {
    setShowRechargeModal(true);
    setIsMenuOpen(false);
  };

  const handleRechargeConfirm = async () => {
    try {
      // 골드 체크
      if (!user || user.gold < 2) {
        alert('골드가 부족합니다.\n필요한 골드: 2개');
        setShowRechargeModal(false);
        return;
      }

      const response = await fetch('https://b801-be.azurewebsites.net/api/story/recharge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 유저 정보 업데이트 (골드 차감)
        updateUser({ gold: data.currentGold });
        alert(`조사 기회가 충전되었습니다!\n남은 조사 기회: ${data.remaining}회`);
      } else {
        const error = await response.json();
        alert(error.error || '충전에 실패했습니다.');
      }
    } catch (error) {
      console.error('충전 오류:', error);
      alert('충전 중 오류가 발생했습니다.');
    } finally {
      setShowRechargeModal(false);
    }
  };

  const commonMenuItems = [
    { label: 'HOME', path: '/' },
    { label: 'MY', path: '/my' },
  ];

  const authenticatedMenuItems = [
    { label: 'SEARCH', path: '/search' },
    { label: 'RAIDSEARCH', path: '/raidsearch' },
    { label: '조사 기회 충전', path: '/recharge', isAction: true },
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
                {menuItems.map((item: any) => {
                  const isSearchItem = item.path === '/search';
                  const isRaidSearchItem = item.path === '/raidsearch';
                  const isRechargeItem = item.path === '/recharge';
                  const isSearchDisabledTime = isSearchItem && isSearchDisabled();
                  const isRaidSearchDisabledTime = isRaidSearchItem && isRaidSearchDisabled();
                  const isDisabled = isSearchDisabledTime || isRaidSearchDisabledTime;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        if (isSearchItem) {
                          handleSearchClick();
                        } else if (isRaidSearchItem) {
                          handleRaidSearchClick();
                        } else if (isRechargeItem) {
                          handleRechargeClick();
                        } else {
                          navigate(item.path);
                          setIsMenuOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 font-medium ${
                        isDisabled 
                          ? 'text-gray-500 cursor-not-allowed bg-gray-800/30' 
                          : isRechargeItem
                          ? 'text-yellow-400 hover:bg-white/10'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                      {isSearchDisabledTime && <span className="text-xs ml-2 text-gray-400">(시간 제한)</span>}
                      {isRaidSearchDisabledTime && <span className="text-xs ml-2 text-gray-400">(21:00~21:40)</span>}
                      {isRechargeItem && <span className="text-xs ml-2 text-yellow-300">(2골드)</span>}
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

      {/* 조사 기회 충전 모달 */}
      {showRechargeModal && (
        <>
          {/* 모달 오버레이 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity"
            onClick={() => setShowRechargeModal(false)}
          />
          
          {/* 모달 콘텐츠 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-70 w-full px-4" style={{ maxWidth: '340px' }}>
            <div 
              className="backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
              style={{
                background: 'rgba(40, 40, 40, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="px-6 py-8">
                {/* 제목 */}
                <h2 className="text-white text-center text-base font-medium mb-8">
                  조사 기회를 충전하시겠습니까?
                </h2>
                
                {/* 가격 정보 */}
                <div className="text-center mb-6">
                  <p className="text-gray-300 text-sm mb-2">
                    가격: <span className="font-semibold text-yellow-400">2 골드</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    현재 골드: {user?.gold ?? 0}개
                  </p>
                </div>

                {/* 안내 문구 */}
                <p className="text-gray-300 text-center text-sm leading-relaxed mb-8">
                  조사 기회 +1회
                </p>

                {/* 버튼 그룹 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRechargeModal(false)}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRechargeConfirm}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    구매
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;

