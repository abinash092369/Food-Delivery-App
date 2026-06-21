import { useEffect, useRef, useState } from 'react';
import { useDriverAuthStore } from '../store/driver-auth.store';
import { useAssignmentStore } from '../store/assignment.store';
import { wsService } from '../lib/websocket';

export function useDriverLocation() {
  const { driver, accessToken } = useDriverAuthStore();
  const { isOnline, currentAssignment } = useAssignmentStore();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<any | null>(null);

  // 1. Watch Geolocation position
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    if (!isOnline) {
      // Clean up watch if offline
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setCoords(null);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setGeoError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let msg = 'Failed to get location.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Location permission denied. Please enable location to go online.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Location position is unavailable.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Location request timed out.';
      }
      setGeoError(msg);
      console.error('[Geolocation Error]', error);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline]);

  // 2. Setup STOMP WebSocket connection when online
  useEffect(() => {
    if (isOnline && accessToken) {
      wsService.connect(accessToken);
    } else {
      wsService.disconnect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isOnline, accessToken]);

  // 3. Publish location to backend every 5 seconds when online and on active delivery
  useEffect(() => {
    if (!isOnline || !driver || !currentAssignment) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (coords && wsService.isConnected()) {
        wsService.publish('/app/driver/location', {
          driverId: driver.id,
          lat: coords.lat,
          lng: coords.lng,
          orderId: currentAssignment.orderId,
        });
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, driver, currentAssignment, coords]);

  return { coords, geoError };
}
export default useDriverLocation;
