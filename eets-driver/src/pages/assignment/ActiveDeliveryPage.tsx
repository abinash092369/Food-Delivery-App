import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Phone,
  IndianRupee,
  AlertCircle,
  Loader2,
  CheckCircle,
  Upload,
  ExternalLink,
  Info
} from 'lucide-react';
import { driverApi } from '../../api/driver.api';
import { useAssignmentStore } from '../../store/assignment.store';
import { axiosInstance } from '../../api/axios';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Google polyline decoder
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 100000, lng / 100000]);
  }
  return points;
}

export const ActiveDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAssignment, setCurrentAssignment } = useAssignmentStore();

  // Redirect to dashboard if no active assignment
  useEffect(() => {
    if (
      !currentAssignment ||
      (currentAssignment.status !== 'ACCEPTED' && currentAssignment.status !== 'PICKED_UP')
    ) {
      navigate('/', { replace: true });
    }
  }, [currentAssignment, navigate]);

  const [pickupOtp, setPickupOtp] = useState<string>('');
  const [deliveryOtp, setDeliveryOtp] = useState<string>('');
  const [podUrl, setPodUrl] = useState<string>(''); // Proof of delivery image
  const [uploading, setUploading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Map element refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingLayerRef = useRef<L.Polyline | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Fetch full details of the order (customer address, order items)
  const { data: orderDetailsRes, isLoading: isOrderLoading } = useQuery({
    queryKey: ['orderActiveDetails', currentAssignment?.orderId],
    queryFn: async () => {
      if (!currentAssignment) return null;
      const res = await driverApi.getOrderDetails(currentAssignment.orderId);
      return res.data;
    },
    enabled: !!currentAssignment,
  });

  const orderDetails = orderDetailsRes;

  // Resolve Restaurant Coordinates dynamically using query + detail lookup
  const [restaurantCoords, setRestaurantCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchRestaurantLocation = async () => {
      if (!orderDetails?.restaurantName) return;
      try {
        // 1. Search for restaurant by name
        const searchRes = await axiosInstance.get(`/api/restaurants`, {
          params: { q: orderDetails.restaurantName },
        });
        
        const list = searchRes.data?.data?.content || [];
        const match = list.find(
          (r: any) => r.name.toLowerCase() === orderDetails.restaurantName.toLowerCase()
        );

        if (match?.slug) {
          // 2. Fetch full restaurant details (includes lat/lng)
          const detailRes = await axiosInstance.get(`/api/restaurants/${match.slug}`);
          const { lat, lng } = detailRes.data.data;
          if (lat && lng) {
            setRestaurantCoords({ lat, lng });
          }
        }
      } catch (e) {
        console.warn('Failed to resolve restaurant coordinates', e);
      }
    };

    fetchRestaurantLocation();
  }, [orderDetails]);

  // Handle live location from browser to render driver marker
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn('Geolocation map watch failed', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default coordinates (e.g. India center or fallback)
    const fallbackLat = restaurantCoords?.lat || 12.971598;
    const fallbackLng = restaurantCoords?.lng || 77.594562;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([fallbackLat, fallbackLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Render route if polyline is present
    if (currentAssignment?.routePolyline) {
      try {
        const decodedCoords = decodePolyline(currentAssignment.routePolyline);
        if (routingLayerRef.current) {
          map.removeLayer(routingLayerRef.current);
        }
        const polyline = L.polyline(decodedCoords, {
          color: '#0d9488',
          weight: 4,
          opacity: 0.85,
        }).addTo(map);
        routingLayerRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      } catch (err) {
        console.error('Failed to parse polyline route', err);
      }
    }

    // Render / Update Driver Location Marker
    if (driverLoc) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>`,
        iconSize: [16, 16],
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLoc.lat, driverLoc.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLoc.lat, driverLoc.lng], { icon: driverIcon }).addTo(map);
      }
    }

    // Render Restaurant Marker
    if (restaurantCoords) {
      const restIcon = L.divIcon({
        className: 'custom-rest-icon',
        html: `<div class="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white shadow-md"><span class="text-[9px] font-bold">R</span></div>`,
        iconSize: [28, 28],
      });
      L.marker([restaurantCoords.lat, restaurantCoords.lng], { icon: restIcon })
        .addTo(map)
        .bindPopup('Restaurant');
    }

    // Render Customer Marker
    if (orderDetails?.deliveryAddress?.lat && orderDetails?.deliveryAddress?.lng) {
      const custIcon = L.divIcon({
        className: 'custom-cust-icon',
        html: `<div class="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md"><span class="text-[9px] font-bold">C</span></div>`,
        iconSize: [28, 28],
      });
      L.marker([orderDetails.deliveryAddress.lat, orderDetails.deliveryAddress.lng], { icon: custIcon })
        .addTo(map)
        .bindPopup('Customer Location');
    }

  }, [restaurantCoords, orderDetails, currentAssignment, driverLoc]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle optional photo proof upload to Cloudinary
  const handlePodPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setErrorMsg('');

    try {
      // 1. Fetch Cloudinary upload signature
      const signatureRes = await driverApi.signCloudinaryUpload('delivery-proofs');
      const { signature, timestamp, apiKey, cloudName, folder } = signatureRes.data;

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      // 3. Post directly to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPodUrl(uploadRes.data.secure_url);
    } catch (err) {
      console.error('Proof of delivery upload failed', err);
      setErrorMsg('Failed to upload proof of delivery photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (status: 'PICKED_UP' | 'DELIVERED') => {
    const otp = status === 'PICKED_UP' ? pickupOtp : deliveryOtp;
    if (!otp || otp.length < 4) {
      setErrorMsg(`Please enter the 4-digit ${status === 'PICKED_UP' ? 'pickup' : 'delivery'} OTP.`);
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await driverApi.updateAssignmentStatus(currentAssignment!.id, status, otp);
      
      if (status === 'DELIVERED') {
        // Order completed! Clear assignment state
        setCurrentAssignment(null);
      } else {
        // Picked up! Set updated assignment
        setCurrentAssignment(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentAssignment || isOrderLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading delivery details...</span>
      </div>
    );
  }

  const isPickedUp = currentAssignment.status === 'PICKED_UP';
  const targetName = isPickedUp ? orderDetails?.deliveryAddress?.label || 'Customer' : orderDetails?.restaurantName || 'Restaurant';
  const targetAddress = isPickedUp ? orderDetails?.deliveryAddress?.addressLine : orderDetails?.restaurantName ? `${orderDetails.restaurantName}, Zone` : 'Fetching Address...';

  // Navigation Deep Link to Google Maps
  const handleOpenMaps = () => {
    const destLat = isPickedUp ? orderDetails?.deliveryAddress?.lat : restaurantCoords?.lat;
    const destLng = isPickedUp ? orderDetails?.deliveryAddress?.lng : restaurantCoords?.lng;
    if (!destLat || !destLng) return;
    
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    if (driverLoc) {
      url += `&origin=${driverLoc.lat},${driverLoc.lng}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 -mx-4 pb-12">
      {/* 1. Stepper & Active Order Details Header */}
      <div className="px-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Active Delivery
            </span>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              Order #{orderDetails?.orderNumber || currentAssignment.orderNumber}
            </h2>
          </div>
          <div className="bg-primary-light text-primary py-2 px-4 rounded-2xl flex items-center gap-1 shadow-sm">
            <IndianRupee className="w-4 h-4" />
            <span className="text-base font-extrabold">{currentAssignment.earnings}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Interactive Map Container */}
      <div className="w-full h-72 relative bg-gray-100 border-y border-gray-150">
        <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />
        
        {/* Map Overlays */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleOpenMaps}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-primary flex items-center justify-center shadow-md hover:bg-gray-50 focus:outline-none"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl py-1.5 px-3 flex items-center gap-1.5 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-gray-700 font-black tracking-wide uppercase">Live Location Active</span>
        </div>
      </div>

      {/* 3. Steps Controller */}
      <div className="px-4 space-y-5">
        
        {/* Step details card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                {isPickedUp ? 'Deliver to Customer' : 'Go to Restaurant'}
              </span>
              <h3 className="text-base font-extrabold text-gray-800 leading-tight">
                {targetName}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {targetAddress}
              </p>
            </div>
            
            {orderDetails?.deliveryAddress?.phone && isPickedUp && (
              <a
                href={`tel:${orderDetails.deliveryAddress.phone}`}
                className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Stepper progression indicator */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between text-xs text-gray-600 font-bold mb-3">
              <span>Status Timeline</span>
              <span className="text-primary uppercase tracking-wider text-[10px] font-black">
                {currentAssignment.status.replace('_', ' ')}
              </span>
            </div>
            
            {/* Pickup OTP Display Info for Driver */}
            {!isPickedUp && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed mb-4 flex gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Get the 4-digit pickup code from the merchant when the order is prepared.</span>
              </div>
            )}

            {isPickedUp && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed mb-4 flex gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Verify the 4-digit delivery PIN with the customer upon arrival.</span>
              </div>
            )}
          </div>

          {/* OTP Verification & Form Input */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                Enter {isPickedUp ? 'Delivery OTP' : 'Pickup OTP'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={isPickedUp ? deliveryOtp : pickupOtp}
                onChange={(e) => isPickedUp ? setDeliveryOtp(e.target.value) : setPickupOtp(e.target.value)}
                placeholder="4-Digit PIN"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white text-center text-gray-800 font-bold rounded-xl text-sm focus:outline-none tracking-widest"
              />
            </div>

            {/* Step 2 POD Proof upload */}
            {isPickedUp && (
              <div className="space-y-3">
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Upload Order Photo (Optional)
                </span>
                
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer h-11 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-600 px-4 shadow-sm flex-1">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : podUrl ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Proof Attached
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400" /> Take Photo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePodPhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  
                  {podUrl && (
                    <div className="w-11 h-11 rounded-xl border border-gray-200 overflow-hidden">
                      <img src={podUrl} className="w-full h-full object-cover" alt="Delivery Proof" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Trigger Buttons */}
            <button
              onClick={() => handleUpdateStatus(isPickedUp ? 'DELIVERED' : 'PICKED_UP')}
              disabled={actionLoading || uploading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-100 text-sm"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPickedUp ? (
                'COMPLETE DELIVERY'
              ) : (
                'CONFIRM PICKUP'
              )}
            </button>
          </div>
        </div>

        {/* Order Items list */}
        {orderDetails?.items && (
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">Order Items</span>
            <div className="divide-y divide-gray-100 text-xs">
              {orderDetails.items.map((item: any) => (
                <div key={item.id} className="py-2.5 flex justify-between">
                  <span className="font-semibold text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-gray-500">₹{item.totalPrice}</span>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-black text-gray-800 text-sm">
                <span>Total Bill Amount</span>
                <span>₹{orderDetails.totalAmount}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ActiveDeliveryPage;
