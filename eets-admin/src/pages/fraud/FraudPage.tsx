import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFraudApi } from '../../api/admin-fraud.api';
import { DataTable, Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StatCard } from '../../components/shared/StatCard';
import { format } from 'date-fns';
import { ShieldAlert, FileText, Settings, ShieldAlertIcon, Ban, CheckCircle, AlertOctagon, RefreshCw, Save, Loader2 } from 'lucide-react';
import { FraudFlagResponse, FraudAuditLog } from '../../types/admin.types';

export const FraudPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'AUDIT' | 'THRESHOLDS'>('ALERTS');

  // Search & Pagination for Alerts
  const [alertsPage, setAlertsPage] = useState(0);
  const [alertsFilter, setAlertsFilter] = useState<'OPEN' | 'INVESTIGATED' | 'DISMISSED' | ''>('OPEN');

  // Search & Pagination for Audit Logs
  const [auditPage, setAuditPage] = useState(0);

  // 1. Fetch Fraud Stats
  const { data: statsResponse, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-fraud-stats'],
    queryFn: adminFraudApi.getStats,
  });

  // 2. Fetch Fraud Flags List
  const { data: flagsResponse, isLoading: loadingFlags } = useQuery({
    queryKey: ['admin-fraud-flags', alertsPage, alertsFilter],
    queryFn: () => adminFraudApi.getFlags(alertsPage, 15, alertsFilter || undefined),
    enabled: activeTab === 'ALERTS',
  });

  // 3. Fetch Audit Logs
  const { data: auditResponse, isLoading: loadingAudit } = useQuery({
    queryKey: ['admin-fraud-audit', auditPage],
    queryFn: () => adminFraudApi.getAuditLogs(auditPage, 15),
    enabled: activeTab === 'AUDIT',
  });

  // 4. Fetch Thresholds
  const { data: thresholdsResponse, isLoading: loadingThresholds } = useQuery({
    queryKey: ['admin-fraud-thresholds'],
    queryFn: adminFraudApi.getThresholds,
    enabled: activeTab === 'THRESHOLDS',
  });

  // Thresholds form state
  const [thresholdsForm, setThresholdsForm] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (thresholdsResponse?.data) {
      setThresholdsForm(thresholdsResponse.data);
    }
  }, [thresholdsResponse]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'OPEN' | 'INVESTIGATED' | 'DISMISSED' }) =>
      adminFraudApi.updateFlagStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      alert('Flag status updated.');
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminFraudApi.blockUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User blocked successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to block user.');
    },
  });

  const blockDriverMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminFraudApi.blockDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      alert('Driver blocked successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to block driver.');
    },
  });

  const saveThresholdsMutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminFraudApi.updateThresholds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-thresholds'] });
      alert('Threshold configurations saved successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save threshold configs.');
    },
  });

  const handleStatusChange = (id: number, status: 'OPEN' | 'INVESTIGATED' | 'DISMISSED') => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleBlockUser = (id: number) => {
    const reason = window.prompt('Provide a reason for blocking this customer user account:');
    if (reason && reason.trim()) {
      blockUserMutation.mutate({ id, reason });
    }
  };

  const handleBlockDriver = (id: number) => {
    const reason = window.prompt('Provide a reason for blocking this driver partner account:');
    if (reason && reason.trim()) {
      blockDriverMutation.mutate({ id, reason });
    }
  };

  const handleThresholdSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveThresholdsMutation.mutate(thresholdsForm);
  };

  // Columns for Flags Table
  const flagColumns: Column<FraudFlagResponse>[] = [
    {
      key: 'userId',
      label: 'Target User',
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 block">Account Ref: #{row.userId}</span>
          {row.orderId && <span className="text-xs text-indigo-600 font-semibold block">Order Ref: #{row.orderId}</span>}
        </div>
      ),
    },
    {
      key: 'flagType',
      label: 'Flag Type',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.flagType}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      sortable: true,
      render: (row) => {
        let textClass = 'text-green-600';
        if (row.riskScore >= 75) textClass = 'text-rose-600 font-bold';
        else if (row.riskScore >= 40) textClass = 'text-amber-600';
        return <span className={textClass}>{row.riskScore} / 100</span>;
      },
    },
    {
      key: 'details',
      label: 'Alert Details',
      render: (row) => <span className="text-xs text-gray-500 font-medium line-clamp-1">{row.details}</span>,
    },
    {
      key: 'flaggedAt',
      label: 'Detected',
      sortable: true,
      render: (row) => format(new Date(row.flaggedAt), 'dd MMM yyyy, hh:mm a'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value as any)}
          className={`text-xs font-semibold rounded px-2.5 py-1 border focus:ring-0 ${
            row.status === 'OPEN'
              ? 'bg-rose-50 border-rose-100 text-rose-700 font-bold'
              : row.status === 'INVESTIGATED'
              ? 'bg-sky-50 border-sky-100 text-sky-700 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <option value="OPEN">OPEN</option>
          <option value="INVESTIGATED">INVESTIGATED</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>
      ),
    },
    {
      key: 'actions',
      label: 'Security Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleBlockUser(row.userId)}
            className="flex items-center gap-1 bg-white hover:bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[10px] px-2 py-1 rounded-lg transition-all"
            title="Block User account"
          >
            <Ban className="h-3 w-3" /> User
          </button>
          <button
            onClick={() => handleBlockDriver(row.userId)}
            className="flex items-center gap-1 bg-white hover:bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[10px] px-2 py-1 rounded-lg transition-all"
            title="Block Driver profile"
          >
            <Ban className="h-3 w-3" /> Driver
          </button>
        </div>
      ),
    },
  ];

  // Columns for Audit Logs Table
  const auditColumns: Column<FraudAuditLog>[] = [
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
          {row.action}
        </span>
      ),
    },
    {
      key: 'performedBy',
      label: 'Admin Agent',
      sortable: true,
      render: (row) => <span className="text-slate-500 font-semibold">{row.performedBy}</span>,
    },
    {
      key: 'target',
      label: 'Target Entity',
      render: (row) => (
        <span className="text-gray-900 font-medium">
          {row.targetType} #{row.targetId}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'DetailsLog',
      render: (row) => <span className="text-xs text-gray-500 font-medium">{row.details}</span>,
    },
    {
      key: 'createdAt',
      label: 'Log Date',
      sortable: true,
      render: (row) => format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Fraud Prevention Hub</h2>
          <p className="text-sm text-gray-500 font-medium">Review suspicious transaction reports and configure risk scoring thresholds</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-150/60 p-1 rounded-xl border border-gray-100 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ALERTS'
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Fraud Alerts
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="h-4 w-4" /> Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('THRESHOLDS')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'THRESHOLDS'
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Settings className="h-4 w-4" /> Threshold Config
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Open Flags"
          value={statsResponse?.data ? statsResponse.data.totalOpenFlags : '0'}
          icon={ShieldAlertIcon}
          loading={loadingStats}
          iconColorClass="text-rose-600 bg-rose-50"
        />
        <StatCard
          title="Investigated Flags"
          value={statsResponse?.data ? statsResponse.data.totalInvestigatedFlags : '0'}
          icon={CheckCircle}
          loading={loadingStats}
          iconColorClass="text-sky-600 bg-sky-50"
        />
        <StatCard
          title="Blocked Users"
          value={statsResponse?.data ? statsResponse.data.blockedUsersCount : '0'}
          icon={Ban}
          loading={loadingStats}
          iconColorClass="text-slate-600 bg-slate-100"
        />
        <StatCard
          title="Blocked Drivers"
          value={statsResponse?.data ? statsResponse.data.blockedDriversCount : '0'}
          icon={AlertOctagon}
          loading={loadingStats}
          iconColorClass="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Dynamic Tab Body */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          {/* Status filter selection */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm text-xs text-gray-600 font-semibold">
              <span>Status:</span>
              <select
                value={alertsFilter}
                onChange={(e) => {
                  setAlertsFilter(e.target.value as any);
                  setAlertsPage(0);
                }}
                className="bg-transparent border-none p-0 focus:ring-0 text-indigo-600 font-bold cursor-pointer text-xs"
              >
                <option value="">ALL FLAGS</option>
                <option value="OPEN">OPEN</option>
                <option value="INVESTIGATED">INVESTIGATED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={flagColumns}
            data={flagsResponse?.data?.content || []}
            loading={loadingFlags}
            currentPage={alertsPage}
            totalPages={flagsResponse?.data?.totalPages || 1}
            onPageChange={setAlertsPage}
            totalElements={flagsResponse?.data?.totalElements || 0}
            emptyMessage="No security fraud flags detected."
          />
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <DataTable
          columns={auditColumns}
          data={auditResponse?.data?.content || []}
          loading={loadingAudit}
          currentPage={auditPage}
          totalPages={auditResponse?.data?.totalPages || 1}
          onPageChange={setAuditPage}
          totalElements={auditResponse?.data?.totalElements || 0}
          emptyMessage="No security audit records logged."
        />
      )}

      {activeTab === 'THRESHOLDS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left max-w-2xl">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-500" />
            Platform Fraud Scoring Thresholds
          </h3>
          <p className="text-xs text-gray-400 font-medium mt-1 mb-6">
            Configure risk evaluation triggers. Changes apply dynamically to incoming orders.
          </p>

          {loadingThresholds ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-10 bg-gray-100 rounded w-full"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
          ) : (
            <form onSubmit={handleThresholdSave} className="space-y-5">
              <div className="space-y-4">
                {Object.keys(thresholdsForm).map((key) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
                    <div>
                      <span className="font-bold text-gray-800 text-sm block capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={thresholdsForm[key]}
                      onChange={(e) =>
                        setThresholdsForm({
                          ...thresholdsForm,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full sm:w-40 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 font-bold text-right"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saveThresholdsMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {saveThresholdsMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save Thresholds
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default FraudPage;
