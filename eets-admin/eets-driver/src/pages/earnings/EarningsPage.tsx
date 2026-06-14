import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import { driverApi } from '../../api/driver.api';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Star,
  Award,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const EarningsPage: React.FC = () => {
  const { driver } = useDriverAuthStore();
  const [period, setPeriod] = useState<'today' | 'week'>('week');

  const { data: earningsRes, isLoading, error } = useQuery({
    queryKey: ['driverEarnings'],
    queryFn: async () => {
      const res = await driverApi.getEarnings();
      return res.data;
    },
    enabled: !!driver,
  });

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-semibold text-gray-550">Loading earnings report...</span>
      </div>
    );
  }

  if (error || !earningsRes) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-start gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold">Failed to load earnings report</h4>
          <p className="text-xs mt-0.5">Please check your network connection and try again.</p>
        </div>
      </div>
    );
  }

  const earningsToday = Number(earningsRes.earningsToday || 0);
  const deliveriesToday = earningsRes.deliveriesToday || 0;
  const earningsThisWeek = Number(earningsRes.earningsThisWeek || 0);
  const deliveriesThisWeek = earningsRes.deliveriesThisWeek || 0;

  // Derive stats based on selected period
  const displayEarnings = period === 'today' ? earningsToday : earningsThisWeek;
  const displayDeliveries = period === 'today' ? deliveriesToday : deliveriesThisWeek;
  const avgEarnings = displayDeliveries > 0 ? (displayEarnings / displayDeliveries).toFixed(0) : '0';

  // Prepare chart data (format dates into readable days)
  const chartData = earningsRes.dailySeries.map((d) => {
    const parsedDate = new Date(d.date);
    const dayName = parsedDate.toLocaleDateString('en-IN', { weekday: 'short' });
    return {
      day: dayName,
      earnings: Number(d.earnings),
      deliveries: d.deliveries,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Earnings</h1>
        
        {/* Toggle Period */}
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-150">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'today' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'week' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* 1. Big Earnings Billboard */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
        {/* Absolute Background shapes */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        
        <div className="space-y-1 z-10">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">
            {period === 'today' ? "Today's Shift Earnings" : 'Weekly Payout Balance'}
          </span>
          <span className="text-4xl font-black tracking-tight flex items-baseline">
            <span className="text-2xl font-bold mr-0.5 text-orange-400">₹</span>
            {displayEarnings.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-white/10 mt-6 pt-4 flex justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Next payout: Monday</span>
          </div>
          <span className="text-[10px] text-primary font-black uppercase tracking-wider">Direct Deposit</span>
        </div>
      </div>

      {/* 2. Key Performance Indicators */}
      <div className="grid grid-cols-3 gap-3">
        {/* Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-primary flex items-center justify-center mx-auto mb-2">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Deliveries</span>
          <span className="text-base font-black text-gray-850 block mt-1">{displayDeliveries}</span>
        </div>

        {/* Average pay */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <IndianRupee className="w-4 h-4" />
          </div>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Avg/Order</span>
          <span className="text-base font-black text-gray-850 block mt-1">₹{avgEarnings}</span>
        </div>

        {/* Avg Rating */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
            <Star className="w-4 h-4 fill-amber-500" />
          </div>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Rating</span>
          <span className="text-base font-black text-gray-850 block mt-1">
            {driver?.avgRating ? Number(driver.avgRating).toFixed(1) : '5.0'}
          </span>
        </div>
      </div>

      {/* 3. Daily Breakdown Bar Chart (Only for Weekly view) */}
      {period === 'week' && chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">Daily Breakdown</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Earnings distribution across weekdays</p>
          </div>
          
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6', radius: 8 }}
                  contentStyle={{ background: '#111827', borderRadius: 12, border: 'none', color: '#fff', fontSize: 10 }}
                  formatter={(value: any) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" radius={[8, 8, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#FF4F18' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Active Incentive Goals */}
      {earningsRes.incentiveProgress && (
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-gray-800">Incentive Goal Progress</h4>
              <p className="text-[10px] text-gray-400 font-semibold">
                Complete {earningsRes.incentiveProgress.target} deliveries today to unlock ₹{Number(earningsRes.incentiveProgress.bonusAmount).toFixed(0)} bonus
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (earningsRes.incentiveProgress.current / earningsRes.incentiveProgress.target) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">
              <span>{earningsRes.incentiveProgress.current} completed</span>
              <span>Goal: {earningsRes.incentiveProgress.target}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Payout History Section */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">Payout History</h3>
          <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer">View statement</span>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            { date: '08 Jun 2026', amount: 3420, ref: 'TXN-90214890', bank: 'SBI *1234' },
            { date: '01 Jun 2026', amount: 4890, ref: 'TXN-80124809', bank: 'SBI *1234' },
            { date: '25 May 2026', amount: 2980, ref: 'TXN-70984128', bank: 'SBI *1234' },
          ].map((txn, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-gray-800 block">Weekly Payout Transfer</span>
                <span className="text-[10px] text-gray-400 font-medium block flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> {txn.bank} | {txn.date}
                </span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="font-extrabold text-emerald-600 block">₹{txn.amount}</span>
                <span className="text-[9px] text-gray-400 font-semibold block uppercase">{txn.ref}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
