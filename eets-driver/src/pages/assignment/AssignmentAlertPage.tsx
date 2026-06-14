import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, IndianRupee, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { driverApi } from '../../api/driver.api';
import { useAssignmentStore } from '../../store/assignment.store';
import { useAssignment } from '../../hooks/useAssignment';

export const AssignmentAlertPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAssignment, setCurrentAssignment } = useAssignmentStore();
  const { stopAlertSound } = useAssignment();

  // Retrieve assignment passed from navigation state or fallback to global store
  const routeAssignment = location.state?.assignment || currentAssignment;
  
  const [countdown, setCountdown] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Fetch full order details if needed (for restaurant and customer addresses)
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    if (routeAssignment?.orderId) {
      driverApi
        .getOrderDetails(routeAssignment.orderId)
        .then((res) => {
          setOrderInfo(res.data);
        })
        .catch((err) => {
          console.error('Failed to load order details for alert page', err);
        });
    }
  }, [routeAssignment]);

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto reject on timeout
          handleRejectSubmit('Timeout - No Response');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Cleanup alert sound when page unmounts
  useEffect(() => {
    return () => {
      stopAlertSound();
    };
  }, []);

  const handleAccept = async () => {
    if (!routeAssignment) return;
    setLoading(true);
    stopAlertSound();
    try {
      const res = await driverApi.acceptAssignment(routeAssignment.id);
      setCurrentAssignment(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to accept assignment', err);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!routeAssignment) return;
    setRejecting(true);
    stopAlertSound();
    try {
      await driverApi.rejectAssignment(routeAssignment.id, reason || 'Declined by partner');
      setCurrentAssignment(null);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to reject assignment', err);
      navigate('/', { replace: true });
    } finally {
      setRejecting(false);
      setShowRejectModal(false);
    }
  };

  if (!routeAssignment) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white px-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">No active assignment found</h2>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2.5 bg-primary rounded-xl font-bold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Get addresses from routeAssignment or orderInfo API fallback
  const restaurantName = orderInfo?.restaurantName || 'Restaurant';
  const restaurantAddress = orderInfo?.restaurantName ? `${orderInfo.restaurantName}, Delivery Zone` : 'Fetching Address...';
  const customerAddress = orderInfo?.deliveryAddress?.addressLine || 'Fetching Address...';
  const earnings = routeAssignment.earnings;
  const distance = routeAssignment.distanceKm || routeAssignment.routeDistanceKm || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 text-white flex flex-col justify-between p-6 select-none overflow-y-auto">
      
      {/* 1. Header & Pulse Timer */}
      <div className="text-center pt-8">
        <span className="text-xs text-orange-400 font-extrabold uppercase tracking-widest block mb-1">
          New Delivery Offer
        </span>
        <h1 className="text-3xl font-black tracking-tight mb-6">Order Assigned</h1>
        
        {/* Pulsing timer */}
        <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-primary/30" />
          <div className="absolute inset-2 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-4xl font-black tracking-tight text-white z-10">
            {countdown}s
          </span>
        </div>
        <p className="text-xs text-gray-400">Accept before timer expires</p>
      </div>

      {/* 2. Order Route Details */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 my-6 space-y-5">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Payout</span>
            <span className="text-3xl font-black text-primary flex items-baseline mt-1">
              <IndianRupee className="w-5 h-5 mr-0.5" />
              {Number(earnings).toFixed(0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Distance</span>
            <span className="text-base font-bold text-white block mt-1">
              {Number(distance).toFixed(1)} km
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pickup Address */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-orange-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pickup Restaurant</span>
              <span className="text-sm font-bold text-white block mt-0.5">{restaurantName}</span>
              <span className="text-xs text-gray-400 block mt-0.5 leading-relaxed">{restaurantAddress}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Delivery Destination</span>
              <span className="text-xs text-white block mt-0.5 leading-relaxed">{customerAddress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleAccept}
          disabled={loading || rejecting}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all text-base"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" /> ACCEPT ASSIGNMENT
            </>
          )}
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading || rejecting}
          className="w-full h-12 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-gray-300 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <X className="w-4 h-4" /> DECLINE OFFER
        </button>
      </div>

      {/* Decline Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Decline Order</h3>
              <p className="text-xs text-gray-400 mt-1">Please select or type the reason for declining this order</p>
            </div>

            <div className="space-y-2">
              {['Too far from my location', 'Vehicle breakdown / Fuel issue', 'Heavy rain / Bad weather', 'Emergency break', 'Other reason'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-semibold border transition-all ${
                    rejectReason === reason
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl text-xs font-bold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectReason || 'Declined by partner')}
                disabled={rejecting}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {rejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Decline'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignmentAlertPage;
