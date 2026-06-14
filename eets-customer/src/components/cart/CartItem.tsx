import React from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { CartItem as CartItemType } from '../../types'
import { resolveCustomerImage } from '../../utils/image'

interface CartItemProps {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onIncrease, onDecrease }) => {
  const fallbackDishImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60';
  const resolvedCartImage = resolveCustomerImage(item.imageUrl, fallbackDishImage);
  const price = item.price ?? item.itemPrice ?? 0;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
      {resolvedCartImage && (
        <img
          src={resolvedCartImage}
          alt={item.name}
          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-50"
          onError={(e) => {
            e.currentTarget.src = fallbackDishImage;
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-textMain text-sm truncate leading-snug">
          {item.name}
        </h5>
        <span className="text-xs text-mutedColor font-semibold mt-0.5 block">
          ₹{price}
        </span>
      </div>

      <div className="flex items-center gap-2 border border-gray-200 rounded-lg h-7 px-1.5 bg-white">
        <button
          onClick={onDecrease}
          type="button"
          className="text-primary hover:bg-gray-50 rounded p-0.5"
          aria-label="Decrease quantity"
        >
          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-error" /> : <Minus className="w-3.5 h-3.5" />}
        </button>
        <span className="font-semibold text-xs text-textMain w-4 text-center">
          {item.quantity}
        </span>
        <button
          onClick={onIncrease}
          type="button"
          className="text-primary hover:bg-gray-50 rounded p-0.5"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-right font-bold text-sm text-textMain min-w-[3.5rem]">
        ₹{price * item.quantity}
      </div>
    </div>
  )
}
export default CartItem
