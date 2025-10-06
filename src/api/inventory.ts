import axios from 'axios';

const API_BASE_URL = 'https://b801-be.azurewebsites.net/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Authorization 헤더 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 인벤토리 타입 정의 (백엔드 응답 형식에 맞춤)
export interface InventoryItem {
  inventoryId: number;
  quantity: number;
  item: {
    id: number;
    name: string;
    description: string;
    type: string;
  };
}

// 스토리용 능력 (관찰력, 근력 등)
export interface UserStoryAbility {
  userStoryAbilityId: number;
  quantity: number;
  obtainedAt: string;
  storyAbility: {
    id: number;
    name: string;
    description: string;
  };
}

// 스토리용 아이템 (진통제, 붕대 등)
export interface UserStoryItem {
  userStoryItemId: number;
  quantity: number;
  obtainedAt: string;
  storyItem: {
    id: number;
    name: string;
    description: string;
  };
}

// 레이드용 능력 (전기 조작, 염력 등)
export interface UserAbility {
  userAbilityId: number;
  isActive: boolean;
  obtainedAt: string;
  ability: {
    id: number;
    name: string;
    description: string;
    effect_type: string;
    effect_value: number;
  };
}

// 인벤토리 조회
export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await apiClient.get('/inventory');
  return response.data.inventory || [];
};

// 스토리 능력 조회
export const getUserStoryAbilities = async (): Promise<UserStoryAbility[]> => {
  const response = await apiClient.get('/story-abilities');
  return response.data.storyAbilities || [];
};

// 스토리 아이템 조회
export const getUserStoryItems = async (): Promise<UserStoryItem[]> => {
  const response = await apiClient.get('/story-items');
  return response.data.storyItems || [];
};

// 체크포인트 인터페이스
export interface UserCheckpoint {
  id: number;
  nodeId: number;
  title: string;
  description: string | null;
  hp: number;
  energy: number;
  gold: number;
  savedAt: string;
}

// 체크포인트 조회
export const getUserCheckpoints = async (): Promise<UserCheckpoint[]> => {
  const response = await apiClient.get('/checkpoints');
  return response.data.checkpoints || [];
};

// 체크포인트 로드
export const loadCheckpoint = async (checkpointId: number) => {
  const response = await apiClient.post('/checkpoints/load', { checkpointId });
  return response.data;
};

// 레이드 능력 조회
export const getUserAbilities = async (): Promise<UserAbility[]> => {
  const response = await apiClient.get('/abilities');
  return response.data.abilities || [];
};

// 레이드 능력 활성화/비활성화
export const toggleAbility = async (abilityId: number): Promise<void> => {
  await apiClient.post('/abilities/toggle', { abilityId });
};

