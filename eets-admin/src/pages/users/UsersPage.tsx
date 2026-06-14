import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminUsersApi } from '../../api/admin-users.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { Eye, Filter, ShieldAlert, Search } from 'lucide-react';
import { AdminUserResponse } from '../../types/admin.types';

const ROLES = ['CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'];

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const size = 15;

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users', page, roleFilter, searchQuery],
    queryFn: () => adminUsersApi.getUsers(page, size, roleFilter || undefined, searchQuery || undefined),
  });

  const columns: Column<AdminUserResponse>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 block">{row.name}</span>
          {row.isBanned && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1 mt-0.5">
              <ShieldAlert className="h-2.5 w-2.5" /> Banned
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => <span className="text-gray-600 font-semibold">{row.email}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => <span className="text-gray-500 font-medium">{row.phone || 'N/A'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{row.role}</span>,
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      sortable: true,
      render: (row) => format(new Date(row.createdAt), 'dd MMM yyyy'),
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => navigate(`/users/${row.id}`)}
          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-gray-400"
          title="View profile details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Accounts Management</h2>
          <p className="text-sm text-gray-500 font-medium">Verify system profiles, monitor permissions, and block violating accounts</p>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 font-semibold">
            <Filter className="h-4 w-4 text-gray-400" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="bg-transparent border-none p-0 focus:ring-0 text-teal-600 font-bold cursor-pointer text-xs uppercase"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
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
            placeholder="Search users by name or email address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/50"
          />
        </div>
        {usersResponse?.data?.totalElements !== undefined && (
          <div className="text-xs font-semibold text-gray-500 shrink-0 self-start sm:self-auto">
            Total {usersResponse.data.totalElements} users
          </div>
        )}
      </div>

      {/* Grid list table */}
      <div className="space-y-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={usersResponse?.data?.content || []}
            loading={isLoading}
            onRowClick={(row) => navigate(`/users/${row.id}`)}
            currentPage={page}
            totalPages={usersResponse?.data?.totalPages || 1}
            onPageChange={setPage}
            totalElements={usersResponse?.data?.totalElements || 0}
            emptyMessage="No user accounts match your search filters."
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4 text-left">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-36 animate-pulse" />
            ))
          ) : !usersResponse?.data?.content || usersResponse.data.content.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-sm text-gray-500 font-semibold shadow-sm">
              No user accounts match your search filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {usersResponse.data.content.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => navigate(`/users/${row.id}`)}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 cursor-pointer hover:shadow transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {row.name}
                        </h4>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5 truncate">
                          {row.email}
                        </p>
                      </div>
                      {row.isBanned && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 shrink-0">
                          <ShieldAlert className="h-2.5 w-2.5" /> Banned
                        </span>
                      )}
                    </div>

                    <div className="text-xs border-t border-gray-50 pt-2.5 grid grid-cols-2 gap-2 text-slate-655">
                      <div>
                        <p className="text-gray-400 font-medium text-[10px] uppercase">Phone</p>
                        <p className="font-semibold">{row.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium text-[10px] uppercase">Joined</p>
                        <p className="font-semibold">{format(new Date(row.createdAt), 'dd MMM yyyy')}</p>
                      </div>
                    </div>

                    <div className="text-xs border-t border-gray-50 pt-2.5 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{row.role}</span>
                      <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Pagination Controls */}
              {usersResponse.data.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm mt-4">
                  <span className="text-xs text-gray-550 font-semibold">Page {page + 1} of {usersResponse.data.totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
                      disabled={page === 0}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(usersResponse.data.totalPages - 1, p + 1)); }}
                      disabled={page === usersResponse.data.totalPages - 1}
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
export default UsersPage;
