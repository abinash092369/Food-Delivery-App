import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { adminAnalyticsApi } from '../../api/admin-analytics.api';
import { adminOrdersApi } from '../../api/admin-orders.api';
import { adminRestaurantsApi } from '../../api/admin-restaurants.api';
import { adminFraudApi } from '../../api/admin-fraud.api';
import { StatCard } from '../../components/shared/StatCard';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { OrdersChart } from '../../components/charts/OrdersChart';
import { UsersChart } from '../../components/charts/UsersChart';
import { HeatmapGrid } from '../../components/charts/HeatmapGrid';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Utensils,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { OrderResponse } from '../../types/admin.types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState<number>(30);

  // 1. Fetch Dashboard metrics (today values & active counts)
  const { data: dashboardMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: adminAnalyticsApi.getDashboardMetrics,
  });

  // 2. Fetch Revenue analytics
  const { data: revenueAnalytics, isLoading: loadingRevenue } = useQuery({
    queryKey: ['admin-revenue-analytics', days],
    queryFn: () => adminAnalyticsApi.getRevenueAnalytics(days),
  });

  // 3. Fetch Orders analytics
  const { data: ordersAnalytics, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders-analytics', days],
    queryFn: () => adminAnalyticsApi.getOrderAnalytics(days),
  });

  // 4. Fetch Users analytics
  const { data: usersAnalytics, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-analytics', days],
    queryFn: () => adminAnalyticsApi.getUserAnalytics(days),
  });

  // 5. Fetch Heatmap
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['admin-heatmap'],
    queryFn: adminAnalyticsApi.getHeatmap,
  });

  // 6. Fetch Pending restaurants count
  const { data: pendingRestaurants, isLoading: loadingPendingRestaurants } = useQuery({
    queryKey: ['admin-restaurants-pending'],
    queryFn: adminRestaurantsApi.getPendingRestaurants,
  });

  // 7. Fetch Fraud alerts count
  const { data: fraudStats, isLoading: loadingFraudStats } = useQuery({
    queryKey: ['admin-fraud-stats'],
    queryFn: adminFraudApi.getStats,
  });

  // 8. Fetch Recent orders (last 10)
  const { data: recentOrdersData, isLoading: loadingRecentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => adminOrdersApi.getOrders(0, 10),
  });

  const recentOrders = recentOrdersData?.data?.content || [];

  // Table Columns
  const columns: Column<OrderResponse>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (row) => <span className="font-semibold text-gray-900">{row.orderNumber}</span>,
    },
    {
      key: 'restaurantName',
      label: 'Restaurant',
      render: (row) => <span className="text-gray-600">{row.restaurantName}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row) => <span className="font-semibold text-gray-900">₹{row.totalAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Analytics Overview</h2>
          <p className="text-sm text-gray-500 font-medium">Real-time statistics and delivery performance</p>
        </div>

        {/* Range Picker */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-100 shadow-sm shrink-0 self-start sm:self-auto">
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setDays(item.val)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                days === item.val
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={revenueAnalytics?.data ? `₹${revenueAnalytics.data.totalRevenue.toLocaleString('en-IN')}` : '₹0'}
          icon={IndianRupee}
          description={dashboardMetrics?.data ? `₹${dashboardMetrics.data.revenueToday.toLocaleString('en-IN')} revenue today` : ''}
          loading={loadingRevenue || loadingMetrics}
          iconColorClass="text-teal-600 bg-teal-50"
        />
        <StatCard
          title="Total Orders"
          value={ordersAnalytics?.data ? ordersAnalytics.data.totalOrders.toLocaleString('en-IN') : '0'}
          icon={ShoppingBag}
          description={dashboardMetrics?.data ? `${dashboardMetrics.data.ordersToday} orders placed today` : ''}
          loading={loadingOrders || loadingMetrics}
          iconColorClass="text-sky-600 bg-sky-50"
        />
        <StatCard
          title="Total Users"
          value={usersAnalytics?.data ? usersAnalytics.data.totalUsers.toLocaleString('en-IN') : '0'}
          icon={Users}
          description={dashboardMetrics?.data ? `+${dashboardMetrics.data.newUsersToday} new registrations today` : ''}
          loading={loadingUsers || loadingMetrics}
          iconColorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Active Restaurants"
          value={dashboardMetrics?.data ? dashboardMetrics.data.activeRestaurants : '0'}
          icon={Utensils}
          description={dashboardMetrics?.data ? `${dashboardMetrics.data.activeDrivers} active delivery partners online` : ''}
          loading={loadingMetrics}
          iconColorClass="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Quick Action Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pending Restaurant Approvals Alert */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100/80 text-amber-800 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Restaurant Approvals</h4>
              <p className="text-xs font-semibold text-amber-800 mt-0.5">
                {pendingRestaurants?.data?.length || 0} applications awaiting verification
              </p>
            </div>
          </div>
          <Link
            to="/restaurants"
            className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review Now
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Open Fraud Alerts */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100/80 text-rose-800 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Fraud Alerts</h4>
              <p className="text-xs font-semibold text-rose-800 mt-0.5">
                {fraudStats?.data ? String(fraudStats.data.totalOpenFlags || 0) : '0'} open flags require inspection
              </p>
            </div>
          </div>
          <Link
            to="/fraud"
            className="flex items-center gap-1 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            Inspect Flags
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueAnalytics?.data?.dailySeries || []} loading={loadingRevenue} />
        <OrdersChart data={ordersAnalytics?.data?.dailySeries || []} loading={loadingOrders} />
        <UsersChart data={usersAnalytics?.data?.dailyNewUsers || []} loading={loadingUsers} />
        <HeatmapGrid data={heatmapData?.data || []} loading={loadingHeatmap} />
      </div>

      {/* Recent Orders Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Order Activity</h3>
            <p className="text-xs text-gray-500 font-medium">Review the last 10 customer food orders</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
          >
            View All Orders
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={recentOrders}
          loading={loadingRecentOrders}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
          emptyMessage="No recent orders found"
        />
      </div>
    </div>
  );
};
export default DashboardPage;
