import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, IndianRupee, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/history', label: 'History', icon: History },
    { to: '/earnings', label: 'Earnings', icon: IndianRupee },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="flex h-full max-w-lg mx-auto justify-around items-center">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-w-[48px] min-h-[48px] transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
