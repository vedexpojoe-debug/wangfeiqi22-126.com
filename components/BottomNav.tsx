
import React from 'react';
import { Store, LayoutDashboard, UserCircle, Briefcase, Landmark } from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 'MARKET' | 'DASHBOARD' | 'PROFILE';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  userRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, userRole }) => {
  
  // 根据角色动态定义主色调
  const getThemeColor = () => {
    switch (userRole) {
      case UserRole.GOVERNMENT: return 'red-700';
      case UserRole.PROPERTY: return 'indigo-600';
      case UserRole.FLEET: return 'cyan-700';
      case UserRole.DRIVER: return 'blue-600';
      case UserRole.DISPOSAL: return 'orange-600';
      case UserRole.ENTERPRISE: return 'slate-800';
      case UserRole.WORKER: return 'yellow-600';
      default: return 'emerald-600';
    }
  };

  const themeColor = getThemeColor();

  const getDashboardLabel = () => {
      switch(userRole) {
          case UserRole.CLIENT: return "首页";
          case UserRole.DRIVER: return "接单";
          case UserRole.PROPERTY: return "管理";
          case UserRole.GOVERNMENT: return "大屏";
          default: return "工作台";
      }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      
      <NavButton 
        isActive={currentTab === 'MARKET'} 
        onClick={() => onTabChange('MARKET')} 
        icon={<Store size={22} />} 
        label="资源集市" 
        activeColor={themeColor}
      />

      <div className="relative -top-5">
         <button 
            onClick={() => onTabChange('DASHBOARD')}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white transition-all active:scale-90 bg-${themeColor} text-white`}
         >
            <LayoutDashboard size={24} />
            <span className="text-[10px] mt-0.5 font-bold">{getDashboardLabel()}</span>
         </button>
      </div>

      <NavButton 
        isActive={currentTab === 'PROFILE'} 
        onClick={() => onTabChange('PROFILE')} 
        icon={<UserCircle size={22} />} 
        label="我的/设置" 
        activeColor={themeColor}
      />
      
    </div>
  );
};

const NavButton = ({ isActive, onClick, icon, label, activeColor }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string, activeColor: string }) => {
   return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 transition-all ${
          isActive ? `text-${activeColor}` : 'text-gray-400 hover:text-gray-500'
        }`}
      >
        <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
            {icon}
        </div>
        <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      </button>
   );
};
