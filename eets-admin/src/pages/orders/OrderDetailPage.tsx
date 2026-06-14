import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrdersApi } from '../../api/admin-orders.api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { ArrowLeft, User, MapPin, Truck, HelpCircle, FileText, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const orderId = Number(id);

  const [notes, setNotes] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundNotice, setRefundNotice] = useState<string | null>(null);

  // 1. Fetch Order details
  const { data: orderResponse, isLoading, error } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => adminOrdersApi.getOrder(orderId),
    enabled: !isNaN(orderId),
    refetchInterval: (query) => {
      const order = query?.state?.data?.data;
      if (order && ['ACCEPTED', 'PREPARING', 'PACKED'].includes(order.status) && !order.driver) {
        return 3000;
      }
      return false;
    }
  });

  const order = orderResponse?.data;

  // Initialize admin notes from order data
  useEffect(() => {
    if (order) {
      setNotes(order.adminNotes || '');
    }
  }, [order]);

  // Mutations
  const notesMutation = useMutation({
    mutationFn: (newNotes: string) => adminOrdersApi.updateNotes(orderId, newNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      alert('Notes saved successfully');
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      adminOrdersApi.refundOrder(orderId, amount, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      if (res.data?.status === 'manual_refund_required') {
        setRefundNotice(res.data.message || 'Refund must be processed manually for Cash on Delivery (COD) order.');
        setRefundError(null);
      } else {
        alert('Order refunded successfully');
        setShowRefundModal(false);
        setRefundAmount('');
        setRefundReason('');
        setRefundNotice(null);
      }
    },
    onError: (err: any) => {
      setRefundError(err.response?.data?.message || 'Failed to dispatch refund. Verify connection and amount.');
    },
  });

  const handleSaveNotes = () => {
    notesMutation.mutate(notes);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);
    setRefundNotice(null);
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRefundError('Please enter a valid refund amount.');
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('Please provide a reason for the refund.');
      return;
    }
    refundMutation.mutate({ amount: amountNum, reason: refundReason });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-48 bg-gray-150 rounded-xl"></div>
        <div className="h-40 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
        <p className="text-gray-500 font-semibold">Error loading order. It might have been deleted or invalid.</p>
        <Link to="/orders" className="mt-4 inline-flex items-center gap-2 text-teal-600 font-bold text-xs hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Orders list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Back to list */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-555 hover:text-gray-900 font-bold text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      {/* Title Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Order #{order.orderNumber}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400 font-bold tracking-wider mt-1 uppercase">
            Placed on: {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
          </p>
        </div>

        {/* Refund dispatch button */}
        {order.status !== 'REFUNDED' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => {
              setShowRefundModal(true);
              setRefundError(null);
              setRefundNotice(null);
            }}
            className="bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md self-start sm:self-auto"
          >
            Process Refund
          </button>
        )}
      </div>

      {/* Main Info Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Dish items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant & Dish details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Restaurant Details</h3>
                <p className="text-xs text-teal-600 font-bold mt-0.5">{order.restaurantName}</p>
              </div>
              <span className="text-xs font-bold text-slate-400">ID: #{order.restaurantId}</span>
            </div>

            {/* Dish list */}
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4 py-1.5">
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-800 text-sm">
                      {item.name} <span className="text-teal-600 font-extrabold text-xs ml-1">x {item.quantity}</span>
                    </p>
                    {item.selectedOptions && (
                      <p className="text-xs text-gray-400 font-medium">Options: {item.selectedOptions}</p>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-gray-900">
                    ₹{(item.totalPrice).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* Calculations Summary footer */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-505 font-medium">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-505 font-medium">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-505 font-medium">
                <span>Tax Amount</span>
                <span>₹{order.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discounts</span>
                  <span>- ₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-955 border-t border-gray-100 pt-3">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Driver info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-500" />
                Delivery Address
              </h3>
              {order.deliveryAddress ? (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-700">{order.deliveryAddress.addressLine}</p>
                  <p className="text-xs text-gray-505 font-medium">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-xs text-teal-600 font-semibold">Landmark: {order.deliveryAddress.landmark}</p>
                  )}
                  <div className="pt-2">
                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-605 font-bold px-2 py-0.5 rounded-full uppercase">
                      Label: {String(order.deliveryAddress.label)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium">No address details mapped.</p>
              )}
            </div>

            {/* Driver Assignment info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-teal-500" />
                Assigned Delivery Partner
              </h3>
              {order.driver ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{order.driver.name}</span>
                    <span className="text-xs font-semibold text-amber-600">★ {order.driver.avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-505 font-semibold">📞 {order.driver.phone}</p>
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                    Vehicle: {order.driver.vehicleType}
                  </p>
                </div>
              ) : (
                <div className="h-20 flex flex-col items-center justify-center text-center">
                  <HelpCircle className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400 font-semibold mt-1">Waiting for driver assignment</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-500" />
              Administrative Notes
            </h3>
            <textarea
              placeholder="Record any issues, customer complaints, or dispatch remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
            />
            <button
              onClick={handleSaveNotes}
              disabled={notesMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Right 1 Col: Status History Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Status Logs</h3>

          {/* Timeline Wrapper */}
          <div className="relative flex-1 border-l-2 border-teal-50 pl-5 ml-2.5 py-2 space-y-6">
            {order.statusHistory && order.statusHistory.length > 0 ? (
              order.statusHistory.map((history, idx) => (
                <div key={idx} className="relative group">
                  {/* Circle locator icon */}
                  <span className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-white border-2 border-teal-600 shadow-sm group-hover:scale-110 transition-transform"></span>

                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
                      {history.status}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {format(new Date(history.changedAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                    {history.notes && (
                      <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                        {history.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-medium py-8 text-center">No status logs recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Refund Request dialog modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-gray-100 animate-scaleUp text-left">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              Dispatch Order Refund
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Provide the refund amount (up to ₹{order.totalAmount}) and the specific reason for dispatching refund.
            </p>

            <form onSubmit={handleRefundSubmit} className="mt-4 space-y-4">
              {/* Errors/Notices alerts */}
              {refundError && (
                <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-lg border border-rose-100">
                  {refundError}
                </div>
              )}
              {refundNotice && (
                <div className="bg-amber-50 text-amber-805 text-xs font-semibold p-3 rounded-lg border border-amber-100">
                  {refundNotice}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Refund Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  max={order.totalAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</label>
                <textarea
                  required
                  placeholder="Customer cancelled, food quality issue, or item missing..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-gray-55 text-gray-600 hover:bg-gray-100 font-semibold text-xs rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {refundMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderDetailPage;
