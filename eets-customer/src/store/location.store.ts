import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocationInfo {
  lat: number | null;
  lng: number | null;
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface LocationState {
  location: LocationInfo | null;
  setLocation: (location: LocationInfo | null) => void;
  detectLocation: (force?: boolean) => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      setLocation: (location) => set({ location }),
      detectLocation: async (force = false) => {
        const current = get().location
        if (current && current.status === 'success' && !force) {
          return
        }

        set({
          location: {
            lat: null,
            lng: null,
            name: 'Fetching location...',
            status: 'loading',
          }
        })

        if (!navigator.geolocation) {
          set({
            location: {
              lat: null,
              lng: null,
              name: 'Select Location',
              status: 'error',
            }
          })
          return
        }

        const getCoords = (): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
            })
          })
        }

        try {
          const position = await getCoords()
          const { latitude: lat, longitude: lng } = position.coords

          let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: {
                'Accept-Language': 'en'
              }
            })
            if (res.ok) {
              const data = await res.json()
              const addr = data.address
              if (addr) {
                const locality = addr.suburb || addr.neighbourhood || addr.village || addr.road || '';
                const city = addr.city || addr.town || addr.municipality || addr.state || '';
                if (locality && city) {
                  name = `${locality}, ${city}`
                } else if (city) {
                  name = city
                } else if (data.display_name) {
                  name = data.display_name.split(',').slice(0, 3).join(',')
                }
              }
            }
          } catch (geoErr) {
            console.error('Reverse geocode failed', geoErr)
          }

          set({
            location: {
              lat,
              lng,
              name,
              status: 'success',
            }
          })
        } catch (err) {
          console.error('Geolocation failed or permission denied', err)
          set({
            location: {
              lat: null,
              lng: null,
              name: 'Select Location',
              status: 'error',
            }
          })
        }
      }
    }),
    {
      name: 'eets-location-storage',
    }
  )
)
export default useLocationStore
