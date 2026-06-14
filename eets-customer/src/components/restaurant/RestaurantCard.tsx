import React from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, Heart } from 'lucide-react'
import { Restaurant } from '../../types'
import { userApi } from '../../api/user.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'
import { resolveCustomerImage, getRestaurantRoute, getRestaurantImage } from '../../utils/image'

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, isFavorite = false }) => {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  React.useEffect(() => {
    console.log('[CUSTOMER_RESTAURANT_CARD_DATA]', restaurant);
  }, [restaurant]);

  const favoriteMutation = useMutation({
    mutationFn: () => userApi.toggleFavorite(restaurant.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(data.message || 'Favorites updated')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update favorite status')
    },
  })

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!accessToken) {
      toast.error('Please login to favorite restaurants')
      return
    }
    favoriteMutation.mutate()
  }

  const fallbackFoodImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60';
  
  const finalCoverSrc = getRestaurantImage(restaurant, fallbackFoodImage);
  const resolvedLogo = resolveCustomerImage(restaurant.logoUrl || (restaurant as any).logo_url, '');

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:border-teal-100 hover:-translate-y-1.5 transition-all duration-300 border border-slate-100/80 flex flex-col relative group overflow-hidden">
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        type="button"
        className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform z-10"
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : 'text-gray-600'}`} />
      </button>

      <Link to={getRestaurantRoute(restaurant)} className="flex flex-col h-full">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <img
            src={finalCoverSrc}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = fallbackFoodImage;
            }}
          />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-heading font-semibold tracking-wider text-sm uppercase px-4 py-1.5 border border-white/40 rounded-full">
                Closed
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1">
          {/* Logo & Name */}
          <div className="flex items-start gap-3 justify-between mb-2">
            <div>
              <h3 className="font-heading text-lg font-bold text-textMain leading-snug group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              <p className="text-xs text-mutedColor font-medium line-clamp-1 mt-0.5">
                {(restaurant.cuisineTypes || []).join(', ')}
              </p>
            </div>
            {resolvedLogo && (
              <img
                src={resolvedLogo}
                alt={`${restaurant.name} Logo`}
                className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <p className="text-sm text-mutedColor line-clamp-2 mb-4 flex-1">
            {restaurant.description}
          </p>

          {/* Details footer */}
          <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto text-sm">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg font-semibold">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{restaurant.avgRating?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-amber-600 font-normal">({restaurant.totalRatings || 0})</span>
            </div>

            <div className="flex items-center gap-1.5 text-mutedColor">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{restaurant.deliveryTimeMin} mins</span>
            </div>

            <div className="text-textMain font-semibold">
              {restaurant.deliveryFee === 0 ? 'Free Delivery' : `₹${restaurant.deliveryFee} del.`}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
export default RestaurantCard
