import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminLiveApi } from '../../api/admin-live.api';
import { formatDistanceToNow } from 'date-fns';
import { Radio, Clock, AlertCircle, ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import { OrderResponse } from '../../types/admin.types';

// Kanban Column keys
const COLUMNS = [
  { id: 'PENDING', label: 'Pending Approval', statuses: ['PLACED'] },
  { id: 'CONFIRMED', label: 'Confirmed', statuses: ['ACCEPTED'] },
  { id: 'PREPARING', label: 'Preparing Food', statuses: ['PREPARING'] },
  { id: 'READY', label: 'Ready for Pickup', statuses: ['PACKED'] },
  { id: 'DELIVERY', label: 'Out for Delivery', statuses: ['PICKED_UP', 'ON_THE_WAY'] },
];

export const LiveOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState('PENDING');

  // Update "now" timestamp every minute to refresh elapsed time labels
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Poll live orders every 10 seconds (10000ms)
  const { data: liveOrdersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['admin-live-orders'],
    queryFn: adminLiveApi.getLiveOrders,
    refetchInterval: 10000,
  });

  const liveOrders = liveOrdersResponse?.data || [];

  // Group orders by column statuses
  const getOrdersForColumn = (statuses: string[]) => {
    return liveOrders.filter((order) => statuses.includes(order.status));
  };

  // Check if order is > 30 minutes old
  const isUrgent = (createdAt: string) => {
    const placedTime = new Date(createdAt).getTime();
    const elapsedMinutes = (now - placedTime) / (60 * 1000);
    return elapsedMinutes > 30;
  };

  const renderColumn = (col: typeof COLUMNS[0]) => {
    const orders = getOrdersForColumn(col.statuses);
    return (
      <div
        key={col.id}
        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col h-full overflow-hidden"
      >
        {/* Column Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-4 shrink-0">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">{col.label}</h3>
          <span className="h-5 px-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-full flex items-center justify-center">
            {orders.length}
          </span>
        </div>

        {/* Column Cards scroll list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center text-xs text-gray-400 font-semibold select-none border-2 border-dashed border-slate-200/40 rounded-xl bg-slate-50/20">
              <ShoppingBag className="h-6 w-6 text-slate-350/50 mb-1" />
              No orders
            </div>
          ) : (
            orders.map((order) => {
              const urgent = isUrgent(order.createdAt);
              const itemQty = order.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                    urgent
                      ? 'border-rose-400 ring-1 ring-rose-300 shadow-rose-100/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Urgent hazard indicator bar */}
                  {urgent && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-rose-500 animate-pulse"></div>
                  )}

                  <div>
                    {/* Order Number & view action */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-gray-900 text-xs">#{order.orderNumber}</span>
                      <button className="p-1 hover:bg-teal-50 hover:text-teal-600 rounded text-gray-400 transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Restaurant details */}
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1 truncate">
                      {order.restaurantName}
                    </p>

                    {/* Item count */}
                    <p className="text-xs font-semibold text-gray-600 mt-2">
                      {itemQty} {itemQty === 1 ? 'item' : 'items'} • ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Card Footer: Clock timer */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 mt-1">
                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase leading-none">
                      {order.paymentMethod}
                    </span>

                    <div
                      className={`flex items-center gap-1 text-[10px] font-bold ${
                        urgent ? 'text-rose-600 animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                      {urgent && <AlertCircle className="h-3.5 w-3.5 text-rose-500 fill-rose-50" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)] text-left overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-rose-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Live Dispatch Monitor</h2>
          </div>
          <p className="text-sm text-gray-500 font-medium">Auto-refreshing real-time food delivery tracking console (10s intervals)</p>
        </div>

        {/* Polling state indicator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm text-xs font-semibold text-gray-400 self-start sm:self-auto select-none">
          <RefreshCw className={`h-3.5 w-3.5 text-teal-500 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Syncing...' : 'Connected (Active)'}</span>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden flex border-b border-gray-250/50 overflow-x-auto shrink-0 scrollbar-none gap-2 pb-1 bg-white p-1.5 rounded-xl">
        {COLUMNS.map((col) => {
          const count = getOrdersForColumn(col.statuses).length;
          const isActive = activeTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`whitespace-nowrap px-3 py-2 text-xs font-extrabold rounded-lg transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              {col.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
            <div className="bg-slate-100 animate-pulse rounded-2xl h-full border border-slate-200/50"></div>
            <div className="hidden lg:block bg-slate-100 animate-pulse rounded-2xl h-full border border-slate-200/50"></div>
            <div className="hidden lg:block bg-slate-100 animate-pulse rounded-2xl h-full border border-slate-200/50"></div>
            <div className="hidden lg:block bg-slate-100 animate-pulse rounded-2xl h-full border border-slate-200/50"></div>
            <div className="hidden lg:block bg-slate-100 animate-pulse rounded-2xl h-full border border-slate-200/50"></div>
          </div>
        ) : (
          <>
            {/* Mobile Column View */}
            <div className="lg:hidden h-full flex flex-col overflow-hidden min-h-0">
              {COLUMNS.filter((col) => col.id === activeTab).map((col) => renderColumn(col))}
            </div>

            {/* Desktop Kanban Board View */}
            <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:h-full lg:min-w-0 lg:items-stretch overflow-hidden">
              {COLUMNS.map((col) => renderColumn(col))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default LiveOrdersPage;
