import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { CartDrawer } from '../cart/CartDrawer'
import { Toaster } from 'react-hot-toast'
import { useLocationStore } from '../../store/location.store'
import ScrollToTop from '../shared/ScrollToTop'
import { SplashScreen } from '../splash/SplashScreen'

export const AppLayout: React.FC = () => {
  const { detectLocation } = useLocationStore()

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  return (
    <div className="flex flex-col min-h-screen bg-background text-textMain">
      <SplashScreen />
      <ScrollToTop />
      <Navbar />
      <div className="flex-grow pb-16 sm:pb-0">
        <Outlet />
      </div>
      <CartDrawer />
      <BottomNav />
      <Footer />
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </div>
  )
}
export default AppLayout

