import { Home, Users, Mic, Clock, LayoutGrid } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomTabBarProps {
  onRecord: () => void;
}

const AVATAR_COLORS = ["#4F46E5", "#0EA5E9", "#8B5CF6", "#06B6D4", "#6366F1", "#3B82F6"];

const BottomTabBar = ({ onRecord }: BottomTabBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'People', path: '/people' },
    { icon: null, label: 'Record', path: null }, // center placeholder
    { icon: Clock, label: 'Timeline', path: '/timeline' },
    { icon: LayoutGrid, label: 'More', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-end justify-around px-2 h-16">
        {tabs.map((tab, i) => {
          if (tab.label === 'Record') {
            return (
              <button
                key="record"
                onClick={onRecord}
                className="relative -mt-6 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                style={{
                  boxShadow: '0 4px 24px rgba(79,70,229,0.5), 0 0 0 5px white',
                }}
                aria-label="Record memory"
              >
                <Mic className="w-7 h-7" />
              </button>
            );
          }

          const Icon = tab.icon!;
          const isActive = tab.path === '/' ? path === '/' : path.startsWith(tab.path!);

          return (
            <button
              key={tab.label}
              onClick={() => tab.path && navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export { AVATAR_COLORS };
export default BottomTabBar;
