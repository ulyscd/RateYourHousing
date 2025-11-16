import { FiSearch, FiStar, FiMapPin } from 'react-icons/fi'

function ListingsSidebar({ listings, searchQuery, onSearchChange, onListingClick, onListingHover, hoveredListing, clickedListing }) {
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.round(rating || 0)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          size={12}
        />
      )
    }
    return stars
  }

  return (
    <div className="w-96 bg-eggshell-100 flex flex-col h-screen overflow-hidden shadow-lg animate-fade-in border-l border-eggshell-400">
      <div className="p-6 border-b border-eggshell-400">
        <h1 className="text-3xl font-extrabold text-charcoal-900 mb-2 tracking-tight">
          RateMyHousing
        </h1>
        <p className="text-xs text-charcoal-600 mb-5 italic">Find your perfect home. Share your experience.</p>
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-charcoal-400 z-10" size={18} />
          <input
            type="text"
            placeholder="Search apartments..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-eggshell-400 scrollbar-track-transparent">
        {listings.length === 0 ? (
          <div className="p-8 text-center card rounded-2xl mt-4">
            <p className="text-charcoal-500 font-medium">No apartments found</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {listings.map((listing, index) => {
              const isClicked = clickedListing?.id === listing.id
              const isHovered = hoveredListing?.id === listing.id
              
              return (
                <button
                  key={listing.id}
                  onClick={() => onListingClick(listing)}
                  onMouseEnter={() => onListingHover(listing)}
                  onMouseLeave={() => onListingHover(null)}
                  className={`w-full p-4 card rounded-2xl text-left transition-all duration-300 animate-slide-up border-2 ${
                    isClicked
                      ? 'border-matcha-500 scale-[1.02] shadow-lg bg-eggshell-200' 
                      : isHovered
                      ? 'border-matcha-400 scale-[1.02] shadow-md bg-eggshell-200'
                      : 'border-eggshell-400 hover:scale-[1.02] hover:shadow-md hover:bg-eggshell-200'
                  } group`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-sm transition-colors ${
                      isClicked
                        ? 'text-charcoal-900' 
                        : isHovered
                        ? 'text-charcoal-800'
                        : 'text-charcoal-900 group-hover:text-charcoal-800'
                    }`}>
                      {listing.name}
                    </h3>
                    {listing.average_rating && (
                      <div className="flex items-center ml-3 px-2 py-1 bg-eggshell-200 rounded-full border border-eggshell-400">
                        <div className="flex items-center">
                          {renderStars(listing.average_rating)}
                        </div>
                        <span className="ml-1.5 text-xs font-bold text-charcoal-700">
                          {listing.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {listing.address && (
                    <div className="flex items-center text-xs text-charcoal-600 mb-2">
                      <FiMapPin className="mr-1.5 text-matcha-500" size={12} />
                      <span className="truncate">{listing.address}</span>
                    </div>
                  )}
                  {listing.price && (
                    <p className="text-sm font-semibold text-matcha-600">{listing.price}</p>
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

