import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restaurantApi } from '../../api/restaurant.api'
import { useCart } from '../../hooks/useCart'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { MenuItemCard } from '../../components/restaurant/MenuItemCard'
import { Star, Clock, Heart, AlertTriangle, Loader2 } from 'lucide-react'
import { userApi } from '../../api/user.api'
import { toast } from 'react-hot-toast'
import { MenuItem } from '../../types'
import { resolveCustomerImage, isRestaurantOpen as checkOpen, getRestaurantImage, getRestaurantHeroImage, normalizeMenu } from '../../utils/image'

export const RestaurantPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { cart, addToCart, updateQuantity, clearCart } = useCart()

  // Clear Cart Confirmation Modal state
  const [showClearModal, setShowClearModal] = useState(false)
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null)
  
  // Track active category scroll state
  const [activeCategory, setActiveCategory] = useState('')
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Fetch all restaurants as fallback list lookup
  const { data: allRestaurantsResponse } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: () =>
      restaurantApi.getRestaurants({
        page: 0,
        size: 100,
      }).catch((err) => {
        console.error('Failed to fetch fallback restaurants list', err)
        return { content: [], last: true, pageNumber: 0, pageSize: 100, totalElements: 0, totalPages: 0 }
      }),
  })

  // Fetch restaurant details from api
  const { data: fetchedRestaurant, isLoading: isRestLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      console.log('[CUSTOMER_RESTAURANT_FETCH_PARAM]', { slug })
      const response = await restaurantApi.getRestaurantBySlug(slug || '')
      console.log('[CUSTOMER_RESTAURANT_FETCH_RESPONSE]', response)
      return response
    },
    enabled: !!slug,
    retry: false,
  })

  // Fallback search from loaded restaurant list by: id OR slug OR name
  const fallbackRestaurant = React.useMemo(() => {
    if (!slug) return null
    const list = allRestaurantsResponse?.content || []
    const found = list.find((r: any) =>
      String(r.id) === slug ||
      r.slug === slug ||
      (r.name && r.name.toLowerCase() === slug.toLowerCase())
    )
    if (found) {
      console.log('[CUSTOMER_RESTAURANT_FALLBACK_FOUND]', found)
    }
    return found || null
  }, [allRestaurantsResponse, slug])

  const restaurant = fetchedRestaurant || fallbackRestaurant

  // Log active restaurant
  useEffect(() => {
    if (restaurant) {
      console.log('[CUSTOMER_RESTAURANT_ACTIVE]', restaurant)
    }
  }, [restaurant])

  // Fetch restaurant menu using resolved ID, with slug and custom endpoint as backfall options
  const menuSlug = restaurant?.slug || slug || ''
  const menuFetchParam = restaurant ? String(restaurant.id) : menuSlug

  const { data: rawMenu, isLoading: isMenuLoading } = useQuery({
    queryKey: ['restaurantMenu', restaurant?.id, menuSlug],
    queryFn: async () => {
      console.log('[CUSTOMER_MENU_FETCH_RESTAURANT_ID]', menuFetchParam)
      
      // 1. Try fetching by ID
      if (restaurant?.id) {
        try {
          const res = await restaurantApi.getRestaurantMenu(String(restaurant.id))
          if (res) return res
        } catch (e) {
          console.warn('Failed to fetch menu by ID, trying slug fallback', e)
        }
      }

      // 2. Try fetching by slug
      if (menuSlug && menuSlug !== String(restaurant?.id)) {
        try {
          const res = await restaurantApi.getRestaurantMenu(menuSlug)
          if (res) return res
        } catch (e) {
          console.warn('Failed to fetch menu by slug', e)
        }
      }

      // 3. Try fallback custom endpoint
      if (restaurant?.id) {
        try {
          const res = await restaurantApi.getRestaurantMenuFallback(String(restaurant.id))
          if (res) return res
        } catch (e) {
          console.warn('Failed to fetch menu by custom fallback endpoint', e)
        }
      }

      return null
    },
    enabled: !!menuFetchParam,
    retry: false,
  })

  // Normalize menu structure
  const normalizedCats = React.useMemo(() => {
    return normalizeMenu(rawMenu)
  }, [rawMenu])

  const menu = {
    categories: normalizedCats
  }

  // Favorite toggle
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userApi.getFavorites().catch(() => []),
    enabled: !!accessToken,
  })

  const isFavorite = favorites?.some((fav) => fav.id === restaurant?.id) || false

  const favMutation = useMutation({
    mutationFn: () => userApi.toggleFavorite(restaurant?.id || 0),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(data.message || 'Favorites updated')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update favorite')
    },
  })

  const handleFavoriteClick = () => {
    if (!accessToken) {
      toast.error('Please login to favorite restaurants')
      return
    }
    favMutation.mutate()
  }

  // Scroll monitoring to set active category in sidebar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      let currentCategory = ''

      if (menu && menu.categories) {
        for (const cat of menu.categories) {
          const el = categoryRefs.current[cat.category.name]
          if (el && el.offsetTop <= scrollPosition) {
            currentCategory = cat.category.name
          }
        }
        if (currentCategory) {
          setActiveCategory(currentCategory)
        } else if (menu.categories.length > 0) {
          setActiveCategory(menu.categories[0].category.name)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [menu])

  const scrollToCategory = (catName: string) => {
    const el = categoryRefs.current[catName]
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth',
      })
      setActiveCategory(catName)
    }
  }

  // Handle Add Item to Cart
  const handleAddItem = async (item: MenuItem) => {
    if (!accessToken) {
      toast.error('Please login to add items to cart')
      navigate('/login')
      return
    }

    // Check if cart has items from a different restaurant
    // Since we don't have direct restaurantId on CartItem, we can determine it from the first item if stored,
    // or rely on a clientside tracker.
    const cartStore = useCartStore.getState()
    
    // We can optimistically store the restaurant slug in localstorage or Zustand when cart has items
    const activeCartSlug = localStorage.getItem('eets_cart_restaurant_slug')

    if (cart && cart.items.length > 0 && activeCartSlug && activeCartSlug !== slug) {
      setPendingItem(item)
      setShowClearModal(true)
      return
    }

    // Proceed to add item normally
    try {
      await addToCart({ menuItemId: item.id, quantity: 1 })
      localStorage.setItem('eets_cart_restaurant_slug', slug || '')
    } catch (err) {
      // toast shown inside hook
    }
  }

  const handleConfirmClearCart = async () => {
    if (!pendingItem) return
    try {
      await clearCart()
      await addToCart({ menuItemId: pendingItem.id, quantity: 1 })
      localStorage.setItem('eets_cart_restaurant_slug', slug || '')
      toast.success('Cart cleared and item added')
    } catch (err) {
      toast.error('Failed to add item')
    } finally {
      setShowClearModal(false)
      setPendingItem(null)
    }
  }

  const handleItemQuantityChange = (cartItemId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change
    updateQuantity({ itemId: cartItemId, quantity: newQty })
    
    // If cart becomes empty, remove the tracked restaurant slug
    if (newQty <= 0 && cart && cart.items.length <= 1) {
      localStorage.removeItem('eets_cart_restaurant_slug')
    }
  }

  const getItemQuantity = (itemId: number) => {
    const cartItem = cart?.items.find((item) => item.menuItemId === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const getCartItemId = (itemId: number) => {
    const cartItem = cart?.items.find((item) => item.menuItemId === itemId)
    return cartItem ? cartItem.id : -1
  }

  if (isRestLoading || isMenuLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Loading restaurant and menu...</span>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h3 className="font-heading text-lg font-bold text-textMain">Restaurant Not Found</h3>
        <p className="text-sm text-mutedColor mt-1">Please return home and choose another restaurant.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm"
        >
          Go Back Home
        </button>
      </div>
    )
  }

  const fallbackCover = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80';
  const resolvedCover = getRestaurantHeroImage(restaurant, fallbackCover);
  const resolvedLogo = resolveCustomerImage(restaurant.logoUrl || (restaurant as any).logo_url, '');

  return (
    <div className="pb-20">
      {/* Restaurant Hero Cover */}
      <div className="relative h-64 md:h-80 w-full bg-gray-100">
        <img
          src={resolvedCover}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackCover;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            {resolvedLogo && (
              <img
                src={resolvedLogo}
                alt={`${restaurant.name} Logo`}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {checkOpen(restaurant) ? 'Open Now' : 'Closed'}
              </span>
              <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mt-1">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-200 mt-1">{restaurant.cuisineTypes.join(', ')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFavoriteClick}
              type="button"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>

            <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl flex items-center gap-6 text-sm font-semibold">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{restaurant.avgRating?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-[10px] text-gray-300 font-normal">({restaurant.totalRatings || 0} reviews)</span>
              </div>
              <div className="border-l border-white/20 h-8"></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-200">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.deliveryTimeMin} mins</span>
                </div>
                <span className="text-[10px] text-gray-300 font-normal">Delivery ETA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout with sticky sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Horizontal scroll categories on Mobile/Tablet */}
        {menu && menu.categories.length > 0 && (
          <div className="lg:hidden sticky top-16 bg-white/95 backdrop-blur-md z-20 border-b border-slate-100 -mx-4 px-4 py-3 overflow-x-auto flex gap-2 scrollbar-none scroll-smooth">
            {menu.categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => scrollToCategory(cat.category.name)}
                type="button"
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.category.name
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-100 text-mutedColor hover:bg-slate-100'
                }`}
              >
                {cat.category.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 mt-4 lg:mt-0">
          {/* Categories Sidebar - Desktop only */}
          <aside className="hidden lg:block w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-120px)] overflow-y-auto bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-textMain uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-1">
              {menu?.categories.map((cat, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => scrollToCategory(cat.category.name)}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat.category.name
                        ? 'bg-primary-light text-primary font-bold'
                        : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
                    }`}
                  >
                    {cat.category.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Menu Items List */}
          <div className="flex-1 space-y-12">
            {menu && menu.categories.length > 0 ? (
              menu.categories.map((cat, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    categoryRefs.current[cat.category.name] = el
                  }}
                  className="space-y-6 scroll-mt-24"
                >
                  <h3 className="font-heading text-xl font-bold text-textMain border-b border-gray-100 pb-3 flex items-center justify-between">
                    <span>{cat.category.name}</span>
                    <span className="text-xs text-mutedColor font-semibold">({cat.items.length} items)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cat.items
                      .filter((item: any) => {
                        const isExplicitlyUnavailable =
                          item.isAvailable === false ||
                          item.available === false ||
                          item.inStock === false ||
                          item.in_stock === false ||
                          item.isAvailable === 0 ||
                          item.available === 0 ||
                          item.inStock === 0 ||
                          item.in_stock === 0;
                        return !isExplicitlyUnavailable;
                      })
                      .map((item: any) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          quantity={getItemQuantity(item.id)}
                          onAdd={() => handleAddItem(item)}
                          onIncrease={() => handleItemQuantityChange(getCartItemId(item.id), getItemQuantity(item.id), 1)}
                          onDecrease={() => handleItemQuantityChange(getCartItemId(item.id), getItemQuantity(item.id), -1)}
                          isRestaurantOpen={checkOpen(restaurant)}
                        />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <h3 className="font-heading text-lg font-bold text-textMain mb-1">No Menu Available</h3>
                <p className="text-sm text-mutedColor">This restaurant hasn't uploaded its menu yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8" />
              <h4 className="font-heading font-extrabold text-lg text-textMain">Replace Cart Items?</h4>
            </div>
            <p className="text-sm text-mutedColor leading-relaxed">
              Your cart contains dishes from another restaurant. Would you like to discard those selections and add from this restaurant?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowClearModal(false)
                  setPendingItem(null)
                }}
                type="button"
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-mutedColor transition-colors"
              >
                No, Keep
              </button>
              <button
                onClick={handleConfirmClearCart}
                type="button"
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Yes, Discard & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky mobile cart summary strip */}
      {cart && cart.items.length > 0 && localStorage.getItem('eets_cart_restaurant_slug') === slug && (
        <div className="sm:hidden fixed bottom-20 left-0 right-0 p-4 bg-transparent pointer-events-none z-30">
          <div className="max-w-md mx-auto bg-primary text-white rounded-xl shadow-lg flex items-center justify-between p-3.5 pointer-events-auto border border-teal-500/20">
            <div className="flex flex-col">
              <span className="text-[10px] text-teal-100 uppercase font-bold tracking-wider">
                {cart.items.reduce((sum, item) => sum + item.quantity, 0)} Items Added
              </span>
              <span className="font-heading font-extrabold text-sm flex items-baseline gap-1">
                ₹{cart.totalAmount}
                <span className="text-[10px] text-teal-100 font-normal font-sans">plus taxes</span>
              </span>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="bg-white text-primary text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-teal-50 transition-colors"
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default RestaurantPage
