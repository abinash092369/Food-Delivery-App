import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRestaurantsApi } from '../../api/admin-restaurants.api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ArrowLeft, Star, MapPin, Clock, ShieldAlert, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';

export const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Restaurant details by slug
  const { data: restaurantResponse, isLoading: loadingDetail, error: detailError } = useQuery({
    queryKey: ['admin-restaurant-detail', slug],
    queryFn: () => adminRestaurantsApi.getRestaurantBySlug(slug || ''),
    enabled: !!slug,
  });

  // 2. Fetch Restaurant menu by slug
  const { data: menuResponse, isLoading: loadingMenu } = useQuery({
    queryKey: ['admin-restaurant-menu', slug],
    queryFn: () => adminRestaurantsApi.getRestaurantMenu(slug || ''),
    enabled: !!slug,
  });

  const restaurant = restaurantResponse?.data;
  const menu = menuResponse?.data;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminRestaurantsApi.approveRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurant-detail', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminRestaurantsApi.rejectRestaurant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurant-detail', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminRestaurantsApi.updateRestaurantStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurant-detail', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    },
  });

  const handleApprove = () => {
    if (restaurant && window.confirm(`Approve ${restaurant.name}?`)) {
      approveMutation.mutate(restaurant.id);
    }
  };

  const handleReject = () => {
    if (restaurant) {
      const reason = window.prompt('Enter rejection reason:');
      if (reason && reason.trim()) {
        rejectMutation.mutate({ id: restaurant.id, reason });
      }
    }
  };

  const handleToggleStatus = () => {
    if (restaurant) {
      statusMutation.mutate({ id: restaurant.id, active: !restaurant.isActive });
    }
  };

  if (loadingDetail) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-48 bg-gray-150 rounded-xl"></div>
        <div className="h-40 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  if (detailError || !restaurant) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
        <p className="text-gray-550 font-semibold">Error loading restaurant details. It might have been deleted or invalid.</p>
        <Link to="/restaurants" className="mt-4 inline-flex items-center gap-2 text-teal-600 font-bold text-xs hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 text-gray-550 hover:text-gray-900 font-bold text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Restaurants list
        </Link>
      </div>

      {/* Hero Cover section */}
      <div className="relative h-64 bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-teal-900 opacity-80"></div>
        )}

        {/* Float overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Logo block */}
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-slate-500 shrink-0 text-xl overflow-hidden shadow-md">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="object-cover h-full w-full" />
                ) : (
                  restaurant.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl md:text-3xl font-extrabold text-white">{restaurant.name}</h2>
                  <div className="flex gap-1">
                    <StatusBadge status={restaurant.isApproved ? 'APPROVED' : 'PENDING'} />
                    <StatusBadge status={restaurant.isActive} />
                  </div>
                </div>
                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mt-1">
                  {restaurant.cuisineTypes.join(' • ')}
                </p>
                <p className="text-sm text-gray-300 font-semibold mt-2 line-clamp-2 max-w-2xl">
                  {restaurant.description}
                </p>
              </div>
            </div>

            {/* Quick action buttons on banner */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              {!restaurant.isApproved ? (
                <>
                  <button
                    onClick={handleApprove}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-950/20 flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-lg shadow-rose-950/20 flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleStatus}
                  className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                    restaurant.isActive
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {restaurant.isActive ? (
                    <>
                      <ToggleRight className="h-4 w-4 text-rose-600" /> Disable Vendor
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 text-white" /> Enable Vendor
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3.5 text-left">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Star className="h-5 w-5 fill-amber-500 stroke-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ratings & Reviews</h4>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{restaurant.avgRating.toFixed(1)} / 5.0</p>
            <p className="text-xs text-gray-500 font-medium">Aggregated from {restaurant.totalRatings} orders</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3.5 text-left">
          <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address Details</h4>
            <p className="text-sm font-semibold text-gray-700 mt-1 line-clamp-1">{restaurant.addressLine}</p>
            <p className="text-xs text-gray-500 font-semibold">{restaurant.city}, {restaurant.state} - {restaurant.pincode}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3.5 text-left">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hours & Operations</h4>
            <p className="text-sm font-bold text-gray-950 mt-1">{restaurant.openingTime} - {restaurant.closingTime}</p>
            <p className="text-xs text-gray-500 font-medium">Open {restaurant.daysOpen?.length || 0} days a week</p>
          </div>
        </div>
      </div>

      {/* Menu / List of dishes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Menu Directory</h3>

        {loadingMenu ? (
          <div className="space-y-4 py-8 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
          </div>
        ) : !menu || !menu.categories || menu.categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 font-semibold">
            This restaurant hasn't uploaded any menu items yet.
          </div>
        ) : (
          <div className="space-y-8 mt-6">
            {menu.categories.map((catWithItems) => (
              <div key={catWithItems.category.id} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 border-l-4 border-teal-600 pl-3">
                  <h4 className="font-extrabold text-gray-900 text-sm">{catWithItems.category.name}</h4>
                  <span className="text-xs text-gray-400 font-semibold">({catWithItems.items.length} items)</span>
                </div>
                {catWithItems.category.description && (
                  <p className="text-xs text-gray-400 font-medium pl-4">{catWithItems.category.description}</p>
                )}

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                  {catWithItems.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              item.isVeg ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={item.isVeg ? 'Veg' : 'Non-Veg'}
                          />
                          <h5 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h5>
                          {item.isFeatured && (
                            <span className="text-[9px] font-bold uppercase bg-amber-50 text-amber-700 px-1 border border-amber-100 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 font-medium line-clamp-2 max-w-sm">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs font-extrabold text-gray-900 mt-1">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Item Image */}
                      {item.imageUrl && (
                        <div className="h-16 w-16 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default RestaurantDetailPage;
