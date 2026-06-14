import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../../api/admin-users.api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { ArrowLeft, User, Mail, Phone, Calendar, ShieldAlert, Check, X, ShieldX, Key, Loader2 } from 'lucide-react';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const userId = Number(id);

  // Profile Edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Ban modal state
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  // 1. Fetch User details
  const { data: userResponse, isLoading, error } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminUsersApi.getUser(userId),
    enabled: !isNaN(userId),
  });

  const user = userResponse?.data;

  // Initialize fields on load
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsActive(user.isActive);
    }
  }, [user]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; email: string; isActive: boolean }) =>
      adminUsersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User profile updated successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update user profile.');
    },
  });

  const banMutation = useMutation({
    mutationFn: (reason: string) => adminUsersApi.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      setShowBanModal(false);
      setBanReason('');
      alert('User account has been banned.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to ban user account.');
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      updateMutation.mutate({ name, email, isActive });
    }
  };

  const handleBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (banReason.trim()) {
      banMutation.mutate(banReason);
    }
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

  if (error || !user) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
        <p className="text-gray-550 font-semibold">Error loading user details. Account might have been deleted or invalid.</p>
        <Link to="/users" className="mt-4 inline-flex items-center gap-2 text-teal-600 font-bold text-xs hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Users list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Back button */}
      <div>
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-gray-550 hover:text-gray-900 font-bold text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
      </div>

      {/* User Title Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.name}</h2>
            <StatusBadge status={user.role} />
            <StatusBadge status={user.isActive} />
            {user.isBanned && <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">BANNED</span>}
          </div>
          <p className="text-xs text-gray-400 font-bold tracking-wider mt-1 uppercase">
            Registered on: {format(new Date(user.createdAt), 'dd MMM yyyy')}
          </p>
        </div>

        {/* Ban quick-action button */}
        {!user.isBanned ? (
          <button
            onClick={() => setShowBanModal(true)}
            className="bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ShieldX className="h-4 w-4" /> Ban Account
          </button>
        ) : (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold max-w-sm">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Reason: {user.banReason || 'Banned by administrator policy.'}</span>
          </div>
        )}
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Detail & Edit form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Update Profile</h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Toggle active switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-800">Account Active State</p>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Toggle status to temporarily activate or disable login rights.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Key Info Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Account Reference</h3>

            <div className="space-y-4 text-sm font-semibold text-gray-600">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase leading-none font-semibold">User reference</span>
                  <span className="text-gray-900 mt-1 block font-bold">ID #{user.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase leading-none font-semibold">Phone reference</span>
                  <span className="text-gray-900 mt-1 block font-bold">{user.phone || 'No phone registered'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase leading-none font-semibold">Last Logged In</span>
                  <span className="text-gray-900 mt-1 block font-bold">
                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd MMM yyyy, hh:mm a') : 'Never logged in'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ban account modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-gray-100 animate-scaleUp text-left">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Ban User Account
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Banning disables this account and logs the specific reason below. The user will be notified of this restriction.
            </p>

            <form onSubmit={handleBanSubmit} className="mt-4 space-y-4">
              <textarea
                required
                placeholder="Violated platform policies or commercial terms..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 bg-gray-55 text-gray-600 hover:bg-gray-100 font-semibold text-xs rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={banMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {banMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Confirm Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserDetailPage;
