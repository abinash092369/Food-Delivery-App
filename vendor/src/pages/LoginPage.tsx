import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useVendorAuthStore } from '../store/vendor-auth.store';
import { vendorAuthApi } from '../api/vendor-auth.api';
import { vendorRestaurantApi } from '../api/vendor-restaurant.api';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import loginIllustration from '../assets/login-illustration.png';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(1, 'Password is required'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useVendorAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleLogin = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      useVendorAuthStore.getState().logout();

      const res = await vendorAuthApi.googleLogin({ credential });
      if (res.success && res.data) {
        const data = res.data;
        console.log("Vendor Google login response:", data);
        setAuth(data.token, data.user);
        useVendorAuthStore.getState().setRestaurant(data.restaurant);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Google login failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Google authentication failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (formData: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      useVendorAuthStore.getState().logout();

      const res = await vendorAuthApi.login(formData as any);
      if (res.success && res.data) {
        const data = res.data;
        console.log("Vendor login response:", data);
        setAuth(data.accessToken, data.user);
        
        try {
          const profileRes = await vendorRestaurantApi.getRestaurant();
          if (profileRes.success && profileRes.data) {
            const profileData = profileRes.data;
            console.log("Vendor restaurant profile:", profileData);
            useVendorAuthStore.getState().setRestaurant(profileData);
          }
        } catch (profileErr) {
          console.error("Failed to fetch restaurant profile on login:", profileErr);
        }

        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Connection to server failed. Ensure Spring Boot backend is running at http://localhost:8080.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="w-full md:w-[45%] lg:w-[50%] bg-gradient-to-tr from-emerald-900 via-teal-800 to-amber-700 flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden shrink-0 min-h-[300px] md:min-h-screen">
        
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
            <img src={loginIllustration} alt="Vendor Portal Illustration" className="w-full h-full object-contain" />
          </motion.div>
          
          {/* Desktop Illustration view */}
          <motion.div 
            className="hidden md:flex w-72 lg:w-96 h-72 lg:h-96 items-center justify-center mb-8"
            initial="hidden"
            animate="visible"
            variants={illustrationVariants}
          >
            <img src={loginIllustration} alt="Vendor Portal Illustration" className="w-full h-full object-contain filter drop-shadow-2xl" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white text-2xl lg:text-3.5xl font-heading font-extrabold tracking-tight"
          >
            Grow Your Restaurant Business
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-teal-100 text-sm lg:text-base mt-2 max-w-sm font-medium"
          >
            Receive real-time orders, manage menus efficiently, view detailed sales analytics, and drive customer retention.
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
          
          {/* Unified EETS logo at top */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="bg-[#0d9488] text-white px-5 py-1.5 rounded-full font-heading font-black text-xl tracking-tight flex items-center gap-1.5 shadow-md shadow-teal-600/10">
              <span className="leading-none">éets</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center space-y-1.5 mb-6">
            <h2 className="text-2xl font-heading font-extrabold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 font-medium">Manage your orders and kitchen operations</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700 text-sm mb-4"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email input */}
            <motion.div variants={itemVariants} className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  placeholder="name@restaurant.com"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error font-medium mt-1">{errors.email.message}</p>
              )}
            </motion.div>

            {/* Password input */}
            <motion.div variants={itemVariants} className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                <a href="#" className="text-xs text-teal-600 font-bold hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error font-medium mt-1">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Separator */}
          <motion.div variants={itemVariants} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold">Or continue with</span>
            </div>
          </motion.div>

          {/* Google Sign-In Button */}
          <motion.div variants={itemVariants} className="flex justify-center w-full">
            <GoogleLogin
              text="continue_with"
              theme="outline"
              size="large"
              width="380"
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  await handleGoogleLogin(credentialResponse.credential);
                } else {
                  setError('Google Sign-In returned invalid token');
                }
              }}
              onError={() => {
                setError('Google Sign-In failed');
              }}
            />
          </motion.div>

          {/* Footer info */}
          <motion.div variants={itemVariants} className="text-center text-sm text-gray-400 pt-6">
            New restaurant owner?{' '}
            <Link to="/register" className="text-teal-600 font-bold hover:underline">
              Register Restaurant
            </Link>
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
};

