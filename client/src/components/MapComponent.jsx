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
                  
                  {/* Bedroom/Bathroom and Price Info */}
                  <div className="flex flex-col gap-1 mb-2 text-sm">
                    {(() => {
                      const bedrooms = listing.bedrooms_list ? listing.bedrooms_list.split(',').filter(b => b && b !== 'null') : []
                      const bathrooms = listing.bathrooms_list ? listing.bathrooms_list.split(',').filter(b => b && b !== 'null') : []
                      const uniqueBedrooms = [...new Set(bedrooms)].sort()
                      const uniqueBathrooms = [...new Set(bathrooms)].sort()
                      
                      let bedroomText = ''
                      if (uniqueBedrooms.length > 0) {
                        if (uniqueBedrooms.length === 1) {
                          bedroomText = uniqueBedrooms[0] === 'Studio' ? 'Studio' : `${uniqueBedrooms[0]} bed`
                        } else {
                          bedroomText = `${uniqueBedrooms[0]}-${uniqueBedrooms[uniqueBedrooms.length - 1]} bed`
                        }
                      }
                      
                      let bathroomText = ''
                      if (uniqueBathrooms.length > 0) {
                        if (uniqueBathrooms.length === 1) {
                          bathroomText = `${uniqueBathrooms[0]} bath`
                        } else {
                          bathroomText = `${uniqueBathrooms[0]}-${uniqueBathrooms[uniqueBathrooms.length - 1]} bath`
                        }
                      }
                      
                      const info = [bedroomText, bathroomText].filter(Boolean).join(' • ')
                      return info ? <p className="text-gray-700 font-medium">🏠 {info}</p> : null
                    })()}
                    
                    {listing.min_price && listing.max_price && (
                      <p className="text-green-700 font-semibold">
                        💵 {listing.min_price === listing.max_price 
                          ? `$${Math.round(listing.min_price)}/mo` 
                          : `$${Math.round(listing.min_price)} - $${Math.round(listing.max_price)}/mo`}
                      </p>
                    )}
                  </div>
                  
                  {/* Top traits shown in popup */}
                  {listing.topTraits && listing.topTraits.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {listing.topTraits.slice(0,3).map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-eggshell-200 rounded-full text-sm font-medium border border-eggshell-300">
                          {t}
                        </span>
                      ))}
                    </div>
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

