import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { GoogleLogin } from '@react-oauth/google'
import { Mail, Lock, Loader2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import loginIllustration from '../../assets/login-illustration.png'

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

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const illustrationVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
  };

  const mobileIllustrationVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F0FDF4] font-sans overflow-x-hidden">
      
      {/* Left panel: Illustration (Desktop) / Top panel (Mobile) */}
      <div className="w-full md:w-[45%] lg:w-[50%] bg-gradient-to-tr from-emerald-950 via-teal-900 to-emerald-800 flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden shrink-0 min-h-[300px] md:min-h-screen">
        
        {/* Animated background glow elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/20 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
          {/* Mobile Illustration view */}
          <motion.div 
            className="md:hidden w-40 h-40 flex items-center justify-center mb-4"
            initial="hidden"
            animate="visible"
            variants={mobileIllustrationVariants}
          >
            <img src={loginIllustration} alt="Customer Illustration" className="w-full h-full object-contain" />
          </motion.div>
          
          {/* Desktop Illustration view */}
          <motion.div 
            className="hidden md:flex w-72 lg:w-96 h-72 lg:h-96 items-center justify-center mb-8"
            initial="hidden"
            animate="visible"
            variants={illustrationVariants}
          >
            <img src={loginIllustration} alt="Customer Illustration" className="w-full h-full object-contain filter drop-shadow-2xl" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white text-2xl lg:text-3.5xl font-heading font-extrabold tracking-tight"
          >
            Order Delicious Food
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-teal-100 text-sm lg:text-base mt-2 max-w-sm font-medium"
          >
            Discover nearby restaurants, track your meals in real time, and enjoy fresh food delivered fast.
          </motion.p>
        </div>
      </div>

      {/* Right panel: Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[24px] border border-teal-100/50 shadow-2xl shadow-teal-950/5 p-8 lg:p-10"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          
          {/* Unified éets logo at top */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="bg-[#0d9488] text-white px-5 py-1.5 rounded-full font-heading font-black text-xl tracking-tight flex items-center gap-1.5 shadow-md shadow-teal-600/10">
              <span className="leading-none">éets</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center space-y-1.5 mb-6">
            <h2 className="text-2xl font-heading font-extrabold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 font-medium">Log in to order delicious food</p>
          </motion.div>

          {/* Tab Toggle */}
          <motion.div variants={itemVariants} className="flex border-b border-gray-100 mb-6">
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
          </motion.div>

          {loginMethod === 'email' ? (
            /* Email Form */
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-1 text-left">
                  <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...register('email')}
                      className={`w-full pl-11 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-error mt-1 font-medium">{errors.email.message}</p>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full pl-11 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                        errors.password ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-error mt-1 font-medium">{errors.password.message}</p>
                  )}
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isLoggingIn}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-teal-600/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </motion.button>
              </motion.div>
            </form>
          ) : (
            /* Phone OTP Form */
            <form className="space-y-4" onSubmit={handleOtpSubmit(onSendOtp)}>
              <div className="space-y-4">
                {/* Phone */}
                <motion.div variants={itemVariants} className="space-y-1 text-left">
                  <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 font-bold">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      {...registerOtp('phone')}
                      className={`w-full pl-14 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                        otpErrors.phone ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {otpErrors.phone && (
                    <p className="text-xs text-error mt-1 font-medium">{otpErrors.phone.message}</p>
                  )}
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isSendingOtp}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-teal-600/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send OTP</span>
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}

          {/* Separator */}
          <motion.div variants={itemVariants} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-mutedColor font-semibold">Or continue with</span>
            </div>
          </motion.div>

          {/* Google Sign-In */}
          <motion.div variants={itemVariants} className="flex justify-center w-full">
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
          </motion.div>

          {/* Footer info */}
          <motion.p variants={itemVariants} className="text-center text-sm text-mutedColor mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </motion.p>
        </motion.div>
      </div>

    </div>
  )
}
export default LoginPage

