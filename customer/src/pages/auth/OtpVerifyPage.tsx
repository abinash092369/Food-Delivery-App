import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const otpSchema = zod.object({
  otp: zod.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
})

type OtpInputs = zod.infer<typeof otpSchema>;

export const OtpVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const phone = searchParams.get('phone') || ''

  const { verifyOtp, isVerifyingOtp, sendOtp, isSendingOtp } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInputs>({
    resolver: zodResolver(otpSchema),
  })

  const onSubmit = (data: OtpInputs) => {
    verifyOtp({ phone, countryCode: '+91', otp: data.otp })
  }

  const handleResend = () => {
    sendOtp({ phone, countryCode: '+91' })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        {/* Back Link */}
        <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-mutedColor hover:text-primary transition-colors font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Register</span>
        </Link>

        {/* Header */}
        <div className="text-center">
          <img src="/logo.jpg" alt="EETS Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4" />
          <h2 className="font-heading text-3xl font-extrabold text-textMain">Verify OTP</h2>
          <p className="mt-2 text-sm text-mutedColor">
            Enter the 6-digit OTP sent to <strong className="text-textMain">{phone}</strong>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="otp" className="block text-sm font-semibold text-textMain mb-1">
              One-Time Password (OTP)
            </label>
            <div className="relative">
              <input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                {...register('otp')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-center tracking-[0.5em] text-textMain font-bold"
              />
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {errors.otp && (
              <p className="text-xs text-error mt-1 font-medium text-center">{errors.otp.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify OTP</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isSendingOtp}
              className="w-full bg-gray-50 hover:bg-gray-100 text-mutedColor hover:text-textMain py-2.5 px-4 rounded-xl text-xs font-bold border border-gray-100 transition-colors disabled:opacity-50"
            >
              {isSendingOtp ? 'Sending code...' : 'Resend Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default OtpVerifyPage
