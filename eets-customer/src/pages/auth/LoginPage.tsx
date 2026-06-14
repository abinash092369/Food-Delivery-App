import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { GoogleLogin } from '@react-oauth/google'
import { Mail, Lock, Loader2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
})

const otpLoginSchema = zod.object({
  phone: zod.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'),
})

type LoginInputs = zod.infer<typeof loginSchema>;
type OtpLoginInputs = zod.infer<typeof otpLoginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoggingIn, googleLogin, sendOtp, isSendingOtp } = useAuth()
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpLoginInputs>({
    resolver: zodResolver(otpLoginSchema),
  })

  const onSubmit = (data: LoginInputs) => {
    login(data)
  }

  const onSendOtp = (data: OtpLoginInputs) => {
    sendOtp(
      { phone: data.phone, countryCode: '+91' },
      {
        onSuccess: () => {
          navigate(`/otp-verify?phone=${encodeURIComponent(data.phone)}`)
        },
      }
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-gray-150 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <img src="/logo.jpg" alt="EETS Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4" />
          <h2 className="font-heading text-3xl font-extrabold text-textMain">Welcome Back</h2>
          <p className="mt-2 text-sm text-mutedColor">
            Log in to order delicious food
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-100 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${
              loginMethod === 'email' ? 'border-primary text-primary' : 'border-transparent text-mutedColor hover:text-textMain'
            }`}
            onClick={() => setLoginMethod('email')}
          >
            Email Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${
              loginMethod === 'otp' ? 'border-primary text-primary' : 'border-transparent text-mutedColor hover:text-textMain'
            }`}
            onClick={() => setLoginMethod('otp')}
          >
            OTP Login
          </button>
        </div>

        {loginMethod === 'email' ? (
          /* Email Form */
          <form className="mt-4 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-textMain mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                  />
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-xs text-error mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-textMain">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                  />
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Phone OTP Form */
          <form className="mt-4 space-y-6" onSubmit={handleOtpSubmit(onSendOtp)}>
            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-textMain mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 font-bold">
                    +91
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    {...registerOtp('phone')}
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                  />
                  <Phone className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {otpErrors.phone && (
                  <p className="text-xs text-error mt-1 font-medium">{otpErrors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-mutedColor font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                googleLogin({ idToken: credentialResponse.credential })
              } else {
                toast.error('Google Sign-In returned invalid token')
              }
            }}
            onError={() => {
              toast.error('Google Sign-In failed')
            }}
          />
        </div>

        {/* Footer info */}
        <p className="text-center text-sm text-mutedColor mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
export default LoginPage

