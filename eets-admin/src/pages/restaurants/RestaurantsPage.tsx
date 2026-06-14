import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminRestaurantsApi } from '../../api/admin-restaurants.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Star, Eye, Check, X, Search, Loader2 } from 'lucide-react';
import { RestaurantDetailResponse } from '../../types/admin.types';

export const RestaurantsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');

  // Search and Pagination for "All" tab
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  // Rejection Modal state
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Fetch All Restaurants
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ['admin-restaurants', page, searchQuery],
    queryFn: () => adminRestaurantsApi.getRestaurants(page, size, searchQuery),
    enabled: activeTab === 'ALL',
  });

  // 2. Fetch Pending Restaurants
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-restaurants-pending'],
    queryFn: adminRestaurantsApi.getPendingRestaurants,
    enabled: activeTab === 'PENDING',
  });

  // Approvals & Rejections Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminRestaurantsApi.approveRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminRestaurantsApi.rejectRestaurant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      closeRejectModal();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminRestaurantsApi.updateRestaurantStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
    },
  });

  const handleApprove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to approve this restaurant?')) {
      approveMutation.mutate(id);
    }
  };

  const openRejectModal = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectId(id);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectId(null);
    setRejectReason('');
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectId && rejectReason.trim()) {
      rejectMutation.mutate({ id: rejectId, reason: rejectReason });
    }
  };

  const handleToggleStatus = (id: number, currentActive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    statusMutation.mutate({ id, active: !currentActive });
  };

  // Columns for All Restaurants Table
  const columns: Column<RestaurantDetailResponse>[] = [
    {
      key: 'logoUrl',
      label: 'Logo',
      render: (row) => (
        <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-150 shrink-0 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
          {row.logoUrl ? (
            <img src={row.logoUrl} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            row.name.substring(0, 2).toUpperCase()
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 block">{row.name}</span>
          <span className="text-xs text-gray-400 font-medium block mt-0.5">{row.cuisineTypes.join(', ')}</span>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Location',
      render: (row) => <span className="text-gray-600 font-semibold">{row.city}, {row.state}</span>,
    },
    {
      key: 'avgRating',
      label: 'Rating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 font-semibold text-amber-600">
          <Star className="h-4 w-4 fill-amber-500 stroke-amber-500" />
          <span>{row.avgRating.toFixed(1)}</span>
          <span className="text-gray-400 text-xs font-medium">({row.totalRatings})</span>
        </div>
      ),
    },
    {
      key: 'isApproved',
      label: 'Approval',
      render: (row) => <StatusBadge status={row.isApproved ? 'APPROVED' : 'PENDING'} />,
    },
    {
      key: 'isActive',
      label: 'Active Status',
      render: (row) => (
        <button
          onClick={(e) => handleToggleStatus(row.id, row.isActive, e)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            row.isActive ? 'bg-teal-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              row.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/restaurants/${row.slug}`); }}
          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-gray-400"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Restaurants Management</h2>
          <p className="text-sm text-gray-500 font-medium">Verify restaurant applications and monitor active vendors</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-150/60 p-1 rounded-xl border border-gray-100 self-start sm:self-auto shadow-sm bg-gray-100">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-teal-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Restaurants
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-white text-teal-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Pending Approvals
            <span className="h-4 px-1.5 text-[10px] bg-teal-50 border border-teal-100 text-teal-600 rounded-full font-bold flex items-center justify-center">
              {pendingData?.data?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'ALL' ? (
        <div className="space-y-4 text-left">
          {/* Search Bar - styled uniformly */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurants by name or city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/50"
              />
            </div>
            {allData?.data?.totalElements !== undefined && (
              <div className="text-xs font-semibold text-gray-500 shrink-0 self-start sm:self-auto">
                Total {allData.data.totalElements} restaurants
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={allData?.data?.content || []}
              loading={loadingAll}
              onRowClick={(row) => navigate(`/restaurants/${row.slug}`)}
              currentPage={page}
              totalPages={allData?.data?.totalPages || 1}
              onPageChange={setPage}
              totalElements={allData?.data?.totalElements || 0}
              emptyMessage="No restaurants found matching search filters"
            />
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-4">
            {loadingAll ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-32 animate-pulse" />
              ))
            ) : !allData?.data?.content || allData.data.content.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-sm text-gray-500 font-semibold shadow-sm">
                No restaurants found matching search filters
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {allData.data.content.map((row) => (
                    <div
                      key={row.id}
                      onClick={() => navigate(`/restaurants/${row.slug}`)}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 hover:shadow transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-150 shrink-0 bg-gray-50 flex items-center justify-center font-bold text-gray-400">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            row.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-sm">{row.name}</h4>
                          <p className="text-xs text-gray-450 truncate mt-0.5">{row.cuisineTypes.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-gray-50 pt-2.5">
                        <p className="text-gray-550 font-semibold">{row.city}, {row.state}</p>
                        <div className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                          <span>{row.avgRating.toFixed(1)}</span>
                          <span className="text-gray-400">({row.totalRatings})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-gray-50 pt-2.5">
                        <StatusBadge status={row.isApproved ? 'APPROVED' : 'PENDING'} />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-semibold">Active Status:</span>
                          <button
                            onClick={(e) => handleToggleStatus(row.id, row.isActive, e)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              row.isActive ? 'bg-teal-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                row.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Pagination Controls */}
                {allData.data.totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm mt-4">
                    <span className="text-xs text-gray-500 font-semibold">Page {page + 1} of {allData.data.totalPages}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
                        disabled={page === 0}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(allData.data.totalPages - 1, p + 1)); }}
                        disabled={page === allData.data.totalPages - 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-655 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Pending Tab */
        <div className="space-y-4">
          {loadingPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : !pendingData?.data || pendingData.data.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-sm text-gray-500 font-semibold shadow-sm">
              All restaurant applications have been processed! No pending items.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {pendingData.data.map((rest) => (
                <div
                  key={rest.id}
                  onClick={() => navigate(`/restaurants/${rest.slug}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md cursor-pointer transition-shadow text-left"
                >
                  <div>
                    {/* Cover Image Placeholder */}
                    <div className="h-28 bg-slate-100 relative">
                      {rest.coverImageUrl ? (
                        <img
                          src={rest.coverImageUrl}
                          alt={rest.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-teal-50 to-teal-100"></div>
                      )}
                      {/* Logo float */}
                      <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-lg bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center font-bold text-gray-400">
                        {rest.logoUrl ? (
                          <img src={rest.logoUrl} alt={rest.name} className="object-cover" />
                        ) : (
                          rest.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-7 space-y-2 text-left">
                      <h4 className="font-bold text-gray-900 text-base">{rest.name}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {rest.cuisineTypes.join(' • ')}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 line-clamp-2">
                        {rest.description || 'No description provided.'}
                      </p>
                      <p className="text-xs font-semibold text-gray-400">
                        📍 {rest.addressLine}, {rest.city}
                      </p>
                    </div>
                  </div>

                  {/* Approve/Reject Footer actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => handleApprove(rest.id, e)}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => openRejectModal(rest.id, e)}
                      className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2 rounded-lg transition-colors border border-rose-100"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Modal dialog */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-gray-100 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 text-left">Reject Restaurant Application</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 text-left">
              Please enter the specific reason why this application is rejected.
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <textarea
                required
                placeholder="Documents missing or food license invalid..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-xs rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {rejectMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default RestaurantsPage;
