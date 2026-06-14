import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
  User as UserIcon,
  Phone,
  Lock,
  Mail,
  Calendar,
  Truck,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Building,
  CreditCard,
  Check
} from 'lucide-react';
import { driverAuthApi } from '../../api/driver-auth.api';
import { driverApi } from '../../api/driver.api';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import { VehicleType } from '../../types/driver.types';

// Multi-step form schema validation using Zod
const personalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  dob: z.string().min(1, 'Date of birth is required'),
});

const vehicleSchema = z.object({
  vehicleType: z.enum(['BIKE', 'SCOOTER', 'BICYCLE', 'CAR'] as const),
  vehicleMake: z.string().min(1, 'Vehicle make is required (e.g. Hero, Honda)'),
  vehicleModel: z.string().min(1, 'Vehicle model is required (e.g. Splendor, Activa)'),
  vehicleRegNumber: z.string().min(1, 'Registration number is required'),
});

const documentsSchema = z.object({
  aadhaarFrontUrl: z.string().min(1, 'Aadhaar Card Front is required'),
  aadhaarBackUrl: z.string().min(1, 'Aadhaar Card Back is required'),
  licenseUrl: z.string().min(1, 'Driving License is required'),
  rcUrl: z.string().min(1, 'Vehicle RC is required'),
  selfieUrl: z.string().min(1, 'Selfie photo is required'),
});

