import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/admin-auth.store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Route gating check
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50/50">
      {/* Mobile Sidebar Drawer overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex flex-col max-w-xs w-full bg-slate-900 h-full shadow-xl z-50">
            <Sidebar collapsed={false} setCollapsed={() => {}} closeDrawer={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
