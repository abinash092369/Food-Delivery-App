import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import { useAssignmentStore } from '../../store/assignment.store';
import { driverApi } from '../../api/driver.api';
import OnlineToggle from '../../components/shared/OnlineToggle';
import ActiveDeliveryPage from '../assignment/ActiveDeliveryPage';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Truck,
  ShieldCheck,
  Loader2,
  MapPin,
  Compass
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { driver, setDriver } = useDriverAuthStore();
  const { isOnline, setIsOnline, currentAssignment, setCurrentAssignment } = useAssignmentStore();

  const [accepting, setAccepting] = React.useState(false);
  const [declining, setDeclining] = React.useState(false);
  const [orderInfo, setOrderInfo] = React.useState<any>(null);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  React.useEffect(() => {
    if (isOnline && currentAssignment && currentAssignment.status === 'ASSIGNED') {
      console.log('[DRIVER_ASSIGNMENT_RENDERED] Rendered incoming delivery offer. Assignment ID:', currentAssignment.id);
      driverApi.getOrderDetails(currentAssignment.orderId)
        .then((res) => {
          setOrderInfo(res.data);
        })
        .catch((err) => {
          console.error('Failed to load order details on dashboard', err);
        });
    } else {
      setOrderInfo(null);
    }
  }, [currentAssignment, isOnline]);

  // Redirect to active assignment page if assignment accepted or picked up
  React.useEffect(() => {
    if (
      currentAssignment &&
      (currentAssignment.status === 'ACCEPTED' || currentAssignment.status === 'PICKED_UP')
    ) {
      navigate('/assignment/active', { replace: true });
    }
  }, [currentAssignment, navigate]);

  // Log assignment render trace
  React.useEffect(() => {
    if (isOnline && currentAssignment && currentAssignment.status === 'ASSIGNED') {
      console.log('[DRIVER_ASSIGNMENT_RENDERED] orderId=' + currentAssignment.orderId + ' driverId=' + (driver?.id || ''));
    }
  }, [currentAssignment, isOnline, driver]);

  // Fetch earnings/today stats
  const { data: earningsRes, refetch: refetchEarnings } = useQuery({
    queryKey: ['todayEarnings'],
    queryFn: async () => {
      const res = await driverApi.getEarnings();
      return res.data;
    },
    enabled: !!driver,
  });

  const handleAccept = async () => {
    if (!currentAssignment) return;
    setAccepting(true);
    console.log('[Accept Clicked] Current assignment ID:', currentAssignment.id);
    try {
      const res = await driverApi.acceptAssignment(currentAssignment.id);
      console.log('[Accept Success] Assignment accepted:', res.data);
      setCurrentAssignment(res.data);
    } catch (err: any) {
      console.error('[Accept Failed] Error accepting assignment:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to accept delivery';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!currentAssignment) return;
    setDeclining(true);
    console.log('[Decline Clicked] Current assignment ID:', currentAssignment.id);
    try {
      await driverApi.rejectAssignment(currentAssignment.id, 'Declined by partner on dashboard');
      console.log('[Decline Success] Assignment rejected/declined');
      setCurrentAssignment(null);
    } catch (err: any) {
      console.error('[Decline Failed] Error declining assignment:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to decline offer';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setDeclining(false);
    }
  };



  const handleToggleOnline = async (newOnline: boolean) => {
    try {
      const res = await driverApi.toggleOnlineStatus(newOnline);
      // Backend returns { isOnline: boolean }
      setIsOnline(res.data.isOnline);
      
      // Update local profile store
      if (driver) {
        const updated = { ...driver, isOnline: res.data.isOnline };
        setDriver(updated);
      }
      refetchEarnings();
    } catch (e: any) {
      console.error('Failed to toggle shift status', e);
    }
  };

  const deliveriesToday = earningsRes?.deliveriesToday ?? 0;
  const earningsToday = earningsRes?.earningsToday ?? 0;
  const incentiveProgress = earningsRes?.incentiveProgress;

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 border border-red-500 animate-bounce">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white font-extrabold text-sm">&times;</button>
        </div>
      )}

      {/* 2b. Available/Assigned Orders Section */}
      {isOnline && currentAssignment && currentAssignment.status === 'ASSIGNED' && (
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 border border-primary/30 text-white rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="text-left">
              <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest block">
                New Delivery Offer {currentAssignment.orderNumber ? `#${currentAssignment.orderNumber}` : ''}
              </span>
              <span className="text-2xl font-black text-primary flex items-baseline mt-1">
                <IndianRupee className="w-5 h-5 mr-0.5 text-primary" />
                {Number(currentAssignment.earnings || currentAssignment.earningsAmount || 0).toFixed(0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Distance</span>
              <span className="text-base font-bold text-white block mt-1">
                {Number(currentAssignment.distanceKm || currentAssignment.routeDistanceKm || 0).toFixed(1)} km
              </span>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pickup Restaurant</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {orderInfo?.restaurantName || 'Loading...'}
                </span>
                <span className="text-xs text-gray-450 block mt-0.5 leading-relaxed">
                  {orderInfo?.restaurantAddress || orderInfo?.restaurantName || 'Fetching address...'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Delivery Destination</span>
                <span className="text-xs text-white block mt-0.5 leading-relaxed">
                  {orderInfo?.deliveryAddress?.addressLine || 'Fetching address...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDecline}
              disabled={accepting || declining}
              className="flex-1 h-12 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-gray-300 rounded-2xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              {declining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decline Offer'}
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting || declining}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black transition-all text-xs flex items-center justify-center gap-1.5"
            >
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept Delivery'}
            </button>
          </div>
        </div>
      )}

      {/* 1. Account Status Banner */}
      {driver && !driver.isVerified && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold tracking-tight">Account Under Review</h4>
            <p className="text-xs text-amber-650 mt-1 leading-relaxed">
              Your onboarding documents (Aadhaar, License, RC) are being verified by our team. You will be able to go online once approved.
            </p>
          </div>
        </div>
      )}

      {driver && driver.isVerified && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold tracking-tight">Verified Delivery Partner</h4>
            <p className="text-xs text-emerald-650 mt-1">
              Your account is active. Turn on your shift below to receive orders.
            </p>
          </div>
        </div>
      )}

      {/* 2. Big Shift Toggle */}
      <OnlineToggle
        isOnline={isOnline}
        onToggle={handleToggleOnline}
        disabled={driver ? !driver.isVerified : true}
      />

      {isOnline && (!currentAssignment || currentAssignment.status !== 'ASSIGNED') && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-light border border-primary/10 flex items-center justify-center text-primary mx-auto animate-pulse">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">No delivery requests yet</h4>
            <p className="text-xs text-gray-450 mt-1">
              You are online. Searching for nearby orders...
            </p>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 text-center shadow-sm">
          <p className="text-xs text-gray-400">
            You are currently offline. Turn on your shift above to start receiving delivery requests.
          </p>
        </div>
      )}

      {/* 3. Today's Performance Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Earnings Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today's Earnings</span>
            <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center text-primary">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-800 flex items-baseline">
              <span className="text-base font-extrabold mr-0.5">₹</span>
              {Number(earningsToday).toFixed(0)}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +100% since yesterday
            </span>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Deliveries</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-800">{deliveriesToday}</span>
            <span className="text-[10px] text-gray-400 block mt-1.5 font-medium">Completed orders</span>
          </div>
        </div>
      </div>

      {/* 4. Active Incentive Goal */}
      {incentiveProgress && (
        <div className="bg-gradient-to-r from-primary to-accent text-white p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black tracking-tight">Today's Payout Incentive</h4>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
              Bonus ₹{Number(incentiveProgress.bonusAmount).toFixed(0)}
            </span>
          </div>
          
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  (incentiveProgress.current / incentiveProgress.target) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          
          <p className="text-[10px] font-bold uppercase tracking-wider flex justify-between">
            <span>Completed: {incentiveProgress.current} / {incentiveProgress.target} orders</span>
            <span>
              {incentiveProgress.current >= incentiveProgress.target
                ? 'Target Met! Bonus unlocked.'
                : `${incentiveProgress.target - incentiveProgress.current} more for bonus`}
            </span>
          </p>
        </div>
      )}

      {/* 5. Assigned Vehicle Info */}
      {driver && (
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Registered Vehicle</span>
            <span className="text-xs font-bold text-gray-700 block">
              {driver.vehicleMake} {driver.vehicleModel} ({driver.vehicleType})
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block uppercase">
              Reg: {driver.vehicleRegNumber}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