const bankSchema = z.object({
  bankAccountNumber: z.string().min(9, 'Enter a valid bank account number'),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid 11-digit IFSC code'),
  upiId: z.string().min(3, 'UPI ID is required'),
});

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useDriverAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<number>(location.state?.step || 1);
  const [phoneVal, setPhoneVal] = useState<string>(location.state?.phone || '');
  const [otpVal, setOtpVal] = useState<string>('');
  const [tempToken, setTempToken] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Document upload loading states
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Forms setup
  const phoneForm = useForm({
    defaultValues: { phone: phoneVal },
  });

  const otpForm = useForm({
    defaultValues: { otp: '' },
  });

  const personalForm = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: { name: '', email: '', dob: '' },
  });

  const vehicleForm = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleType: 'BIKE' as VehicleType,
      vehicleMake: '',
      vehicleModel: '',
      vehicleRegNumber: '',
    },
  });

  const documentsForm = useForm({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      aadhaarFrontUrl: '',
      aadhaarBackUrl: '',
      licenseUrl: '',
      rcUrl: '',
      selfieUrl: '',
    },
  });

  const bankForm = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: { bankAccountNumber: '', bankIfsc: '', upiId: '' },
  });

  // OTP send handler
  const handleSendOtp = async (data: { phone: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await driverAuthApi.sendOtp(data.phone);
      setPhoneVal(data.phone);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP verify handler
  const handleVerifyOtp = async (data: { otp: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await driverAuthApi.verifyOtp(phoneVal, data.otp);
      const { accessToken, user } = res.data;
      setTempToken(accessToken);
      setOtpVal(data.otp);

      // If user exists and is already a DRIVER, fetch profile and go Home (Login bypass)
      if (user.role === 'DRIVER') {
        try {
          setAuth(accessToken, null);
          const profileRes = await driverApi.getProfile();
          setAuth(accessToken, profileRes.data);
          navigate('/', { replace: true });
        } catch (profileErr) {
          // If no profile yet, proceed to complete onboarding
          setAuth(null, null);
          setStep(3);
        }
      } else {
        setStep(3);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Cloudinary direct file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof z.infer<typeof documentsSchema>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading((prev) => ({ ...prev, [fieldName]: true }));
    setErrorMsg('');

    try {
      // 1. Get upload signature from Spring Boot (authorized call)
      const headers = tempToken ? { Authorization: `Bearer ${tempToken}` } : undefined;
      const signatureRes = await axios.post(
        'http://localhost:8080/api/cloudinary/sign-upload',
        { folder: 'driver-docs' },
        { headers }
      );
      
      const { signature, timestamp, apiKey, cloudName, folder } = signatureRes.data.data;

      // 2. Prepare Form Data for direct Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      // 3. Post directly to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 4. Save file secure_url back to document form values
      documentsForm.setValue(fieldName, uploadRes.data.secure_url, { shouldValidate: true });
    } catch (err: any) {
      console.error('File upload failed', err);
      setErrorMsg('Failed to upload file to Cloudinary. Check your internet connection.');
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  // Onboarding registration submit handler
  const handleRegisterSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const personal = personalForm.getValues();
      const vehicle = vehicleForm.getValues();
      const docs = documentsForm.getValues();
      const bank = bankForm.getValues();

      const payload = {
        name: personal.name,
        phone: phoneVal,
        email: personal.email,
        dob: personal.dob,
        vehicleType: vehicle.vehicleType,
        vehicleMake: vehicle.vehicleMake,
        vehicleModel: vehicle.vehicleModel,
        vehicleRegNumber: vehicle.vehicleRegNumber,
        aadhaarFrontUrl: docs.aadhaarFrontUrl,
        aadhaarBackUrl: docs.aadhaarBackUrl,
        licenseUrl: docs.licenseUrl,
        rcUrl: docs.rcUrl,
        selfieUrl: docs.selfieUrl,
        bankAccountNumber: bank.bankAccountNumber,
        bankIfsc: bank.bankIfsc,
        upiId: bank.upiId,
      };

      // Register the driver profile
      const regRes = await driverAuthApi.register(payload);
      
      const token = regRes.data.accessToken || tempToken;

      // Verify OTP again (or use tempToken) to save credentials to Zustand
      if (token) {
        setAuth(token, null);
        const profileRes = await driverApi.getProfile();
        setAuth(token, profileRes.data);
      }
      setStep(7);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => {
    const totalSteps = 6;
    if (step > totalSteps) return null;
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(((step - 1) / (totalSteps - 1)) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-md">
        
        {renderProgressIndicator()}

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Phone Verification */}
        {step === 1 && (
          <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mb-1">Verify Mobile</h2>
              <p className="text-xs text-gray-400 mb-6">We will send a 6-digit OTP code to verify your phone number</p>
              
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  {...phoneForm.register('phone', { required: true })}
                  className="w-full h-12 pl-14 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-bold transition-all text-sm"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Entry */}
        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Enter OTP</h2>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline">Change</button>
              </div>
              <p className="text-xs text-gray-400 mb-6">Enter the 6-digit code sent to +91 {phoneVal}</p>

              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  {...otpForm.register('otp', { required: true })}
                  className="w-full h-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-center text-gray-800 font-black tracking-[0.4em] transition-all text-sm"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* STEP 3: Personal Details */}
        {step === 3 && (
          <form onSubmit={personalForm.handleSubmit(() => setStep(4))} className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mb-1">Personal Profile</h2>
              <p className="text-xs text-gray-400 mb-6">Please provide your personal information</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      {...personalForm.register('name')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {personalForm.formState.errors.name && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{personalForm.formState.errors.name.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="driver@eets.com"
                      {...personalForm.register('email')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {personalForm.formState.errors.email && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{personalForm.formState.errors.email.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      {...personalForm.register('dob')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {personalForm.formState.errors.dob && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{personalForm.formState.errors.dob.message}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              Continue to Vehicle Details <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 4: Vehicle Details */}
        {step === 4 && (
          <form onSubmit={vehicleForm.handleSubmit(() => setStep(5))} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => setStep(3)} className="text-gray-400 hover:text-gray-650"><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Vehicle Setup</h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Describe the vehicle you will use for deliveries</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Vehicle Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BIKE', 'SCOOTER', 'BICYCLE', 'CAR'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => vehicleForm.setValue('vehicleType', type)}
                        className={`h-11 border rounded-2xl text-xs font-bold transition-all ${
                          vehicleForm.watch('vehicleType') === type
                            ? 'border-primary bg-primary-light text-primary ring-2 ring-primary-light'
                            : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Make / Brand</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Honda, Bajaj, Hero"
                      {...vehicleForm.register('vehicleMake')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {vehicleForm.formState.errors.vehicleMake && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{vehicleForm.formState.errors.vehicleMake.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Model Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Activa 6G, Pulsar 150"
                    {...vehicleForm.register('vehicleModel')}
                    className="w-full h-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                  />
                  {vehicleForm.formState.errors.vehicleModel && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{vehicleForm.formState.errors.vehicleModel.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH 12 AB 1234"
                    {...vehicleForm.register('vehicleRegNumber')}
                    className="w-full h-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-bold transition-all text-sm uppercase"
                  />
                  {vehicleForm.formState.errors.vehicleRegNumber && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{vehicleForm.formState.errors.vehicleRegNumber.message}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              Continue to Document Uploads <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 5: Document Uploads */}
        {step === 5 && (
          <form onSubmit={documentsForm.handleSubmit(() => setStep(6))} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => setStep(4)} className="text-gray-400 hover:text-gray-650"><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Upload Documents</h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Scan and upload official driver identification documents</p>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {/* Document Slots */}
                {([
                  { key: 'selfieUrl', label: 'Selfie Photo' },
                  { key: 'aadhaarFrontUrl', label: 'Aadhaar Card (Front)' },
                  { key: 'aadhaarBackUrl', label: 'Aadhaar Card (Back)' },
                  { key: 'licenseUrl', label: 'Driving License' },
                  { key: 'rcUrl', label: 'Vehicle Registration (RC)' },
                ] as const).map((doc) => {
                  const url = documentsForm.watch(doc.key);
                  const isUploading = uploading[doc.key];

                  return (
                    <div key={doc.key} className="border border-gray-150 rounded-2xl p-4 bg-gray-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">{doc.label}</span>
                        {url ? (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                            <Check className="w-3.5 h-3.5" /> Uploaded successfully
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-450 block mt-0.5">Required document</span>
                        )}
                      </div>
                      
                      <label className="relative cursor-pointer min-w-[100px] h-10 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 px-3 shadow-sm">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : url ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Change
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" /> Upload
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, doc.key)}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              {Object.keys(documentsForm.formState.errors).length > 0 && (
                <span className="text-rose-500 text-[10px] font-bold mt-2 block">Please upload all mandatory documents before continuing.</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              Continue to Bank Details <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 6: Bank Account & Payment Info */}
        {step === 6 && (
          <form onSubmit={bankForm.handleSubmit(handleRegisterSubmit)} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => setStep(5)} className="text-gray-400 hover:text-gray-650"><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Payout Account</h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Where we will deposit your earnings and incentives</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Bank Account Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Account Number"
                      {...bankForm.register('bankAccountNumber')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {bankForm.formState.errors.bankAccountNumber && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{bankForm.formState.errors.bankAccountNumber.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Bank IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    {...bankForm.register('bankIfsc')}
                    className="w-full h-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-bold transition-all text-sm uppercase"
                  />
                  {bankForm.formState.errors.bankIfsc && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{bankForm.formState.errors.bankIfsc.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">UPI ID (e.g. paytm, gpay, ybl)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="driver@ybl"
                      {...bankForm.register('upiId')}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold transition-all text-sm"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {bankForm.formState.errors.upiId && (
                    <span className="text-rose-500 text-[10px] font-bold mt-1 block">{bankForm.formState.errors.upiId.message}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Application <Check className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* STEP 7: Submission complete, Under review */}
        {step === 7 && (
          <div className="text-center py-6 space-y-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Application Under Review</h2>
              <p className="text-xs text-gray-400 mt-2 px-4 leading-relaxed">
                Thank you for registering! Our admin team is verifying your uploaded identification documents and vehicle details. 
                This usually takes 24-48 hours. You will receive an update once verified.
              </p>
            </div>
            
            <div className="p-4 bg-gray-55 rounded-2xl border border-gray-100 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Registration Summary</span>
              <div className="space-y-1 text-xs font-semibold text-gray-600">
                <p>Phone: +91 {phoneVal}</p>
                <p>Name: {personalForm.getValues('name')}</p>
                <p>Vehicle: {vehicleForm.getValues('vehicleMake')} {vehicleForm.getValues('vehicleModel')}</p>
                <p>Status: <span className="text-primary font-bold">Awaiting Verification</span></p>
              </div>
            </div>

            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-extrabold flex items-center justify-center shadow-lg shadow-orange-100 transition-all text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisterPage;
