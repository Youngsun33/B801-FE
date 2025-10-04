import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="mobile-container">
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;

