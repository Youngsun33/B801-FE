import apiClient from './axios';

// 스토리 관련 타입 정의
export interface ActionPointStatus {
  current: number;
  max: number;
  nextRechargeAt: string | null;
}

export interface StoryProgress {
  id: number;
  user_id: number;
  day: number;
  current_node_id: number;
  visited_nodes: number[];
  collected_items: number[];
  last_saved_at: string;
}

export interface StoryNode {
  nodeId: number;
  text: string;
  description?: string; // text를 description으로도 사용 가능
  imageUrl?: string;
  choices?: Array<{
    id: number;
    label: string;
    requiresItemId?: number;
  }>;
  rewards?: {
    items?: Array<{ itemId: number; quantity: number }>;
    gold?: number;
    hp?: number;
    energy?: number;
    abilities?: Array<{ abilityId: number }>;
  };
  isEndNode?: boolean;
}

export interface ChoiceResult {
  nodeId: number;
  delta?: {
    hp?: number;
    energy?: number;
    gold?: number;
    items?: Array<{ itemId: number; name: string; qty: number }>;
    abilities?: Array<{ abilityId: number; name: string }>;
  };
  investigation_count?: number;
}

// 액션 포인트 상태 조회
export const getActionPointStatus = async (): Promise<ActionPointStatus> => {
  const response = await apiClient.get<ActionPointStatus>('http://localhost:5000/api/story/action-point');
  return response.data;
};

// 스토리 진행 상황 조회
export const getStoryProgress = async (day?: number): Promise<StoryProgress> => {
  const params = day ? { day } : {};
  const response = await apiClient.get<StoryProgress>('http://localhost:5000/api/story/progress', { params });
  return response.data;
};

// 특정 스토리 노드 조회
export const getStoryNode = async (nodeId: number): Promise<StoryNode> => {
  const response = await apiClient.get<StoryNode>(`http://localhost:5000/api/story/nodes/${nodeId}`);
  return response.data;
};

// 선택지 선택
export const chooseStoryOption = async (data: {
  choiceId: number;
}): Promise<ChoiceResult> => {
  const response = await apiClient.post<ChoiceResult>('http://localhost:5000/api/story/choose', data);
  return response.data;
};

// 스토리 오토세이브
export const autosaveStory = async (data: {
  day: number;
  currentNodeId: number;
  visitedNodes: number[];
  collectedItems: number[];
}): Promise<void> => {
  await apiClient.post('http://localhost:5000/api/story/autosave', data);
};

// 특정 일차 스토리 입장
export const enterStoryDay = async (day: number): Promise<{
  progress: StoryProgress;
  startNode: StoryNode;
  actionPointsRemaining: number;
}> => {
  const response = await apiClient.post(`http://localhost:5000/api/story/day/${day}/enter`);
  return response.data;
};

