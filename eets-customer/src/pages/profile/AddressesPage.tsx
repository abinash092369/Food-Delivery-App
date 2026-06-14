import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../../api/user.api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import {
  Loader2,
  Plus,
  Home,
  Briefcase,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const addressSchema = zod.object({
  label: zod.string().min(2, 'Label is required'),
  addressLine: zod.string().min(5, 'Address details are required'),
  city: zod.string().min(2, 'City is required'),
  state: zod.string().min(2, 'State is required'),
  pincode: zod.string().length(6, 'Pincode must be exactly 6 digits').regex(/^\d+$/, 'Pincode must contain only numbers'),
})
type AddressInputs = zod.infer<typeof addressSchema>;

export const AddressesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  // Fetch addresses
  const { data: addresses, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
  })

  // Add Address Form hooks
  const { register, handleSubmit, reset, setValue } = useForm<AddressInputs>({
    resolver: zodResolver(addressSchema),
  })

  // Mutations
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddressInputs }) => userApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address updated successfully')
      setEditingAddressId(null)
      setShowAddressForm(false)
      reset()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update address')
    },
  })

  const addAddressMutation = useMutation({
    mutationFn: (data: AddressInputs) => userApi.addAddress({ ...data, lat: 12.9716, lng: 77.5946, isDefault: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address added successfully')
      setShowAddressForm(false)
      reset()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add address')
    },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete address')
    },
  })

  const setAddressDefaultMutation = useMutation({
    mutationFn: (id: number) => userApi.updateAddress(id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Default address updated')
    },
  })

  const handleAddressSave = (data: AddressInputs) => {
    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, data })
    } else {
      addAddressMutation.mutate(data)
    }
  }

  const handleStartEditAddress = (addr: any) => {
    setEditingAddressId(addr.id)
    setShowAddressForm(true)
    setValue('label', addr.label)
    setValue('addressLine', addr.addressLine)
    setValue('city', addr.city)
    setValue('state', addr.state)
    setValue('pincode', addr.pincode)
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
        <h3 className="font-heading font-bold text-textMain text-xl">Saved Addresses</h3>
        {!showAddressForm && (
          <button
            onClick={() => {
              setEditingAddressId(null)
              reset()
              setShowAddressForm(true)
            }}
            type="button"
            className="flex items-center gap-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        )}
      </div>

      {isAddressesLoading ? (
        <div className="flex items-center gap-2 py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-semibold text-mutedColor">Loading addresses...</span>
        </div>
      ) : showAddressForm ? (
        /* Address Form (Add or Edit) */
        <form onSubmit={handleSubmit(handleAddressSave)} className="space-y-4 max-w-xl">
          <h4 className="font-heading font-bold text-sm text-textMain mb-2">
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1">Label</label>
              <input
                type="text"
                placeholder="Home, Office, Work, etc."
                {...register('label')}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-textMain"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1">Pincode</label>
              <input
                type="text"
                placeholder="560001"
                maxLength={6}
                {...register('pincode')}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-textMain"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMain mb-1">Address details</label>
            <input
              type="text"
              placeholder="House No, Apartment, Street name..."
              {...register('addressLine')}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-textMain"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1">City</label>
              <input
                type="text"
                placeholder="Bangalore"
                {...register('city')}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-textMain"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1">State</label>
              <input
                type="text"
                placeholder="Karnataka"
                {...register('state')}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-textMain"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={() => {
                setShowAddressForm(false)
                setEditingAddressId(null)
                reset()
              }}
              type="button"
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-mutedColor transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Save Address
            </button>
          </div>
        </form>
      ) : addresses && addresses.length > 0 ? (
        /* Address cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border-2 bg-white flex justify-between gap-4 relative transition-all ${
                addr.isDefault ? 'border-primary' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex gap-3">
                <div className="text-primary mt-1">
                  {addr.label.toLowerCase() === 'home' ? (
                    <Home className="w-5 h-5" />
                  ) : (
                    <Briefcase className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-textMain capitalize text-sm">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mutedColor leading-relaxed mt-1">
                    {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end h-full">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleStartEditAddress(addr)}
                    type="button"
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    onClick={() => deleteAddressMutation.mutate(addr.id)}
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Delete
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => setAddressDefaultMutation.mutate(addr.id)}
                    type="button"
                    className="text-[10px] text-primary hover:text-primary-hover font-bold mt-4"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-mutedColor mb-4">No addresses saved yet</p>
          <button
            onClick={() => setShowAddressForm(true)}
            type="button"
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            Add Address
          </button>
        </div>
      )}
    </div>
  )
}
export default AddressesPage
