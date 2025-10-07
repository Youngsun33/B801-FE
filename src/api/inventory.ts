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