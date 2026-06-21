import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorOrdersApi } from '../api/vendor-orders.api';
import { OrderResponse, OrderItemResponse } from '../types/vendor.types';
import { 
  Clock, 
  Check, 
  X, 
  Phone, 
  Info, 
  User as UserIcon, 
  Truck, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [rejectOrderId, setRejectOrderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'new' | 'preparing' | 'transit' | 'completed'>('new');

  const prevPlacedCountRef = useRef<number>(0);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Fetch Orders with 15s Polling
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['vendor-orders-live'],
    queryFn: () => vendorOrdersApi.getOrders(0, 100),
    refetchInterval: 15000,
  });

  const orders = ordersRes?.data?.content || [];

  // Update a clock every 5 seconds to force elapsed time re-renders
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Play notification chime when a new PLACED order is detected
  const placedOrders = orders.filter((o) => o.status === 'PLACED');
  
  useEffect(() => {
    if (placedOrders.length > prevPlacedCountRef.current) {
      playChime();
    }
    prevPlacedCountRef.current = placedOrders.length;
  }, [placedOrders.length]);

  // Synthetic Audio Chime using Web Audio API (Guarantees no external asset loading errors)
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.frequency.value = 523.25; // C5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);
      
      // Tone 2 (offset)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.value = 659.25; // E5
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Could not play notification chime', e);
    }
  };

  // 2. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      vendorOrdersApi.updateOrderStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders-live'] });
      setSelectedOrder(null);
      if (variables.status === 'ACCEPTED') {
        showToast('Order accepted successfully!');
      } else {
        showToast(`Order status updated to ${variables.status}!`);
      }
    },
    onError: (err: any) => {
      console.error('Accept/Status update failed:', err);
      let msg = err.response?.data?.message || err.message || 'Failed to update order status';
      if (msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('deadlock') || msg.toLowerCase().includes('cannotacquirelock')) {
        msg = 'Database concurrency/deadlock occurred. Please try again.';
      } else if (msg.toLowerCase().includes('enum') || msg.toLowerCase().includes('invalid')) {
        msg = 'Invalid status transition value. Please refresh the page.';
      }
      showToast(msg, 'error');
    }
  });

  // 3. Reject Order Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      vendorOrdersApi.rejectOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders-live'] });
      setRejectOrderId(null);
      setRejectReason('');
      showToast('Order rejected & customer refunded.', 'success');
    },
    onError: (err: any) => {
      console.error('Reject failed:', err);
      let msg = err.response?.data?.message || err.message || 'Failed to reject order';
      if (msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('deadlock') || msg.toLowerCase().includes('cannotacquirelock')) {
        msg = 'Database concurrency/deadlock occurred. Please try again.';
      }
      showToast(msg, 'error');
    }
  });

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper to compute minutes elapsed since order creation
  const getMinutesElapsed = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const diffMs = currentTime.getTime() - created.getTime();
    return Math.floor(diffMs / 60000);
  };

  // Render elapsed time label
  const renderElapsedTime = (createdAtStr: string) => {
    const mins = getMinutesElapsed(createdAtStr);
    const isOverdue = mins >= 5;
    
    return (
      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
        isOverdue 
          ? 'bg-red-100 text-red-700 animate-pulse' 
          : 'bg-gray-100 text-mutedColor'
      }`}>
        <Clock className="w-3 h-3" />
        {mins}m ago
      </span>
    );
  };

  // Categorize orders into Kanban columns
  const cols = {
    new: orders.filter((o) => o.status === 'PLACED'),
    preparing: orders.filter((o) => ['ACCEPTED', 'PREPARING'].includes(o.status)),
    delivery: orders.filter((o) => 
      ['PACKED', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY'].includes(o.status)
    ),
    completed: orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status)),
  };

  const handleAccept = (id: number) => {
    if (updateStatusMutation.isPending) return;
    // Transition Placed -> Accepted
    updateStatusMutation.mutate({ id, status: 'ACCEPTED' });
  };

  const handleStartPrep = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'PREPARING' });
  };

  const handleReady = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'PACKED' });
  };

  const handleRejectClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRejectOrderId(id);
  };

  const renderColumnNew = () => (
    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
        <h3 className="text-sm font-extrabold text-textMain flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-primary rounded-full" />
          New Orders
        </h3>
        <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
          {cols.new.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cols.new.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer relative group ${
              getMinutesElapsed(order.createdAt) >= 5 ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            {getMinutesElapsed(order.createdAt) >= 5 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-xl" />
            )}

            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-textMain">#{order.orderNumber}</span>
              {renderElapsedTime(order.createdAt)}
            </div>
            
            <div className="text-xs font-medium text-mutedColor mb-3 line-clamp-2">
              {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>

            <div className="flex justify-between items-center border-t border-gray-50 pt-3">
              <span className="text-sm font-black text-textMain">{formatCurrency(order.totalAmount)}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRejectClick(e, order.id); }}
                  disabled={updateStatusMutation.isPending || rejectMutation.isPending}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-50"
                  title="Reject Order"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAccept(order.id); }}
                  disabled={updateStatusMutation.isPending || rejectMutation.isPending}
                  className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors flex items-center gap-1 text-[11px] font-bold px-3.5 disabled:opacity-50 min-w-[95px] justify-center h-9"
                >
                  {updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Accept
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        {cols.new.length === 0 && (
          <div className="text-center text-xs text-mutedColor py-8">No incoming orders.</div>
        )}
      </div>
    </div>
  );

  const renderColumnPreparing = () => (
    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
        <h3 className="text-sm font-extrabold text-textMain flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
          Preparing
        </h3>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          {cols.preparing.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cols.preparing.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer relative ${
              getMinutesElapsed(order.createdAt) >= 15 ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            {getMinutesElapsed(order.createdAt) >= 15 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-xl" />
            )}

            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-textMain flex items-center gap-1">
                #{order.orderNumber}
                <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                  order.status === 'ACCEPTED' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {order.status === 'ACCEPTED' ? 'Accepted' : 'Preparing'}
                </span>
              </span>
              {renderElapsedTime(order.createdAt)}
            </div>

            <div className="text-xs font-medium text-mutedColor mb-3 line-clamp-2">
              {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>

            <div className="flex justify-between items-center border-t border-gray-50 pt-3">
              <span className="text-sm font-black text-textMain">{formatCurrency(order.totalAmount)}</span>
              {order.status === 'ACCEPTED' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartPrep(order.id); }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold transition-colors h-9"
                >
                  Start Prep
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleReady(order.id); }}
                  className="px-4 py-2 bg-success hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 h-9"
                >
                  <Check className="w-4 h-4" /> Mark Ready
                </button>
              )}
            </div>
          </div>
        ))}
        {cols.preparing.length === 0 && (
          <div className="text-center text-xs text-mutedColor py-8">No active prep tasks.</div>
        )}
      </div>
    </div>
  );

  const renderColumnTransit = () => (
    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
        <h3 className="text-sm font-extrabold text-textMain flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
          Transit / Ready
        </h3>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          {cols.delivery.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cols.delivery.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-textMain flex items-center gap-1">
                #{order.orderNumber}
                <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                  order.status === 'PACKED' 
                    ? 'bg-indigo-100 text-indigo-800 animate-pulse' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {order.status === 'PACKED' ? 'Food Ready' : 'Transit'}
                </span>
              </span>
              {renderElapsedTime(order.createdAt)}
            </div>

            <div className="text-xs font-medium text-mutedColor mb-3 line-clamp-2">
              {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>

            {/* Driver Assign details */}
            {order.driver ? (
              <div className="border-t border-gray-50 pt-2 mb-2 space-y-1 bg-gray-50 p-2 rounded-lg text-[10px]">
                <div className="flex items-center gap-1 text-textMain font-bold">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  {order.driver.name} ({order.driver.vehicleType})
                </div>
                <div className="text-mutedColor flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {order.driver.phone}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-50 pt-2 mb-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Waiting for delivery agent...
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-50 pt-2.5">
              <span className="text-sm font-black text-textMain">{formatCurrency(order.totalAmount)}</span>
              <span className="text-[10px] text-mutedColor font-semibold">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
        {cols.delivery.length === 0 && (
          <div className="text-center text-xs text-mutedColor py-8">No orders in transit.</div>
        )}
      </div>
    </div>
  );

  const renderColumnCompleted = () => (
    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
        <h3 className="text-sm font-extrabold text-textMain flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-gray-400" />
          Fulfilled / Terminated
        </h3>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {cols.completed.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cols.completed.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer opacity-70 hover:opacity-100"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-textMain">#{order.orderNumber}</span>
              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="text-xs font-medium text-mutedColor mb-3 line-clamp-2">
              {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>

            <div className="flex justify-between items-center border-t border-gray-50 pt-3">
              <span className="text-sm font-black text-textMain">{formatCurrency(order.totalAmount)}</span>
              <span className="text-[10px] text-mutedColor">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {cols.completed.length === 0 && (
          <div className="text-center text-xs text-mutedColor py-8">No completed orders yet.</div>
        )}
      </div>
    </div>
  );

  const submitReject = () => {
    if (rejectOrderId && rejectReason.trim()) {
      rejectMutation.mutate({ id: rejectOrderId, reason: rejectReason });
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Live Orders Board</h1>
          <p className="text-sm text-mutedColor">Real-time status tracking with sound alerts</p>
        </div>
        <button
          onClick={playChime}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-mutedColor font-bold px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
        >
          Test Chime Beep
        </button>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-mutedColor">Initializing operations board...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile/Tablet column tabs switcher */}
          <div className="lg:hidden flex border-b border-gray-150 bg-white sticky top-16 z-20 -mx-4 px-4 py-2 gap-1 overflow-x-auto scrollbar-none">
            {[
              { key: 'new', label: 'New', count: cols.new.length, color: 'bg-primary' },
              { key: 'preparing', label: 'Preparing', count: cols.preparing.length, color: 'bg-amber-500' },
              { key: 'transit', label: 'Transit', count: cols.delivery.length, color: 'bg-indigo-500' },
              { key: 'completed', label: 'Completed', count: cols.completed.length, color: 'bg-gray-400' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveMobileTab(tab.key as any)}
                type="button"
                className={`flex-1 min-w-[70px] flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeMobileTab === tab.key
                    ? 'bg-primary-light text-primary border border-primary/20'
                    : 'text-mutedColor hover:text-textMain'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${tab.color}`} />
                  {tab.label}
                </span>
                <span className="text-[10px] text-mutedColor mt-0.5">{tab.count} orders</span>
              </button>
            ))}
          </div>

          {/* Desktop Kanban columns (always visible on desktop) */}
          <div className="hidden lg:grid grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
            {renderColumnNew()}
            {renderColumnPreparing()}
            {renderColumnTransit()}
            {renderColumnCompleted()}
          </div>

          {/* Mobile/Tablet active tab view */}
          <div className="lg:hidden h-[calc(100vh-260px)] min-h-[400px]">
            {activeMobileTab === 'new' && renderColumnNew()}
            {activeMobileTab === 'preparing' && renderColumnPreparing()}
            {activeMobileTab === 'transit' && renderColumnTransit()}
            {activeMobileTab === 'completed' && renderColumnCompleted()}
          </div>
        </div>
      )}

      {/* ── DETAIL OVERLAY MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden border border-gray-100 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-textMain">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-mutedColor">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-gray-200 text-mutedColor hover:text-textMain rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              
              {/* Order Status history */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-xs font-bold text-mutedColor uppercase">Current Status</span>
                <span className="px-2.5 py-1 bg-primary-light text-primary text-xs font-bold rounded-lg border border-primary/10 uppercase">
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Items Ordered</h4>
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl p-3 bg-gray-50/30">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-start text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-textMain">
                          <span className="text-primary font-bold mr-1">{item.quantity}x</span> {item.name}
                        </p>
                        {item.selectedOptions && (
                          <p className="text-xs text-mutedColor italic">Options: {item.selectedOptions}</p>
                        )}
                      </div>
                      <span className="font-bold text-textMain">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <Info className="w-4 h-4" /> Customer Instructions
                  </h4>
                  <p className="text-xs text-amber-700 font-medium">{selectedOrder.specialInstructions}</p>
                </div>
              )}

              {/* Payment Summary */}
              <div className="space-y-2 text-sm border-t border-gray-50 pt-4">
                <div className="flex justify-between text-mutedColor">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-mutedColor">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-textMain font-extrabold text-base border-t border-gray-100 pt-2">
                  <span>Total Bill Amount</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Details
              </button>
              
              {selectedOrder.status === 'PLACED' && (
                <button
                  onClick={() => handleAccept(selectedOrder.id)}
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updateStatusMutation.isPending && updateStatusMutation.variables?.id === selectedOrder.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <span>Accept Order</span>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── REJECT REASON MODAL ── */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl p-6 border border-gray-100 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-textMain">Cancel & Reject Order</h3>
            <p className="text-xs text-mutedColor">
              Please enter the reason for rejecting this order. The customer will be refunded and notified immediately.
            </p>
            
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Ingredients out of stock / Kitchen overloaded"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setRejectOrderId(null); setRejectReason(''); }}
                className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                {rejectMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-[100] px-6 py-3.5 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
            : 'bg-rose-50 border-rose-250 text-rose-800'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
};
