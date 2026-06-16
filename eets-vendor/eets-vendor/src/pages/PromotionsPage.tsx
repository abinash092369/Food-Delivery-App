import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorPromotionsApi, PromotionRequest } from '../api/vendor-promotions.api';
import { vendorMenuApi } from '../api/vendor-menu.api';
import { ImageUploader } from '../components/ImageUploader';
import { getLocalImage } from '../utils/imageFallback';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Calendar, 
  ShoppingBag, 
  Percent, 
  DollarSign, 
  Loader2, 
  X, 
  Check, 
  Sparkles,
  Ticket
} from 'lucide-react';

export const PromotionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Promotions
  const { data: promoRes, isLoading: isPromoLoading } = useQuery({
    queryKey: ['vendor-promotions'],
    queryFn: () => vendorPromotionsApi.getPromotions(),
  });

  // 2. Fetch Menu to populate target dropdown selection options
  const { data: menuRes } = useQuery({
    queryKey: ['vendor-menu'],
    queryFn: () => vendorMenuApi.getMenu(),
  });

  const promotions = promoRes?.data || [];
  const categoriesData = menuRes?.data?.categories || [];

  // Flatten items for target items selection
  const menuItems = categoriesData.flatMap((cat) => cat.items);

  // Mutations
  const addPromoMutation = useMutation({
    mutationFn: vendorPromotionsApi.addPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-promotions'] });
      setIsCreatorOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to create promotion.');
    }
  });

  const deletePromoMutation = useMutation({
    mutationFn: vendorPromotionsApi.deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-promotions'] });
    },
  });

  // Form states
  const [promoType, setPromoType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('199');
  const [applicableTo, setApplicableTo] = useState<'ALL' | 'CATEGORY' | 'ITEM'>('ALL');
  const [applicableId, setApplicableId] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const resetForm = () => {
    setPromoType('PERCENTAGE');
    setValue('');
    setMinOrder('199');
    setApplicableTo('ALL');
    setApplicableId('');
    setBannerUrl('');
    setUsageLimit('');
    setValidFrom('');
    setValidUntil('');
    setErrorMsg(null);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value);
    const minOrderNum = parseFloat(minOrder);
    
    if (isNaN(valNum) || valNum <= 0) {
      setErrorMsg('Please enter a valid promotion value');
      return;
    }
    if (promoType === 'PERCENTAGE' && valNum > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%');
      return;
    }
    if (!validFrom || !validUntil) {
      setErrorMsg('Validity dates are required');
      return;
    }
    if (applicableTo !== 'ALL' && !applicableId) {
      setErrorMsg('Please select a target category or item');
      return;
    }

    const payload: PromotionRequest = {
      type: promoType,
      value: valNum,
      minOrder: isNaN(minOrderNum) ? 0 : minOrderNum,
      applicableTo,
      applicableId: applicableId ? parseInt(applicableId) : null,
      bannerUrl: bannerUrl || undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
    };

    addPromoMutation.mutate(payload);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getDynamicTitle = (type: 'PERCENTAGE' | 'FLAT', val: number) => {
    return type === 'PERCENTAGE' ? `Save ${val}% OFF` : `FLAT ${formatCurrency(val)} OFF`;
  };

  const getTargetLabel = (type: 'ALL' | 'CATEGORY' | 'ITEM', id?: number) => {
    if (type === 'ALL') return 'Entire Menu';
    if (type === 'CATEGORY' && id) {
      const cat = categoriesData.find(c => c.category.id === id);
      return `Category: ${cat?.category.name || id}`;
    }
    if (type === 'ITEM' && id) {
      const itm = menuItems.find(i => i.id === id);
      return `Item: ${itm?.name || id}`;
    }
    return 'Menu items';
  };

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Promotions & Coupons</h1>
          <p className="text-sm text-mutedColor">Create custom discount campaigns to boost sales</p>
        </div>
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {isPromoLoading ? (
        <div className="h-[300px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-mutedColor">Loading active campaigns...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-sm">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto stroke-[1.5]" />
          <h2 className="text-xl font-bold text-textMain">No Active Campaigns</h2>
          <p className="text-sm text-mutedColor max-w-sm mx-auto">
            Build promotional discount rules to display on the customer application and drive more restaurant traffic.
          </p>
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div 
              key={promo.id}
              className="bg-surface border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow relative flex flex-col justify-between"
            >
              
              {/* Scissor cut border line simulating standard coupons */}
              <div className="absolute top-[48%] left-[-8px] w-4 h-4 rounded-full bg-background border-r border-gray-200 z-10" />
              <div className="absolute top-[48%] right-[-8px] w-4 h-4 rounded-full bg-background border-l border-gray-200 z-10" />
              
              {/* Top Banner image or Background gradient */}
              {promo.bannerUrl ? (
                <img 
                  src={getLocalImage(promo.bannerUrl)} 
                  alt="Promo banner" 
                  className="w-full h-32 object-cover border-b shrink-0 bg-gray-50"
                />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white p-4 shrink-0">
                  <Ticket className="w-10 h-10 opacity-30 absolute rotate-12" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full block w-max mx-auto mb-1">
                      Platform Deal
                    </span>
                    <h3 className="text-lg font-black">{getDynamicTitle(promo.type, promo.value)}</h3>
                  </div>
                </div>
              )}

              {/* Card details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {promo.bannerUrl && (
                    <h3 className="text-base font-extrabold text-textMain leading-tight">
                      {getDynamicTitle(promo.type, promo.value)}
                    </h3>
                  )}

                  <div className="text-xs text-mutedColor font-medium space-y-1">
                    <p className="flex items-center gap-1.5 text-textMain font-bold">
                      <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      Min Order: {formatCurrency(promo.minOrder)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Target: {getTargetLabel(promo.applicableTo, promo.applicableId)}
                    </p>
                    {promo.usageLimit && (
                      <p>Usage stats: {promo.currentUsage} / {promo.usageLimit} claims</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-mutedColor">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {promo.isActive ? 'Active' : 'Expired'}
                    </span>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this promotion? It will expire immediately.')) {
                          deletePromoMutation.mutate(promo.id);
                        }
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border"
                      title="Delete Promotion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── CREATE PROMOTION PANEL / DRAWER MODAL ── */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreatePromo}
            className="bg-surface w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="text-lg font-black text-textMain">Create Coupon Campaign</h3>
              <button 
                type="button" 
                onClick={() => { setIsCreatorOpen(false); resetForm(); }} 
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-error font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              
              {/* Type Select */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPromoType('PERCENTAGE')}
                  className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    promoType === 'PERCENTAGE'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-200 hover:border-gray-300 text-mutedColor bg-white'
                  }`}
                >
                  <Percent className="w-4 h-4" /> Percentage Discount
                </button>
                <button
                  type="button"
                  onClick={() => setPromoType('FLAT')}
                  className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    promoType === 'FLAT'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-200 hover:border-gray-300 text-mutedColor bg-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Flat Discount
                </button>
              </div>

              {/* Discount Value and Min Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">
                    {promoType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={promoType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 100'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="e.g. 199"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
                  />
                </div>
              </div>

              {/* Applicable Target options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">Applies To</label>
                  <select
                    value={applicableTo}
                    onChange={(e) => { setApplicableTo(e.target.value as any); setApplicableId(''); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-semibold text-textMain"
                  >
                    <option value="ALL">Entire Menu (All)</option>
                    <option value="CATEGORY">Specific Category</option>
                    <option value="ITEM">Specific Menu Item</option>
                  </select>
                </div>

                {applicableTo !== 'ALL' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-xs font-bold text-textMain uppercase">
                      Select Target {applicableTo === 'CATEGORY' ? 'Category' : 'Item'}
                    </label>
                    <select
                      value={applicableId}
                      onChange={(e) => setApplicableId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-semibold text-textMain"
                    >
                      <option value="">-- Choose Target --</option>
                      {applicableTo === 'CATEGORY' 
                        ? categoriesData.map(c => <option key={c.category.id} value={c.category.id}>{c.category.name}</option>)
                        : menuItems.map(itm => <option key={itm.id} value={itm.id}>{itm.name}</option>)
                      }
                    </select>
                  </div>
                )}
              </div>

              {/* Campaign Limits & Validation Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-textMain uppercase">Total Usage Claims Limit (Optional)</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 100 uses total (leave empty for unlimited)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">Start Validity Date</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMain uppercase">End Validity Date</label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50 font-mono"
                  />
                </div>
              </div>

              {/* Banner Uploader */}
              <ImageUploader
                folder="restaurant_banners"
                label="Promotion Card Banner"
                aspectRatio="video"
                value={bannerUrl}
                onChange={setBannerUrl}
              />

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsCreatorOpen(false); resetForm(); }}
                className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={addPromoMutation.isPending}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1"
              >
                {addPromoMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Launch Campaign
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
