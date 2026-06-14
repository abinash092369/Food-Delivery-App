import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { RestaurantsPage } from './pages/restaurants/RestaurantsPage';
import { RestaurantDetailPage } from './pages/restaurants/RestaurantDetailPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { DriversPage } from './pages/drivers/DriversPage';
import { FraudPage } from './pages/fraud/FraudPage';
import { CouponsPage } from './pages/coupons/CouponsPage';
import { LiveOrdersPage } from './pages/live/LiveOrdersPage';
import { BroadcastPage } from './pages/notifications/BroadcastPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Admin Routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="live-orders" element={<LiveOrdersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="restaurants/:slug" element={<RestaurantDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="fraud" element={<FraudPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="broadcast" element={<BroadcastPage />} />
          </Route>

          {/* Fallback Catch All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
