import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Menu as MenuIcon, 
  Settings, 
  TrendingUp, 
  MessageSquare, 
  Tag, 
  LogOut 
} from 'lucide-react';
import { useVendorAuthStore } from '../store/vendor-auth.store';
import { getLocalImage } from '../utils/imageFallback';

interface SidebarProps {
  closeDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ closeDrawer }) => {
  const logout = useVendorAuthStore((state) => state.logout);
  const restaurant = useVendorAuthStore((state) => state.restaurant);
  const user = useVendorAuthStore((state) => state.user);

  const displayName =
    restaurant?.name ||
    user?.restaurantName ||
    user?.name ||
    user?.email ||
    "Vendor";

  const initial = displayName?.charAt(0)?.toUpperCase() || "V";

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/menu', label: 'Menu Catalog', icon: MenuIcon },
    { to: '/promotions', label: 'Promotions', icon: Tag },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/reviews', label: 'Customer Reviews', icon: MessageSquare },
    { to: '/settings', label: 'Restaurant Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    closeDrawer?.();
  };

  return (
    <aside className="w-64 bg-surface border-r border-gray-100 flex flex-col justify-between h-full lg:h-screen sticky top-0">
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md shadow-primary/20">
              é
            </div>
            <div>
              <h1 className="text-base font-bold text-textMain leading-tight">éets Vendor</h1>
              <p className="text-xs text-mutedColor">Restaurant Portal</p>
            </div>
          </div>
          {closeDrawer && (
            <button
              onClick={closeDrawer}
              type="button"
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Restaurant Mini Card */}
        {(restaurant || user) && (
          <div className="p-4 mx-4 my-4 bg-gray-50 rounded-xl flex items-center gap-3">
            {restaurant?.logoUrl ? (
              <img 
                src={getLocalImage(restaurant.logoUrl)} 
                alt="Logo" 
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary font-bold">
                {initial}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-textMain truncate">
                {restaurant?.name || user?.restaurantName || user?.name || "Your Restaurant"}
              </h4>
              <p className="text-[10px] text-mutedColor truncate">{restaurant?.city || "Vendor"}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => closeDrawer?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-mutedColor hover:text-textMain hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5 stroke-[2]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 stroke-[2]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
