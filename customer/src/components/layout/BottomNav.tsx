import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, ShoppingBag, History, User } from 'lucide-react'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'

export const BottomNav: React.FC = () => {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const { cart } = useCartStore()
  const { accessToken } = useAuthStore()

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (routerLocation.pathname === '/') {
      const searchInput = document.getElementById('main-search-input')
      if (searchInput) {
        searchInput.focus()
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      navigate('/', { state: { focusSearch: true } })
    }
  }

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      onClick: null,
    },
    {
      label: 'Search',
      icon: Search,
      path: '#',
      onClick: handleSearchClick,
    },
    {
      label: 'Cart',
      icon: ShoppingBag,
      path: '/cart',
      badge: cartItemCount,
      onClick: null,
    },
    {
      label: 'Orders',
      icon: History,
      path: accessToken ? '/orders' : '/login',
      onClick: null,
    },
    {
      label: 'Profile',
      icon: User,
      path: accessToken ? '/profile' : '/login',
      onClick: null,
    },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive =
            item.path !== '#' &&
            (item.path === '/'
              ? routerLocation.pathname === '/'
              : routerLocation.pathname.startsWith(item.path))

          const content = (
            <div className="flex flex-col items-center justify-center gap-1 w-12 py-1">
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive ? 'text-primary scale-110' : 'text-slate-500'
                  }`}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          )

          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                type="button"
                className="focus:outline-none flex-grow flex justify-center"
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={index}
              to={item.path}
              className="flex-grow flex justify-center"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
export default BottomNav
