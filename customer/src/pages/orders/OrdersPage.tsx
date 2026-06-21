import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../../api/order.api'
import { OrderCard } from '../../components/order/OrderCard'
import { Loader2, ClipboardList, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCart } from '../../hooks/useCart'
import { Link, useNavigate } from 'react-router-dom'

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { refetchCart } = useCart()

  // Pagination state
  const [page, setPage] = useState(0)

  // Cancel Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('Ordered by mistake')
  const [customReason, setCustomReason] = useState('')

  // Fetch paginated order history
  const { data: orderData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderApi.getOrders({ page, size: 5 }),
    placeholderData: (prev) => prev,
  })

  // Cancel Order mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => orderApi.cancelOrder(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled successfully')
      setSelectedOrderId(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (id: number) => orderApi.reorder(id),
    onSuccess: async () => {
      await refetchCart()
      toast.success('Items added to cart. Redirecting to cart page...')
      navigate('/cart')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reorder items')
    },
  })

  const handleOpenCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId)
    setCancelReason('Ordered by mistake')
    setCustomReason('')
  }

  const handleConfirmCancel = () => {
    if (!selectedOrderId) return
    const finalReason = cancelReason === 'Other' ? customReason : cancelReason
    if (cancelReason === 'Other' && !customReason.trim()) {
      toast.error('Please enter a cancellation reason')
      return
    }
    cancelMutation.mutate({ id: selectedOrderId, reason: finalReason })
  }

  if (isLoading && !orderData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Loading order history...</span>
      </div>
    )
  }

  const orders = orderData?.content || []
  const hasOrders = orders.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-heading text-3xl font-extrabold text-textMain mb-8">My Orders</h1>

      {hasOrders ? (
        <div className="space-y-6">
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={(id) => reorderMutation.mutate(id)}
                onCancel={(id) => handleOpenCancelModal(id)}
              />
            ))}
          </div>

          {/* Simple Pagination Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isPlaceholderData}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-mutedColor transition-colors disabled:opacity-50"
            >
              Previous Page
            </button>
            <span className="text-xs font-semibold text-mutedColor">
              Page {page + 1} of {orderData?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => (orderData?.last ? p : p + 1))}
              disabled={orderData?.last || isPlaceholderData}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-mutedColor transition-colors disabled:opacity-50"
            >
              Next Page
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <ClipboardList className="w-20 h-20 text-gray-300 stroke-1 mx-auto mb-6" />
          <h2 className="font-heading text-xl font-bold text-textMain mb-2">No Orders Placed Yet</h2>
          <p className="text-sm text-mutedColor px-6 max-w-sm mx-auto mb-6">
            You haven't ordered anything from éets yet. Try placing your first delicious food order!
          </p>
          <Link
            to="/"
            className="inline-flex bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            Browse Nearby Restaurants
          </Link>
        </div>
      )}

      {/* Cancel Order Reason Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8" />
              <h4 className="font-heading font-extrabold text-lg text-textMain">Cancel Order?</h4>
            </div>
            <p className="text-sm text-mutedColor leading-relaxed">
              Please let us know the reason you are cancelling this order. This helps us improve our service.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-textMain mb-1">Select Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Takes too long to deliver">Takes too long to deliver</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Want to add/remove items">Want to add/remove items</option>
                <option value="Other">Other (Enter custom reason)</option>
              </select>

              {cancelReason === 'Other' && (
                <textarea
                  placeholder="Enter details here..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[5rem]"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderId(null)}
                type="button"
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-mutedColor transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Cancel Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OrdersPage
