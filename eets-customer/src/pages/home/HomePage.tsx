import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { restaurantApi } from '../../api/restaurant.api'
import { searchApi } from '../../api/search.api'
import { userApi } from '../../api/user.api'
import { RestaurantCard } from '../../components/restaurant/RestaurantCard'
import { SearchBar } from '../../components/shared/SearchBar'
import { useAuthStore } from '../../store/auth.store'
import { useLocationStore } from '../../store/location.store'
import { Flame, ArrowUpDown, AlertCircle, Pizza, Leaf, ShoppingBag, Sparkles, Bike, ShieldCheck } from 'lucide-react'
import { MenuResponse } from '../../types'
import { isRestaurantApproved, isRestaurantActive, isRestaurantOpen } from '../../utils/image'

const CUISINES = [
  { name: 'All', value: '' },
  { name: 'Biryani', value: 'BIRYANI' },
  { name: 'Pizza', value: 'PIZZA' },
  { name: 'Chinese', value: 'CHINESE' },
  { name: 'South Indian', value: 'SOUTH_INDIAN' },
  { name: 'North Indian', value: 'NORTH_INDIAN' },
  { name: 'Burgers', value: 'BURGERS' },
  { name: 'Desserts', value: 'DESSERTS' },
]

const SORT_OPTIONS = [
  { name: 'Relevance', value: '' },
  { name: 'Rating: High to Low', value: 'RATING_DESC' },
  { name: 'Delivery Time', value: 'DELIVERY_TIME_ASC' },
  { name: 'Price: Low to High', value: 'PRICE_ASC' },
  { name: 'Price: High to Low', value: 'PRICE_DESC' },
]

