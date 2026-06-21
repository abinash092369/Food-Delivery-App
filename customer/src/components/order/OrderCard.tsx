import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle, Clock, RotateCcw, XCircle, ChevronRight } from 'lucide-react'
import { Order } from '../../types'

interface OrderCardProps {
  order: Order;
  onReorder: (id: number) => void;
  onCancel: (id: number) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onReorder, onCancel }) => {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle }
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }
      default:
        return { label: status.replace(/_/g, ' '), color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock }
    }
  }

  const { label: statusLabel, color: statusColor, icon: StatusIcon } = getStatusDetails(order.status)

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h4 className="font-heading font-bold text-textMain text-lg">{order.restaurantName}</h4>
            <div className="flex items-center gap-1.5 text-xs text-mutedColor mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="font-semibold text-gray-500">#{order.orderNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{statusLabel.toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="py-4">
          <p className="text-sm text-textMain font-medium mb-1">Items:</p>
          <p className="text-xs text-mutedColor leading-relaxed">
            {order.items.map((item) => `${item.name} x ${item.quantity}`).join(', ')}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="text-textMain">
            <span className="text-xs text-mutedColor block font-medium">Total Bill</span>
            <span className="text-base font-bold">₹{order.totalAmount}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {canCancel && (
              <button
                onClick={() => onCancel(order.id)}
                type="button"
                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors"
              >
                Cancel Order
              </button>
            )}
            <button
              onClick={() => onReorder(order.id)}
              type="button"
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 hover:bg-gray-100 text-mutedColor rounded-lg text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reorder</span>
            </button>
            <Link
              to={`/orders/${order.id}/track`}
              className="flex items-center gap-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <span>Track Order</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default OrderCard
