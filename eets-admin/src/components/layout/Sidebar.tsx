import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  ShoppingBag,
  Utensils,
  Users,
  Truck,
  ShieldAlert,
  BadgePercent,
  Send,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  closeDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, closeDrawer }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Orders', path: '/live-orders', icon: Radio },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Restaurants', path: '/restaurants', icon: Utensils },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Drivers', path: '/drivers', icon: Truck },
    { name: 'Fraud Alerts', path: '/fraud', icon: ShieldAlert },
    { name: 'Coupons', path: '/coupons', icon: BadgePercent },
    { name: 'Broadcast', path: '/broadcast', icon: Send },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen z-10`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-wider flex items-center gap-2">
            <span className="bg-teal-600 p-1.5 rounded-lg text-white text-xs">EETS</span>
            Admin Panel
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {closeDrawer && (
            <button
              onClick={closeDrawer}
              type="button"
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
          {!closeDrawer && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mx-auto"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => closeDrawer?.()}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/10'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.name}</span>}
            {collapsed && (
              <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
