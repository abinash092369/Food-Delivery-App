import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Phone, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { driverAuthApi } from '../../api/driver-auth.api';
import { driverApi } from '../../api/driver.api';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import loginIllustration from '../../assets/login-illustration.png';

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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F0F9FF] font-sans overflow-x-hidden">
      
      {/* Left panel: Illustration (Desktop) / Top panel (Mobile) */}
      <div className="w-full md:w-[45%] lg:w-[50%] bg-gradient-to-tr from-blue-950 via-sky-900 to-cyan-800 flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden shrink-0 min-h-[300px] md:min-h-screen">
        
        {/* Animated background glow elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
          {/* Mobile Illustration view */}
          <motion.div 
            className="md:hidden w-40 h-40 flex items-center justify-center mb-4"
            initial="hidden"
            animate="visible"
            variants={mobileIllustrationVariants}
          >
            <img src={loginIllustration} alt="Driver Illustration" className="w-full h-full object-contain" />
          </motion.div>
          
          {/* Desktop Illustration view */}
          <motion.div 
            className="hidden md:flex w-72 lg:w-96 h-72 lg:h-96 items-center justify-center mb-8"
            initial="hidden"
            animate="visible"
            variants={illustrationVariants}
          >
            <img src={loginIllustration} alt="Driver Illustration" className="w-full h-full object-contain filter drop-shadow-2xl" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white text-2xl lg:text-3.5xl font-heading font-extrabold tracking-tight"
          >
            Deliver & Earn on Your Schedule
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-blue-100 text-sm lg:text-base mt-2 max-w-sm font-medium"
          >
            Choose your own hours, track your earnings in real time, and deliver meals efficiently as a partner.
          </motion.p>
        </div>
      </div>

      {/* Right panel: Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[24px] border border-blue-100/50 shadow-2xl shadow-blue-950/5 p-8 lg:p-10"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          
          {/* Unified éets logo at top */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="bg-[#0284c7] text-white px-5 py-1.5 rounded-full font-heading font-black text-xl tracking-tight flex items-center gap-1.5 shadow-md shadow-blue-600/10">
              <span className="leading-none">éets</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center space-y-1.5 mb-6">
            <h2 className="text-2xl font-heading font-extrabold text-gray-900">Driver Partner Portal</h2>
            <p className="text-sm text-gray-500 font-medium">Log in to start delivering and earning</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-700 text-sm mb-4"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium text-left">{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-1 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    {...phoneForm.register('phone')}
                    className={`w-full pl-14 pr-11 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white ${
                      phoneForm.formState.errors.phone ? 'border-rose-300' : 'border-gray-200'
                    }`}
                  />
                  <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-xs text-rose-550 font-medium mt-1">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
              
              <motion.div variants={itemVariants} className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Register as a new partner
                </button>
              </motion.div>
            </form>
          )}

          {/* Form Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-1 text-left">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    6-Digit OTP code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    placeholder="000000"
                    {...otpForm.register('otp')}
                    ref={(e) => {
                      otpForm.register('otp').ref(e);
                      otpInputRef.current = e;
                    }}
                    className={`w-full py-3 px-4 text-center text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/40 hover:bg-gray-50/80 focus:bg-white text-gray-800 font-black tracking-[0.4em] ${
                      otpForm.formState.errors.otp ? 'border-rose-300' : 'border-gray-200'
                    }`}
                  />
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-xs text-rose-550 font-medium mt-1">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 text-center">
                  OTP sent to <span className="font-bold text-gray-600">+91 {phoneVal}</span>
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}

        </motion.div>
      </div>

    </div>
  );
};

export default OtpLoginPage;
