import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Bell, LogOut, MapPin, History } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useCartStore } from '../../store/cart.store'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../../api/notification.api'
import { toast } from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { useQueryClient } from '@tanstack/react-query'

import { useLocationStore } from '../../store/location.store'

export const Navbar: React.FC = () => {
  const routerLocation = useLocation()
  const { user, accessToken, logout } = useAuthStore()
  const { cart } = useCartStore()
  const { location, detectLocation, setLocation } = useLocationStore()
  const queryClient = useQueryClient()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: !!accessToken,
    refetchInterval: 15000, // Poll notifications every 15s
  })

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      // ignore
    } finally {
      logout()
      queryClient.clear()
      toast.success('Logged out successfully')
    }
  }

  const handleLocationClick = async () => {
    const choice = window.confirm("Would you like to auto-detect your current location?\n(Click Cancel to enter it manually)")
    if (choice) {
      await detectLocation(true)
    } else {
      const manual = window.prompt("Enter your city/locality name:", location?.name || "")
      if (manual !== null) {
        const finalName = manual.trim() || 'Select Location'
        setLocation({
          lat: location?.lat || null,
          lng: location?.lng || null,
          name: finalName,
          status: 'success',
        })
      }
    }
  }

  return (
    <header className="sticky top-0 bg-white/75 backdrop-blur-md border-b border-slate-100/50 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Logo, Text, Location Button */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-1">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <img src="/logo.jpg" alt="EETS Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shadow-sm" />
            <span className="text-xl sm:text-2xl font-heading font-extrabold text-primary tracking-wider hover:text-primary-hover transition-colors">EETS</span>
          </Link>

          {/* Location display placeholder */}
          <button
            onClick={handleLocationClick}
            type="button"
            className="flex items-center gap-1.5 text-xs text-mutedColor font-semibold hover:text-primary transition-all duration-300 cursor-pointer bg-slate-50 border border-slate-100 hover:border-teal-200/40 hover:bg-teal-50/20 px-3 py-1.5 sm:px-3 rounded-full shadow-sm max-w-[100px] min-[400px]:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-xs flex-shrink-1"
          >
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{location?.name || 'Select Location'}</span>
          </button>
        </div>

        {/* Middle Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* My Orders Button */}
          <Link
            to="/orders"
            className={`hidden sm:flex items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200 ${routerLocation.pathname === '/orders'
              ? 'text-primary bg-teal-50/50'
              : 'text-slate-600 hover:text-primary hover:bg-slate-50'
              }`}
            title="My Orders"
          >
            <History className="w-5 h-5" />
            <span className="hidden md:inline font-heading font-bold text-sm">My Orders</span>
          </Link>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className={`hidden sm:block relative p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-200 ${routerLocation.pathname === '/cart'
              ? 'text-primary bg-teal-50/50'
              : 'text-slate-600 hover:text-primary hover:bg-slate-50'
              }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          {accessToken && (
            <Link
              to="/notifications"
              className="relative p-2.5 hover:bg-gray-50 rounded-full text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadData && unreadData.count > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadData.count}
                </span>
              )}
            </Link>
          )}

          {/* User Menu */}
          {accessToken ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
              >
                <img
                  src={localStorage.getItem('customer_profile_photo') || user?.profileImageUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'}
                  alt={user?.name || 'User Profile'}
                  className="w-8 h-8 rounded-full object-cover border border-gray-100"
                />
                <span className="hidden md:inline font-heading font-semibold text-sm text-textMain">
                  {user?.name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-mutedColor hover:text-primary font-semibold text-xs sm:text-sm transition-colors px-1"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
export default Navbar
