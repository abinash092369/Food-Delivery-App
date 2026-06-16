import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVendorAuthStore } from '../store/vendor-auth.store';
import { vendorRestaurantApi } from '../api/vendor-restaurant.api';
import { Sidebar } from './Sidebar';
import { Loader2, AlertCircle, Clock, ShieldAlert, LogOut, CheckCircle, Power, Menu, LayoutDashboard, ShoppingBag, TrendingUp, Settings } from 'lucide-react';

export const VendorLayout: React.FC = () => {
  const token = useVendorAuthStore((state) => state.token);
  const logout = useVendorAuthStore((state) => state.logout);
  const setRestaurant = useVendorAuthStore((state) => state.setRestaurant);
  const restaurant = useVendorAuthStore((state) => state.restaurant);
  const user = useVendorAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isSettingsPath = location.pathname === '/settings';

  // Redirect to login if token is missing
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Fetch restaurant details using TanStack Query
  const { data: restaurantData, isLoading, isFetching, error } = useQuery({
    queryKey: ['restaurant-profile'],
    queryFn: async () => {
      const res = await vendorRestaurantApi.getRestaurant();
      if (!res.success) {
        throw new Error(res.message || 'Failed to fetch restaurant profile');
      }
      return res.data;
    },
    refetchInterval: 60000, // Sync profile status every 1 minute
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  // Log profile query response
  useEffect(() => {
    if (restaurantData) {
      console.log('[VENDOR_STATUS_PROFILE_RESPONSE]', restaurantData);
    }
  }, [restaurantData]);

  // Normalize backend isOpen status
  const rAny = restaurantData as any;
  const backendIsOpen = rAny ? (
    rAny.isOpen === true ||
    rAny.is_open === true ||
    rAny.isOpen === 1 ||
    rAny.is_open === 1 ||
    rAny.isOpen === 'true' ||
    rAny.is_open === 'true'
  ) : undefined;

  // Derive initial status from store
  const storeAny = restaurant as any;
  const storeIsOpen = storeAny ? (
    storeAny.isOpen === true ||
    storeAny.is_open === true ||
    storeAny.isOpen === 1 ||
    storeAny.is_open === 1 ||
    storeAny.isOpen === 'true' ||
    storeAny.is_open === 'true'
  ) : undefined;

  // Keep track of the last known status to prevent defaulting undefined to false
  const [lastKnownIsOpen, setLastKnownIsOpen] = useState<boolean | undefined>(storeIsOpen);

  useEffect(() => {
    if (backendIsOpen !== undefined) {
      setLastKnownIsOpen(backendIsOpen);
    }
  }, [backendIsOpen]);

  // Log derived status
  useEffect(() => {
    console.log('[VENDOR_STATUS_DERIVED] backendIsOpen:', backendIsOpen, 'lastKnownIsOpen:', lastKnownIsOpen);
  }, [backendIsOpen, lastKnownIsOpen]);

  const isApprovedValue = (r: any) =>
    r?.isApproved === true ||
    r?.is_approved === true ||
    r?.is_approved === 1 ||
    r?.approved === true ||
    r?.approved === 1;

  const backendApproved = isApprovedValue(restaurantData);
  const storeApproved = isApprovedValue(restaurant);

  const [hasEverBeenApproved, setHasEverBeenApproved] = useState(() => {
    return backendApproved || storeApproved;
  });

  const explicitNotApproved = restaurantData !== undefined && (
    restaurantData.isApproved === false ||
    (restaurantData as any).is_approved === false ||
    (restaurantData as any).is_approved === 0 ||
    (restaurantData as any).approved === false ||
    (restaurantData as any).approved === 0
  );

  useEffect(() => {
    if (backendApproved || storeApproved) {
      setHasEverBeenApproved(true);
    } else if (explicitNotApproved) {
      setHasEverBeenApproved(false);
    }
  }, [backendApproved, storeApproved, explicitNotApproved]);

  const finalIsApproved =
    backendApproved ||
    storeApproved ||
    hasEverBeenApproved;

  // Sync with Zustand store when data changes, prevent overwriting store during refetch with empty/partial response
  useEffect(() => {
    if (restaurantData && (restaurantData.id || restaurantData.name)) {
      setRestaurant(restaurantData);
    }
  }, [restaurantData, setRestaurant]);

  // Mutation for setting status
  const toggleMutation = useMutation({
    mutationFn: (target: boolean) => vendorRestaurantApi.setStatus(target),
    onSuccess: (res) => {
      console.log('[VENDOR_STATUS_TOGGLE_RESPONSE]', res);
      if (res.success && res.data) {
        // Update local state in cache
        queryClient.setQueryData(['restaurant-profile'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isOpen: res.data.isOpen,
          };
        });

        // Sync store immediately if cache is available
        const currentCached = queryClient.getQueryData<any>(['restaurant-profile']);
        if (currentCached) {
          setRestaurant(currentCached);
        }

        // Invalidate/refetch vendor restaurant profile query
        queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
      }
    },
  });

  const isProfileLoading = isLoading || !restaurantData;
  const isTogglePending = toggleMutation.isPending;
  const isButtonDisabled = isProfileLoading || isTogglePending || lastKnownIsOpen === undefined;

  const handleToggleClick = () => {
    if (isButtonDisabled) return;
    console.log('[VENDOR_STATUS_TOGGLE_CLICK]');
    const targetStatus = !lastKnownIsOpen;
    console.log('[VENDOR_STATUS_TOGGLE_TARGET] targetStatus:', targetStatus);
    toggleMutation.mutate(targetStatus);
  };

  // Determine gate decision for logging
  let gateDecision = 'LAYOUT';
  if (isLoading || isFetching || !restaurantData) {
    if (finalIsApproved || hasEverBeenApproved) {
      gateDecision = 'LAYOUT_LOADING_FAST_PASS';
    } else {
      gateDecision = 'LOADING_SCREEN';
    }
  } else if (!finalIsApproved && !isLoading && !isFetching && restaurantData && !isSettingsPath) {
    gateDecision = restaurantData.rejectionReason ? 'REJECTED_SCREEN' : 'PENDING_SCREEN';
  }

  console.log('[VENDOR_GATE_ROUTE_CHANGE]', {
    currentPath: location.pathname,
    restaurantData: restaurantData ? { id: restaurantData.id, isApproved: restaurantData.isApproved } : null,
    storeRestaurant: restaurant ? { id: restaurant.id, isApproved: restaurant.isApproved } : null,
    isLoading,
    isFetching,
    backendApproved,
    storeApproved,
    hasEverBeenApproved,
    finalIsApproved,
    gateDecision
  });

  // Gate check during loading/fetching
  if (isLoading || isFetching || !restaurantData) {
    if (finalIsApproved || hasEverBeenApproved) {
      // Fast pass: render main app normally to avoid flickering
    } else {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-mutedColor">Checking restaurant status...</p>
        </div>
      );
    }
  }

  // Redirect to Settings if the restaurant profile is incomplete (draft setup)
  const isDraft = !finalIsApproved && (!restaurantData?.fssaiLicense || !restaurantData?.addressLine);
  if (isDraft && !isSettingsPath) {
    return <Navigate to="/settings" replace />;
  }


  // Handle load errors
  if (error && !finalIsApproved && !hasEverBeenApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 stroke-[1.5]" />
        <h2 className="text-xl font-bold text-textMain">Failed to Load Profile</h2>
        <p className="text-sm text-mutedColor max-w-md">
          There was an error loading your restaurant details. Please make sure the backend server is running and try again.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover shadow-md shadow-primary/10 transition-colors"
          >
            Retry Connection
          </button>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-white border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const pendingRestaurantName = restaurant?.name || restaurantData?.name || user?.restaurantName || "Your Restaurant";

  // Gate check: Pending Approval (finalIsApproved = false, rejectionReason is null/empty)
  if (!finalIsApproved && !restaurantData?.rejectionReason && !isSettingsPath) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-surface p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-textMain">Approval Pending</h2>
            <p className="text-sm text-mutedColor leading-relaxed">
              Your restaurant <strong>"{pendingRestaurantName}"</strong> has been registered successfully and is currently under review by our administration team.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-4 h-4" /> Next Steps:
            </h4>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
              <li>Verification of FSSAI License: <code>{restaurantData?.pincode || ""}</code></li>
              <li>Verification of GSTIN details (if provided)</li>
              <li>Menu synchronization and setup</li>
            </ul>
          </div>
          <p className="text-xs text-mutedColor">We will notify you via email as soon as your account is approved.</p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] })}
              className="px-6 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Refresh Status
            </button>
            <button
              onClick={logout}
              className="px-6 py-2 bg-gray-100 text-textMain text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate check: Rejected (finalIsApproved = false, rejectionReason is present)
  if (!finalIsApproved && restaurantData?.rejectionReason && !isSettingsPath) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-surface p-8 rounded-2xl border border-red-100 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-textMain">Registration Rejected</h2>
            <p className="text-sm text-mutedColor leading-relaxed">
              Unfortunately, your restaurant registration has been rejected by our administration team.
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left">
            <h4 className="text-xs font-bold text-red-800 mb-1">Rejection Reason:</h4>
            <p className="text-xs text-red-700 leading-relaxed font-semibold">
              {restaurantData?.rejectionReason || "No reason specified."}
            </p>
          </div>
          <p className="text-xs text-mutedColor">
            Please log out, update your registration parameters, or contact support if you believe this is an error.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Update Restaurant Info
            </button>
            <button
              onClick={logout}
              className="px-6 py-2 bg-gray-100 text-textMain text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approved state / Settings path: layout with sidebar and main content pane
  return (
    <div className="min-h-screen bg-background flex">
      {/* Collapsible Sidebar Drawer overlay for Mobile/Tablet */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface h-full shadow-xl z-50">
            <Sidebar closeDrawer={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Navigation Sidebar (Desktop only) */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-100 bg-surface flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              type="button"
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-textMain capitalize whitespace-normal">
              {user?.name ? `Welcome Back, ${user.name}!` : 'Welcome Back!'}
            </h2>
          </div>

          {/* Restaurant Status Bar (Open/Closed toggle) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden xs:flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                isProfileLoading && lastKnownIsOpen === undefined
                  ? 'bg-amber-400 animate-pulse'
                  : lastKnownIsOpen
                    ? 'bg-success animate-pulse'
                    : 'bg-gray-300'
              }`} />
              <span className="text-xs font-semibold text-mutedColor">
                {isProfileLoading && lastKnownIsOpen === undefined
                  ? 'Syncing...'
                  : lastKnownIsOpen
                    ? 'Open'
                    : 'Closed'}
              </span>
            </div>

            <button
              onClick={handleToggleClick}
              disabled={isButtonDisabled}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isProfileLoading
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : lastKnownIsOpen
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-primary-light text-primary hover:bg-primary/10 border border-primary/20'
              }`}
            >
              {isButtonDisabled ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>
                {isProfileLoading
                  ? 'Syncing...'
                  : lastKnownIsOpen
                    ? 'Go Offline'
                    : 'Go Online'}
              </span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          {[
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Orders', path: '/orders', icon: ShoppingBag },
            { label: 'Menu', path: '/menu', icon: Menu },
            { label: 'Analytics', path: '/analytics', icon: TrendingUp },
            { label: 'Settings', path: '/settings', icon: Settings },
          ].map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={index}
                to={item.path}
                className="flex-grow flex justify-center focus:outline-none"
              >
                <div className="flex flex-col items-center justify-center gap-1 w-12 py-1">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? 'text-primary scale-110' : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive ? 'text-primary font-bold' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
