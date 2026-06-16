import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorMenuApi, MenuItemRequest, MenuCategoryRequest, CustomizationGroupRequest } from '../api/vendor-menu.api';
import { CategoryWithItems, MenuItemResponse, MenuCategoryResponse } from '../types/vendor.types';
import { ImageUploader } from '../components/ImageUploader';
import { getLocalImage } from '../utils/imageFallback';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff, 
  UtensilsCrossed, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  X, 
  CornerDownRight,
  Sparkles
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  
  // Modals state
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; cat?: MenuCategoryResponse } | null>(null);
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: MenuItemResponse; categoryId: number } | null>(null);
  
  // 1. Fetch Menu (Categories + Items)
  const { data: menuRes, isLoading } = useQuery({
    queryKey: ['vendor-menu'],
    queryFn: () => vendorMenuApi.getMenu(),
  });

  // Normalize menu categories and items response shapes
  const categoriesData: Array<{ category: MenuCategoryResponse; items: MenuItemResponse[] }> = (() => {
    const res = menuRes as any;
    if (!res) return [];
    
    let rawList: any[] = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else {
      const root = res.data !== undefined ? res.data : res;
      if (Array.isArray(root)) {
        rawList = root;
      } else if (root && typeof root === 'object') {
        if (Array.isArray(root.categories)) {
          rawList = root.categories;
        } else if (Array.isArray(root.content)) {
          rawList = root.content;
        } else if (Array.isArray(root.items)) {
          rawList = root.items;
        } else if (Array.isArray(root.menuItems)) {
          rawList = root.menuItems;
        }
      }
    }
    
    return rawList.map((entry: any, index: number) => {
      let category: MenuCategoryResponse = {
        id: entry.id || index,
        name: entry.name || 'Category',
        description: entry.description || '',
        imageUrl: entry.imageUrl || entry.image || '',
        sortOrder: entry.sortOrder || index,
        isAvailable: entry.isAvailable !== false && entry.is_available !== false,
      };
      
      if (entry.category && typeof entry.category === 'object') {
        const c = entry.category;
        category = {
          id: c.id !== undefined ? c.id : category.id,
          name: c.name || category.name,
          description: c.description || category.description,
          imageUrl: c.imageUrl || c.image || category.imageUrl,
          sortOrder: c.sortOrder || category.sortOrder,
          isAvailable: c.isAvailable !== false && c.is_available !== false,
        };
      }
      
      let rawItems: any[] = [];
      if (Array.isArray(entry.items)) {
        rawItems = entry.items;
      } else if (Array.isArray(entry.menuItems)) {
        rawItems = entry.menuItems;
      } else if (entry.category && Array.isArray(entry.category.items)) {
        rawItems = entry.category.items;
      } else if (entry.category && Array.isArray(entry.category.menuItems)) {
        rawItems = entry.category.menuItems;
      }
      
      const items = rawItems.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId || category.id,
        name: item.name,
        description: item.description || '',
        price: item.price || 0,
        imageUrl: item.imageUrl || item.image || '',
        isVeg: item.isVeg === true || item.is_veg === true,
        isAvailable: item.isAvailable !== false && item.is_available !== false,
        isFeatured: item.isFeatured === true || item.is_featured === true,
        avgRating: item.avgRating || 0,
        customizationGroups: item.customizationGroups || [],
      }));
      
      return { category, items };
    });
  })();

  // Toggle category collapse/expand
  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Mutations
  const addCategoryMutation = useMutation({
    mutationFn: vendorMenuApi.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
      setCategoryModal(null);
    },
  });

  const editCategoryMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: MenuCategoryRequest }) =>
      vendorMenuApi.updateCategory(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
      setCategoryModal(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: vendorMenuApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: vendorMenuApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
      setItemModal(null);
    },
  });

  const editItemMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: MenuItemRequest }) =>
      vendorMenuApi.updateItem(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
      setItemModal(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: vendorMenuApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
    },
  });

  const setItemAvailMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      vendorMenuApi.setItemAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
    },
  });

  const setItemFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: number; isFeatured: boolean }) =>
      vendorMenuApi.setItemFeatured(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
    },
  });

  // Category sorting / reordering helper
  const handleMoveCategory = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categoriesData.length) return;

    const cat1 = categoriesData[idx].category;
    const cat2 = categoriesData[targetIdx].category;

    // Swap sortOrder
    const order1 = cat1.sortOrder ?? idx;
    const order2 = cat2.sortOrder ?? targetIdx;

    try {
      await vendorMenuApi.updateCategory(cat1.id, {
        name: cat1.name,
        description: cat1.description,
        imageUrl: cat1.imageUrl,
        sortOrder: order2,
      });
      await vendorMenuApi.updateCategory(cat2.id, {
        name: cat2.name,
        description: cat2.description,
        imageUrl: cat2.imageUrl,
        sortOrder: order1,
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-menu'] });
    } catch (err) {
      console.error('Failed to swap categories sort order', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Menu Catalog</h1>
          <p className="text-sm text-mutedColor">Manage categories, item listings, and customization sets</p>
        </div>
        <button
          onClick={() => setCategoryModal({ open: true })}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-mutedColor">Loading menu structure...</p>
        </div>
      ) : categoriesData.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-sm">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto stroke-[1.5]" />
          <h2 className="text-xl font-bold text-textMain">No Categories Yet</h2>
          <p className="text-sm text-mutedColor max-w-sm mx-auto">
            Get started by creating your first menu category (e.g., Starters, Main Course, Drinks) and adding items.
          </p>
          <button
            onClick={() => setCategoryModal({ open: true })}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriesData.map((catWrap, idx) => {
            const cat = catWrap.category;
            const items = catWrap.items;
            const isExpanded = expandedCategories[cat.id] !== false; // Default expanded

            return (
              <div 
                key={cat.id} 
                className="bg-surface border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                
                {/* Category Header */}
                <div className="p-4 bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between transition-colors">
                  <div 
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    {cat.imageUrl && (
                      <img 
                        src={getLocalImage(cat.imageUrl)} 
                        alt={cat.name} 
                        className="w-10 h-10 rounded-lg object-cover bg-white border"
                      />
                    )}
                    <div>
                      <h3 className="text-sm font-extrabold text-textMain truncate">{cat.name}</h3>
                      <p className="text-xs text-mutedColor truncate">{cat.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Actions / Sorting */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveCategory(idx, 'up')}
                      className="p-1.5 hover:bg-white text-gray-400 hover:text-textMain disabled:opacity-30 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={idx === categoriesData.length - 1}
                      onClick={() => handleMoveCategory(idx, 'down')}
                      className="p-1.5 hover:bg-white text-gray-400 hover:text-textMain disabled:opacity-30 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <span className="w-px h-6 bg-gray-200 mx-2" />

                    <button
                      onClick={() => setCategoryModal({ open: true, cat })}
                      className="p-1.5 hover:bg-white text-blue-600 rounded-lg border border-transparent hover:border-gray-200"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete category "${cat.name}"? This will delete all its menu items too!`)) {
                          deleteCategoryMutation.mutate(cat.id);
                        }
                      }}
                      className="p-1.5 hover:bg-white text-red-600 rounded-lg border border-transparent hover:border-gray-200"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setItemModal({ open: true, categoryId: cat.id })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-sm transition-colors ml-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>
                </div>

                {/* Category Items Accordion Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-white divide-y divide-gray-50">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="pt-4 first:pt-0 flex items-center justify-between gap-4 text-sm group"
                      >
                        {/* Item Info */}
                        <div className="flex items-start gap-4 min-w-0">
                          {item.imageUrl && (
                            <img 
                              src={getLocalImage(item.imageUrl)} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-xl object-cover border bg-gray-50 flex-shrink-0"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {/* Veg / Non-Veg Indicator */}
                              <span className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border-2 ${
                                item.isVeg 
                                  ? 'border-emerald-600 bg-emerald-50' 
                                  : 'border-red-600 bg-red-50'
                              }`} title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                              </span>

                              <h4 className="font-extrabold text-textMain truncate leading-none">{item.name}</h4>
                              
                              {item.isFeatured && (
                                <span className="bg-amber-50 border border-amber-200 text-amber-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Featured
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-mutedColor line-clamp-2 max-w-lg leading-relaxed">{item.description}</p>
                            <p className="text-sm font-extrabold text-textMain">{formatCurrency(item.price)}</p>

                            {/* Render customization groups briefly if present */}
                            {item.customizationGroups && item.customizationGroups.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {item.customizationGroups.map(group => (
                                  <span key={group.id} className="text-[10px] bg-gray-100 text-mutedColor px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    <CornerDownRight className="w-3 h-3 text-gray-400" />
                                    {group.name} ({group.options.length})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Item Controls */}
                        <div className="flex items-center gap-3">
                          {/* Availability Toggle */}
                          <button
                            onClick={() => setItemAvailMutation.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border ${
                              item.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </button>

                          {/* Featured Toggle */}
                          <button
                            onClick={() => setItemFeaturedMutation.mutate({ id: item.id, isFeatured: !item.isFeatured })}
                            className={`p-2 rounded-xl transition-all border ${
                              item.isFeatured
                                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                            }`}
                            title={item.isFeatured ? 'Remove from Featured' : 'Feature Item'}
                          >
                            <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>

                          <span className="w-px h-6 bg-gray-100" />

                          <button
                            onClick={() => setItemModal({ open: true, item, categoryId: cat.id })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete item "${item.name}"?`)) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center text-xs text-mutedColor py-8 italic">No items listed in this category yet.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CATEGORY DIALOG MODAL ── */}
      {categoryModal?.open && (
        <CategoryFormModal 
          cat={categoryModal.cat} 
          onClose={() => setCategoryModal(null)} 
          onSubmit={async (data) => {
            console.log('[VENDOR_SAVE_PAYLOAD] logoUrl/coverImageUrl/imageUrl= imageUrl=' + data.imageUrl);
            if (categoryModal.cat) {
              await editCategoryMutation.mutateAsync({ id: categoryModal.cat.id, req: data });
            } else {
              await addCategoryMutation.mutateAsync({
                ...data,
                sortOrder: categoriesData.length + 1,
              });
            }
          }}
          isSubmitting={addCategoryMutation.isPending || editCategoryMutation.isPending}
        />
      )}

      {/* ── MENU ITEM DIALOG MODAL (WITH CUSTOMIZATIONS) ── */}
      {itemModal?.open && (
        <ItemFormModal 
          item={itemModal.item} 
          categoryId={itemModal.categoryId}
          onClose={() => setItemModal(null)}
          onSubmit={async (data) => {
            console.log('[VENDOR_SAVE_PAYLOAD] logoUrl/coverImageUrl/imageUrl= imageUrl=' + data.imageUrl);
            if (itemModal.item) {
              await editItemMutation.mutateAsync({ id: itemModal.item.id, req: data });
            } else {
              await addItemMutation.mutateAsync(data);
            }
          }}
          isSubmitting={addItemMutation.isPending || editItemMutation.isPending}
        />
      )}
    </div>
  );
};

// ── CATEGORY MODAL COMPONENT ──
interface CategoryFormModalProps {
  cat?: MenuCategoryResponse;
  onClose: () => void;
  onSubmit: (data: MenuCategoryRequest) => Promise<void>;
  isSubmitting: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ cat, onClose, onSubmit, isSubmitting }) => {
  const [name, setName] = useState(cat?.name || '');
  const [description, setDescription] = useState(cat?.description || '');
  const [imageUrl, setImageUrl] = useState(cat?.imageUrl || '');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    try {
      await onSubmit({ name, description, imageUrl });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-surface w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-5">
        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <h3 className="text-lg font-black text-textMain">{cat ? 'Edit Category' : 'Create Category'}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {error && <div className="text-xs text-error font-medium">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-textMain uppercase">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters / Beverages"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-textMain uppercase">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the category..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
            />
          </div>

          <ImageUploader
            folder="menu_items"
            label="Category Cover Image"
            aspectRatio="video"
            value={imageUrl}
            onChange={setImageUrl}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Category
          </button>
        </div>
      </form>
    </div>
  );
};

// ── MENU ITEM FORM MODAL (WITH CUSTOMIZATIONS BUILDER) ──
interface ItemFormModalProps {
  item?: MenuItemResponse;
  categoryId: number;
  onClose: () => void;
  onSubmit: (data: MenuItemRequest) => Promise<void>;
  isSubmitting: boolean;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ item, categoryId, onClose, onSubmit, isSubmitting }) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price ? item.price.toString() : '');
  const [isVeg, setIsVeg] = useState(item?.isVeg ?? true);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  
  // Customization groups builder state
  const [customGroups, setCustomGroups] = useState<CustomizationGroupRequest[]>(
    item?.customizationGroups?.map(group => ({
      name: group.name,
      type: group.type,
      isRequired: group.isRequired,
      options: group.options.map(opt => ({ name: opt.name, extraPrice: opt.extraPrice }))
    })) || []
  );

  const [error, setError] = useState('');

  // Customization helpers
  const addGroup = () => {
    setCustomGroups((prev) => [
      ...prev,
      { name: '', type: 'SINGLE', isRequired: false, options: [{ name: '', extraPrice: 0 }] }
    ]);
  };

  const removeGroup = (gIdx: number) => {
    setCustomGroups((prev) => prev.filter((_, idx) => idx !== gIdx));
  };

  const updateGroup = (gIdx: number, key: keyof CustomizationGroupRequest, val: any) => {
    setCustomGroups((prev) => {
      const copy = [...prev];
      copy[gIdx] = { ...copy[gIdx], [key]: val };
      return copy;
    });
  };

  const addOption = (gIdx: number) => {
    setCustomGroups((prev) => {
      const copy = [...prev];
      copy[gIdx].options = [...copy[gIdx].options, { name: '', extraPrice: 0 }];
      return copy;
    });
  };

  const removeOption = (gIdx: number, oIdx: number) => {
    setCustomGroups((prev) => {
      const copy = [...prev];
      copy[gIdx].options = copy[gIdx].options.filter((_, idx) => idx !== oIdx);
      return copy;
    });
  };

  const updateOption = (gIdx: number, oIdx: number, key: 'name' | 'extraPrice', val: any) => {
    setCustomGroups((prev) => {
      const copy = [...prev];
      const optCopy = [...copy[gIdx].options];
      optCopy[oIdx] = { ...optCopy[oIdx], [key]: val };
      copy[gIdx].options = optCopy;
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    // Validate customizations have names
    for (const group of customGroups) {
      if (!group.name.trim()) {
        setError('Please name all customization groups');
        return;
      }
      if (group.options.length === 0) {
        setError(`Group "${group.name}" must have at least one option`);
        return;
      }
      for (const opt of group.options) {
        if (!opt.name.trim()) {
          setError(`Please name all options inside "${group.name}"`);
          return;
        }
      }
    }

    setError('');
    try {
      await onSubmit({
        name,
        description,
        price: numPrice,
        categoryId,
        isVeg,
        imageUrl,
        isAvailable,
        isFeatured,
        customizationGroups: customGroups,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-surface w-full max-w-2xl rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="text-lg font-black text-textMain">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
          {error && <div className="text-xs text-error font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Item Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paneer Butter Masala"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-textMain uppercase">Base Price (INR)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 249"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-textMain uppercase">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="List ingredients or allergens..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* VegToggle */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border-2 ${isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
              </span>
              <div className="flex-1">
                <label className="text-xs font-bold text-textMain block">Veg Item</label>
                <input 
                  type="checkbox" 
                  checked={isVeg} 
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="sr-only"
                  id="veg-checkbox"
                />
                <button
                  type="button"
                  onClick={() => setIsVeg(!isVeg)}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  {isVeg ? 'Mark Non-Veg' : 'Mark Veg'}
                </button>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input 
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
                id="avail-check"
              />
              <div>
                <label htmlFor="avail-check" className="text-xs font-bold text-textMain block cursor-pointer">In Stock</label>
                <span className="text-[10px] text-mutedColor">Visible to customers</span>
              </div>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input 
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                id="feat-check"
              />
              <div>
                <label htmlFor="feat-check" className="text-xs font-bold text-textMain block cursor-pointer">Feature Item</label>
                <span className="text-[10px] text-mutedColor">Show in carousel</span>
              </div>
            </div>
          </div>

          <ImageUploader
            folder="menu_items"
            label="Dish Image"
            aspectRatio="square"
            value={imageUrl}
            onChange={setImageUrl}
          />

          {/* ── CUSTOMIZATIONS BUILDER SUB-FORM ── */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-extrabold text-textMain">Customization Sets</h4>
                <p className="text-xs text-mutedColor">Add sizes, choice of sauces, extra cheese options</p>
              </div>
              <button
                type="button"
                onClick={addGroup}
                className="flex items-center gap-1 px-3 py-1.5 border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary-light transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Group
              </button>
            </div>

            <div className="space-y-4">
              {customGroups.map((group, gIdx) => (
                <div key={gIdx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200 relative space-y-3">
                  <button
                    type="button"
                    onClick={() => removeGroup(gIdx)}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded text-red-500 hover:text-red-700"
                    title="Remove customization group"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Group Name */}
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[10px] font-bold text-mutedColor uppercase">Group Name</label>
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => updateGroup(gIdx, 'name', e.target.value)}
                        placeholder="e.g. Choose Size"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white font-semibold"
                      />
                    </div>

                    {/* Selection type */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-mutedColor uppercase">Selection Type</label>
                      <select
                        value={group.type}
                        onChange={(e) => updateGroup(gIdx, 'type', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white font-semibold"
                      >
                        <option value="SINGLE">Single Choice (Radio)</option>
                        <option value="MULTIPLE">Multi-Select (Checkbox)</option>
                      </select>
                    </div>

                    {/* Is Required check */}
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        checked={group.isRequired}
                        onChange={(e) => updateGroup(gIdx, 'isRequired', e.target.checked)}
                        id={`req-check-${gIdx}`}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <label htmlFor={`req-check-${gIdx}`} className="text-xs font-bold text-textMain cursor-pointer">Mandatory selection</label>
                    </div>
                  </div>

                  {/* Options child rows */}
                  <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-mutedColor uppercase">Options List</span>
                      <button
                        type="button"
                        onClick={() => addOption(gIdx)}
                        className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => updateOption(gIdx, oIdx, 'name', e.target.value)}
                            placeholder="e.g. Regular / Large"
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white"
                          />
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-mutedColor">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={opt.extraPrice}
                              onChange={(e) => updateOption(gIdx, oIdx, 'extraPrice', parseFloat(e.target.value) || 0)}
                              placeholder="Extra Price"
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOption(gIdx, oIdx)}
                            disabled={group.options.length <= 1}
                            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 rounded hover:bg-gray-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {customGroups.length === 0 && (
                <div className="text-xs text-mutedColor py-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
                  No customization sets defined. Items will be sold with base price only.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Menu Item
          </button>
        </div>
      </form>
    </div>
  );
};
