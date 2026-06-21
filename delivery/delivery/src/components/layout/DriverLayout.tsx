import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import BottomNav from './BottomNav';
import { useAssignment } from '../../hooks/useAssignment';
import { useDriverLocation } from '../../hooks/useDriverLocation';

export const DriverLayout: React.FC = () => {
  const { accessToken } = useDriverAuthStore();

  // If not logged in, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Initialize background tasks: polling, websocket, and geolocation watch
  return <DriverLayoutInner />;
};

const DriverLayoutInner: React.FC = () => {
  // Start background location broadcast
  useDriverLocation();
  // Start background assignment polling/websocket subscription
  useAssignment();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[520px] bg-white min-h-screen shadow-xl flex flex-col pb-20 relative">
        <main className="flex-1 w-full overflow-y-auto px-4 py-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default DriverLayout;
