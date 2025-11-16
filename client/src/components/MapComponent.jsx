import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons for apartment markers
const createApartmentIcon = (isHovered = false) => {
  let color = 'blue'
  if (isHovered) color = 'green'
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: isHovered ? [30, 48] : [25, 41],
    iconAnchor: isHovered ? [15, 48] : [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

function MapComponent({ listings, onMarkerClick, hoveredListing, onMarkerHover, onPopupClose }) {
  const navigate = useNavigate()
  // Eugene, Oregon coordinates
  const eugeneCenter = [44.0521, -123.0868]

  const handleMarkerClick = (listing) => {
    // Notify parent component that a pin was clicked (for sidebar scrolling/highlighting)
    if (onMarkerClick) {
      onMarkerClick(listing)
    }
  }

  return (
    <>
      <MapContainer
        center={eugeneCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((listing) => {
          if (!listing.latitude || !listing.longitude) return null
          const isHovered = hoveredListing?.id === listing.id
          
          return (
            <Marker
              key={listing.id}
              position={[listing.latitude, listing.longitude]}
              icon={createApartmentIcon(isHovered)}
              eventHandlers={{
                click: () => handleMarkerClick(listing),
                mouseover: () => onMarkerHover && onMarkerHover(listing),
                mouseout: () => onMarkerHover && onMarkerHover(null),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-1">{listing.name}</h3>
                  {listing.address && (
                    <p className="text-sm text-gray-600 mb-2">📍 {listing.address}</p>
                  )}
                  {listing.average_rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{listing.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium mt-2"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </>
  )
}

export default MapComponent

