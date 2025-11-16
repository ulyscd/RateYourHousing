import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { FiArrowLeft, FiStar } from 'react-icons/fi'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { getListing, getReviews } from '../services/api'

function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('reviews')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListingData()
    // Check if we should open review tab from navigation state
    if (location.state?.openReviewTab) {
      setActiveTab('write-review')
    }
  }, [id, location.state])

  const loadListingData = async () => {
    try {
      setLoading(true)
      const listingData = await getListing(id)
      const reviewsData = await getReviews(id)
      setListing(listingData)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error loading listing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = () => {
    loadListingData()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg">
        <div className="glass-card px-8 py-6 rounded-2xl">
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg">
        <div className="glass-card px-8 py-6 rounded-2xl">
          <div className="text-xl font-semibold text-gray-700">Listing not found</div>
        </div>
      </div>
    )
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        size={22}
      />
    ))
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="glass sticky top-0 z-10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center glass-card px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 font-medium transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <FiArrowLeft className="mr-2" />
            Back to Map
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden mb-6 animate-fade-in border border-white/40">
          {listing.image_url && (
            <img
              src={listing.image_url}
              alt={listing.name}
              className="w-full h-96 object-cover"
            />
          )}
          <div className="p-8">
            <h1 className="text-4xl font-extrabold mb-4" style={{ 
              background: 'linear-gradient(135deg, #0284c7 0%, #c026d3 50%, #0284c7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#0284c7',
              display: 'inline-block'
            }}>
              {listing.name || 'Unknown Listing'}
            </h1>
            <div className="flex items-center mb-6">
              <div className="flex items-center glass px-4 py-2 rounded-full">
                <div className="flex items-center">
                  {renderStars(Math.round(listing.average_rating || 0))}
                </div>
                <span className="ml-3 text-xl font-bold text-gray-800">
                  {listing.average_rating ? listing.average_rating.toFixed(1) : 'N/A'}
                </span>
                <span className="ml-3 text-sm text-gray-600">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {listing.address && (
                <div className="glass p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-primary-600 uppercase mb-2 tracking-wide">Address</h3>
                  <p className="text-gray-800 font-medium">{listing.address}</p>
                </div>
              )}
              {listing.price && (
                <div className="glass p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-primary-600 uppercase mb-2 tracking-wide">Price</h3>
                  <p className="text-gray-800 font-medium">{listing.price}</p>
                </div>
              )}
              {listing.bedrooms && (
                <div className="glass p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-primary-600 uppercase mb-2 tracking-wide">Bedrooms</h3>
                  <p className="text-gray-800 font-medium">{listing.bedrooms}</p>
                </div>
              )}
              {listing.bathrooms && (
                <div className="glass p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-primary-600 uppercase mb-2 tracking-wide">Bathrooms</h3>
                  <p className="text-gray-800 font-medium">{listing.bathrooms}</p>
                </div>
              )}
            </div>

            {listing.description && (
              <div className="glass p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-primary-600 uppercase mb-3 tracking-wide">Description</h3>
                <p className="text-gray-700 leading-relaxed">{listing.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/40 animate-fade-in">
          <div className="border-b border-white/20">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-8 py-5 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'reviews'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-white/30'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab('write-review')}
                className={`px-8 py-5 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'write-review'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-white/30'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                Write a Review
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'reviews' && (
              <ReviewList reviews={reviews} />
            )}
            {activeTab === 'write-review' && (
              <ReviewForm listingId={id} onSubmit={handleReviewSubmit} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail

