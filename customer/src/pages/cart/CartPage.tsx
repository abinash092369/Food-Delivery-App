import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { CartItem } from '../../components/cart/CartItem'
import { CouponInput } from '../../components/shared/CouponInput'
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    cart,
    isLoading,
    updateQuantity,
    clearCart,
    applyCoupon,
    isApplyingCoupon,
    removeCoupon,
  } = useCart()

  const handleApplyCoupon = (code: string) => {
    applyCoupon(code)
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-gray-100 rounded-xl"></div>
            <div className="h-32 bg-gray-100 rounded-xl"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded-xl"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const hasItems = cart && cart.items.length > 0
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Back Button */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-mutedColor hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping</span>
        </Link>
        {hasItems && (
          <button
            onClick={() => clearCart()}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      <h1 className="font-heading text-3xl font-extrabold text-textMain mb-8">
        Shopping Cart {hasItems && <span className="text-mutedColor font-semibold text-lg">({itemCount} items)</span>}
      </h1>

      {hasItems ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 divide-y divide-gray-100">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                onDecrease={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
              />
            ))}
          </div>

          {/* Right Column: Coupon & Breakdown */}
          <div className="space-y-6">
            {/* Coupon Input */}
            <CouponInput
              activeCoupon={cart.couponCode}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              isLoading={isApplyingCoupon}
            />

            {/* Price breakdown */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <h3 className="font-heading font-bold text-textMain text-base mb-4 border-b border-gray-50 pb-3">
                Bill Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-mutedColor">
                  <span>Subtotal</span>
                  <span className="font-semibold text-textMain">₹{cart.subtotal}</span>
                </div>

                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{cart.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-mutedColor">
                  <span>Delivery Partner Fee</span>
                  <span className="font-semibold text-textMain">₹{cart.deliveryFee}</span>
                </div>

                <div className="flex justify-between text-mutedColor">
                  <span>Taxes and Charges</span>
                  <span className="font-semibold text-textMain">₹{cart.taxAmount}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-textMain border-t border-gray-100 pt-4 mt-4">
                  <span>To Pay</span>
                  <span className="text-primary text-lg">₹{cart.totalAmount}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="hidden sm:flex w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm items-center justify-center gap-2 transition-colors mt-6"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <ShoppingBag className="w-20 h-20 text-gray-300 stroke-1 mx-auto mb-6" />
          <h2 className="font-heading text-xl font-bold text-textMain mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-mutedColor px-6 max-w-sm mx-auto">
            Before proceeding, please add delicious food items from your favorite restaurants!
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <span>Start Exploring Restaurants</span>
          </Link>
        </div>
      )}

      {/* Mobile Sticky Bottom checkout strip */}
      {hasItems && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 p-4 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-mutedColor font-bold uppercase tracking-wider">Total amount</span>
            <span className="text-lg font-heading font-extrabold text-primary">₹{cart.totalAmount}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
export default CartPage
