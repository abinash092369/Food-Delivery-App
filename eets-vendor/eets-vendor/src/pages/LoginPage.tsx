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
      // Clear old vendor localStorage/state
      useVendorAuthStore.getState().logout();

      const res = await vendorAuthApi.googleLogin({ credential });
      if (res.success && res.data) {
        const data = res.data;
        console.log("Vendor Google login response:", data);
        setAuth(data.token, data.user);
        useVendorAuthStore.getState().setRestaurant(data.restaurant);

        // Navigate to dashboard
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
      // Clear old vendor localStorage/state
      useVendorAuthStore.getState().logout();

      const res = await vendorAuthApi.login(formData as any);
      if (res.success && res.data) {
        const data = res.data;
        console.log("Vendor login response:", data);
        setAuth(data.accessToken, data.user);
        
        // Fetch restaurant profile from backend immediately and save it in the store
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

        // Navigate to dashboard
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
        
        {/* Portal Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-primary/20 mx-auto">
            E
          </div>
          <h1 className="text-2xl font-extrabold text-textMain tracking-tight">EETS Vendor Portal</h1>
          <p className="text-sm text-mutedColor">Manage your orders and kitchen operations</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-textMain uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="name@restaurant.com"
                {...register('email')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-gray-50"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-textMain uppercase tracking-wider block">Password</label>
              <a href="#" className="text-xs text-primary font-bold hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-error font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/15 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-150"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-3 text-mutedColor font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div className="flex justify-center w-full">
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
        </div>

        <div className="text-center text-sm text-mutedColor pt-2">
          New restaurant owner?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Register Restaurant
          </Link>
        </div>

      </div>
    </div>
  );
};
