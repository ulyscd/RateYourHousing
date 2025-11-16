import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiHome } from 'react-icons/fi'
import MapComponent from '../components/MapComponent'
import ListingsSidebar from '../components/ListingsSidebar'
import SearchBar from '../components/SearchBar'
import AddHousingModal from '../components/AddHousingModal'
import FilterModal from '../components/FilterModal'
import SmartMatchAgent from '../components/SmartMatchAgent'
import { getListings, getReviews } from '../services/api'

function HomePage() {
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [sortedListings, setSortedListings] = useState([])
  const [clickedListing, setClickedListing] = useState(null)
  const [hoveredListing, setHoveredListing] = useState(null)
  const [highlightedListing, setHighlightedListing] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateReview, setShowCreateReview] = useState(false)
  const [selectedListingForReview, setSelectedListingForReview] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSmartMatch, setShowSmartMatch] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [listingsWithMeta, setListingsWithMeta] = useState({})
  const [filters, setFilters] = useState({
    minRating: '',
    maxRating: '',
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    minPrice: '',
    maxPrice: '',
    traits: []
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, listings, filters])

  useEffect(() => {
    applySorting()
  }, [filteredListings, sortBy, listingsWithMeta])

  const loadListings = async () => {
    try {
      const data = await getListings()

      // Load metadata for sorting (review counts, avg prices, top traits, etc.)
      const meta = {}
      for (const listing of data) {
        try {
          const reviews = await getReviews(listing.id)

          // Compute avgPrice and latestReview
          const avgPrice = reviews.reduce((sum, r) => sum + (r.rent_price || 0), 0) / (reviews.filter(r => r.rent_price).length || 1)
          const latestReview = reviews.length > 0 ? new Date(reviews[0].created_at) : null

          // Aggregate traits frequency
          const traitCounts = {}
          reviews.forEach(r => {
            const t = r.traits || []
            t.forEach(tr => {
              const key = ('' + tr).trim()
              if (!key) return
              traitCounts[key] = (traitCounts[key] || 0) + 1
            })
          })
          // Sort traits by frequency and pick top 3
          const topTraits = Object.entries(traitCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([trait]) => trait)

          meta[listing.id] = {
            reviewCount: reviews.length,
            avgPrice: avgPrice,
            latestReview: latestReview,
            topTraits
          }

          // Attach topTraits directly to the listing object for easy access in UI
          listing.topTraits = topTraits
        } catch (error) {
          meta[listing.id] = { reviewCount: 0, avgPrice: 0, latestReview: null, topTraits: [] }
          listing.topTraits = []
        }
      }

      setListings(data)
      setFilteredListings(data)
      setListingsWithMeta(meta)
    } catch (error) {
      console.error('Error loading listings:', error)
    }
  }

  const applySorting = () => {
    let sorted = [...filteredListings]
    
    switch (sortBy) {
      case 'rating-high':
        sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        break
      case 'rating-low':
        sorted.sort((a, b) => (a.average_rating || 0) - (b.average_rating || 0))
        break
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = listingsWithMeta[a.id]?.avgPrice || 0
          const priceB = listingsWithMeta[b.id]?.avgPrice || 0
          return priceA - priceB
        })
        break
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = listingsWithMeta[a.id]?.avgPrice || 0
          const priceB = listingsWithMeta[b.id]?.avgPrice || 0
          return priceB - priceA
        })
        break
      case 'most-reviewed':
        sorted.sort((a, b) => {
          const countA = listingsWithMeta[a.id]?.reviewCount || 0
          const countB = listingsWithMeta[b.id]?.reviewCount || 0
          return countB - countA
        })
        break
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = listingsWithMeta[a.id]?.latestReview || new Date(0)
          const dateB = listingsWithMeta[b.id]?.latestReview || new Date(0)
          return dateB - dateA
        })
        break
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    
    setSortedListings(sorted)
  }

  const applyFilters = async () => {
    let filtered = [...listings]

    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(listing =>
        listing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply rating filter
    if (filters.minRating || filters.maxRating) {
      filtered = filtered.filter(listing => {
        const rating = listing.average_rating || 0
        const min = filters.minRating ? parseFloat(filters.minRating) : 0
        const max = filters.maxRating ? parseFloat(filters.maxRating) : 5
        return rating >= min && rating <= max
      })
    }

    // For bedroom/bathroom/price/traits filters, we need to fetch reviews
    const needsReviewData = filters.minBedrooms || filters.maxBedrooms || 
                           filters.minBathrooms || filters.maxBathrooms ||
                           filters.minPrice || filters.maxPrice ||
                           filters.traits.length > 0

    if (needsReviewData) {
      // Fetch reviews for each listing and filter based on them
      const filteredByReviews = await Promise.all(
        filtered.map(async (listing) => {
          try {
            const reviews = await getReviews(listing.id)
            
            // Check if any review matches the criteria
            const hasMatchingReview = reviews.some(review => {
              // Bedroom filter
              if (filters.minBedrooms && (!review.bedrooms || review.bedrooms < parseInt(filters.minBedrooms))) {
                return false
              }
              if (filters.maxBedrooms && (!review.bedrooms || review.bedrooms > parseInt(filters.maxBedrooms))) {
                return false
              }

              // Bathroom filter
              if (filters.minBathrooms && (!review.bathrooms || review.bathrooms < parseFloat(filters.minBathrooms))) {
                return false
              }
              if (filters.maxBathrooms && (!review.bathrooms || review.bathrooms > parseFloat(filters.maxBathrooms))) {
                return false
              }

              // Price filter
              if (filters.minPrice && (!review.rent_price || review.rent_price < parseFloat(filters.minPrice))) {
                return false
              }
              if (filters.maxPrice && (!review.rent_price || review.rent_price > parseFloat(filters.maxPrice))) {
                return false
              }

              // Traits filter - check if review has ALL selected traits
              if (filters.traits.length > 0) {
                const reviewTraits = review.traits || []
                const hasAllTraits = filters.traits.every(trait =>
                  reviewTraits.some(rt => rt.toLowerCase().includes(trait.toLowerCase()))
                )
                if (!hasAllTraits) {
                  return false
                }
              }

              return true
            })

            return hasMatchingReview ? listing : null
          } catch (error) {
            console.error(`Error fetching reviews for listing ${listing.id}:`, error)
            return null
          }
        })
      )

      filtered = filteredByReviews.filter(listing => listing !== null)
    }

    setFilteredListings(filtered)
  }

  const handleListingClick = (listing) => {
    setClickedListing(listing)
    setHighlightedListing(null) // Clear highlight when navigating
    navigate(`/listing/${listing.id}`)
  }

  const handleMarkerClick = (listing) => {
    // When a map pin is clicked:
    // 1. Show the popup on the map (handled by MapComponent)
    // 2. Highlight the corresponding listing in the sidebar (stays highlighted)
    // 3. Auto-scroll to that listing
    setHighlightedListing(listing)
  }
  
  const handleMarkerHover = (listing) => {
    // Set hovered listing for beacon and menu highlight
    setHoveredListing(listing)
  }

  const handlePopupClose = () => {
    // Clear the highlight when the popup is closed
    setHighlightedListing(null)
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

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
  }

  const handleModalClose = () => {
    setSelectedLocation(null)
  }

  const handleModalSubmit = async (newListing) => {
    await loadListings() // Reload listings to show the new one
  }

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
  }

  const handleSmartMatchApply = (matchFilters, matchSortBy) => {
    // Apply the filters extracted by the AI
    if (matchFilters) {
      setFilters(matchFilters)
    }
    // Apply the sort option if provided
    if (matchSortBy) {
      setSortBy(matchSortBy)
    }
    // Close the Smart Match modal
    setShowSmartMatch(false)
  }

  const countActiveFilters = () => {
    let count = 0
    if (filters.minRating) count++
    if (filters.maxRating) count++
    if (filters.minBedrooms) count++
    if (filters.maxBedrooms) count++
    if (filters.minBathrooms) count++
    if (filters.maxBathrooms) count++
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    count += filters.traits.length
    return count
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
                <h1 className="text-4xl font-extrabold text-matcha-600">
                  Rate Your Housing
                </h1>
                <p className="text-lg font-semibold text-charcoal-700">
                  Eugene, OR
                </p>
              </div>
              <p className="text-sm text-charcoal-600 italic mb-1">
                Find your perfect home. Share your experience. Help your fellow Ducks! 🦆
              </p>
              <p className="text-xs text-charcoal-500 italic mb-2">
                Made with AI assistance
              </p>
            </div>
            {/* Create Review Button and Search Bar */}
            <div className="flex items-end gap-4">
              {/* Create Review Button */}
              <div className="relative pointer-events-auto create-review-dropdown">
                <button
                  onClick={() => setShowCreateReview(!showCreateReview)}
                  className="bg-matcha-500 hover:bg-matcha-600 text-white px-5 py-3 rounded-xl font-bold hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
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
              
              {/* Search Bar */}
              <div className="max-w-md">
                <SearchBar onLocationSelect={handleLocationSelect} />
              </div>
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
                listings={sortedListings.length > 0 ? sortedListings : filteredListings}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={handleMarkerHover}
                hoveredListing={hoveredListing}
                onPopupClose={handlePopupClose}
              />
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <ListingsSidebar
          listings={sortedListings.length > 0 ? sortedListings : filteredListings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onListingClick={handleListingClick}
          onListingHover={setHoveredListing}
          hoveredListing={hoveredListing}
          clickedListing={clickedListing}
          highlightedListing={highlightedListing}
          onFilterClick={() => setShowFilterModal(true)}
          activeFiltersCount={countActiveFilters()}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSmartMatchClick={() => setShowSmartMatch(true)}
        />
      </div>

      {/* Add Housing Modal */}
      {selectedLocation && (
        <AddHousingModal
          location={selectedLocation}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Smart Match Agent */}
      {showSmartMatch && (
        <SmartMatchAgent
          onApplyMatch={handleSmartMatchApply}
          onClose={() => setShowSmartMatch(false)}
        />
      )}
    </div>
  )
}

export default HomePage

