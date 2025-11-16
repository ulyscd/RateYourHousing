import { FiSearch, FiStar, FiMapPin, FiSliders, FiChevronDown, FiZap } from 'react-icons/fi'
import { useRef, useEffect, useState } from 'react'

function ListingsSidebar({ 
  listings, 
  searchQuery, 
  onSearchChange, 
  onListingClick, 
  onListingHover, 
  hoveredListing, 
  clickedListing, 
  highlightedListing,
  onFilterClick,
  activeFiltersCount,
  sortBy,
  onSortChange,
  onSmartMatchClick
}) {
  const listingRefs = useRef({})
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  // Scroll to highlighted listing when it changes
  useEffect(() => {
    if (highlightedListing && listingRefs.current[highlightedListing.id]) {
      listingRefs.current[highlightedListing.id].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [highlightedListing])

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.round(rating || 0)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          size={16}
        />
      )
    }
    return stars
  }

  return (
    <div className="w-[480px] bg-eggshell-100 flex flex-col h-full overflow-hidden shadow-lg animate-fade-in border-l border-eggshell-400">
      <div className="p-6 border-b border-eggshell-400 flex-shrink-0 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-charcoal-400 z-10" size={20} />
            <input
              type="text"
              placeholder="Search apartments..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm text-base"
            />
          </div>
          <button
            onClick={onFilterClick}
            className="relative px-5 py-3 bg-matcha-500 hover:bg-matcha-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 border-matcha-600 flex items-center gap-2"
          >
            <FiSliders size={20} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full px-4 py-2.5 bg-eggshell-50 rounded-lg border border-eggshell-400 hover:bg-eggshell-200 transition-all duration-200 flex items-center justify-between text-charcoal-800 font-medium text-sm"
          >
            <span>Sort by: {sortBy === 'rating-high' ? 'Rating (High to Low)' : 
                           sortBy === 'rating-low' ? 'Rating (Low to High)' :
                           sortBy === 'price-low' ? 'Price (Low to High)' :
                           sortBy === 'price-high' ? 'Price (High to Low)' :
                           sortBy === 'most-reviewed' ? 'Most Reviewed' :
                           sortBy === 'newest' ? 'Newest' : 'Name'}</span>
            <FiChevronDown className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showSortDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-eggshell-50 rounded-lg border border-eggshell-400 shadow-lg z-20 overflow-hidden">
              {[
                { value: 'name', label: 'Name (A-Z)' },
                { value: 'rating-high', label: 'Rating (High to Low)' },
                { value: 'rating-low', label: 'Rating (Low to High)' },
                { value: 'price-low', label: 'Price (Low to High)' },
                { value: 'price-high', label: 'Price (High to Low)' },
                { value: 'most-reviewed', label: 'Most Reviewed' },
                { value: 'newest', label: 'Newest' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setShowSortDropdown(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    sortBy === option.value
                      ? 'bg-matcha-500 text-white'
                      : 'hover:bg-eggshell-200 text-charcoal-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Smart Match feature temporarily hidden for demos */}
        {/* To re-enable, restore the button above and pass onSmartMatchClick from HomePage */}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-eggshell-400 scrollbar-track-transparent">
        {listings.length === 0 ? (
          <div className="p-8 text-center card rounded-2xl mt-4">
            <p className="text-charcoal-500 font-medium text-base">No apartments found</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {listings.map((listing, index) => {
              const isClicked = clickedListing?.id === listing.id
              const isHovered = hoveredListing?.id === listing.id
              const isHighlighted = highlightedListing?.id === listing.id
              
              return (
                <button
                  key={listing.id}
                  ref={el => listingRefs.current[listing.id] = el}
                  onClick={() => onListingClick(listing)}
                  onMouseEnter={() => onListingHover(listing)}
                  onMouseLeave={() => onListingHover(null)}
                  className={`w-full p-5 card rounded-2xl text-left transition-all duration-300 animate-slide-up border-2 ${
                    isHighlighted
                      ? 'persistent-highlight animate-pulse-highlight'
                      : isClicked
                      ? 'border-matcha-500 scale-[1.02] shadow-lg bg-eggshell-200' 
                      : isHovered
                      ? 'border-matcha-400 scale-[1.02] shadow-md bg-eggshell-200'
                      : 'border-eggshell-400 hover:scale-[1.02] hover:shadow-md hover:bg-eggshell-200'
                  } group`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-base transition-colors ${
                      isClicked
                        ? 'text-charcoal-900' 
                        : isHovered
                        ? 'text-charcoal-800'
                        : 'text-charcoal-900 group-hover:text-charcoal-800'
                    }`}>
                      {listing.name}
                    </h3>
                    {listing.average_rating && (
                      <div className="flex items-center ml-3 px-3 py-1.5 bg-eggshell-200 rounded-full border border-eggshell-400">
                        <div className="flex items-center">
                          {renderStars(listing.average_rating)}
                        </div>
                        <span className="ml-2 text-sm font-bold text-charcoal-700">
                          {listing.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {listing.address && (
                    <div className="flex items-center text-sm text-charcoal-600 mb-2">
                      <FiMapPin className="mr-2 text-matcha-500" size={14} />
                      <span className="truncate">{listing.address}</span>
                    </div>
                  )}
                  {/* Top traits (up to 3) */}
                  {listing.topTraits && listing.topTraits.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {listing.topTraits.slice(0,3).map((trait, idx) => (
                        <span key={idx} className="px-2 py-1 bg-eggshell-200 text-sm rounded-full text-charcoal-700 border border-eggshell-300">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                  {listing.price && (
                    <p className="text-base font-semibold text-matcha-600">{listing.price}</p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListingsSidebar

