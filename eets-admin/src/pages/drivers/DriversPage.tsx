import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminDriversApi } from '../../api/admin-drivers.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { Star, Truck, Check, Filter, AlertCircle, X, Search } from 'lucide-react';
import { DriverProfileResponse } from '../../types/admin.types';

export const DriversPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const size = 15;

  // 1. Fetch drivers list with try/catch wrapping
  const { data: driversResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-drivers', page],
    queryFn: async () => {
      try {
        return await adminDriversApi.getDrivers(page, size);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        throw err;
      }
    },
  });

  const rawDrivers = driversResponse?.data?.content || [];

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: number) => adminDriversApi.verifyDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      alert('Driver verified successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to verify driver.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminDriversApi.rejectDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      alert('Driver application rejected.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to reject driver.');
    },
  });

  const handleVerify = (id: number, currentVerified: boolean) => {
    if (currentVerified) return; // Verified is terminal in the backend verify endpoint.
    if (window.confirm('Verify this delivery partner profile? This approves them for dispatch.')) {
      verifyMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    if (window.confirm('Reject this delivery partner profile? This will deny them dispatch access.')) {
      rejectMutation.mutate(id);
    }
  };

  // Filter & search client-side
  const filteredDrivers = React.useMemo(() => {
    let result = rawDrivers;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => {
        const name = d?.name || (d as any)?.fullName || d?.phone || "Driver";
        const email = d?.email || "";
        const phone = d?.phone || (d as any)?.mobile || "N/A";
        return (
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          phone.includes(q)
        );
      });
    }

    // Status filter
    if (verificationFilter === 'VERIFIED') {
      result = result.filter((d) => d?.isVerified);
    } else if (verificationFilter === 'UNVERIFIED') {
      result = result.filter((d) => !d?.isVerified);
    }

    return result;
  }, [rawDrivers, verificationFilter, searchQuery]);

  const columns: Column<DriverProfileResponse>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 block">
            {row?.name || (row as any)?.fullName || row?.phone || "Driver"}
          </span>
          <span className="text-xs text-gray-400 font-semibold block mt-0.5">
            {row?.email || "No Email"}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => (
        <span className="text-gray-600 font-semibold">
          {row?.phone || (row as any)?.mobile || "N/A"}
        </span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle Details',
      render: (row) => {
        const vehicleType = row?.vehicleType || (row as any)?.vehicle?.type || "N/A";
        const regNo = row?.vehicleRegNumber || "N/A";
        const make = row?.vehicleMake || "";
        const model = row?.vehicleModel || "";
        return (
          <div>
            <span className="text-gray-800 font-semibold block uppercase text-xs">
              {vehicleType} • {regNo}
            </span>
            {(make || model) && (
              <span className="text-xs text-gray-400 font-medium block">
                {make} {model}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'isOnline',
      label: 'Status',
      render: (row) => {
        const isOnline = !!row?.isOnline;
        return (
          <span className="flex items-center gap-1.5 font-bold text-xs">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        );
      },
    },
    {
      key: 'avgRating',
      label: 'Avg Rating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 font-bold text-xs text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
          <span>{row?.avgRating != null ? row.avgRating.toFixed(1) : "0.0"}</span>
        </div>
      ),
    },
    {
      key: 'totalDeliveries',
      label: 'Deliveries',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 text-xs">
          {row?.totalDeliveries ?? 0}
        </span>
      ),
    },
    {
      key: 'isVerified',
      label: 'Verification & Actions',
      render: (row) => {
        const approvalStatus = (row as any)?.approvalStatus || (row as any)?.status || (row?.isVerified ? "APPROVED" : "UNDER_REVIEW");
        const isVerified = row?.isVerified || approvalStatus === "APPROVED" || approvalStatus === "VERIFIED";
        const isRejected = approvalStatus === "REJECTED";

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                isVerified
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                  : isRejected
                    ? 'bg-rose-50 border-rose-150 text-rose-700'
                    : 'bg-amber-50 border-amber-150 text-amber-700'
              }`}>
                {approvalStatus}
              </span>
            </div>

            {!isVerified && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleVerify(row.id, isVerified)}
                  disabled={verifyMutation.isPending || rejectMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all shadow-sm"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Approve
                </button>
                {!isRejected && (
                  <button
                    onClick={() => handleReject(row.id)}
                    disabled={verifyMutation.isPending || rejectMutation.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-white hover:bg-rose-50 border-rose-250 text-rose-700 hover:text-rose-800 transition-all shadow-sm"
                  >
                    <X className="h-3.5 w-3.5 text-rose-600" />
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Delivery Partners</h2>
          <p className="text-sm text-gray-500 font-medium">Verify driver background documents and coordinate active fleets</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-600 animate-bounce" />
          <div>
            <h3 className="text-base font-bold">Failed to Load Drivers</h3>
            <p className="text-xs text-rose-700 mt-1">
              {error instanceof Error ? error.message : 'An error occurred while fetching the drivers list.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-755 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Delivery Partners</h2>
          <p className="text-sm text-gray-500 font-medium">Verify driver background documents and coordinate active fleets</p>
        </div>

        {/* Verification Filter */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 font-semibold">
            <Filter className="h-4 w-4 text-gray-400" />
            <span>Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="bg-transparent border-none p-0 focus:ring-0 text-teal-600 font-bold cursor-pointer text-xs uppercase"
            >
              <option value="ALL">All Partners</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="UNVERIFIED">Awaiting Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar - styled uniformly */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search drivers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/50"
          />
        </div>
        {driversResponse?.data?.totalElements !== undefined && (
          <div className="text-xs font-semibold text-gray-500 shrink-0 self-start sm:self-auto">
            Total {driversResponse.data.totalElements} drivers
          </div>
        )}
      </div>

      {/* List DataTable */}
      <div className="space-y-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filteredDrivers}
            loading={isLoading}
            currentPage={page}
            totalPages={driversResponse?.data?.totalPages || 1}
            onPageChange={setPage}
            totalElements={driversResponse?.data?.totalElements || 0}
            emptyMessage="No delivery partners match your filters."
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4 text-left">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-36 animate-pulse" />
            ))
          ) : filteredDrivers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-sm text-gray-500 font-semibold shadow-sm">
              No delivery partners match your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {filteredDrivers.map((row) => {
                  const approvalStatus = (row as any)?.approvalStatus || (row as any)?.status || (row?.isVerified ? "APPROVED" : "UNDER_REVIEW");
                  const isVerified = row?.isVerified || approvalStatus === "APPROVED" || approvalStatus === "VERIFIED";
                  const isRejected = approvalStatus === "REJECTED";

                  return (
                    <div
                      key={row.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {row?.name || (row as any)?.fullName || row?.phone || "Driver"}
                          </h4>
                          <p className="text-xs text-gray-400 font-semibold mt-0.5 truncate">
                            {row?.email || "No Email"}
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 font-bold text-xs bg-slate-50 border border-slate-205 px-2 py-0.5 rounded-md shrink-0">
                          <span className={`h-2 w-2 rounded-full ${row?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          {row?.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>

                      <div className="text-xs border-t border-gray-50 pt-2.5 grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <p className="text-gray-400 font-medium text-[10px] uppercase">Phone</p>
                          <p className="font-semibold">{row?.phone || (row as any)?.mobile || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium text-[10px] uppercase font-semibold">Vehicle</p>
                          <p className="font-semibold truncate uppercase">
                            {row?.vehicleType || (row as any)?.vehicle?.type || "N/A"} • {row?.vehicleRegNumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs border-t border-gray-50 pt-2.5 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                          <span>{row?.avgRating != null ? row.avgRating.toFixed(1) : "0.0"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-505">Deliveries: </span>
                          <span className="font-extrabold text-gray-900">{row?.totalDeliveries ?? 0}</span>
                        </div>
                      </div>

                      <div className="text-xs border-t border-gray-50 pt-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-450 font-medium text-[10px] uppercase font-semibold">Verification</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            isVerified
                              ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                              : isRejected
                                ? 'bg-rose-50 border-rose-150 text-rose-700'
                                : 'bg-amber-50 border-amber-150 text-amber-700'
                          }`}>
                            {approvalStatus}
                          </span>
                        </div>

                        {!isVerified && (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleVerify(row.id, isVerified)}
                              disabled={verifyMutation.isPending || rejectMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Approve
                            </button>
                            {!isRejected && (
                              <button
                                onClick={() => handleReject(row.id)}
                                disabled={verifyMutation.isPending || rejectMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border bg-white hover:bg-rose-50 border-rose-250 text-rose-700 hover:text-rose-800 transition-all shadow-sm"
                              >
                                <X className="h-3.5 w-3.5 text-rose-600" />
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Pagination Controls */}
              {driversResponse?.data?.totalPages && driversResponse.data.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm mt-4">
                  <span className="text-xs text-gray-500 font-semibold">Page {page + 1} of {driversResponse.data.totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
                      disabled={page === 0}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(driversResponse.data.totalPages - 1, p + 1)); }}
                      disabled={page === driversResponse.data.totalPages - 1}
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
    </div>
  );
};

export default DriversPage;
