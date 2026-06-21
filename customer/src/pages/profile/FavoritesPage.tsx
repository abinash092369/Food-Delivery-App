import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '../../api/user.api'
import { RestaurantCard } from '../../components/restaurant/RestaurantCard'
import { Heart, Loader2 } from 'lucide-react'

export const FavoritesPage: React.FC = () => {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userApi.getFavorites(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Loading favorites...</span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
      <h3 className="font-heading font-bold text-textMain text-xl mb-6 pb-3 border-b border-gray-50">
        Favorite Restaurants
      </h3>

      {favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} isFavorite={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-1" />
          <h4 className="font-heading font-bold text-textMain mb-1">No Favorites</h4>
          <p className="text-sm text-mutedColor">You haven't liked any restaurants yet!</p>
        </div>
      )}
    </div>
  )
}
export default FavoritesPage
