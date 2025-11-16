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
    <div className="h-screen w-screen flex flex-col bg-eggshell-50 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-eggshell-100 border-b border-eggshell-400 shadow-sm z-20">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-charcoal-900">
                  Rate Your Housing
                </h1>
                <p className="text-lg font-semibold text-charcoal-700">
                  Eugene, OR
                </p>
              </div>
              <p className="text-sm text-charcoal-600 italic mb-1">
                Find your perfect home. Share your experience. Help your fellow Ducks! 🦆
              </p>
              <p className="text-xs text-charcoal-500 italic">
                Made with AI assistance
              </p>
            </div>
            {/* Create Review Button */}
            <div className="relative pointer-events-auto create-review-dropdown">
              <button
                onClick={() => setShowCreateReview(!showCreateReview)}
                className="bg-matcha-500 hover:bg-matcha-600 text-white px-5 py-3 rounded-xl font-bold hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiPlus size={20} />
                Create a Review
              </button>
              {showCreateReview && (
                <div className="absolute top-full right-0 mt-2 card-elevated rounded-xl p-4 shadow-lg border border-eggshell-400 min-w-[300px] z-30 pointer-events-auto">
                  <label className="block text-sm font-bold text-charcoal-800 mb-2">
                    Select Your Housing:
                  </label>
                  <select
                    value={selectedListingForReview}
                    onChange={(e) => setSelectedListingForReview(e.target.value)}
                    className="w-full px-4 py-2 card rounded-lg border border-eggshell-400 text-charcoal-900 font-medium mb-3 focus:outline-none focus:ring-2 focus:ring-matcha-400"
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
                    className="w-full bg-matcha-500 hover:bg-matcha-600 text-white py-2 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
          <div className="h-full w-full bg-eggshell-100 rounded-3xl border-2 border-eggshell-400 shadow-lg overflow-hidden relative">
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

