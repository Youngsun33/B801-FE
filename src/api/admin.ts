import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 모든 유저 목록 조회
export const getAllUsers = async () => {
  const response = await adminApi.get('/users');
  return response.data;
};

// 특정 유저 상세 정보 조회
export const getUserDetail = async (userId: number) => {
  const response = await adminApi.get(`/users/${userId}`);
  return response.data;
};

// 유저 정보 수정
export const updateUser = async (userId: number, data: any) => {
  const response = await adminApi.put(`/users/${userId}`, data);
  return response.data;
};

// 유저 아이템 추가
export const addUserItem = async (userId: number, itemId: number, quantity: number) => {
  const response = await adminApi.post(`/users/${userId}/items`, {
    item_id: itemId,
    quantity: quantity,
  });
  return response.data;
};

// 유저 아이템 삭제
export const deleteUserItem = async (inventoryId: number) => {
  const response = await adminApi.delete(`/users/items/${inventoryId}`);
  return response.data;
};

// 유저 능력 추가
export const addUserAbility = async (userId: number, abilityId: number, quantity: number) => {
  const response = await adminApi.post(`/users/${userId}/abilities`, {
    story_ability_id: abilityId,
    quantity: quantity,
  });
  return response.data;
};

// 유저 능력 삭제
export const deleteUserAbility = async (abilityId: number) => {
  const response = await adminApi.delete(`/users/abilities/${abilityId}`);
  return response.data;
};

// 유저 체크포인트 삭제
export const deleteUserCheckpoint = async (checkpointId: number) => {
  const response = await adminApi.delete(`/users/checkpoints/${checkpointId}`);
  return response.data;
};

// 관리자 통계 조회
export const getAdminStats = async () => {
  const response = await adminApi.get('/stats');
  return response.data;
};

