import axios from 'axios';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://b801-be.azurewebsites.net/api' // 프로덕션: Azure 백엔드
    : 'http://localhost:8080/api', // 개발: 로컬 백엔드
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Access Token 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // Refresh Token이 없으면 로그인 페이지로
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Refresh Token으로 새로운 Access Token 발급
        const response = await axios.post('/api/auth/refresh', {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const { accessToken: newAccessToken } = response.data;
        localStorage.setItem('accessToken', newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

