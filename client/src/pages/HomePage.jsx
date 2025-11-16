import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiHome } from 'react-icons/fi'
import MapComponent from '../components/MapComponent'
import ListingsSidebar from '../components/ListingsSidebar'
import { getListings } from '../services/api'

function HomePage() {
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [clickedListing, setClickedListing] = useState(null)
  const [hoveredListing, setHoveredListing] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateReview, setShowCreateReview] = useState(false)
  const [selectedListingForReview, setSelectedListingForReview] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadListings()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredListings(listings)
    } else {
      const filtered = listings.filter(listing =>
        listing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredListings(filtered)
    }
  }, [searchQuery, listings])

  const loadListings = async () => {
    try {
      const data = await getListings()
      setListings(data)
      setFilteredListings(data)
    } catch (error) {
      console.error('Error loading listings:', error)
    }
  }

  const handleListingClick = (listing) => {
    setClickedListing(listing)
    navigate(`/listing/${listing.id}`)
  }

  const handleMarkerClick = (listing) => {
    // Set clicked listing for menu highlight only
    setClickedListing(listing)
    navigate(`/listing/${listing.id}`)
  }
  
  const handleMarkerHover = (listing) => {
    // Set hovered listing for beacon and menu highlight
    setHoveredListing(listing)
  }

  const handleCreateReview = () => {
    if (selectedListingForReview) {
      navigate(`/listing/${selectedListingForReview}`, { 
        state: { openReviewTab: true },
        replace: false 
      })
      setShowCreateReview(false)
      setSelectedListingForReview('')
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateReview && !event.target.closest('.create-review-dropdown')) {
        setShowCreateReview(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreateReview])

  return (
    <div className="h-screen w-screen flex flex-col gradient-bg overflow-hidden">
      {/* Top Banner */}
      <div className="glass-card border-b-2 border-white/40 shadow-xl z-20">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-primary-700" style={{ 
                  background: 'linear-gradient(135deg, #0284c7 0%, #c026d3 50%, #0284c7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: '#0284c7' // Fallback color
                }}>
                  Rate Your Housing
                </h1>
                <p className="text-lg font-semibold text-gray-700">
                  Eugene, OR
                </p>
              </div>
              <p className="text-sm text-gray-600 italic mb-1">
                Find your perfect home. Share your experience. Help your fellow Ducks! 🦆
              </p>
              <p className="text-xs text-gray-500 italic">
                Made with AI assistance
              </p>
            </div>
            {/* Create Review Button */}
            <div className="relative pointer-events-auto create-review-dropdown">
              <button
                onClick={() => setShowCreateReview(!showCreateReview)}
                className="glass-card px-5 py-3 rounded-xl font-bold text-primary-700 hover:text-primary-600 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg border border-white/40 flex items-center gap-2"
              >
                <FiPlus size={20} />
                Create a Review
              </button>
              {showCreateReview && (
                <div className="absolute top-full right-0 mt-2 glass-card rounded-xl p-4 shadow-2xl border border-white/40 min-w-[300px] z-30 pointer-events-auto">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Select Your Housing:
                  </label>
                  <select
                    value={selectedListingForReview}
                    onChange={(e) => setSelectedListingForReview(e.target.value)}
                    className="w-full px-4 py-2 glass rounded-lg border border-white/30 text-gray-800 font-medium mb-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="">Choose a listing...</option>
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateReview}
                    disabled={!selectedListingForReview}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    Go to Review Form
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section with Frame */}
        <div className="flex-1 relative p-6">
          <div className="h-full w-full glass-card rounded-3xl border-2 border-white/40 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 z-0">
              <MapComponent
                listings={filteredListings}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={handleMarkerHover}
                hoveredListing={hoveredListing}
              />
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <ListingsSidebar
          listings={filteredListings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onListingClick={handleListingClick}
          onListingHover={setHoveredListing}
          hoveredListing={hoveredListing}
          clickedListing={clickedListing}
        />
      </div>
    </div>
  )
}

export default HomePage

