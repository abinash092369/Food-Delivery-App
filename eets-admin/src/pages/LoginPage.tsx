import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/admin-auth.store';
import { adminAuthApi } from '../api/admin-auth.api';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormFields = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema),
  });

  // If already authenticated, redirect immediately
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormFields) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAuthApi.login(data);
      if (response.success && response.data) {
        const { accessToken, user } = response.data;
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          login(accessToken, user);
          navigate('/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please verify server connection and credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50/50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-6">
        {/* Brand/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-2xl mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">EETS Admin Panel</h2>
          <p className="text-sm text-gray-500 font-medium">Log in to manage delivery platform operations</p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-4 rounded-xl border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="admin@eets.com"
                {...register('email')}
                className={`w-full pl-11 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.email ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200 bg-gray-50/30'
                }`}
              />
            </div>
            {errors.email && <p className="text-rose-500 text-xs font-medium">{errors.email.message}</p>}
          </div>

          {/* Password input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-11 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.password ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200 bg-gray-50/30'
                }`}
              />
            </div>
            {errors.password && <p className="text-rose-500 text-xs font-medium">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-teal-600/15 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
