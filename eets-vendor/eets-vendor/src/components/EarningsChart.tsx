import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DaySeries } from '../types/vendor.types';
import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

interface EarningsChartProps {
  data: DaySeries[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'earnings' | 'orders'>('earnings');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xl">
          <p className="text-xs font-semibold text-mutedColor mb-2">{formatDate(label)}</p>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center justify-between space-x-6 my-1">
              <span className="text-sm text-gray-600 flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: pld.color }}
                />
                {pld.name}
              </span>
              <span className="text-sm font-bold text-textMain">
                {pld.name.toLowerCase().includes('earnings') || pld.name.toLowerCase().includes('gross') || pld.name.toLowerCase().includes('net')
                  ? formatCurrency(pld.value)
                  : pld.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance History
          </h3>
          <p className="text-xs text-mutedColor">Daily breakdown of sales and order volume</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'earnings'
                ? 'bg-white text-primary shadow-sm'
                : 'text-mutedColor hover:text-textMain'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-primary shadow-sm'
                : 'text-mutedColor hover:text-textMain'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders
          </button>
        </div>
      </div>

      <div className="h-[320px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-mutedColor space-y-2">
            <ShoppingBag className="w-12 h-12 stroke-[1.5] text-gray-300" />
            <p className="text-sm">No transaction data available for this range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'earnings' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate} 
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={11}
                  tickFormatter={(v) => `₹${v}`}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Earnings"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
                <Area
                  type="monotone"
                  dataKey="gross"
                  name="Gross Sales"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorGross)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate} 
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                <Bar
                  dataKey="orders"
                  name="Orders Fulfilled"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
