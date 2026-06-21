import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DriverLayout from './components/layout/DriverLayout';
import HomePage from './pages/home/HomePage';
import OtpLoginPage from './pages/auth/OtpLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AssignmentAlertPage from './pages/assignment/AssignmentAlertPage';
import ActiveDeliveryPage from './pages/assignment/ActiveDeliveryPage';
import DeliveryHistoryPage from './pages/history/DeliveryHistoryPage';
import EarningsPage from './pages/earnings/EarningsPage';
import ProfilePage from './pages/profile/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<OtpLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Driver layout */}
          <Route element={<DriverLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/assignment/alert" element={<AssignmentAlertPage />} />
            <Route path="/assignment/active" element={<ActiveDeliveryPage />} />
            <Route path="/history" element={<DeliveryHistoryPage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
