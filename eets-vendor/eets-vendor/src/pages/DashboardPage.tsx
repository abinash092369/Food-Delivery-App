import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorAnalyticsApi } from '../api/vendor-analytics.api';
import { vendorOrdersApi } from '../api/vendor-orders.api';
import { EarningsChart } from '../components/EarningsChart';
import { 
  DollarSign, 
  ShoppingBag, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  Plus, 
  Clock, 
  ChefHat, 
  Utensils,
  Loader2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  // Fetch earnings analytics (30 days)
  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['vendor-analytics-30d'],
    queryFn: () => vendorAnalyticsApi.getEarnings(30),
  });

  // Fetch recent orders
  const { data: ordersRes, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['vendor-recent-orders'],
    queryFn: () => vendorOrdersApi.getOrders(0, 10),
    refetchInterval: 15000, // Poll orders every 15s
  });

  const analytics = analyticsRes?.data;
  const recentOrders = ordersRes?.data?.content || [];
  const activeOrdersCount = recentOrders.filter(
    (order) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status)
  ).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statCards = [
    {
      title: 'Net Earnings',
      value: analytics ? formatCurrency(analytics.netEarnings) : '₹0',
      description: 'Last 30 days net revenue',
      icon: DollarSign,
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50/50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total Orders',
      value: analytics ? analytics.totalOrders : 0,
      description: 'Orders fulfilled (30 days)',
      icon: ShoppingBag,
      color: 'bg-primary',
      lightBg: 'bg-primary-light/50',
      textColor: 'text-primary',
    },
    {
      title: 'Active Orders',
      value: activeOrdersCount,
      description: 'Currently in progress',
      icon: ChefHat,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50/50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Avg Customer Rating',
      value: '4.8', // Or fetch from restaurant detail avgRating
      description: 'Out of 5 stars',
      icon: Star,
      color: 'bg-indigo-500',
      lightBg: 'bg-indigo-50/50',
      textColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Upper Welcome Header */}
      <div>
        <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Operations Dashboard</h1>
        <p className="text-sm text-mutedColor">Quick snapshot of your restaurant's performance</p>
      </div>

      {/* Warning/Alert Banner for Unattended Orders */}
      {recentOrders.some(o => o.status === 'PLACED') && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-textMain">Pending Action Required</h3>
              <p className="text-xs text-mutedColor">You have new incoming orders waiting to be accepted.</p>
            </div>
          </div>
          <Link
            to="/orders"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-colors"
          >
            Review Orders
          </Link>
        </div>
      )}

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group cursor-default"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-mutedColor uppercase tracking-wider block">
                {stat.title}
              </span>
              <h2 className="text-2xl font-black text-textMain tracking-tight my-0 leading-tight">
                {isAnalyticsLoading ? (
                  <span className="inline-block w-16 h-7 bg-gray-100 animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </h2>
              <span className="text-[10px] text-mutedColor block">{stat.description}</span>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Block */}
      {isAnalyticsLoading ? (
        <div className="h-80 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        analytics?.dailySeries && <EarningsChart data={analytics.dailySeries} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left pane: Top Selling Dishes */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-base font-bold text-textMain flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Top Performing Dishes
              </h3>
              <p className="text-xs text-mutedColor">Best sellers by volume and revenue</p>
            </div>
            <Link to="/menu" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Manage Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {isAnalyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !analytics || analytics.topDishes.length === 0 ? (
              <div className="py-8 text-center text-mutedColor text-sm">
                No orders processed yet to calculate top dishes.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-xs font-bold text-mutedColor uppercase">
                    <th className="pb-3">Dish Name</th>
                    <th className="pb-3 text-center">Orders</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {analytics.topDishes.slice(0, 5).map((dish, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 font-semibold text-textMain">{dish.name}</td>
                      <td className="py-3 text-center font-medium text-mutedColor">{dish.orders}</td>
                      <td className="py-3 text-right font-bold text-textMain">{formatCurrency(dish.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right pane: Quick Actions */}
        <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-textMain flex items-center gap-2 border-b border-gray-50 pb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Link 
                to="/menu" 
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-primary-light rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-primary border border-gray-100 group-hover:border-primary/20">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-textMain group-hover:text-primary">Add Menu Item</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </Link>

              <Link 
                to="/promotions" 
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-primary-light rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-primary border border-gray-100 group-hover:border-primary/20">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-textMain group-hover:text-primary">Create Promotion</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="bg-primary-light p-4 rounded-2xl border border-primary/10 mt-6">
            <h4 className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Operational Tip</h4>
            <p className="text-xs text-primary leading-relaxed">
              Keep your menu updated and mark items out of stock if ingredients are low to reduce order cancellations!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