export const HomePage: React.FC = () => {
  const { accessToken } = useAuthStore()
  const { location } = useLocationStore()
  const routerLocation = useLocation()
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedSort, setSelectedSort] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurantMenus, setRestaurantMenus] = useState<Record<number, MenuResponse>>({})

  useEffect(() => {
    if (routerLocation.state?.focusSearch) {
      const searchInput = document.getElementById('main-search-input')
      if (searchInput) {
        searchInput.focus()
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Clear location state
      window.history.replaceState({}, document.title)
    }
  }, [routerLocation])

  // Fetch popular suggestions
  const { data: popularChips } = useQuery({
    queryKey: ['popularSuggestions'],
    queryFn: () => searchApi.getPopularSuggestions().catch(() => ['Pizza', 'Biryani', 'Burgers', 'Dosa', 'Cake']),
    staleTime: 60 * 1000,
  })

  // Fetch user favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userApi.getFavorites().catch(() => []),
    enabled: !!accessToken,
  })

  // Fetch all active, approved restaurants
  const {
    data: allRestaurantsResponse,
    isLoading: isRestaurantsLoading,
    error: restaurantsError,
  } = useQuery({
    queryKey: ['allRestaurants', location?.lat, location?.lng],
    queryFn: () =>
      restaurantApi.getRestaurants({
        page: 0,
        size: 100, // Load up to 100 restaurants to support complete local search/filter
        lat: location?.lat || undefined,
        lng: location?.lng || undefined,
      }).catch((err) => {
        console.error('Failed to fetch restaurants list', err)
        return { content: [], last: true, pageNumber: 0, pageSize: 100, totalElements: 0, totalPages: 0 }
      }),
  })

  // Normalize response shape to be extremely robust
  const rawRestaurants = (() => {
    if (!allRestaurantsResponse) return []
    if (Array.isArray(allRestaurantsResponse)) return allRestaurantsResponse
    const data = (allRestaurantsResponse as any).data !== undefined ? (allRestaurantsResponse as any).data : allRestaurantsResponse
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      if (Array.isArray(data.content)) return data.content
      if (Array.isArray(data.restaurants)) return data.restaurants
    }
    return []
  })()

  // Load restaurant menus in parallel in background
  useEffect(() => {
    const list = rawRestaurants
    if (!list || list.length === 0) return

    list.forEach((restaurant) => {
      if (restaurantMenus[restaurant.id]) return // already loaded

      restaurantApi.getRestaurantMenu(restaurant.slug)
        .then((menu) => {
          setRestaurantMenus((prev) => ({ ...prev, [restaurant.id]: menu }))
        })
        .catch((err) => {
          console.error(`Failed to load menu in background for ${restaurant.name}`, err)
        })
    })
  }, [rawRestaurants, restaurantMenus])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleChipClick = (suggestion: string) => {
    setSearchQuery(suggestion)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const isFav = (id: number) => {
    return favorites?.some((fav) => fav.id === id) || false
  }

  // Local Case-insensitive searching and filtering logic
  const includesText = (target?: string, query?: string) => {
    if (!target || !query) return false
    return target.toLowerCase().includes(query.toLowerCase())
  }

  const filteredRestaurants = rawRestaurants.filter((restaurant) => {
    // 1. All shows all active approved restaurants (even closed ones show with Closed badge)
    if (!isRestaurantApproved(restaurant) || !isRestaurantActive(restaurant)) {
      return false
    }

    const menu = restaurantMenus[restaurant.id]

    // 2. Category filters
    if (selectedCuisine) {
      let categoryMatch = false
      const cat = selectedCuisine.toUpperCase()

      if (cat === 'BIRYANI') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'Biryani'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'Biryani') ||
          c.items.some(item => includesText(item.name, 'Biryani'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'PIZZA') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'Pizza'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'Pizza') ||
          c.items.some(item => includesText(item.name, 'Pizza'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'CHINESE') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'Chinese'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'Chinese') ||
          c.items.some(item => includesText(item.name, 'Chinese'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'SOUTH_INDIAN') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'South Indian') || includesText(c, 'South_Indian') || includesText(c, 'SouthIndian'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'South Indian') ||
          includesText(c.category.name, 'Dosa') ||
          c.items.some(item => includesText(item.name, 'South Indian') || includesText(item.name, 'Dosa') || includesText(item.name, 'Idli') || includesText(item.name, 'Vada') || includesText(item.name, 'Uttapam'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'NORTH_INDIAN') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'North Indian') || includesText(c, 'North_Indian') || includesText(c, 'NorthIndian'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'North Indian') ||
          c.items.some(item => includesText(item.name, 'North Indian'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'BURGERS') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'Burger') || includesText(c, 'Burgers'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'Burger') ||
          c.items.some(item => includesText(item.name, 'Burger'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      } else if (cat === 'DESSERTS') {
        const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, 'Dessert') || includesText(c, 'Desserts') || includesText(c, 'Cake') || includesText(c, 'Sweet') || includesText(c, 'Sweets'))
        const menuMatch = menu?.categories?.some(c =>
          includesText(c.category.name, 'Dessert') ||
          includesText(c.category.name, 'Cake') ||
          includesText(c.category.name, 'Sweet') ||
          c.items.some(item => includesText(item.name, 'Dessert') || includesText(item.name, 'Cake') || includesText(item.name, 'Sweet') || includesText(item.name, 'Ice Cream') || includesText(item.name, 'Sweets'))
        )
        categoryMatch = cuisineMatch || !!menuMatch
      }

      if (!categoryMatch) return false
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim()

      const nameMatch = includesText(restaurant.name, q)
      const cuisineMatch = restaurant.cuisineTypes.some(c => includesText(c, q))
      const descMatch = includesText(restaurant.description, q)
      const menuMatch = menu?.categories?.some(c =>
        c.items.some(item => includesText(item.name, q) || includesText(item.description, q))
      )

      if (!nameMatch && !cuisineMatch && !descMatch && !menuMatch) {
        return false
      }
    }

    return true
  })

  // Local sorting
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (selectedSort === 'RATING_DESC') {
      return (b.avgRating || 0) - (a.avgRating || 0)
    }
    if (selectedSort === 'DELIVERY_TIME_ASC') {
      return (a.deliveryTimeMin || 0) - (b.deliveryTimeMin || 0)
    }
    if (selectedSort === 'PRICE_ASC') {
      return (a.deliveryFee || 0) - (b.deliveryFee || 0)
    }
    if (selectedSort === 'PRICE_DESC') {
      return (b.deliveryFee || 0) - (a.deliveryFee || 0)
    }
    // Default relevance/distance
    if (a.distance !== undefined && b.distance !== undefined) {
      return (a.distance ?? 9999) - (b.distance ?? 9999)
    }
    return 0
  })

  const isSearchMode = !!searchQuery.trim()

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 md:py-24 px-4 overflow-hidden border-b border-slate-900/40 shadow-2xl">
        {/* Animated Background Grids and Overlays */}
        <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none"></div>
        <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none"></div>
        <div className="absolute -inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-light-sweep pointer-events-none"></div>

        {/* Ambient Glow Blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[35rem] h-[35rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '3.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[25rem] h-[25rem] bg-teal-600/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '6s' }}></div>

        {/* Glass circles backdrop */}
        <div className="absolute top-12 left-12 w-20 h-20 bg-white/5 rounded-full backdrop-blur-[2px] border border-white/5 pointer-events-none animate-float hidden md:block"></div>
        <div className="absolute bottom-12 right-12 w-28 h-28 bg-white/5 rounded-full backdrop-blur-[2px] border border-white/5 pointer-events-none animate-float hidden md:block" style={{ animationDelay: '2.5s' }}></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">

          {/* Left Column: Text Content and Search Bar */}
          <div className="md:col-span-7 flex flex-col justify-center text-left space-y-6 md:pr-4 fadeUp">

            {/* Craving satisfied badge */}
            <div className="inline-flex self-start items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm hoverLift">
              <Flame className="w-3.5 h-3.5 animate-pulse text-accent" />
              <span>Craving satisfied in minutes</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight md:leading-none">
              Delicious Food <br className="hidden lg:block" />
              Delivered to <span className="bg-gradient-to-r from-accent via-teal-300 to-cyan-400 bg-clip-text text-transparent shimmerText animate-shine-sweep">Your Door</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm md:text-base lg:text-lg max-w-xl leading-relaxed font-light">
              Order from the best local restaurants in your city. Fresh ingredients, hot delivery, exceptional taste.
            </p>

            {/* Search bar wrapper with hover lift */}
            <div className="pt-2 w-full max-w-2xl hoverLift">
              <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>

            {/* Popular search chips */}
            {popularChips && popularChips.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 text-xs md:text-sm text-slate-300 w-full overflow-hidden">
                <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1">
                  <span className="font-semibold text-slate-400 flex-shrink-0">Popular:</span>
                  {popularChips.slice(0, 6).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      type="button"
                      className="bg-white/5 hover:bg-teal-500/25 border border-white/10 hover:border-teal-400/40 text-slate-200 hover:text-white px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-105 font-medium hover:shadow-teal-500/20 hover:shadow-md cursor-pointer flex-shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Premium Food Image Showcase */}
          <div className="absolute md:relative inset-0 md:inset-auto md:col-span-5 flex items-center justify-center opacity-[0.08] md:opacity-100 pointer-events-none md:pointer-events-auto select-none overflow-visible z-0 md:z-10 mt-8 md:mt-0">
            <div className="relative w-full max-w-[380px] lg:max-w-[420px] aspect-square flex items-center justify-center">

              {/* Outer Cyan Radial/Teal glow base */}
              <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-teal-500/20 to-cyan-500/30 rounded-full blur-2xl animate-pulse-glow"></div>

              {/* Large center premium food bowl image (Salad bowl) */}
              <div className="relative w-[80%] h-[80%] rounded-full glow-ring-teal hoverLift floatSlow overflow-hidden shadow-2xl bg-slate-900 border-4 border-white/10 pointer-events-auto">
                <img
                  src="/salad.png"
                  alt="Delicious food salad bowl"
                  className="w-full h-full object-cover scale-105 transition-transform duration-700 hover:scale-110 select-none pointer-events-none"
                  onError={(e) => {
                    // Fallback to placeholder if salad.png is missing
                    (e.target as HTMLImageElement).src = '/logo.jpg'
                  }}
                />
              </div>

              {/* Smaller floating burger image bottom left */}
              <div className="absolute -bottom-4 -left-6 w-[35%] aspect-square rounded-3xl overflow-hidden border border-white/15 bg-slate-900/90 backdrop-blur-sm shadow-xl floating-burger hoverLift z-20 pointer-events-auto">
                <img
                  src="/burger.png"
                  alt="Delicious burger"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg'
                  }}
                />
              </div>

              {/* Smaller floating pizza slice top right */}
              <div className="absolute -top-6 -right-6 w-[30%] aspect-square rounded-3xl overflow-hidden border border-white/15 bg-slate-900/90 backdrop-blur-sm shadow-xl floating-pizza hoverLift z-20 pointer-events-auto">
                <img
                  src="/pizza_slice.png"
                  alt="Cheesy pizza slice"
                  className="w-full h-full object-cover scale-110 pointer-events-none select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg'
                  }}
                />
              </div>

              {/* Trust mini-card: Left/lower-left overlay */}
              <div className="absolute -left-12 top-1/3 w-[180px] bg-slate-950/85 backdrop-blur-lg border border-white/10 rounded-2xl p-3.5 shadow-2xl floatSlow hoverLift pointer-events-auto hidden lg:block" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold font-heading">Trusted</h4>
                    <p className="text-slate-400 text-[10px] font-medium leading-none mt-0.5">Fresh & hygienic</p>
                  </div>
                </div>
              </div>

              {/* Delivery mini-card: Right/lower-right overlay */}
              <div className="absolute -right-12 bottom-8 w-[170px] bg-slate-950/85 backdrop-blur-lg border border-white/10 rounded-2xl p-3.5 shadow-2xl floatSlow hoverLift pointer-events-auto hidden lg:block" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-xl text-accent animate-bounce">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold font-heading">Fast Delivery</h4>
                    <p className="text-teal-400 text-[10px] font-bold mt-0.5">25-30 mins</p>
                  </div>
                </div>
              </div>

              {/* Small absolute floating icons & sparkles */}
              <div className="absolute top-1/4 right-[85%] text-teal-400 animate-float pointer-events-none opacity-60">
                <Leaf className="w-5 h-5 fill-teal-400/25" />
              </div>
              <div className="absolute bottom-[80%] left-1/3 text-accent animate-float pointer-events-none opacity-75" style={{ animationDelay: '1.2s' }}>
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="absolute bottom-1/4 right-0 text-teal-300 animate-float pointer-events-none opacity-60" style={{ animationDelay: '2.3s' }}>
                <Pizza className="w-4 h-4" />
              </div>
              <div className="absolute top-12 right-12 text-accent/80 animate-float pointer-events-none opacity-70" style={{ animationDelay: '0.9s' }}>
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Filters and Sorting bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          {/* Cuisine selection chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-thin">
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => setSelectedCuisine(cuisine.value)}
                type="button"
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedCuisine === cuisine.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-100 text-mutedColor'
                  }`}
              >
                {cuisine.name}
              </button>
            ))}
          </div>

          {/* Sorting controls */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-100 px-3.5 py-2 rounded-xl text-sm font-semibold text-textMain shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-mutedColor" />
              <span>Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer pr-4 font-semibold text-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-textMain">
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search status header */}
        {isSearchMode && (
          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="font-heading text-xl font-bold text-textMain">
              Search results for "{searchQuery}"
            </h2>
            <button
              onClick={handleClearSearch}
              type="button"
              className="text-sm font-bold text-primary hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Restaurants Grid */}
        {isRestaurantsLoading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 animate-pulse">
                <div className="bg-gray-100 h-48 w-full rounded-lg"></div>
                <div className="h-5 bg-gray-100 rounded w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="flex justify-between pt-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurantsError ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4 stroke-1" />
            <h3 className="font-heading text-lg font-bold text-textMain">Failed to Load Restaurants</h3>
            <p className="text-sm text-mutedColor mt-1">Please try reloading the page or check your connection.</p>
          </div>
        ) : sortedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {sortedRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite={isFav(restaurant.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm mt-8">
            <span className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-300">
              ?
            </span>
            <h3 className="font-heading text-lg font-bold text-textMain mb-1">
              No Restaurants Found
            </h3>
            <p className="text-sm text-mutedColor px-6 max-w-sm mx-auto">
              We couldn't find any restaurants matching your preferences. Try resetting filters or changing searches!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
export default HomePage

