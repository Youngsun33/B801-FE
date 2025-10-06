import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';
import { register } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({ username, password });
      
      // Zustand 스토어에 인증 정보 저장
      setAuth(response.accessToken, response.refreshToken, response.user);
      
      // 홈으로 이동
      navigate('/');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
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
      
      {/* 회원가입 컨텐츠 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* 로고/타이틀 */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-white tracking-wider drop-shadow-2xl mb-2">
              B801
            </h1>
            <p className="text-sm text-white/80 font-medium">
              새로운 계정을 만들어 시작하세요
            </p>
          </div>

          {/* 회원가입 폼 카드 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleRegister} className="space-y-6">
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
                  minLength={3}
                />
                <p className="mt-1 text-xs text-gray-500">최소 3자 이상</p>
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
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">최소 6자 이상</p>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="input-field"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>

            {/* 하단 링크 */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                이미 계정이 있으신가요? <span className="text-primary-600">로그인</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← 홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

