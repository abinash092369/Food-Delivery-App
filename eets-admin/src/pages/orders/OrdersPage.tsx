import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminOrdersApi } from '../../api/admin-orders.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { Eye, Filter, ShoppingBag, Search } from 'lucide-react';
import { OrderResponse } from '../../types/admin.types';

const ORDER_STATUSES = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'PACKED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); // client-side filter
  const size = 15;

  // Fetch orders from API
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => adminOrdersApi.getOrders(page, size, statusFilter || undefined),
  });

  const rawOrders = ordersResponse?.data?.content || [];

  // Filter orders by orderNumber client-side if searchQuery is typed
  const filteredOrders = React.useMemo(() => {
    if (!searchQuery.trim()) return rawOrders;
    return rawOrders.filter((order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawOrders, searchQuery]);

  const columns: Column<OrderResponse>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (row) => <span className="font-bold text-gray-900">{row.orderNumber}</span>,
    },
    {
      key: 'restaurantName',
      label: 'Restaurant',
      sortable: true,
      render: (row) => <span className="text-gray-700 font-semibold">{row.restaurantName}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <span className="text-gray-900 font-medium block">Guest Customer</span>
          <span className="text-xs text-gray-400 font-medium block">Ref: #{row.id}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (row) => format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a'),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (row) => <span className="font-bold text-gray-900">₹{row.totalAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => navigate(`/orders/${row.id}`)}
          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-gray-400"
          title="View Order Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Order Logs</h2>
          <p className="text-sm text-gray-500 font-medium">Monitor and manage customer food orders, refunds, and logs</p>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 font-semibold">
            <Filter className="h-4 w-4 text-gray-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="bg-transparent border-none p-0 focus:ring-0 text-teal-600 font-bold cursor-pointer text-xs uppercase"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
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
            placeholder="Search by order number (e.g. ORD...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/50"
          />
        </div>
        {ordersResponse?.data?.totalElements !== undefined && (
          <div className="text-xs font-semibold text-gray-500 shrink-0 self-start sm:self-auto">
            Total {ordersResponse.data.totalElements} orders
          </div>
        )}
      </div>

      {/* Table grid */}
      <div className="space-y-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filteredOrders}
            loading={isLoading}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
            currentPage={page}
            totalPages={ordersResponse?.data?.totalPages || 1}
            onPageChange={setPage}
            totalElements={ordersResponse?.data?.totalElements || 0}
            emptyMessage="No orders match your filter criteria."
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4 text-left">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-36 animate-pulse" />
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-sm text-gray-500 font-semibold shadow-sm">
              No orders match your filter criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => navigate(`/orders/${row.id}`)}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 cursor-pointer hover:shadow transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {row.orderNumber}
                        </h4>
                        <p className="text-xs text-gray-450 font-semibold mt-0.5 truncate">
                          {row.restaurantName}
                        </p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>

                    <div className="text-xs border-t border-gray-50 pt-2.5 grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <p className="text-gray-400 font-medium text-[10px] uppercase">Placed On</p>
                        <p className="font-semibold">{format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium text-[10px] uppercase">Total</p>
                        <p className="font-extrabold text-gray-950 text-sm">₹{row.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="text-xs border-t border-gray-50 pt-2.5 flex justify-between items-center text-gray-400">
                      <span>Ref: #{row.id}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Guest Customer
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Pagination Controls */}
              {ordersResponse?.data?.totalPages && ordersResponse.data.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm mt-4">
                  <span className="text-xs text-gray-550 font-semibold">Page {page + 1} of {ordersResponse.data.totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
                      disabled={page === 0}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(ordersResponse.data.totalPages - 1, p + 1)); }}
                      disabled={page === ordersResponse.data.totalPages - 1}
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
export default OrdersPage;
