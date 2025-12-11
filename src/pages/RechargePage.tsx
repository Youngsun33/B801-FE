import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';
import { getActionPointStatus } from '@/api/story';
import { useAuthStore } from '@/store/authStore';
import type { ActionPointStatus } from '@/api/story';

const RechargePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [actionPoints, setActionPoints] = useState<ActionPointStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
  }, []);

  const handleRecharge = async () => {
    if (!user) return;

    // 골드 체크
    if (user.gold < 2) {
      setError('골드가 부족합니다. (필요: 2 골드)');
      return;
    }

    // 조사 기회가 이미 최대인지 체크
    if (actionPoints && actionPoints.current >= actionPoints.max) {
      setError('조사 기회가 이미 최대입니다.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
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
        
        // 액션 포인트 다시 불러오기
        const updatedActionPoints = await getActionPointStatus();
        setActionPoints(updatedActionPoints);
        
        // 성공 메시지
        alert(`조사 기회가 충전되었습니다!\n남은 조사 기회: ${data.remaining}회`);
        
      } else {
        const errorData = await response.json();
        setError(errorData.error || '충전에 실패했습니다.');
      }
    } catch (error) {
      console.error('충전 오류:', error);
      setError('충전 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
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
            조사 기회 충전
          </h1>
          <div className="w-full h-px bg-white/40" />
        </div>
      </div>
      
      {/* 충전 확인 모달 */}
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
                  조사 기회를 충전하시겠습니까?
                </h2>
                
                {/* 로딩 또는 남은 기회 표시 */}
                {isLoading ? (
                  <div className="text-center mb-6">
                    <p className="text-gray-300 text-sm">로딩 중...</p>
                  </div>
                ) : (
                  <>
                    {/* 현재 조사 기회 */}
                    <div className="text-center mb-6">
                      <p className="text-gray-300 text-sm mb-2">
                        현재 조사 기회: <span className={`font-semibold ${actionPoints && actionPoints.current > 0 ? 'text-green-400' : 'text-red-500'}`}>
                          {actionPoints?.current ?? 0} / {actionPoints?.max ?? 3}회
                        </span>
                      </p>
                    </div>

                    {/* 가격 정보 */}
                    <div className="text-center mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-gray-300 text-sm mb-2">
                        가격: <span className="font-semibold text-yellow-400">2 골드</span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        현재 보유: {user?.gold ?? 0} 골드
                      </p>
                    </div>
                  </>
                )}

                {/* 에러 메시지 */}
                {error && (
                  <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                  </div>
                )}

                {/* 안내 문구 */}
                <p className="text-gray-300 text-center text-sm leading-relaxed mb-8">
                  골드 2개를 소모하여 조사 기회를 1회 충전합니다.
                </p>

                {/* 버튼 그룹 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRecharge}
                    disabled={isLoading || isProcessing || !user || user.gold < 2}
                    className="flex-1 py-3.5 rounded-full font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {isProcessing ? '처리 중...' : '구매'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default RechargePage;




