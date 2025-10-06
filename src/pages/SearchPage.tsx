import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';
import { getActionPointStatus, enterStoryDay } from '@/api/story';
import { useAuthStore } from '@/store/authStore';
import type { ActionPointStatus } from '@/api/story';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [actionPoints, setActionPoints] = useState<ActionPointStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 액션 포인트 불러오기
  useEffect(() => {
    const fetchActionPoints = async () => {
      try {
        const data = await getActionPointStatus();
        setActionPoints(data);
      } catch (err: any) {
        console.error('Failed to fetch action points:', err);
        setError('액션 포인트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActionPoints();

    // 페이지 포커스 시 조사 기회 새로고침
    const handleFocus = () => {
      fetchActionPoints();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleStart = async () => {
    if (!user || !actionPoints) return;

    if (actionPoints.current <= 0) {
      setError('조사 기회가 부족합니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 게임 시작 - 조사 기회 1회 소모
      const currentDay = user.current_day > 0 ? user.current_day : 1;
      console.log('게임 시작, 조사 기회 소모:', currentDay);
      await enterStoryDay(currentDay);
      
      // 게임 스토리 페이지로 이동
      navigate('/game');
    } catch (err: any) {
      console.error('Failed to start game:', err);
      setError(err.response?.data?.error || '게임 시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <Header />

      {/* 배경 이미지 - 흐리고 어둡게 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${IMAGES.HOME})`,
          filter: 'brightness(0.25) blur(4px)'
        }}
      />
      
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/70" />

      {/* 상단 타이틀 */}
      <div className="relative z-10 pt-16 px-6">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-center text-white text-lg font-normal tracking-widest mb-3">
            SEARCH
          </h1>
          <div className="w-full h-px bg-white/40" />
        </div>
      </div>
      
      {/* 게임 시작 확인 모달 */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full" style={{ maxWidth: '340px' }}>
            {/* 모달 카드 */}
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
                  조사를 시작하시겠습니까?
                </h2>
                
                {/* 로딩 또는 남은 기회 표시 */}
                {isLoading ? (
                  <div className="text-center mb-6">
                    <p className="text-gray-300 text-sm">로딩 중...</p>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <p className="text-gray-300 text-sm mb-2">
                      남은 기회: <span className={`font-semibold ${actionPoints && actionPoints.current > 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {actionPoints?.current ?? 0} / {actionPoints?.max ?? 3}회
                      </span>
                    </p>
                    {actionPoints && actionPoints.nextRechargeAt && (
                      <p className="text-gray-500 text-xs mt-1">
                        다음 충전: {new Date(actionPoints.nextRechargeAt).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}

                {/* 에러 메시지 */}
                {error && (
                  <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                  </div>
                )}

                {/* 안내 문구 */}
                <p className="text-gray-300 text-center text-sm leading-relaxed mb-8">
                  지정된 데이터가 입장 시 해당 차원에서 시작됩니다.
                </p>

                {/* 버튼 그룹 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleStart}
                    disabled={isLoading || !actionPoints || actionPoints.current <= 0}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {isLoading ? '처리 중...' : '확인'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default SearchPage;

