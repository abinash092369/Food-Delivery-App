import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../../api/user.api'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import axios from 'axios'
import {
  User as UserIcon,
  MapPin,
  Heart,
  Bell,
  Sliders,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Upload,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Sub-pages/Components
import AddressesPage from './AddressesPage'
import FavoritesPage from './FavoritesPage'
import NotificationsPage from '../notifications/NotificationsPage'

// Form schemas
const profileSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  phone: zod.string().min(10, 'Phone must be at least 10 digits'),
})
type ProfileInputs = zod.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user, updateProfile, isUpdatingProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'favorites' | 'notifications' | 'preferences'>('profile')

  // Cloudinary uploading state
  const [isUploading, setIsUploading] = useState(false)

  // Fetch preferences
  const { data: preferences, isLoading: isPrefsLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => userApi.getNotificationPreferences(),
  })

  // Form hooks
  const { register: regProfile, handleSubmit: handleProfileSubmit } = useForm<ProfileInputs>({
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
    resolver: zodResolver(profileSchema),
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => userApi.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Preferences updated')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update preferences')
    },
  })

  // Handle profile photo Cloudinary Signed Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate image format: jpg, png, webp only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid image format. Allowed formats: jpg, png, webp')
      return
    }

    // Validate image size: max 5MB
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image is too large. Maximum size allowed is 5MB.')
      return
    }

    setIsUploading(true)
    console.log('[CUSTOMER_AVATAR_UPLOAD_START]')

    const saveToLocalStorageFallback = () => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Data = reader.result as string
        localStorage.setItem('customer_profile_photo', base64Data)
        
        // Also update local store user avatar so navbar and profile update immediately
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            profileImageUrl: base64Data,
            avatarUrl: base64Data
          })
        }
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        console.log('[CUSTOMER_AVATAR_UPLOAD_SUCCESS]', 'Stored in localStorage base64')
        toast.success('Profile photo updated')
      }
      reader.onerror = (error) => {
        console.error('[CUSTOMER_AVATAR_UPLOAD_FAILED]', error)
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }

    try {
      // 1. Get signed signature from backend
      const { signature, timestamp, apiKey, cloudName, folder, uploadPreset } = await userApi.getCloudinarySignature('eets/avatars')

      // 2. Build form data for Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      if (folder) formData.append('folder', folder)
      if (uploadPreset) formData.append('upload_preset', uploadPreset)

      // 3. Upload directly to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )

      const secureUrl = response.data.secure_url

      // 4. Save photo secure URL to backend profile
      await updateProfile({
        name: user?.name || '',
        phone: user?.phone || '',
        avatarUrl: secureUrl,
        toastMessage: 'Profile photo updated'
      } as any)
      
      // Clean up fallback if it succeeded
      localStorage.removeItem('customer_profile_photo')
      console.log('[CUSTOMER_AVATAR_UPLOAD_SUCCESS]', secureUrl)
    } catch (err: any) {
      console.error('[CUSTOMER_AVATAR_UPLOAD_FAILED]', err.message || err)
      // Fallback to Base64 localStorage
      saveToLocalStorageFallback()
    } finally {
      setIsUploading(false)
    }
  }

  const handleProfileSave = (data: ProfileInputs) => {
    const isPhoneChanged = data.phone !== user?.phone
    const toastMessage = isPhoneChanged ? 'Phone number saved' : 'Profile updated successfully'
    updateProfile({ 
      ...data, 
      avatarUrl: localStorage.getItem('customer_profile_photo') || user?.profileImageUrl || user?.avatarUrl, 
      email: user?.email,
      toastMessage 
    } as any)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-heading text-3xl font-extrabold text-textMain mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column navigation tabs */}
        <aside className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'addresses'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span>Saved Addresses</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'favorites'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>Favorites</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'preferences'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mutedColor hover:bg-gray-50 hover:text-textMain'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span>Preferences</span>
          </button>
        </aside>

        {/* Right Columns: Tab Contents */}
        <div className="lg:col-span-3">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
              <h3 className="font-heading font-bold text-textMain text-xl mb-6 pb-3 border-b border-gray-50">
                Profile Details
              </h3>

              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                {/* Avatar upload */}
                <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50">
                  <img
                    src={localStorage.getItem('customer_profile_photo') || user?.profileImageUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer gap-1">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Change Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center md:text-left">
                  <h4 className="font-heading font-extrabold text-lg text-textMain">{user?.name}</h4>
                  <p className="text-sm text-mutedColor mt-0.5">{user?.email}</p>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2">
                    {user?.role} Account
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit(handleProfileSave)} className="space-y-6 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-textMain mb-1">Full Name</label>
                    <input
                      type="text"
                      {...regProfile('name')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textMain mb-1">Phone Number</label>
                    <input
                      type="tel"
                      {...regProfile('phone')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textMain"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Profile</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && <AddressesPage />}

          {/* TAB 3: FAVORITES */}
          {activeTab === 'favorites' && <FavoritesPage />}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && <NotificationsPage />}

          {/* TAB 5: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
              <h3 className="font-heading font-bold text-textMain text-xl mb-6 pb-3 border-b border-gray-50">
                Notification Preferences
              </h3>

              {isPrefsLoading ? (
                <div className="flex items-center gap-2 py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-sm font-semibold text-mutedColor">Loading preferences...</span>
                </div>
              ) : preferences ? (
                <div className="space-y-6 max-w-lg">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <h5 className="font-bold text-sm text-textMain">Email Updates</h5>
                      <p className="text-xs text-mutedColor">Receive receipt and order statuses via email</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          orderUpdatesEmail: !preferences.orderUpdatesEmail,
                        })
                      }
                      type="button"
                      className="text-primary focus:outline-none"
                    >
                      {preferences.orderUpdatesEmail ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <h5 className="font-bold text-sm text-textMain">SMS Updates</h5>
                      <p className="text-xs text-mutedColor">Receive driver tracking alerts via SMS</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          orderUpdatesSms: !preferences.orderUpdatesSms,
                        })
                      }
                      type="button"
                      className="text-primary focus:outline-none"
                    >
                      {preferences.orderUpdatesSms ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <h5 className="font-bold text-sm text-textMain">Promotional Emails</h5>
                      <p className="text-xs text-mutedColor">Get notified of new discount offers and coupons</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          promotionsEmail: !preferences.promotionsEmail,
                        })
                      }
                      type="button"
                      className="text-primary focus:outline-none"
                    >
                      {preferences.promotionsEmail ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-mutedColor">Failed to load preferences.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ProfilePage
