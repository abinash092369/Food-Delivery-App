import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet marker icon issue in Vite production builds
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom driver icon (orange pin)
const driverIcon = L.divIcon({
  html: `<div class="bg-primary text-white p-2 rounded-full shadow-lg border border-white animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Custom destination icon (emerald pin)
const destinationIcon = L.divIcon({
  html: `<div class="bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

interface DriverMapProps {
  driverLat?: number | null;
  driverLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
}

// Helper component to center map when coords change
const RecenterMap: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(coords, 15)
  }, [coords, map])
  return null
}

export const DriverMap: React.FC<DriverMapProps> = ({
  driverLat,
  driverLng,
  destLat = 12.9716, // Default to Bangalore coords if none provided
  destLng = 77.5946,
}) => {
  const defaultCenter: [number, number] = destLat && destLng ? [destLat, destLng] : [12.9716, 77.5946]
  const driverCenter: [number, number] | null = driverLat && driverLng ? [driverLat, driverLng] : null

  return (
    <div className="w-full h-[250px] sm:h-[400px] rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <MapContainer center={defaultCenter} zoom={14} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Destination Marker */}
        {destLat && destLng && (
          <Marker position={[destLat, destLng]} icon={destinationIcon}>
            <Popup>Delivery Address</Popup>
          </Marker>
        )}

        {/* Driver Marker */}
        {driverCenter && (
          <>
            <Marker position={driverCenter} icon={driverIcon}>
              <Popup>Delivery Partner is here</Popup>
            </Marker>
            <RecenterMap coords={driverCenter} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
export default DriverMap
