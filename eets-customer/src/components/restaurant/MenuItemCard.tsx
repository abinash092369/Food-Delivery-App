import React from 'react'
import { Plus, Minus } from 'lucide-react'
import { MenuItem } from '../../types'
import { resolveCustomerImage } from '../../utils/image'

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isRestaurantOpen?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  isRestaurantOpen = true,
}) => {
  const fallbackDishImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60';
  const resolvedItemImage = resolveCustomerImage(item.imageUrl, '') || resolveCustomerImage((item as any).image, '') || fallbackDishImage;

  return (
    <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Left side details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Veg/Non-veg Indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`inline-flex items-center justify-center w-5 h-5 border-2 rounded ${item.isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
            </span>
            {item.isVeg && <span className="text-[10px] text-emerald-700 font-semibold uppercase">Veg</span>}
            {item.isFeatured && (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Bestseller
              </span>
            )}
          </div>

          <h4 className="font-heading font-bold text-textMain text-base md:text-lg mb-1">
            {item.name}
          </h4>
          <span className="font-semibold text-textMain text-sm">
            ₹{item.price}
          </span>
          <p className="text-xs text-mutedColor mt-2 font-normal line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Right side image & controls */}
      <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0 flex flex-col items-center">
        <div className="w-full h-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
          <img
            src={resolvedItemImage}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackDishImage;
            }}
          />
        </div>

        {/* Action Button */}
        <div className="absolute -bottom-2 bg-white rounded-lg shadow-md border border-gray-100 flex items-center h-8 px-1.5 min-w-[5.5rem] justify-between z-10">
          {!isRestaurantOpen || !item.isAvailable ? (
            <span className="text-[10px] text-red-500 font-bold uppercase w-full text-center px-2">
              Unavailable
            </span>
          ) : quantity > 0 ? (
            <>
              <button
                onClick={onDecrease}
                type="button"
                className="p-1 text-primary hover:bg-gray-50 rounded transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-semibold text-sm px-2 text-textMain min-w-[1.25rem] text-center">
                {quantity}
              </span>
              <button
                onClick={onIncrease}
                type="button"
                className="p-1 text-primary hover:bg-gray-50 rounded transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onAdd}
              type="button"
              className="w-full h-full text-primary hover:bg-primary-light font-bold text-xs uppercase transition-colors tracking-wide rounded-lg flex items-center justify-center"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default MenuItemCard
