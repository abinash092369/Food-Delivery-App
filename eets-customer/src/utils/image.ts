export const resolveCustomerImage = (url: string | undefined, fallback: string): string => {
  let resolved = fallback;
  if (!url || url.trim() === '') {
    resolved = fallback;
  } else if (url.startsWith('/local-image/')) {
    resolved = fallback;
  } else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
    resolved = url;
  } else {
    resolved = fallback;
  }
  console.log('[CUSTOMER_IMAGE_RESOLVE]', { url, fallback, resolved });
  return resolved;
};

export const getRestaurantRoute = (restaurant: { slug?: string; id: number }) => {
  const param = restaurant.slug || restaurant.id;
  const route = `/restaurant/${param}`;
  console.log('[CUSTOMER_RESTAURANT_ROUTE]', { restaurant, route });
  return route;
};

export const isRestaurantApproved = (r: any): boolean => {
  const hasField = r.isApproved !== undefined || r.is_approved !== undefined || r.approved !== undefined;
  if (!hasField) return true;
  return r.isApproved === true || 
         r.is_approved === true || 
         r.is_approved === 1 || 
         r.isApproved === 1 || 
         r.approved === true || 
         r.approved === 1;
};

export const isRestaurantActive = (r: any): boolean => {
  const hasField = r.isActive !== undefined || r.is_active !== undefined || r.active !== undefined;
  if (!hasField) return true;
  return r.isActive === true || 
         r.is_active === true || 
         r.is_active === 1 || 
         r.isActive === 1 || 
         r.active === true || 
         r.active === 1;
};

export const isRestaurantOpen = (r: any): boolean => {
  const hasField = r.isOpen !== undefined || r.is_open !== undefined || r.open !== undefined;
  if (!hasField) return true;
  return r.isOpen === true || 
         r.is_open === true || 
         r.is_open === 1 || 
         r.isOpen === 1 || 
         r.open === true || 
         r.open === 1;
};

export const getRestaurantImage = (r: any, fallback: string): string => {
  const priorityKeys = [
    'coverImageUrl',
    'cover_image_url',
    'bannerUrl',
    'banner_url',
    'logoUrl',
    'logo_url',
    'imageUrl',
    'image_url',
    'thumbnailUrl'
  ];

  for (const key of priorityKeys) {
    if (r && r[key]) {
      const resolved = resolveCustomerImage(r[key], '');
      if (resolved && resolved !== '') {
        return resolved;
      }
    }
  }

  return fallback;
};

export const getRestaurantHeroImage = (r: any, fallback: string): string => {
  const priorityKeys = [
    'coverImageUrl',
    'cover_image_url',
    'bannerUrl',
    'banner_url',
    'imageUrl',
    'image_url',
    'thumbnailUrl'
  ];

  for (const key of priorityKeys) {
    if (r && r[key]) {
      const resolved = resolveCustomerImage(r[key], '');
      if (resolved && resolved !== '') {
        return resolved;
      }
    }
  }

  return fallback;
};

export const normalizeMenu = (response: any): any[] => {
  if (!response) {
    console.log('[CUSTOMER_MENU_EMPTY_REASON]', 'Response is falsy');
    return [];
  }

  console.log('[CUSTOMER_MENU_FETCH_RESPONSE]', response);

  let rawCategories: any[] = [];

  // Check if response itself is an array
  if (Array.isArray(response)) {
    rawCategories = response;
  } else {
    // Check various data fields
    const data = response.data !== undefined ? response.data : response;
    
    if (Array.isArray(data)) {
      rawCategories = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.content)) {
        rawCategories = data.content;
      } else if (Array.isArray(data.categories)) {
        rawCategories = data.categories;
      } else if (Array.isArray(data.menuItems)) {
        rawCategories = data.menuItems;
      } else if (Array.isArray(data.items)) {
        rawCategories = data.items;
      } else if (Array.isArray(response.categories)) {
        rawCategories = response.categories;
      } else if (Array.isArray(response.menuItems)) {
        rawCategories = response.menuItems;
      } else if (Array.isArray(response.items)) {
        rawCategories = response.items;
      }
    }
  }

  if (!rawCategories || rawCategories.length === 0) {
    console.log('[CUSTOMER_MENU_EMPTY_REASON]', 'Could not find any category array in response', response);
    return [];
  }

  const normalized = rawCategories.map((catEntry: any, index: number) => {
    let id = catEntry.id || index;
    let name = catEntry.name || 'Category';
    let description = catEntry.description || '';
    let imageUrl = catEntry.imageUrl || catEntry.image || '';
    let rawItems: any[] = [];

    if (catEntry.category && typeof catEntry.category === 'object') {
      const c = catEntry.category;
      id = c.id !== undefined ? c.id : id;
      name = c.name || name;
      description = c.description || description;
      imageUrl = c.imageUrl || c.image || imageUrl;
    }

    // items can be on catEntry itself or inside catEntry.items / catEntry.menuItems
    if (Array.isArray(catEntry.items)) {
      rawItems = catEntry.items;
    } else if (Array.isArray(catEntry.menuItems)) {
      rawItems = catEntry.menuItems;
    } else if (catEntry.category && Array.isArray(catEntry.category.items)) {
      rawItems = catEntry.category.items;
    } else if (catEntry.category && Array.isArray(catEntry.category.menuItems)) {
      rawItems = catEntry.category.menuItems;
    }

    const items = rawItems.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price !== undefined ? item.price : 0,
        imageUrl: item.imageUrl || item.image || '',
        isVeg: item.isVeg === true || item.is_veg === true || item.isVeg === 1 || item.is_veg === 1,
        inStock: item.inStock !== false && item.in_stock !== false && item.inStock !== 0 && item.in_stock !== 0,
        isAvailable: item.isAvailable !== false && item.is_available !== false && item.isAvailable !== 0 && item.is_available !== 0,
        customizationGroups: item.customizationGroups || []
      };
    });

    return {
      category: {
        id,
        name,
        description,
        imageUrl
      },
      items
    };
  });

  console.log('[CUSTOMER_MENU_NORMALIZED]', normalized);
  return normalized;
};
