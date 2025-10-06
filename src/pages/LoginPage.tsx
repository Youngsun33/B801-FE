import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login({ username, password });
      
      // Zustand 스토어에 인증 정보 저장
      setAuth(response.accessToken, response.refreshToken, response.user);
      
      // 관리자인지 확인하고 적절한 페이지로 이동
      const isAdmin = ['admin', 'administrator', 'root'].includes(username.toLowerCase());
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <Header />

      {/* 배경 이미지 - 더 어둡고 흐리게 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${IMAGES.HOME})`,
          filter: 'brightness(0.4) blur(2px)'
        }}
      />
      
      {/* 오버레이 - 더 진하게 */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* 로그인 컨텐츠 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* 로고/타이틀 */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-white tracking-wider drop-shadow-2xl mb-2">
              B801
            </h1>
            <p className="text-sm text-white/80 font-medium">
              로그인하여 게임을 시작하세요
            </p>
          </div>

          {/* 로그인 폼 카드 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 아이디 입력 */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  아이디
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="아이디를 입력하세요"
                  required
                  autoFocus
                />
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 하단 링크 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← 홈으로 돌아가기
              </button>
              <p className="text-xs text-gray-400 text-center mt-4">
                계정은 관리자를 통해 발급받을 수 있습니다.
              </p>
            </div>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

