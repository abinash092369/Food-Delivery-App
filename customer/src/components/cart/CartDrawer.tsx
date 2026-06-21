import React from 'react'
import { X, ShoppingBag, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { CartItem } from './CartItem'

export const CartDrawer: React.FC = () => {
  const { cart, updateQuantity, clearCart, setDrawerOpen, isDrawerOpen } = useCart()

  if (!isDrawerOpen) return null

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-lg font-bold text-textMain">Your Cart ({itemCount})</h3>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart && cart.items.length > 0 ? (
              cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrease={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                  onDecrease={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4 stroke-1" />
                <h4 className="font-heading font-semibold text-textMain mb-1">Your cart is empty</h4>
                <p className="text-sm text-mutedColor px-6">
                  Add delicious food items from your favorite restaurants to satisfy your hunger!
                </p>
              </div>
            )}
          </div>

          {/* Footer summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 mt-auto">
              <div className="space-y-1.5 mb-6 text-sm">
                <div className="flex justify-between text-mutedColor">
                  <span>Subtotal</span>
                  <span className="font-medium text-textMain">₹{cart.subtotal}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Applied</span>
                    <span>-₹{cart.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-mutedColor">
                  <span>Delivery Partner Fee</span>
                  <span className="font-medium text-textMain">₹{cart.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-mutedColor">
                  <span>Taxes and Charges</span>
                  <span className="font-medium text-textMain">₹{cart.taxAmount}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-textMain border-t border-gray-200 pt-3 mt-3">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{cart.totalAmount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => clearCart()}
                  type="button"
                  className="px-4 py-3 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-semibold text-mutedColor transition-colors"
                >
                  Clear Cart
                </button>
                <Link
                  to="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default CartDrawer
