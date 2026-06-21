import React, { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { Loader2 } from 'lucide-react'

// Lazy loaded page components
const HomePage = lazy(() => import('./pages/home/HomePage'))
const RestaurantPage = lazy(() => import('./pages/restaurant/RestaurantPage'))
const CartPage = lazy(() => import('./pages/cart/CartPage'))
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const OrderTrackingPage = lazy(() => import('./pages/orders/OrderTrackingPage'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))

const TermsPage = lazy(() => import('./pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'))
const CookiePolicyPage = lazy(() => import('./pages/legal/CookiePolicyPage'))
const DeliveryPolicyPage = lazy(() => import('./pages/legal/DeliveryPolicyPage'))

const BecomeVendorPage = lazy(() => import('./pages/partner/BecomeVendorPage'))
const BecomeDriverPage = lazy(() => import('./pages/partner/BecomeDriverPage'))

const CustomerSupportPage = lazy(() => import('./pages/support/CustomerSupportPage'))
const HelpCenterPage = lazy(() => import('./pages/support/HelpCenterPage'))
const ReportIssuePage = lazy(() => import('./pages/support/ReportIssuePage'))
const RefundPolicyPage = lazy(() => import('./pages/support/RefundPolicyPage'))
const ContactUsPage = lazy(() => import('./pages/support/ContactUsPage'))

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const OtpVerifyPage = lazy(() => import('./pages/auth/OtpVerifyPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

const SuspendedPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Loading page...</span>
      </div>
    }
  >
    {children}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: (
          <SuspendedPage>
            <HomePage />
          </SuspendedPage>
        ),
      },
      {
        path: '/restaurant/:slug',
        element: (
          <SuspendedPage>
            <RestaurantPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/cart',
        element: (
          <SuspendedPage>
            <CartPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/checkout',
        element: (
          <ProtectedRoute>
            <SuspendedPage>
              <CheckoutPage />
            </SuspendedPage>
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders',
        element: (
          <ProtectedRoute>
            <SuspendedPage>
              <OrdersPage />
            </SuspendedPage>
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders/:id/track',
        element: (
          <ProtectedRoute>
            <SuspendedPage>
              <OrderTrackingPage />
            </SuspendedPage>
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <SuspendedPage>
              <ProfilePage />
            </SuspendedPage>
          </ProtectedRoute>
        ),
      },
      {
        path: '/notifications',
        element: (
          <ProtectedRoute>
            <SuspendedPage>
              <NotificationsPage />
            </SuspendedPage>
          </ProtectedRoute>
        ),
      },
      {
        path: '/terms',
        element: (
          <SuspendedPage>
            <TermsPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/privacy',
        element: (
          <SuspendedPage>
            <PrivacyPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/cookies',
        element: (
          <SuspendedPage>
            <CookiePolicyPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/delivery-policy',
        element: (
          <SuspendedPage>
            <DeliveryPolicyPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/partner/vendor',
        element: (
          <SuspendedPage>
            <BecomeVendorPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/partner/driver',
        element: (
          <SuspendedPage>
            <BecomeDriverPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/support',
        element: (
          <SuspendedPage>
            <CustomerSupportPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/help-center',
        element: (
          <SuspendedPage>
            <HelpCenterPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/report-issue',
        element: (
          <SuspendedPage>
            <ReportIssuePage />
          </SuspendedPage>
        ),
      },
      {
        path: '/refund-policy',
        element: (
          <SuspendedPage>
            <RefundPolicyPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/contact',
        element: (
          <SuspendedPage>
            <ContactUsPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/login',
        element: (
          <SuspendedPage>
            <LoginPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/register',
        element: (
          <SuspendedPage>
            <RegisterPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/otp-verify',
        element: (
          <SuspendedPage>
            <OtpVerifyPage />
          </SuspendedPage>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <SuspendedPage>
            <ForgotPasswordPage />
          </SuspendedPage>
        ),
      },
    ],
  },
])

export default router

