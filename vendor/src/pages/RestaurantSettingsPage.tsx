import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorRestaurantApi, RestaurantUpdateRequest } from '../api/vendor-restaurant.api';
import { ImageUploader } from '../components/ImageUploader';
import { 
  Save, 
  MapPin, 
  Clock, 
  Info, 
  CheckCircle, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react';

const CUISINES = [
  'North Indian', 'South Indian', 'Biryani', 'Chinese', 'Fast Food', 
  'Mughlai', 'Street Food', 'Desserts', 'Beverages', 'Italian', 'Healthy Food'
];

const DAYS_OF_WEEK = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 7, label: 'Sun' }
];

export const RestaurantSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Profile Details
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['restaurant-profile'],
    queryFn: () => vendorRestaurantApi.getRestaurant(),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const restaurant = profileRes?.data;

  const isApproved = restaurant && (
    restaurant.isApproved === true ||
    (restaurant as any).is_approved === 1 ||
    (restaurant as any).is_approved === true
  );

  const isDraft = restaurant && !isApproved && (!restaurant.fssaiLicense || !restaurant.addressLine);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [deliveryTimeMin, setDeliveryTimeMin] = useState('30');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [daysOpen, setDaysOpen] = useState<number[]>([1,2,3,4,5,6,7]);

  // Load values when restaurant profile is loaded
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || (restaurant as any).restaurantName || '');
      setDescription(restaurant.description || (restaurant as any).restaurantDescription || '');
      setCuisineTypes(restaurant.cuisineTypes || (restaurant as any).cuisines || []);
      setCoverImageUrl(restaurant.coverImageUrl || (restaurant as any).cover_image_url || (restaurant as any).bannerUrl || '');
      setLogoUrl(restaurant.logoUrl || (restaurant as any).logo_url || '');
      setAddressLine(restaurant.addressLine || (restaurant as any).address_line || '');
      setCity(restaurant.city || '');
      setState(restaurant.state || '');
      setPincode(restaurant.pincode || '');
      setLat(restaurant.lat ?? 12.9716);
      setLng(restaurant.lng ?? 77.5946);
      setMinOrderAmount(restaurant.minOrderAmount?.toString() || '0');
      setDeliveryTimeMin(restaurant.deliveryTimeMin?.toString() || '30');
      setDeliveryFee(restaurant.deliveryFee?.toString() || '0');
      
      // Formatting time HH:mm:ss -> HH:mm
      setOpeningTime(restaurant.openingTime ? restaurant.openingTime.slice(0, 5) : '09:00');
      setClosingTime(restaurant.closingTime ? restaurant.closingTime.slice(0, 5) : '22:00');
      setDaysOpen(restaurant.daysOpen || [1,2,3,4,5,6,7]);
    }
  }, [restaurant]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (req: RestaurantUpdateRequest) => vendorRestaurantApi.updateRestaurant(req),
    onSuccess: (res) => {
      if (res.success) {
        setSuccessMsg('Restaurant settings saved successfully!');
        setErrorMsg(null);
        queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.message || 'Update failed.');
      }
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update restaurant settings.');
    }
  });

  const handleCuisineToggle = (cuisine: string) => {
    setCuisineTypes((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleDayToggle = (dayVal: number) => {
    setDaysOpen((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Restaurant name is required');
      return;
    }
    if (cuisineTypes.length === 0) {
      setErrorMsg('Please select at least one cuisine');
      return;
    }
    if (!addressLine.trim() || !city.trim() || !pincode.trim()) {
      setErrorMsg('Full address is required');
      return;
    }

    setErrorMsg(null);
    console.log('[VENDOR_SAVE_PAYLOAD] logoUrl/coverImageUrl/imageUrl= logoUrl=' + logoUrl + ', coverImageUrl=' + coverImageUrl);
    updateMutation.mutate({
      name,
      description,
      cuisineTypes,
      coverImageUrl,
      logoUrl,
      addressLine,
      city,
      state,
      pincode,
      lat,
      lng,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      deliveryTimeMin: parseInt(deliveryTimeMin) || 30,
      deliveryFee: parseFloat(deliveryFee) || 0,
      openingTime: `${openingTime}:00`,
      closingTime: `${closingTime}:00`,
      daysOpen,
    });
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-mutedColor">Loading restaurant profile settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Restaurant Settings</h1>
        <p className="text-sm text-mutedColor">Manage business hours, delivery boundaries, and cover images</p>
      </div>

      {/* Approval Status Banner inside settings */}
      {restaurant && (
        isDraft ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm text-amber-850">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-905">Restaurant Setup Incomplete</h4>
              <p className="text-xs opacity-90 mt-0.5 text-amber-800">
                Please complete your restaurant details, FSSAI license, and address below to submit your profile for admin review.
              </p>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
            isApproved 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : restaurant.rejectionReason
                ? 'bg-red-50 border-red-100 text-red-800'
                : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            {isApproved ? (
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <div>
              <h4 className="text-sm font-bold">
                Verification Status: {isApproved ? 'Approved & Active' : restaurant.rejectionReason ? 'Rejected' : 'Under Review'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {isApproved 
                  ? 'Your kitchen details are verified and live on the customer app.'
                  : restaurant.rejectionReason
                    ? `Reason: "${restaurant.rejectionReason}". Please update the form below and resubmit for approval.`
                    : 'Your FSSAI and kitchen details are currently under verification. Updates below will sync immediately.'}
              </p>
            </div>
          </div>
        )
      )}

      {/* Notification Toast */}
      {successMsg && (
        <div className="bg-emerald-500 border border-emerald-600 rounded-xl p-4 text-white text-sm font-bold shadow-lg animate-bounce">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-surface border border-gray-100 rounded-3xl p-8 shadow-sm">
        
        {/* SECTION 1: BUSINESS BASICS */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-textMain pb-2 border-b border-gray-50">Business Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Restaurant Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase block mb-1">Cuisines Selection</label>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1.5 border rounded-xl bg-gray-50">
                {CUISINES.map((c) => {
                  const active = cuisineTypes.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCuisineToggle(c)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        active 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-mutedColor border-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-textMain uppercase">Restaurant Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: BRANDING ASSETS */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-textMain pb-2 border-b border-gray-50">Branding & Covers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <ImageUploader
              folder="restaurant_logos"
              label="Restaurant Logo/Thumbnail"
              aspectRatio="square"
              value={logoUrl}
              onChange={setLogoUrl}
            />

            <ImageUploader
              folder="restaurant_banners"
              label="Cover banner (App Header)"
              aspectRatio="video"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
            />
          </div>
        </div>

        {/* SECTION 3: LOCATION & GPS */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-textMain pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <MapPin className="w-5 h-5 text-primary" /> Delivery Area & GPS Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-textMain uppercase">Street Address</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            {/* GPS coordinates mapping */}
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-bold text-mutedColor uppercase">GPS Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50 font-mono"
              />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold text-mutedColor uppercase">GPS Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: OPERATIONS & DELIVERY PARAMS */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-textMain pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-primary" /> Hours & Delivery Charges
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Min Order Amount (₹)</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Est. Prep Time (mins)</label>
              <input
                type="number"
                value={deliveryTimeMin}
                onChange={(e) => setDeliveryTimeMin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Base Delivery Fee (₹)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Opening Time</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-textMain uppercase">Closing Time</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
              />
            </div>

            {/* Days open */}
            <div className="space-y-1 col-span-3">
              <label className="text-xs font-bold text-textMain uppercase block mb-1">Operational Days</label>
              <div className="flex bg-gray-50 border rounded-xl p-2 max-w-sm justify-between">
                {DAYS_OF_WEEK.map((d) => {
                  const selected = daysOpen.includes(d.val);
                  return (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => handleDayToggle(d.val)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                        selected 
                          ? 'bg-primary text-white' 
                          : 'text-mutedColor hover:bg-gray-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-colors flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
};
