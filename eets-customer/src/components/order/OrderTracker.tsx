import React from 'react'
import { Check, Clock, User, Gift, Navigation, MapPin } from 'lucide-react'
import { OrderStatus } from '../../types'

interface OrderTrackerProps {
  status: OrderStatus;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ status }) => {
  const steps = [
    { label: 'Order Confirmed', description: 'Restaurant has accepted your order', icon: Gift, statuses: ['ACCEPTED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    { label: 'Preparing Food', description: 'Our chef is preparing your delicious meal', icon: Clock, statuses: ['PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    { label: 'Ready for Pickup', description: 'Food is cooked and packed', icon: User, statuses: ['PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    { label: 'Out for Delivery', description: 'Driver is on the way to your place', icon: Navigation, statuses: ['ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    { label: 'Delivered', description: 'Enjoy your meal!', icon: MapPin, statuses: ['DELIVERED'] },
  ]

  const getStatusIndex = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'CANCELLED':
        return -1
      case 'PENDING':
      case 'PLACED':
        return 0
      case 'ACCEPTED':
        return 1
      case 'PREPARING':
        return 2
      case 'PACKED':
      case 'READY_FOR_PICKUP':
      case 'PICKED_UP':
        return 3
      case 'ON_THE_WAY':
      case 'OUT_FOR_DELIVERY':
        return 4
      case 'DELIVERED':
        return 5
      default:
        return 0
    }
  }

  const activeIndex = getStatusIndex(status)

  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl flex items-center gap-3">
        <span className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">!</span>
        <div>
          <h4 className="font-heading font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-red-700 mt-0.5">This order was cancelled. Refund will be processed if applicable.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const isCompleted = activeIndex > index
        const isActive = activeIndex === index + 1
        const StepIcon = step.icon

        return (
          <div key={index} className="flex gap-4 relative last:after:hidden">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 ${
                  activeIndex > index + 1 ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Icon circle */}
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-colors duration-300 ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isActive
                  ? 'bg-white border-primary text-primary shadow-sm'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <StepIcon className="w-5 h-5" />}
            </div>

            {/* Step text */}
            <div className="flex-1 pt-1.5 pb-5">
              <h5
                className={`font-heading font-bold text-sm ${
                  isCompleted ? 'text-emerald-700' : isActive ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step.label}
              </h5>
              <p className="text-xs text-mutedColor mt-0.5">{step.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default OrderTracker
