import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorAnalyticsApi } from '../api/vendor-analytics.api';
import { EarningsChart } from '../components/EarningsChart';
import { 
  TrendingUp, 
  ShoppingBag, 
  Percent, 
  TrendingDown, 
  Calendar,
  UtensilsCrossed,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [daysRange, setDaysRange] = useState<7 | 30 | 90>(30);

  // Fetch earnings details
  const { data: analyticsRes, isLoading, error } = useQuery({
    queryKey: ['vendor-analytics', daysRange],
    queryFn: () => vendorAnalyticsApi.getEarnings(daysRange),
  });

  const analytics = analyticsRes?.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (error) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-base font-bold text-textMain">Analytics Loading Failed</h3>
        <p className="text-xs text-mutedColor max-w-sm">
          Could not sync analytics reports from backend. Ensure backend service is operational.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Business Analytics</h1>
          <p className="text-sm text-mutedColor">Detailed reports on sales, platform commission, and dish performance</p>
        </div>

        {/* Days filter */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mutedColor hidden sm:block" />
          <div className="flex sm:pl-7 w-full">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDaysRange(days as any)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  daysRange === days
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-mutedColor hover:text-textMain'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-mutedColor">Compiling reports...</p>
        </div>
      ) : !analytics ? (
        <div className="text-center py-8 text-mutedColor">No data found.</div>
      ) : (
        <div className="space-y-8">
          
          {/* Detailed Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-mutedColor uppercase tracking-wider block">Gross Sales</span>
              <h2 className="text-2xl font-black text-textMain tracking-tight my-0 leading-none">
                {formatCurrency(analytics.totalEarnings)}
              </h2>
              <p className="text-[10px] text-mutedColor pt-1">Total billing values before platform cuts</p>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-mutedColor uppercase tracking-wider block">Net Earnings</span>
              <h2 className="text-2xl font-black text-primary tracking-tight my-0 leading-none">
                {formatCurrency(analytics.netEarnings)}
              </h2>
              <p className="text-[10px] text-mutedColor pt-1">Transferred directly to your bank account</p>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-mutedColor uppercase tracking-wider block">Commission Paid</span>
              <h2 className="text-2xl font-black text-red-600 tracking-tight my-0 leading-none flex items-center gap-1.5">
                {formatCurrency(analytics.commissionAmount)}
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  {analytics.commissionRate}%
                </span>
              </h2>
              <p className="text-[10px] text-mutedColor pt-1">Platform service and logistics fee</p>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-mutedColor uppercase tracking-wider block">Fulfillments</span>
              <h2 className="text-2xl font-black text-textMain tracking-tight my-0 leading-none">
                {analytics.totalOrders}
              </h2>
              <p className="text-[10px] text-mutedColor pt-1">Total orders completed inside range</p>
            </div>

          </div>

          {/* Performance chart */}
          <EarningsChart data={analytics.dailySeries} />

          {/* Dish Sales breakdown */}
          <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-textMain flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                Dish Sales Breakdown
              </h3>
              <p className="text-xs text-mutedColor">Detailed breakdown of menu item sales contributions</p>
            </div>

            <div className="overflow-x-auto">
              {analytics.topDishes.length === 0 ? (
                <div className="py-12 text-center text-mutedColor text-sm">
                  No products have been ordered in the selected timeframe.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-mutedColor uppercase">
                      <th className="pb-3 pl-4">Dish Name</th>
                      <th className="pb-3 text-center">Orders Sold</th>
                      <th className="pb-3 text-right pr-4">Revenue Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {analytics.topDishes.map((dish, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-4 pl-4 font-semibold text-textMain">{dish.name}</td>
                        <td className="py-4 text-center font-medium text-mutedColor">{dish.orders}</td>
                        <td className="py-4 text-right pr-4 font-bold text-textMain">{formatCurrency(dish.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
