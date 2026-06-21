import React, { useState } from 'react'
import { Ticket, X, Check } from 'lucide-react'

interface CouponInputProps {
  activeCoupon?: string;
  onApply: (code: string) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  activeCoupon,
  onApply,
  onRemove,
  isLoading,
}) => {
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    onApply(code.toUpperCase())
    setCode('')
  }

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-primary" />
        <span className="font-heading font-medium text-textMain">Apply Coupon</span>
      </div>

      {activeCoupon ? (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg text-emerald-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Applied: <strong className="uppercase">{activeCoupon}</strong></span>
          </div>
          <button
            onClick={onRemove}
            type="button"
            className="text-emerald-700 hover:text-emerald-900 focus:outline-none transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="ENTER COUPON CODE"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase text-sm font-medium text-textMain"
          />
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  )
}
export default CouponInput
