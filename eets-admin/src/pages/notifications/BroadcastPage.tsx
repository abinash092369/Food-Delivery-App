import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminNotificationsApi, BroadcastNotificationPayload } from '../../api/admin-notifications.api';
import { Send, Bell, Smartphone, User, Users, ShieldAlert, Loader2 } from 'lucide-react';

export const BroadcastPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CUSTOMER' | 'DRIVER' | 'VENDOR'>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutation
  const broadcastMutation = useMutation({
    mutationFn: (payload: BroadcastNotificationPayload) => adminNotificationsApi.broadcast(payload),
    onSuccess: (res) => {
      setSuccessMessage(res.data?.message || 'Broadcast push notification sent successfully.');
      setErrorMessage(null);
      // Reset form
      setTitle('');
      setBody('');
      setTargetRole('ALL');
      // Clear toast after 5s
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch broadcast. Verify connection.');
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!title.trim() || !body.trim()) {
      setErrorMessage('Please enter both a title and a notification body.');
      return;
    }

    const payload: BroadcastNotificationPayload = {
      title: title.trim(),
      body: body.trim(),
      type: 'PROMO', // default custom routing type
    };

    if (targetRole !== 'ALL') {
      payload.targetRoles = [targetRole];
    }

    broadcastMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title block */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Broadcast Push Alerts</h2>
        <p className="text-sm text-gray-500 font-medium">Send push notifications to all users or target specific user roles</p>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-100 shadow-sm animate-fadeIn">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-xl border border-rose-100 shadow-sm animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {/* Main Form + Preview Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Create Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-500" />
            Build Push Notification
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Audience Role</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'All Users', val: 'ALL', icon: Users },
                  { label: 'Customers', val: 'CUSTOMER', icon: User },
                  { label: 'Drivers', val: 'DRIVER', icon: Smartphone },
                  { label: 'Vendors', val: 'VENDOR', icon: Bell },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTargetRole(item.val as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all gap-1.5 ${
                      targetRole === item.val
                        ? 'border-teal-600 bg-teal-50/50 text-teal-600 font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-[10px] leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alert Title</label>
              <input
                type="text"
                required
                placeholder="Delicious weekend offers inside! 😋"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notification Body</label>
              <textarea
                required
                placeholder="Order from your favorite restaurants this weekend and get up to 50% discount. Grab the deal now!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                rows={5}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
              />
              <div className="text-[10px] font-semibold text-gray-400 text-right mt-0.5">
                {body.length} / 1000 characters
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={broadcastMutation.isPending || !title.trim() || !body.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Dispatch Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Mock Phone Preview */}
        <div className="flex justify-center shrink-0">
          <div className="bg-slate-900 border-8 border-slate-950 rounded-[40px] w-full max-w-[320px] aspect-[9/18.5] p-3 shadow-2xl relative flex flex-col items-center">
            {/* Camera notch */}
            <div className="h-5 w-24 bg-slate-950 rounded-full absolute top-1.5 z-30 shadow-inner"></div>

            {/* Screen Wallpaper */}
            <div className="w-full h-full bg-gradient-to-b from-teal-900 via-teal-955 to-slate-950 rounded-[30px] p-4 flex flex-col justify-start relative overflow-hidden select-none">
              {/* Wallpaper curves */}
              <div className="absolute top-1/4 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl"></div>
              <div className="absolute bottom-1/4 -right-10 h-40 w-40 rounded-full bg-teal-600/10 blur-2xl"></div>

              {/* Status bar */}
              <div className="flex justify-between items-center text-[10px] text-white/80 font-bold px-1.5 shrink-0 z-10">
                <span>12:00</span>
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Push notification overlay */}
              <div className="mt-8 w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-lg flex items-start gap-2.5 animate-bounce z-20">
                <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shrink-0 text-[10px] font-extrabold font-mono shadow-sm">
                  EETS
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-extrabold text-white text-[11px] leading-tight truncate">
                      {title.trim() || 'Notification Title'}
                    </h5>
                    <span className="text-[9px] text-white/50 shrink-0 font-medium">now</span>
                  </div>
                  <p className="text-[10px] text-white/80 font-medium leading-tight mt-1 break-words line-clamp-3">
                    {body.trim() || 'This is how your message will appear on devices. Fill the alert body field to preview.'}
                  </p>
                </div>
              </div>

              {/* Phone middle filler */}
              <div className="flex-1 flex flex-col justify-center items-center opacity-30 shrink-0 z-10 text-white/80 select-none">
                <p className="text-2xl font-bold font-sans">EETS</p>
                <p className="text-[10px] tracking-widest font-semibold uppercase mt-1">Indian Food Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BroadcastPage;
