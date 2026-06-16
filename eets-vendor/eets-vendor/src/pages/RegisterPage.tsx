import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { vendorAuthApi } from '../api/vendor-auth.api';
import { ImageUploader } from '../components/ImageUploader';
import { 
  User, 
  MapPin, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  UtensilsCrossed 
} from 'lucide-react';
import { useVendorAuthStore } from '../store/vendor-auth.store';
import { GoogleLogin } from '@react-oauth/google';

// Step 1: Owner Details Schema
const step1Schema = zod.object({
  name: zod.string().min(3, 'Owner name must be at least 3 characters'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(8, 'Password must be at least 8 characters'),
  phone: zod.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number (10 digits starting with 6-9)'),
});

// Step 2: Restaurant Details Schema
const step2Schema = zod.object({
  restaurantName: zod.string().min(3, 'Restaurant name is required'),
  description: zod.string().optional(),
  cuisineTypes: zod.array(zod.string()).min(1, 'Please select at least one cuisine type'),
  addressLine: zod.string().min(5, 'Address is required'),
  city: zod.string().min(2, 'City is required'),
  state: zod.string().min(2, 'State is required'),
  pincode: zod.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  lat: zod.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: zod.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

// Step 3: Licenses & Uploads Schema
const step3Schema = zod.object({
  fssaiLicense: zod.string().min(14, 'FSSAI License must be exactly 14 digits').max(14, 'FSSAI License must be exactly 14 digits'),
  gstNumber: zod.string().optional().refine(
    (val) => !val || /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(val),
    'Invalid GSTIN format'
  ),
  logoUrl: zod.string().optional(),
  coverImageUrl: zod.string().optional(),
});

const registrationSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type RegistrationFormValues = zod.infer<typeof registrationSchema>;

const CUISINES = [
  'North Indian', 'South Indian', 'Biryani', 'Chinese', 'Fast Food', 
  'Mughlai', 'Street Food', 'Desserts', 'Beverages', 'Italian', 'Healthy Food'
];

export const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const navigate = useNavigate();
  const setAuth = useVendorAuthStore((state) => state.setAuth);

  const handleGoogleSignup = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      useVendorAuthStore.getState().logout();

      const res = await vendorAuthApi.googleLogin({ credential });
      if (res.success && res.data) {
        const data = res.data;
        console.log("Vendor Google signup response:", data);
        setAuth(data.token, data.user);
        useVendorAuthStore.getState().setRestaurant(data.restaurant);

        // Redirect directly to settings (Complete Restaurant Setup)
        navigate('/settings');
      } else {
        setError(res.message || 'Google registration failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Google registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      cuisineTypes: [],
      lat: 12.9716, // Default Bengaluru Coordinates
      lng: 77.5946,
      logoUrl: '',
      coverImageUrl: '',
    },
  });

  const watchCuisines = watch('cuisineTypes') || [];
  const watchLogo = watch('logoUrl');
  const watchCover = watch('coverImageUrl');

  const handleCuisineToggle = (cuisine: string) => {
    if (watchCuisines.includes(cuisine)) {
      setValue(
        'cuisineTypes',
        watchCuisines.filter((c) => c !== cuisine)
      );
    } else {
      setValue('cuisineTypes', [...watchCuisines, cuisine]);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email', 'password', 'phone'];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'restaurantName',
        'description',
        'cuisineTypes',
        'addressLine',
        'city',
        'state',
        'pincode',
        'lat',
        'lng',
      ];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setError(null);
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await vendorAuthApi.register(data as any);
      if (res.success) {
        setRegisteredSuccess(true);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Connection error. Please try again or check backend services.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-textMain">Registration Successful!</h2>
            <p className="text-sm text-mutedColor leading-relaxed">
              Your restaurant registration has been submitted successfully. Our admin verification team will review your credentials and FSSAI license.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/10 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-6">
      <div className="max-w-xl w-full bg-surface p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-textMain">Register Your Restaurant</h1>
          <p className="text-sm text-mutedColor">Join the EETS partner network and grow your business</p>
        </div>

        {/* Wizard Steps Progress Bar */}
        <div className="flex items-center justify-between max-w-sm mx-auto relative px-2">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />

          {[
            { step: 1, icon: User, label: 'Owner' },
            { step: 2, icon: UtensilsCrossed, label: 'Restaurant' },
            { step: 3, icon: FileText, label: 'Verification' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300 ${
                  currentStep >= item.step
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${
                currentStep >= item.step ? 'text-primary' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 1: Owner Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-textMain border-b border-gray-50 pb-2">Owner Credentials</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  {...register('name')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                />
                {errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="owner@restaurant.com"
                  {...register('email')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                />
                {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  {...register('password')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                />
                {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase">Phone Number</label>
                <input
                  type="text"
                  placeholder="10-digit Indian number"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                />
                {errors.phone && <p className="text-xs text-error">{errors.phone.message}</p>}
              </div>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-150"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-3 text-mutedColor font-semibold">Or register with</span>
                </div>
              </div>

              {/* Google Sign-Up Button */}
              <div className="flex justify-center w-full">
                <GoogleLogin
                  text="signup_with"
                  theme="outline"
                  size="large"
                  width="380"
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      await handleGoogleSignup(credentialResponse.credential);
                    } else {
                      setError('Google Sign-In returned invalid token');
                    }
                  }}
                  onError={() => {
                    setError('Google Sign-In failed');
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Restaurant Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-textMain border-b border-gray-50 pb-2">Restaurant Profile</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-textMain uppercase">Restaurant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Spice Route Bistro"
                    {...register('restaurantName')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                  {errors.restaurantName && <p className="text-xs text-error">{errors.restaurantName.message}</p>}
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-textMain uppercase">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your kitchen style..."
                    {...register('description')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase block mb-1">Cuisines Offered</label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((cuisine) => {
                    const isSelected = watchCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => handleCuisineToggle(cuisine)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-200 text-mutedColor hover:border-gray-300'
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
                {errors.cuisineTypes && <p className="text-xs text-error">{errors.cuisineTypes.message}</p>}
              </div>

              <h4 className="text-xs font-extrabold text-textMain uppercase tracking-wider pt-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> Location & Address
              </h4>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMain uppercase">Street Address</label>
                <input
                  type="text"
                  placeholder="Shop number, building name, locality"
                  {...register('addressLine')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                />
                {errors.addressLine && <p className="text-xs text-error">{errors.addressLine.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                  {errors.city && <p className="text-xs text-error">{errors.city.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                  {errors.state && <p className="text-xs text-error">{errors.state.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">Pincode</label>
                  <input
                    type="text"
                    placeholder="6 digits"
                    {...register('pincode')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                  {errors.pincode && <p className="text-xs text-error">{errors.pincode.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-mutedColor uppercase">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    {...register('lat', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-mutedColor uppercase">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    {...register('lng', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Verification & Branding */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-textMain border-b border-gray-50 pb-2">Verification & Branding</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">FSSAI License No.</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="14 digits"
                    {...register('fssaiLicense')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 font-mono"
                  />
                  {errors.fssaiLicense && <p className="text-xs text-error">{errors.fssaiLicense.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 29AAAAA1111A1Z1"
                    {...register('gstNumber')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 font-mono"
                  />
                  {errors.gstNumber && <p className="text-xs text-error">{errors.gstNumber.message}</p>}
                </div>
              </div>

              {/* Branding Image Uploads */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <ImageUploader
                  folder="restaurant_logos"
                  label="Restaurant Logo"
                  aspectRatio="square"
                  value={watchLogo}
                  onChange={(url) => setValue('logoUrl', url)}
                />
                
                <ImageUploader
                  folder="restaurant_banners"
                  label="Cover / Banner Image"
                  aspectRatio="video"
                  value={watchCover}
                  onChange={(url) => setValue('coverImageUrl', url)}
                />
              </div>
            </div>
          )}

          {/* Buttons Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/10 transition-colors flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/15 transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="text-center text-sm text-mutedColor">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
};
