import apiClient from './axios';

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

export interface Checkpoint {
  id: number;
  nodeId: number;
  title: string;
  description: string;
  hp: number;
  energy: number;
  gold: number;
  savedAt: string;
}

// GameStoryPage에서 사용하는 타입들
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

export interface UserCheckpoint {
  id: number;
  nodeId: number;
  title: string;
  description: string;
  hp: number;
  energy: number;
  gold: number;
  savedAt: string;
}

// 인벤토리 조회
export const getInventory = async (type?: 'story' | 'raid'): Promise<{ inventory: InventoryItem[] }> => {
  const params = type ? { type } : {};
  const response = await apiClient.get('/inventory', { params });
  return response.data;
};

// 사용자 능력 조회
export const getUserAbilities = async (): Promise<{ abilities: UserAbility[] }> => {
  const response = await apiClient.get('/abilities');
  return response.data;
};

// 체크포인트 조회
export const getUserCheckpoints = async (): Promise<{ checkpoints: Checkpoint[] }> => {
  const response = await apiClient.get('/checkpoints');
  return response.data;
};

// GameStoryPage에서 사용하는 함수들
export const getUserStoryAbilities = async (): Promise<UserStoryAbility[]> => {
  const response = await apiClient.get('/story-abilities');
  return response.data.storyAbilities;
};

export const getUserStoryItems = async (): Promise<UserStoryItem[]> => {
  const response = await apiClient.get('/story-items');
  return response.data.storyItems;
};

export const loadCheckpoint = async (checkpointId: number): Promise<any> => {
  const response = await apiClient.post('/checkpoints/load', { checkpointId });
  return response.data;
};