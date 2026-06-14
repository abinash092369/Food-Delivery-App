import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDriverAuthStore } from '../../store/driver-auth.store';
import { driverApi } from '../../api/driver.api';
import { driverReviewApi } from '../../api/driver-review.api';
import { axiosInstance } from '../../api/axios';
import {
  User as UserIcon,
  Camera,
  Edit2,
  Check,
  CheckCircle,
  Truck,
  FileText,
  Star,
  LogOut,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

export const ProfilePage: React.FC = () => {
  const { driver, accessToken, setDriver, logout } = useDriverAuthStore();
  const [editing, setEditing] = useState<boolean>(false);
  
  // Local edit inputs
  const [editName, setEditName] = useState<string>(driver?.name || '');
  const [editUpiId, setEditUpiId] = useState<string>(driver?.upiId || '');

  const [saving, setSaving] = useState<boolean>(false);
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Fetch reviews for driver
  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ['driverReviews', driver?.id],
    queryFn: async () => {
      if (!driver) return null;
      const res = await driverReviewApi.getReviewsByDriver(driver.id);
      return res.data;
    },
    enabled: !!driver,
  });

  const reviews = reviewsRes?.content || [];

  // PWA/Profile Image upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !driver) return;

    const file = files[0];
    setPhotoUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Get signature
      const signatureRes = await driverApi.signCloudinaryUpload('driver-profiles');
      const { signature, timestamp, apiKey, cloudName, folder } = signatureRes.data;

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      // 3. Post to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPhotoUrl = uploadRes.data.secure_url;

      // 4. Update profile in Spring Boot
      const profileUpdateRes = await driverApi.updateProfile({
        profileImageUrl: newPhotoUrl
      } as any); // Update profileImageUrl
      
      setDriver(profileUpdateRes.data);
      setSuccessMsg('Profile photo updated successfully!');
    } catch (err) {
      console.error('Photo upload failed', err);
      setErrorMsg('Failed to update profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!driver) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await driverApi.updateProfile({
        name: editName,
        upiId: editUpiId,
      });
      setDriver(res.data);
      setSuccessMsg('Profile saved successfully!');
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      setErrorMsg('Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    // Call logout endpoint to invalidate tokens (optional / best effort)
    if (accessToken) {
      axiosInstance.post('/api/auth/logout', null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    }
    logout();
  };

  if (!driver) return null;

  const displayName = driver?.name || "Driver";
  const initial = displayName?.charAt(0)?.toUpperCase() || "D";

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-black text-gray-800 tracking-tight">Driver Profile</h1>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-semibold flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Profile Photo & Editable Details Header */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm flex flex-col items-center relative">
        <div className="relative w-24 h-24 mb-4">
          {photoUploading ? (
            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : driver?.profileImageUrl ? (
            <img
              src={driver.profileImageUrl}
              className="w-full h-full rounded-full object-cover border border-gray-200"
              alt={displayName}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center border border-primary/10 text-primary font-bold text-3xl">
              {initial}
            </div>
          )}
          
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-colors">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={photoUploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Details Editing */}
        {editing ? (
          <div className="w-full space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">UPI ID for Payouts</label>
              <input
                type="text"
                value={editUpiId}
                onChange={(e) => setEditUpiId(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-150 rounded-xl text-xs font-bold text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-100"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Details
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center w-full relative">
            <button
              onClick={() => {
                setEditName(driver.name);
                setEditUpiId(driver.upiId || '');
                setEditing(true);
              }}
              className="absolute right-0 top-0 w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            
            <h2 className="text-lg font-black text-gray-850 tracking-tight">{driver.name}</h2>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">+91 {driver.phone}</p>
            {driver.upiId && (
              <span className="inline-block text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold mt-2 tracking-wide uppercase">
                UPI: {driver.upiId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Vehicle Registrations Display Only */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-gray-800 tracking-tight flex items-center gap-1.5">
          <Truck className="w-4.5 h-4.5 text-gray-400" /> Vehicle Information
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Vehicle Type</span>
            <span className="font-bold text-gray-750 block mt-0.5 uppercase">{driver.vehicleType}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Registration Number</span>
            <span className="font-bold text-gray-750 block mt-0.5 uppercase">{driver.vehicleRegNumber}</span>
          </div>
          <div className="col-span-2 border-t border-gray-50 pt-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Make & Model</span>
            <span className="font-bold text-gray-750 block mt-0.5">
              {driver.vehicleMake} {driver.vehicleModel}
            </span>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 mt-2 font-medium">
          Note: To update registered vehicle details, please contact partner support.
        </p>
      </div>

      {/* 3. Onboarding Documents Chips */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-gray-800 tracking-tight flex items-center gap-1.5">
          <FileText className="w-4.5 h-4.5 text-gray-400" /> Document Verification
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {['Aadhaar Card', 'Driving License', 'Vehicle RC'].map((docName) => (
            <div
              key={docName}
              className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-500 font-black" />
              <span className="text-xs font-bold text-emerald-700">{docName} verified</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Customer Reviews & Feedbacks */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">Recent Reviews</h3>
          <div className="flex items-center text-amber-500 font-bold text-xs gap-0.5">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{Number(driver.avgRating || 5.0).toFixed(1)} Rating</span>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No reviews received yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">{rev.customerName}</span>
                  <div className="flex text-amber-500 gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500" />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-gray-500 italic">"{rev.comment}"</p>
                )}
                <span className="text-[9px] text-gray-400 block">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Logout */}
      <button
        onClick={handleLogout}
        className="w-full h-12 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
      >
        <LogOut className="w-4 h-4" /> LOG OUT
      </button>
    </div>
  );
};

export default ProfilePage;
