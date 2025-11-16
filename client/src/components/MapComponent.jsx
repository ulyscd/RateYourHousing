import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReviews } from '../services/api'
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
    className: isHovered ? 'animate-pulse transition-all duration-200' : ''
  })
}

function MapComponent({ listings, onMarkerClick, hoveredListing, onMarkerHover }) {
  const navigate = useNavigate()
  const [clickedListingPopup, setClickedListingPopup] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  // Eugene, Oregon coordinates
  const eugeneCenter = [44.0521, -123.0868]

  const handleMarkerClick = async (listing) => {
    setClickedListingPopup(listing)
    onMarkerClick(listing)
    // Fetch review count
    try {
      const reviews = await getReviews(listing.id)
      setReviewCount(reviews.length)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviewCount(0)
    }
  }

  const handleJumpToProfile = (listingId) => {
    navigate(`/listing/${listingId}`)
    setClickedListingPopup(null)
    setReviewCount(0)
  }

  const closePopup = () => {
    setClickedListingPopup(null)
    setReviewCount(0)
  }

  // Close popup when clicking outside
  useEffect(() => {
    if (!clickedListingPopup) return
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.listing-popup')) {
        setClickedListingPopup(null)
        setReviewCount(0)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [clickedListingPopup])

  const renderStars = (rating) => {
    const fullStars = Math.round(rating || 0)
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < fullStars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))
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
            />
          )
        })}
      </MapContainer>

      {/* Custom Popup for clicked listing */}
      {clickedListingPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div className="listing-popup bg-eggshell-100 border-2 border-matcha-500 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-charcoal-900 pr-4">{clickedListingPopup.name}</h3>
              <button
                onClick={closePopup}
                className="text-charcoal-500 hover:text-charcoal-900 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            
            {clickedListingPopup.address && (
              <p className="text-charcoal-700 mb-3 flex items-center">
                <span className="mr-2">📍</span>
                {clickedListingPopup.address}
              </p>
            )}
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {renderStars(clickedListingPopup.average_rating || 0)}
              </div>
              <span className="text-lg font-bold text-charcoal-900">
                {clickedListingPopup.average_rating ? clickedListingPopup.average_rating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-sm text-charcoal-600">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            
            <button
              onClick={() => handleJumpToProfile(clickedListingPopup.id)}
              className="w-full bg-matcha-500 hover:bg-matcha-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MapComponent

