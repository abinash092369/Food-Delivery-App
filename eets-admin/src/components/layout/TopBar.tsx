import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/admin-auth.store';
import { useLocation } from 'react-router-dom';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // Helper to format the path to a page title
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 leading-none">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-500 font-medium leading-none">{user.email}</p>
            </div>
          </div>
        )}

        <div className="h-5 w-px bg-gray-200"></div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
