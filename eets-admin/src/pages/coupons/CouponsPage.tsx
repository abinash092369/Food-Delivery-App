import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponsApi, CouponCreatePayload } from '../../api/admin-coupons.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { BadgePercent, Plus, Trash2, CheckCircle2, Loader2, Calendar } from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const size = 50;

  // Create Coupon modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY' | 'BOGO'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [applicableRestaurantId, setApplicableRestaurantId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Coupons
  const { data: couponsResponse, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => adminCouponsApi.getCoupons(page, size),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CouponCreatePayload) => adminCouponsApi.createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      setShowCreateModal(false);
      resetForm();
      alert('Coupon created successfully.');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create coupon. Check constraints.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCouponsApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      alert('Coupon deleted (disabled).');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete coupon.');
    },
  });

  const resetForm = () => {
    setCode('');
    setType('PERCENTAGE');
    setValue('');
    setMaxDiscount('');
    setMinOrderAmount('');
    setValidUntil('');
    setApplicableRestaurantId('');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum <= 0) {
      setFormError('Please enter a valid discount value greater than 0.');
      return;
    }

    if (!validUntil) {
      setFormError('Please select an expiry date.');
      return;
    }

    const payload: CouponCreatePayload = {
      code: code.trim().toUpperCase(),
      type,
      value: valNum,
      validUntil: new Date(validUntil).toISOString(),
    };

    if (minOrderAmount.trim()) {
      const minAmt = parseFloat(minOrderAmount);
      if (!isNaN(minAmt)) payload.minOrderAmount = minAmt;
    }

    if (maxDiscount.trim()) {
      const maxD = parseFloat(maxDiscount);
      if (!isNaN(maxD)) payload.maxDiscount = maxD;
    }

    if (applicableRestaurantId.trim()) {
      const rId = parseInt(applicableRestaurantId);
      if (!isNaN(rId)) payload.applicableRestaurantId = rId;
    }

    createMutation.mutate(payload);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this coupon code? This will disable it immediately.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'code',
      label: 'Promo Code',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded text-xs select-all">
          {row.code}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Coupon Type',
      render: (row) => <span className="text-xs font-bold text-gray-500 uppercase">{row.type.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900">
          {row.type === 'PERCENTAGE' ? `${row.value}%` : `₹${row.value.toLocaleString('en-IN')}`}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      label: 'Min Order',
      render: (row) => <span className="text-gray-500">₹{row.minOrderAmount?.toLocaleString('en-IN') || '0'}</span>,
    },
    {
      key: 'validUntil',
      label: 'Expires On',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(row.validUntil), 'dd MMM yyyy, hh:mm a')}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => <StatusBadge status={row.isActive} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => handleDelete(row.id, e)}
          disabled={!row.isActive || deleteMutation.isPending}
          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors text-gray-400 border border-transparent hover:border-rose-100"
          title="Delete Coupon"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header and Create trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Coupons & Campaigns</h2>
          <p className="text-sm text-gray-500 font-medium">Issue promo discount codes and monitor coupon conversions</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      {/* Grid list DataTable */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={couponsResponse?.data?.content || []}
          loading={isLoading}
          currentPage={page}
          totalPages={couponsResponse?.data?.totalPages || 1}
          onPageChange={setPage}
          totalElements={couponsResponse?.data?.totalElements || 0}
          emptyMessage="No promotional coupons have been created yet."
        />
      </div>

      {/* Create Coupon Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-gray-100 animate-scaleUp text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-indigo-500" />
              Build Promo Coupon Campaign
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Configure code constraints. Coupons are valid immediately upon publishing.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Form validation alert */}
              {formError && (
                <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-lg border border-rose-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promo Code</label>
                  <input
                    type="text"
                    required
                    placeholder="EETS50"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT AMOUNT (₹)</option>
                    <option value="FREE_DELIVERY">FREE DELIVERY</option>
                    <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Discount Value {type === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder={type === 'PERCENTAGE' ? '15' : '100'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Min Order Limit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Discount Limit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Applicable Restaurant ID (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave empty for all restaurants"
                  value={applicableRestaurantId}
                  onChange={(e) => setApplicableRestaurantId(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-gray-55 text-gray-600 hover:bg-gray-100 font-semibold text-xs rounded-xl transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CouponsPage;
