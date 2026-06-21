import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { Mail, Lock, Loader2, ArrowLeft, Key } from 'lucide-react'

// Schema for requesting password reset
const requestSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
})
type RequestInputs = zod.infer<typeof requestSchema>;

// Schema for resetting password with token
const resetSchema = zod
  .object({
    newPassword: zod.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type ResetInputs = zod.infer<typeof resetSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const { forgotPassword, isRequestingReset, resetPassword, isResettingPassword } = useAuth()

  const {
    register: registerReq,
    handleSubmit: handleSubmitReq,
    formState: { errors: errorsReq },
  } = useForm<RequestInputs>({
    resolver: zodResolver(requestSchema),
  })

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetInputs>({
    resolver: zodResolver(resetSchema),
  })

  const onRequestSubmit = (data: RequestInputs) => {
    forgotPassword(data)
  }

  const onResetSubmit = (data: ResetInputs) => {
    resetPassword({ token: token || '', newPassword: data.newPassword })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-mutedColor hover:text-primary transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        {token ? (
          /* Case: Reset Password Form */
          <>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-extrabold text-textMain">Reset Password</h2>
              <p className="mt-2 text-sm text-mutedColor">
                Enter your new secure password
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmitReset(onResetSubmit)}>
              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-textMain mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerReset('newPassword')}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                    />
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errorsReset.newPassword && (
                    <p className="text-xs text-error mt-1 font-medium">{errorsReset.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-textMain mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerReset('confirmPassword')}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                    />
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errorsReset.confirmPassword && (
                    <p className="text-xs text-error mt-1 font-medium">{errorsReset.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Case: Request Password Reset Form */
          <>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-extrabold text-textMain">Forgot Password</h2>
              <p className="mt-2 text-sm text-mutedColor">
                We'll email you instructions to reset your password
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmitReq(onRequestSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-textMain mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...registerReq('email')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                  />
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errorsReq.email && (
                  <p className="text-xs text-error mt-1 font-medium">{errorsReq.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isRequestingReset}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isRequestingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending instructions...</span>
                    </>
                  ) : (
                    <span>Request Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
export default ForgotPasswordPage
