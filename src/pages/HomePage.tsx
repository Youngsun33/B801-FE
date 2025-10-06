import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import Header from '@/components/layout/Header';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 (햄버거 메뉴) */}
      <Header />

      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${IMAGES.HOME})`,
          filter: 'brightness(0.95)'
        }}
      />
      
      {/* 오버레이 (이미지 위에 약간의 어두운 레이어) */}
      <div className="absolute inset-0 bg-black/20" />


    </div>
  );
};

export default HomePage;

