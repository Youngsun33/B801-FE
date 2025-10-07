import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/authStore';
import { getActionPointStatus } from '@/api/story';
import { getInventory, getUserAbilities, getUserCheckpoints } from '@/api/inventory';
import type { InventoryItem, UserAbility, Checkpoint } from '@/api/inventory';

interface UserInventory {
  abilities: UserAbility[];
  items: InventoryItem[];
  checkpoints: Checkpoint[];
  actionPoints: {
    current: number;
    max: number;
    nextRechargeAt: string | null;
  };
}

const MyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError('');

        // 병렬로 데이터 가져오기
        const [actionPointsData, inventoryData, abilitiesData, checkpointsData] = await Promise.all([
          getActionPointStatus(),
          getInventory(),
          getUserAbilities(),
          getUserCheckpoints()
        ]);

        const userInventory: UserInventory = {
          abilities: abilitiesData.abilities,
          items: inventoryData.inventory,
          checkpoints: checkpointsData.checkpoints,
          actionPoints: actionPointsData
        };

        setInventory(userInventory);
      } catch (err: any) {
        console.error('Failed to fetch inventory:', err);
        setError('인벤토리 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const handleBack = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-center">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <Header />

      {/* 배경 이미지 */}
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
            MY
          </h1>
          <div className="w-full h-px bg-white/40" />
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-20 flex-1 px-4 pb-12 pt-6">
        <div className="w-full max-w-md mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-300 text-sm">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          ) : inventory ? (
            <div className="space-y-6">
              {/* 유저 기본 정보 */}
              <div 
                className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'rgba(40, 40, 40, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="px-6 py-4">
                  <h2 className="text-white text-lg font-medium mb-3">캐릭터 정보</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>이름:</span>
                      <span className="text-white">{user.username}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>HP:</span>
                      <span className="text-white">{user.hp}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>에너지:</span>
                      <span className="text-white">{user.energy}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>골드:</span>
                      <span className="text-white">{user.gold}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>공격력:</span>
                      <span className="text-white">{user.attack_power}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>현재 일차:</span>
                      <span className="text-white">{user.current_day}일차</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 조사 기회 */}
              <div 
                className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'rgba(40, 40, 40, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="px-6 py-4">
                  <h2 className="text-white text-lg font-medium mb-3">조사 기회</h2>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-2">
                      남은 기회: <span className={`font-semibold ${inventory.actionPoints.current > 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {inventory.actionPoints.current} / {inventory.actionPoints.max}회
                      </span>
                    </p>
                    {inventory.actionPoints.nextRechargeAt && (
                      <p className="text-gray-500 text-xs">
                        다음 충전: {new Date(inventory.actionPoints.nextRechargeAt).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 능력 */}
              <div 
                className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'rgba(40, 40, 40, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="px-6 py-4">
                  <h2 className="text-white text-lg font-medium mb-3">능력</h2>
                  <div className="space-y-3">
                    {inventory.abilities.map((ability) => (
                      <div key={ability.userAbilityId} className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-medium">{ability.ability.name}</p>
                          <p className="text-gray-400 text-xs">{ability.ability.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${ability.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                            {ability.isActive ? '활성' : '비활성'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 아이템 */}
              <div 
                className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'rgba(40, 40, 40, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="px-6 py-4">
                  <h2 className="text-white text-lg font-medium mb-3">아이템</h2>
                  <div className="space-y-3">
                    {inventory.items.map((item) => (
                      <div key={item.inventoryId} className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-medium">{item.item.name}</p>
                          <p className="text-gray-400 text-xs">{item.item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-300 text-sm">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 체크포인트 */}
              <div 
                className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'rgba(40, 40, 40, 0.85)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="px-6 py-4">
                  <h2 className="text-white text-lg font-medium mb-3">체크포인트</h2>
                  <div className="space-y-3">
                    {inventory.checkpoints.map((checkpoint) => (
                      <div key={checkpoint.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-medium">{checkpoint.title}</p>
                          <p className="text-gray-400 text-xs">노드 {checkpoint.nodeId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-300 text-xs">
                            {new Date(checkpoint.savedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
