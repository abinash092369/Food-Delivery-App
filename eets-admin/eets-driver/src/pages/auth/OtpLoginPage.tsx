import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { driverAuthApi } from '../../api/driver-auth.api';
import { driverApi } from '../../api/driver.api';
import { useDriverAuthStore } from '../../store/driver-auth.store';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});

export const OtpLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useDriverAuthStore((state) => state.setAuth);
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneVal, setPhoneVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const phoneForm = useForm<{ phone: string }>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<{ otp: string }>({
    resolver: zodResolver(otpSchema),
  });

  // Focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const onSendOtp = async (data: { phone: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await driverAuthApi.sendOtp(data.phone);
      setPhoneVal(data.phone);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: { otp: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Verify OTP
      const res = await driverAuthApi.verifyOtp(phoneVal, data.otp);
      const { accessToken, user } = res.data;

      // Temporarily store token so that the profile request can use it
      setAuth(accessToken, null);

      if (user.role === 'DRIVER') {
        try {
          // 2. Fetch full Driver Profile details
          const profileRes = await driverApi.getProfile();
          setAuth(accessToken, profileRes.data);
          navigate('/', { replace: true });
        } catch (profileErr) {
          // If profile not found but role is DRIVER (edge case), redirect to Register
          setAuth(null, null);
          navigate('/register', { state: { phone: phoneVal, step: 3, user } });
        }
      } else {
        // User has Role.CUSTOMER. Redirect them to complete onboarding
        setAuth(null, null);
        navigate('/register', { state: { phone: phoneVal, step: 3, user } });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-black text-2xl tracking-tighter">EETS</span>
          </div>
          <h1 className="text-2xl font-black text-gray-905 tracking-tight">EETS Driver Partner</h1>
          <p className="text-sm text-gray-400 mt-1">Deliver food & earn on your schedule</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Enter Phone Number */}
        {step === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  {...phoneForm.register('phone')}
                  className="w-full h-12 pl-14 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-bold transition-all text-sm"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {phoneForm.formState.errors.phone && (
                <span className="text-rose-500 text-[10px] font-bold mt-1 block">
                  {phoneForm.formState.errors.phone.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Register as a new partner
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider">
                  6-Digit OTP code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Change Number
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={6}
                  placeholder="000 000"
                  {...otpForm.register('otp')}
                  ref={(e) => {
                    otpForm.register('otp').ref(e);
                    otpInputRef.current = e;
                  }}
                  className="w-full h-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-center text-gray-800 font-black tracking-[0.4em] transition-all text-base"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {otpForm.formState.errors.otp && (
                <span className="text-rose-500 text-[10px] font-bold mt-1 block">
                  {otpForm.formState.errors.otp.message}
                </span>
              )}
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                OTP sent to <span className="font-bold text-gray-600">+91 {phoneVal}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify & Login <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OtpLoginPage;
