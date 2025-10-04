import apiClient from './axios';

// 인증 관련 타입 정의
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    hp: number;
    energy: number;
    gold: number;
    attack_power: number;
    current_day: number;
    is_alive: boolean;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

// 회원가입
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('http://localhost:5000/api/auth/register', data);
  return response.data;
};

// 로그인
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('http://localhost:5000/api/auth/login', data);
  return response.data;
};

// 토큰 갱신
export const refreshToken = async (): Promise<RefreshResponse> => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await apiClient.post<RefreshResponse>(
    'http://localhost:5000/api/auth/refresh',
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    }
  );
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken');
  await apiClient.post('http://localhost:5000/api/auth/logout', { refreshToken });
  
  // 로컬 스토리지에서 토큰 제거
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

