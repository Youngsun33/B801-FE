         import { useState, useEffect, useRef } from 'react';
         import { useNavigate } from 'react-router-dom';
         import { useAuthStore } from '@/store/authStore';

        interface UserRaidItem {
        item_name: string;
        quantity: number;
        }

        interface SearchResult {
        success: boolean;
        found: boolean;
        item: { name: string; quantity: number } | null;
        remainingSearches: number;
        }

        const RaidSearchPage = () => {
        const navigate = useNavigate();
        const { user } = useAuthStore();
        
        const [userItems, setUserItems] = useState<UserRaidItem[]>([]);
        const [remainingSearches, setRemainingSearches] = useState(25);
        const [selectedArea, setSelectedArea] = useState<number | null>(null);
        const [selectedAreaName, setSelectedAreaName] = useState('');
        const [isSearching, setIsSearching] = useState(false);
        
        // 모달 상태
         const [showBackModal, setShowBackModal] = useState(false);
         const [showInventory, setShowInventory] = useState(false);
         const [gainedItems, setGainedItems] = useState<{ name: string; quantity: number }[]>([]);
         const [showToast, setShowToast] = useState(false);
         const [toastMessage, setToastMessage] = useState('');
         
         // 지도 이미지 크기 측정을 위한 ref
         const mapImageRef = useRef<HTMLImageElement>(null);
         const [mapScale, setMapScale] = useState({ x: 1, y: 1 });

        // 지역별 이미지 URL 매핑
        const areaImageMap: { [key: string]: string } = {
            '등산로': 'https://stb801.blob.core.windows.net/images/등산로.png',
            '청계천': 'https://stb801.blob.core.windows.net/images/청계천.png',
            '번화가': 'https://stb801.blob.core.windows.net/images/번화가.png',
            '터널': 'https://stb801.blob.core.windows.net/images/터널.png',
            '슬럼가': 'https://stb801.blob.core.windows.net/images/슬럼가.png',
            '골목길': 'https://stb801.blob.core.windows.net/images/골목길.png',
            '학교': 'https://stb801.blob.core.windows.net/images/학교.png',
            '소방서': 'https://stb801.blob.core.windows.net/images/소방서.png',
            '고급주택가': 'https://stb801.blob.core.windows.net/images/고급주택가.png',
            '물류창고': 'https://stb801.blob.core.windows.net/images/물류창고.png'
        };

        // 유저 아이템 목록 로드
        const loadUserItems = async () => {
            try {
            const userId = user?.id;
            if (!userId) return;
            
            const response = await fetch('https://b801-be.azurewebsites.net/api/raid-search/user-items', {
                headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setUserItems(data);
            } else {
                const errorData = await response.json();
                console.error('API Error:', errorData);
            }
            } catch (error) {
            console.error('유저 아이템 로드 실패:', error);
            }
        };

        // 남은 검색 횟수 로드
        const loadRemainingSearches = async () => {
            try {
            const response = await fetch('https://b801-be.azurewebsites.net/api/raid-search/remaining', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setRemainingSearches(data.remainingSearches || 0);
            } else {
                console.error('검색 횟수 로드 실패:', response.status);
                setRemainingSearches(0);
            }
            } catch (error) {
            console.error('검색 횟수 로드 실패:', error);
            setRemainingSearches(0);
            }
        };

        // 지도 영역 클릭 핸들러 - 지역 상세 페이지로 이동
        const handleMapAreaClick = (areaName: string) => {
            const areaMap: { [key: string]: number } = {
            '등산로': 1,
            '청계천': 2,
            '번화가': 3,
            '터널': 4,
            '슬럼가': 5,
            '골목길': 6,
            '학교': 7,
            '소방서': 8,
            '고급주택가': 9,
            '물류창고': 10
            };
            
            const areaId = areaMap[areaName];
            if (areaId) {
            setSelectedArea(areaId);
            setSelectedAreaName(areaName);
            }
        };

        // 조사 실행
        const handleInvestigate = async () => {
            if (remainingSearches <= 0 || isSearching || !selectedArea) return;

            setIsSearching(true);
            try {
            const response = await fetch('https://b801-be.azurewebsites.net/api/raid-search/search', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ areaId: selectedArea }),
            });

            if (response.ok) {
                const result: SearchResult = await response.json();
                console.log('조사 결과:', result); // 디버깅용
                // 항상 알림창 표시 (백엔드에서 항상 아이템을 찾도록 수정됨)
                if (result.found && result.item) {
                    console.log('아이템 획득:', result.item); // 디버깅용
                    // 토스트 알람 즉시 표시
                    setToastMessage(`🎉 ${result.item.name} x${result.item.quantity} 획득!`);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000); // 3초 후 자동 사라짐
                    
                    // 모달은 표시하지 않음 (토스트로 대체)
                    setGainedItems([result.item]);
                } else {
                    // 아이템을 찾지 못한 경우에도 토스트 알람 표시
                    console.log('아이템 없음'); // 디버깅용
                    setToastMessage('🔍 아무것도 찾지 못했습니다');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000); // 3초 후 자동 사라짐
                    
                    // 모달은 표시하지 않음 (토스트로 대체)
                    setGainedItems([]);
                }
                setRemainingSearches(result.remainingSearches);
                await loadUserItems(); // 아이템 목록 새로고침
            } else {
                const error = await response.json();
                setToastMessage(`❌ ${error.message || '조사에 실패했습니다.'}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
            } catch (error) {
            console.error('조사 실패:', error);
            setToastMessage('❌ 조사 중 오류가 발생했습니다.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            } finally {
            setIsSearching(false);
            }
        };

        // 취소 - 지도로 돌아가기
        const handleCancel = () => {
            setSelectedArea(null);
            setSelectedAreaName('');
            setGainedItems([]); // 획득 아이템 초기화
        };

        // 나가기 확인
        const handleBackConfirm = () => {
            setGainedItems([]); // 획득 아이템 초기화
            navigate('/');
        };

         // 지도 이미지 크기 측정 및 스케일 계산
         const updateMapScale = () => {
             if (mapImageRef.current) {
                 const img = mapImageRef.current;
                 const originalWidth = 416.05;
                 const originalHeight = 289.23;
                 
                 setMapScale({
                     x: img.offsetWidth / originalWidth,
                     y: img.offsetHeight / originalHeight
                 });
             }
         };

         useEffect(() => {
             if (!user) {
             navigate('/login');
             return;
             }
             
             loadUserItems();
             loadRemainingSearches();
             
             // 지도 이미지 로드 후 크기 측정
             const timer = setTimeout(updateMapScale, 100);
             return () => clearTimeout(timer);
         }, [user, navigate]);

         // 윈도우 리사이즈 시 스케일 재계산
         useEffect(() => {
             const handleResize = () => {
                 updateMapScale();
             };
             
             window.addEventListener('resize', handleResize);
             return () => window.removeEventListener('resize', handleResize);
         }, []);

        // 지역 상세 화면 렌더링
        if (selectedArea && selectedAreaName) {
            return (
            <div className="min-h-screen bg-white relative overflow-hidden">
                {/* 상단 헤더 */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 safe-top">
                {/* 나가기 버튼 */}
                <button
                    onClick={() => setShowBackModal(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* 조사 기회 */}
                <div className="text-center">
                    <div className="text-sm text-gray-600">조사 가능 횟수</div>
                    <div className="text-lg font-bold text-black">{remainingSearches}</div>
                </div>

                {/* 인벤토리 버튼 */}
                <button
                    onClick={() => setShowInventory(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </button>
                </div>

                {/* 지역 제목 */}
                <div className="pt-16 pb-4">
                <h1 className="text-2xl font-bold text-center text-gray-900">{selectedAreaName}</h1>
                </div>

                {/* 지역 이미지 */}
                <div className="px-4 mb-6">
                <div className="max-w-md mx-auto">
                    <img
                    src={areaImageMap[selectedAreaName]}
                    alt={selectedAreaName}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200 "
                    onError={(e) => {
                        e.currentTarget.src = 'https://stb801.blob.core.windows.net/images/지도.png';
                    }}
                    />
                </div>
                </div>

                {/* 하단 버튼들 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
                <div className="flex gap-4">
                    <button
                    onClick={handleInvestigate}
                    disabled={remainingSearches <= 0 || isSearching}
                    className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                        remainingSearches > 0 && !isSearching
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    >
                    {isSearching ? '조사 중...' : '조사'}
                    </button>
                    <button
                    onClick={handleCancel}
                    className="flex-1 py-4 px-6 bg-gray-200 text-gray-800 rounded-lg font-bold text-lg hover:bg-gray-300 transition-colors"
                    >
                    취소
                    </button>
                </div>
                </div>
            </div>
            );
        }

        // 지도 화면 렌더링
        return (
            <div className="min-h-screen bg-white relative overflow-hidden flex flex-col">
            {/* 상단 헤더 */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 safe-top">
                {/* 나가기 버튼 */}
                <button
                onClick={() => setShowBackModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                >
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                </button>

                {/* 조사 기회 */}
                <div className="text-center">
                <div className="text-sm text-gray-600">조사 가능 횟수</div>
                <div className="text-lg font-bold text-black">{remainingSearches}</div>
                </div>

                {/* 인벤토리 버튼 */}
                <button
                onClick={() => setShowInventory(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                >
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                </button>
            </div>

             {/* 지도 영역 */}
             <div className={`transition-all duration-300 ${showInventory ? 'pt-16 pb-8' : 'flex-1 flex items-center justify-center pt-16 pb-16'}`}>
                 {/* 지도 이미지 */}
                 <div className="relative w-full">
                     <img
                         ref={mapImageRef}
                         src="https://stb801.blob.core.windows.net/images/지도.png"
                         alt="레이드서치 지도"
                         className="w-full h-auto cursor-pointer"
                         style={{ 
                         border: 'none',
                         outline: 'none',
                         boxShadow: 'none'
                         }}
                         onLoad={updateMapScale}
                        onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        // 지도 영역별 클릭 감지 (대략적인 좌표)
                        if (y < rect.height * 0.2) {
                            if (x < rect.width * 0.3) handleMapAreaClick('등산로');
                            else if (x < rect.width * 0.7) handleMapAreaClick('청계천');
                            else handleMapAreaClick('번화가');
                        } else if (y < rect.height * 0.4) {
                            if (x < rect.width * 0.3) handleMapAreaClick('터널');
                            else if (x < rect.width * 0.7) handleMapAreaClick('슬럼가');
                            else handleMapAreaClick('골목길');
                        } else if (y < rect.height * 0.6) {
                            if (x < rect.width * 0.3) handleMapAreaClick('학교');
                            else if (x < rect.width * 0.7) handleMapAreaClick('소방서');
                            else handleMapAreaClick('고급주택가');
                        } else {
                            if (x > rect.width * 0.8) handleMapAreaClick('물류창고');
                        }
                        }}
                    />
                    
                    {/* 지역명 오버레이 */}
                    <div className="absolute inset-0 pointer-events-none">
                         {/* 등산로 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((63 * 1.327) - 20) * mapScale.y}px`, left: `${((189 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('등산로')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            등산로
                        </button>
                        </div>
                        
                         {/* 청계천 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((85 * 1.327) - 20) * mapScale.y}px`, left: `${((136 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('청계천')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            청계천
                        </button>
                        </div>
                        
                         {/* 번화가 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((132 * 1.327) - 20) * mapScale.y}px`, left: `${((161 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('번화가')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            번화가
                        </button>
                        </div>
                        
                         {/* 터널 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((89 * 1.327) - 20) * mapScale.y}px`, left: `${((233 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('터널')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            터널
                        </button>
                        </div>
                        
                         {/* 골목길 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((116 * 1.327) - 20) * mapScale.y}px`, left: `${((53 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('골목길')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            골목길
                        </button>
                        </div>
                        
                         {/* 슬럼가 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((123 * 1.327) - 20) * mapScale.y}px`, left: `${((233 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('슬럼가')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            슬럼가
                        </button>
                        </div>
                        
                         {/* 학교 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((172 * 1.327) - 20) * mapScale.y}px`, left: `${((120 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('학교')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            학교
                        </button>
                        </div>
                        
                         {/* 소방서 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((172 * 1.327) - 20) * mapScale.y}px`, left: `${((179 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('소방서')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            소방서
                        </button>
                        </div>
                        
                         {/* 고급주택가 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((163 * 1.327) - 20) * mapScale.y}px`, left: `${((249 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('고급주택가')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            고급주택가
                        </button>
                        </div>
                        
                         {/* 물류창고 */}
                         <div className="absolute text-center pointer-events-auto" style={{ top: `${((119 * 1.327) - 20) * mapScale.y}px`, left: `${((286 * 1.325) - 30) * mapScale.x}px` }}>
                        <button 
                            onClick={() => handleMapAreaClick('물류창고')}
                            className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            물류창고
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 나가기 확인 모달 */}
            {showBackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                    <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-2">나가시겠습니까?</div>
                    <div className="text-sm text-gray-600 mb-6">
                        레이드서치를 종료하고 홈으로 돌아갑니다.
                    </div>
                    <div className="flex gap-3">
                        <button
                        onClick={() => setShowBackModal(false)}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                        취소
                        </button>
                        <button
                        onClick={handleBackConfirm}
                        className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                        나가기
                        </button>
                    </div>
                    </div>
                </div>
                </div>
            )}

            {/* 인벤토리 슬라이드업 모달 */}
            {showInventory && (
                <>
                <div 
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setShowInventory(false)}
                />
                <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm rounded-t-3xl z-50 transition-transform duration-300">
                    <div className="p-6 max-h-[75vh] overflow-y-auto">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">레이드 아이템</h3>
                        <button
                        onClick={() => setShowInventory(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700"
                        >
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>
                    
                    {/* 아이템 목록 */}
                    <div className="space-y-3">
                        {userItems.length > 0 ? (
                        userItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-700 rounded-lg p-4">
                            <span className="font-medium text-white">{item.item_name}</span>
                            <span className="font-bold text-yellow-400">x {item.quantity}</span>
                            </div>
                        ))
                        ) : (
                        <div className="text-center text-gray-400 py-12">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-lg">아직 획득한 아이템이 없습니다</p>
                            <p className="text-sm mt-2">지역을 탐색해서 아이템을 수집해보세요!</p>
                        </div>
                        )}
                    </div>
                    </div>
                </div>
                </>
            )}


            {/* 토스트 알람 */}
            {showToast && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-black text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">{toastMessage}</span>
                        </div>
                    </div>
                </div>
            )}
            </div>
        );
        };

        export default RaidSearchPage;
