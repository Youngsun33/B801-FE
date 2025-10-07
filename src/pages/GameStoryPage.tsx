import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getStoryNode, chooseStoryOption, enterStoryDay } from '../api/story';
import { StoryNode } from '../api/story';
import { getUserStoryAbilities, getUserStoryItems, getUserCheckpoints, loadCheckpoint, UserStoryAbility, UserStoryItem, UserCheckpoint } from '../api/inventory';

// 이미지 URL 상수
import { IMAGES } from '../constants/images';

const GameStoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [hearts, setHearts] = useState(3);
  const [mental, setMental] = useState(3);
  const [gold, setGold] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 모달/알림 상태
  const [showBackModal, setShowBackModal] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [remainingChances, setRemainingChances] = useState(3);
  
  // 인벤토리 데이터
  const [abilities, setAbilities] = useState<UserStoryAbility[]>([]);
  const [storyItems, setStoryItems] = useState<UserStoryItem[]>([]);
  const [checkpoints, setCheckpoints] = useState<UserCheckpoint[]>([]);
  const [inventoryTab, setInventoryTab] = useState<'abilities' | 'items' | 'checkpoint'>('abilities');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // 게임 오버 체크
  useEffect(() => {
    if (currentNode && (hearts <= 0 || mental <= 0)) {
      // 게임 오버 처리
      const gameOverMessage = hearts <= 0 
        ? '생명력이 모두 소진되었습니다.' 
        : '정신력이 모두 소진되었습니다.';
      
      setError(gameOverMessage);
      
      // 3초 후 SEARCH 페이지로 돌아가기
      setTimeout(() => {
        navigate('/search');
      }, 3000);
    }
  }, [hearts, mental, currentNode, navigate]);

  const initializeGame = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // 게임 시작 (1일차부터 시작) - axios 사용
      const gameStart = await enterStoryDay(1);
      console.log('게임 시작 응답:', gameStart);
      
      // startNode가 있는지 확인
      if (!gameStart.startNode || !gameStart.startNode.nodeId) {
        throw new Error('시작 노드 정보가 없습니다.');
      }
      
      // 시작 노드 로드
      const node = await getStoryNode(gameStart.startNode.nodeId);
      console.log('스토리 노드:', node);
      setCurrentNode(node);
      
      // 초기 상태 설정 (세션 데이터 사용 - 항상 HP 3, Energy 3으로 시작)
      if (node.session) {
        setHearts(node.session.hp || 3);
        setMental(node.session.energy || 3);
        setGold(node.session.gold || 0);
        console.log('세션 데이터 로드:', node.session);
      } else {
        // 세션 데이터가 없으면 기본값 (조사 시작 시 항상 3)
        setHearts(3);
        setMental(3);
        setGold(user.gold || 0);
        console.warn('세션 데이터 없음 - 기본값 사용');
      }

      // 남은 조사 기회 가져오기
      const actionPoints = await fetch('https://b801-be.azurewebsites.net/api/story/action-point', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }).then(res => res.json());
      setRemainingChances(actionPoints.current || 0);
    } catch (err: any) {
      console.error('Failed to initialize game:', err);
      console.error('에러 상세:', err.response?.data);
      setError(err.response?.data?.error || '게임 초기화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choiceId: number) => {
    if (!currentNode) return;

    console.log('선택지 클릭:', choiceId);
    setIsLoading(true);
    setError('');

    try {
      console.log('API 호출 시작...');
      const result = await chooseStoryOption({
        choiceId
      });
      console.log('API 응답:', result);

      // 세션 정보 업데이트 (백엔드에서 계산된 최신 HP/Energy 사용)
      if (result.session) {
        setHearts(result.session.hp);
        setMental(result.session.energy);
        setGold(result.session.gold);
        console.log('세션 업데이트:', result.session);
      }

      // 보상 처리 (delta 기반 - 알림용)
      if (result.delta) {
        if (result.delta.hp) {
          // HP 알림 표시
          if (result.delta.hp > 0) {
            showToast(`체력 +${result.delta.hp}`);
          } else {
            showToast(`체력 ${result.delta.hp}`);
          }
        }
        if (result.delta.energy) {
          // 정신력 알림 표시
          if (result.delta.energy > 0) {
            showToast(`정신력 +${result.delta.energy}`);
          } else {
            showToast(`정신력 ${result.delta.energy}`);
          }
        }
        if (result.delta.gold) {
          const goldChange = result.delta.gold;
          setGold(prev => Math.max(0, prev + goldChange));
          if (goldChange !== 0) {
            showToast(`돈 ${goldChange > 0 ? '+' : ''}${goldChange}`);
          }
        }
        if (result.delta.items && result.delta.items.length > 0) {
          const itemText = result.delta.items.map((item: any) => `${item.name} x${item.qty}`).join(', ');
          showToast(`아이템 획득: ${itemText}`);
          
          // 스토리 아이템 인벤토리 새로고침
          try {
            const storyItemsData = await getUserStoryItems();
            setStoryItems(storyItemsData);
          } catch (err) {
            console.error('Failed to refresh story items:', err);
          }
        }
        if (result.delta.abilities && result.delta.abilities.length > 0) {
          // 능력 획득 토스트 표시
          const abilityNames = result.delta.abilities.map(a => a.name).join(', ');
          showToast(`능력 획득: ${abilityNames}`);
          
          // 스토리 능력 인벤토리 새로고침
          try {
            const abilData = await getUserStoryAbilities();
            setAbilities(abilData);
          } catch (err) {
            console.error('Failed to refresh story abilities:', err);
          }
        }
        if (result.delta.checkpoint) {
          // 체크포인트 도달 알림 표시
          showToast(`💾 ${result.delta.checkpoint.message}`);
          
          // 체크포인트 인벤토리 새로고침
          try {
            const checkpointData = await getUserCheckpoints();
            setCheckpoints(checkpointData.checkpoints);
          } catch (err) {
            console.error('Failed to refresh checkpoints:', err);
          }
        }
        if (result.delta.ending) {
          // 엔딩 도달 알림 표시
          showToast(`🏆 ${result.delta.ending.message}`);
          
          // 체크포인트 인벤토리 새로고침 (엔딩에서도 체크포인트 저장됨)
          try {
            const checkpointData = await getUserCheckpoints();
            setCheckpoints(checkpointData.checkpoints);
          } catch (err) {
            console.error('Failed to refresh checkpoints:', err);
          }
        }
      }

      // 다음 노드 로드
      console.log('다음 노드 로드:', result.nodeId);
      const nextNode = await getStoryNode(result.nodeId);
      console.log('다음 노드:', nextNode);
      console.log('다음 노드의 선택지들:', nextNode.choices);
      if (nextNode.choices) {
        nextNode.choices.forEach((choice, index) => {
          console.log(`선택지 ${index + 1}:`, choice);
          console.log(`  - id: ${choice.id}`);
          console.log(`  - targetNodeId: ${choice.targetNodeId}`);
          console.log(`  - label: ${choice.label}`);
        });
      }
      setCurrentNode(nextNode);
    } catch (err: any) {
      console.error('선택지 처리 실패:', err);
      console.error('에러 응답:', err.response?.data);
      setError(err.response?.data?.error || '선택지 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowBackModal(true);
  };

  const handleConfirmBack = () => {
    navigate('/search');
  };

  const handleCancelBack = () => {
    setShowBackModal(false);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleInventoryClick = async () => {
    if (!showInventory) {
      // 인벤토리 열 때 데이터 새로고침
      try {
        const [abilData, itemsData, checkpointsData] = await Promise.all([
          getUserStoryAbilities(),
          getUserStoryItems(),
          getUserCheckpoints()
        ]);
        setAbilities(abilData);
        setStoryItems(itemsData);
        setCheckpoints(checkpointsData.checkpoints);
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    }
    setShowInventory(!showInventory);
  };

  const handleLoadCheckpoint = async (checkpointId: number) => {
    try {
      setIsLoading(true);
      const result = await loadCheckpoint(checkpointId);
      
      // 노드 정보가 응답에 포함되어 있으면 바로 사용
      if (result.node) {
        setCurrentNode(result.node);
      } else {
        // 없으면 다시 조회 (fallback)
        const node = await getStoryNode(result.nodeId);
        setCurrentNode(node);
      }
      
      setShowInventory(false);
      showToast('체크포인트로 이동했습니다!');
    } catch (error) {
      console.error('체크포인트 로드 실패:', error);
      showToast('체크포인트 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  if (!currentNode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">게임을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* 모바일 컨테이너 */}
      <div className="relative w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-200">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={handleBack}
            className="p-1"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* 상단 스탯 바 */}
          <div className="flex items-center gap-3">
            {/* 생명력 */}
            <div className="flex items-center gap-0.5">
              {[...Array(hearts)].map((_, i) => (
                <img
                  key={`heart-${i}`}
                  src={IMAGES.HEART}
                  alt="heart"
                  className="w-7 h-7"
                />
              ))}
            </div>

            {/* 정신력 */}
            <div className="flex items-center gap-0.5">
              {[...Array(mental)].map((_, i) => (
                <img
                  key={`mental-${i}`}
                  src={IMAGES.MENTAL}
                  alt="mental"
                  className="w-7 h-7"
                />
              ))}
            </div>

            {/* 돈 */}
            <div className="flex items-center gap-1">
              <img src={IMAGES.MONEY} alt="money" className="w-7 h-7" />
              <span className="text-base font-semibold text-gray-800 min-w-[20px]">{gold}</span>
            </div>
          </div>

          {/* 인벤토리 버튼 */}
          <button
            onClick={handleInventoryClick}
            className="p-1"
            disabled={isLoading}
          >
            <img src={IMAGES.INVENTORY} alt="inventory" className="w-6 h-6" />
          </button>
        </div>

        {/* 스토리 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col relative mt-10">
          {/* 스크롤 가능한 콘텐츠 */}
          <div className="flex-1 overflow-y-auto pb-32 pt-8">
            {/* 스토리 이미지 */}
            <div className="w-full px-6 pt-2 pb-4">
              {currentNode.nodeId === 100 ? (
                // 인트로 이미지
                <img
                  src={IMAGES.STORY_1_1}
                  alt="intro"
                  className="w-full rounded-lg"
                />
              ) : currentNode.imageUrl ? (
                // 다른 스토리 이미지
                <img
                  src={currentNode.imageUrl}
                  alt="story"
                  className="w-full rounded-lg"
                />
              ) : null}
            </div>

            {/* 스토리 텍스트 */}
            <div className="px-6 py-4">
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {currentNode.text || currentNode.description}
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              </div>
            )}

            {/* 엔딩 화면 */}
            {currentNode.isEndNode && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleGoHome}
                  className="w-full py-4 px-6 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            )}
          </div>

          {/* 하단 고정 선택지 */}
          {currentNode.choices && currentNode.choices.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 space-y-2">
              {currentNode.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => {
                    console.log('선택지 클릭:', choice);
                    console.log('targetNodeId:', choice.targetNodeId);
                    console.log('id:', choice.id);
                    console.log('targetNodeId 타입:', typeof choice.targetNodeId);
                    console.log('targetNodeId 값:', choice.targetNodeId);
                    
                    // 선택지의 실제 ID 사용
                    const choiceId = choice.id;
                    console.log('최종 choiceId:', choiceId);
                    handleChoice(choiceId);
                  }}
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-left rounded-lg bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="text-gray-800 text-sm">
                    - {choice.label}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 뒤로가기 모달 */}
        {showBackModal && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <p className="text-gray-800 text-center mb-2">나가시겠나요? 남은 기회: {remainingChances}회</p>
              <p className="text-gray-600 text-sm text-center mb-6">조사 재시작 시 처음부터 시작됩니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelBack}
                  className="flex-1 py-3 rounded-full border-2 border-gray-300 text-gray-800 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmBack}
                  className="flex-1 py-3 rounded-full border-2 border-gray-300 text-gray-800 font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 인벤토리 슬라이드업 모달 */}
        {showInventory && (
          <>
            <div 
              className="absolute inset-0 bg-black/30 z-40"
              onClick={() => setShowInventory(false)}
            />
            <div className={`absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm rounded-t-3xl z-50 transition-transform duration-300 ${showInventory ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {/* 탭 헤더 */}
                <div className="flex gap-6 mb-6 border-b border-gray-600">
                  <button 
                    onClick={() => setInventoryTab('abilities')}
                    className={`pb-3 text-base ${inventoryTab === 'abilities' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-300'}`}
                  >
                    능력
                  </button>
                  <button 
                    onClick={() => setInventoryTab('items')}
                    className={`pb-3 text-base ${inventoryTab === 'items' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-300'}`}
                  >
                    아이템
                  </button>
                  <button 
                    onClick={() => setInventoryTab('checkpoint')}
                    className={`pb-3 text-base ${inventoryTab === 'checkpoint' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-300'}`}
                  >
                    체크 포인트
                  </button>
                </div>

                {/* 능력 탭 */}
                {inventoryTab === 'abilities' && (
                  <div className="space-y-4 mb-8">
                    {abilities.length > 0 ? (
                      abilities.map(ability => (
                        <div key={ability.userStoryAbilityId} className="pb-3 border-b border-gray-700">
                          <p className="text-white text-base">
                            {ability.storyAbility.name} x {ability.quantity}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-base py-4">현재 능력이 없습니다.</div>
                    )}
                  </div>
                )}

                {/* 아이템 탭 */}
                {inventoryTab === 'items' && (
                  <div className="space-y-3 mb-8">
                    {storyItems.length > 0 ? (
                      storyItems.map(item => (
                        <div key={item.userStoryItemId} className="py-2">
                          <p className="text-white text-base">
                            {item.storyItem.name} x {item.quantity}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-base py-4">현재 아이템이 없습니다.</div>
                    )}
                  </div>
                )}

                {/* 체크포인트 탭 */}
                {inventoryTab === 'checkpoint' && (
                  <div className="space-y-3 mb-8">
                    {checkpoints.length > 0 ? (
                      <>
                        <p className="text-gray-300 text-sm mb-2">- 가능한 길</p>
                        <div className="grid grid-cols-3 gap-2">
                          {checkpoints.map(checkpoint => (
                            <button
                              key={checkpoint.id}
                              onClick={() => handleLoadCheckpoint(checkpoint.id)}
                              className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
                            >
                              {checkpoint.title}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-300 text-sm mb-2">- 가능한 길</p>
                        <p className="text-white text-base pl-4">이용 가능한 체크포인트가 없습니다.</p>
                      </div>
                    )}
                    <div className="py-4">
                      <p className="text-gray-300 text-sm mb-2">- 오픈할 길</p>
                      <p className="text-gray-400 text-sm pl-4">화살 잡은 답답으로도 없는 사치까지</p>
                    </div>
                  </div>
                )}

                {/* 닫기 버튼 */}
                <button 
                  onClick={() => setShowInventory(false)}
                  className="mt-4 w-full py-3 bg-white text-gray-900 rounded-full font-medium text-base"
                >
                  닫기
                </button>
              </div>
            </div>
          </>
        )}

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-out">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStoryPage;

