export const getLocalImage = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('/local-image/')) {
    const key = url.replace('/local-image/', '');
    try {
      const stored = localStorage.getItem('eets_vendor_images');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[key] || '';
      }
    } catch (e) {
      console.error('Error parsing eets_vendor_images from localStorage', e);
    }
  }
  return url;
};

export const saveLocalImage = (base64: string): string => {
  const key = `local_img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  try {
    const stored = localStorage.getItem('eets_vendor_images');
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[key] = base64;
    localStorage.setItem('eets_vendor_images', JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving image to localStorage', e);
  }
  return `/local-image/${key}`;
};

export const isLocalImageUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.startsWith('/local-image/');
};
