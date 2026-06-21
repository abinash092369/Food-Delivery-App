import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../../api/order.api'
import { useOrderTracking } from '../../hooks/useOrderTracking'
import { OrderTracker } from '../../components/order/OrderTracker'
import { DriverMap } from '../../components/order/DriverMap'
import { ArrowLeft, Phone, User, Star, Loader2, Compass, AlertCircle } from 'lucide-react'

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  // Subscribe to live websocket updates
  const {
    status: liveStatus,
    estimatedDeliveryAt: liveEstTime,
    driverLocation,
    driverEta,
    connected: wsConnected,
  } = useOrderTracking(id)

  // Fetch full order details for destination coordinates & static info
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['orderDetail', id],
    queryFn: () => orderApi.getOrderById(id || ''),
    enabled: !!id,
    refetchInterval: wsConnected ? false : 10000,
  })

  // Countdown timer state
  const [countdown, setCountdown] = useState<string>('Calculating...')

  const currentStatus = liveStatus || order?.status || 'PENDING'
  const currentEstTime = liveEstTime || order?.estimatedDeliveryAt

  useEffect(() => {
    if (!currentEstTime) {
      setCountdown('No ETA available')
      return
    }

    const updateTimer = () => {
      const targetTime = new Date(currentEstTime).getTime()
      const now = new Date().getTime()
      const diff = targetTime - now

      if (diff <= 0) {
        setCountdown('Arriving shortly!')
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setCountdown(`${minutes}m ${seconds}s`)
    }

    updateTimer() // run once immediately
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [currentEstTime])

  if (isOrderLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Initializing order tracking...</span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4 stroke-1" />
        <h3 className="font-heading text-lg font-bold text-textMain">Order Not Found</h3>
        <p className="text-sm text-mutedColor mt-1">Please check the ID or return to orders history.</p>
        <Link to="/orders" className="mt-6 inline-flex bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm">
          Go to Orders History
        </Link>
      </div>
    )
  }

  // Check if driver details exist
  const driver = order.driver

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header back button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-mutedColor hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-textMain">Track Order</h1>
          <p className="text-sm text-mutedColor mt-1">
            Order <strong className="text-textMain">#{order.orderNumber}</strong> from{' '}
            <strong className="text-textMain">{order.restaurantName}</strong>
          </p>
        </div>

        {/* Live WS connection status pill */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-100 rounded-full shadow-sm text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-mutedColor">{wsConnected ? 'Connected to live updates' : 'Reconnecting...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column: Step tracker & Driver Card */}
        <div className="space-y-6">
          {/* Visual Step Tracker */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="font-heading font-bold text-textMain text-lg mb-6 border-b border-gray-50 pb-3">
              Delivery Status
            </h3>
            <OrderTracker status={currentStatus} />
          </div>

          {/* Driver details Card */}
          {driver && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <h3 className="font-heading font-bold text-textMain text-base mb-4 border-b border-gray-50 pb-3">
                Your Delivery Partner
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-sm text-textMain leading-tight">{driver.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-mutedColor">
                    {driver.vehicleType && <span className="capitalize">{driver.vehicleType}</span>}
                    {driver.vehicleNumber && <span>({driver.vehicleNumber})</span>}
                  </div>
                  {driver.avgRating && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{driver.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <a
                  href={`tel:${driver.phone}`}
                  className="bg-primary/10 hover:bg-primary/20 text-primary p-3 rounded-xl transition-colors"
                  title="Call Driver"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Map and ETA countdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Countdown & ETA banner */}
          {currentStatus !== 'CANCELLED' && currentStatus !== 'DELIVERED' && (
            <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Compass className="w-10 h-10 stroke-[1.5] animate-spin text-cyan-200" style={{ animationDuration: '6s' }} />
                <div>
                  <span className="text-[10px] text-cyan-100 font-bold uppercase tracking-wider block">Estimated Delivery</span>
                  <span className="text-2xl font-extrabold font-heading mt-0.5 block">{countdown}</span>
                </div>
              </div>
              {driverEta && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center self-start sm:self-auto text-xs font-semibold">
                  <span>Driver ETA: {driverEta}</span>
                </div>
              )}
            </div>
          )}

          {/* Map Display */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
            <h3 className="font-heading font-bold text-textMain text-base mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <span>Live Delivery Map</span>
            </h3>
            <DriverMap
              driverLat={driverLocation?.lat}
              driverLng={driverLocation?.lng}
              destLat={order.deliveryAddress?.lat}
              destLng={order.deliveryAddress?.lng}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export default OrderTrackingPage
