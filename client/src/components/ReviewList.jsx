import { FiStar, FiTrash2, FiThumbsUp, FiThumbsDown } from 'react-icons/fi'
import { deleteReview, voteOnReview, removeVoteFromReview } from '../services/api'
import { useState, useEffect } from 'react'
import PhotoGallery from './PhotoGallery'

function ReviewList({ reviews, onReviewDeleted }) {
  const [deletingId, setDeletingId] = useState(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)
  const [userIdentifier, setUserIdentifier] = useState('')
  const [votingReviews, setVotingReviews] = useState({})

  // Generate or get user identifier from localStorage
  useEffect(() => {
    let identifier = localStorage.getItem('user_identifier')
    if (!identifier) {
      identifier = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
      localStorage.setItem('user_identifier', identifier)
    }
    setUserIdentifier(identifier)
  }, [])
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        size={18}
      />
    ))
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setDeletingId(reviewId)
    try {
      await deleteReview(reviewId)
      if (onReviewDeleted) {
        onReviewDeleted()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const openGallery = (images, initialIndex) => {
    setGalleryImages(images)
    setGalleryInitialIndex(initialIndex)
    setGalleryOpen(true)
  }

  const handleVote = async (reviewId, voteType) => {
    if (!userIdentifier) return
    
    setVotingReviews(prev => ({ ...prev, [reviewId]: true }))
    
    try {
      const currentVote = reviews.find(r => r.id === reviewId)?.user_vote
      
      if (currentVote === voteType) {
        // Remove vote if clicking same button
        await removeVoteFromReview(reviewId, userIdentifier)
      } else {
        // Add or update vote
        await voteOnReview(reviewId, voteType, userIdentifier)
      }
      
      // Refresh reviews
      if (onReviewDeleted) {
        onReviewDeleted()
      }
    } catch (error) {
      console.error('Error voting on review:', error)
    } finally {
      setVotingReviews(prev => ({ ...prev, [reviewId]: false }))
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 card rounded-2xl border border-eggshell-400">
        <p className="text-xl font-bold text-charcoal-600 mb-2">No reviews yet</p>
        <p className="text-sm text-charcoal-500">Be the first to leave a review! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {reviews.map((review, index) => (
        <div 
          key={review.id} 
          className="card p-6 rounded-2xl border border-eggshell-400 hover:shadow-lg transition-all duration-300 animate-slide-up hover:bg-eggshell-200"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-bold text-charcoal-900 text-lg mb-1">{review.user_name}</h4>
              <p className="text-sm text-charcoal-500">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center card px-3 py-1.5 rounded-full border border-eggshell-400">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <span className="ml-2 text-sm font-bold text-charcoal-800">
                  {review.rating}/5
                </span>
              </div>
              <button
                onClick={() => handleDelete(review.id)}
                disabled={deletingId === review.id}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Delete review"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>

          <p className="text-charcoal-700 mb-4 whitespace-pre-wrap leading-relaxed">{review.text}</p>

          {(review.bedrooms || review.bathrooms || review.rent_price) && (
            <div className="mb-4 flex flex-wrap gap-3">
              {review.bedrooms && (
                <div className="inline-flex items-center px-4 py-2 bg-eggshell-100 rounded-lg border border-eggshell-400">
                  <span className="text-sm font-bold text-charcoal-800">
                    {review.bedrooms} {review.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                  </span>
                </div>
              )}
              {review.bathrooms && (
                <div className="inline-flex items-center px-4 py-2 bg-eggshell-100 rounded-lg border border-eggshell-400">
                  <span className="text-sm font-bold text-charcoal-800">
                    {review.bathrooms} {review.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                  </span>
                </div>
              )}
              {review.rent_price && (
                <div className="inline-flex items-center px-4 py-2 bg-matcha-100 rounded-lg border border-matcha-300">
                  <span className="text-sm font-bold text-matcha-800">
                    ${review.rent_price.toLocaleString()}/month
                  </span>
                </div>
              )}
            </div>
          )}

          {review.traits && review.traits.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-bold text-charcoal-600 uppercase mb-2">Traits:</h5>
              <div className="flex flex-wrap gap-2">
                {review.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 bg-matcha-100 text-matcha-700 rounded-full text-xs font-medium border border-matcha-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Helpful Voting */}
          <div className="mt-4 pt-4 border-t border-eggshell-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(review.id, 'helpful')}
                disabled={votingReviews[review.id]}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  review.user_vote === 'helpful'
                    ? 'bg-matcha-500 text-white border-2 border-matcha-600'
                    : 'bg-eggshell-100 text-charcoal-700 border border-eggshell-400 hover:bg-eggshell-200'
                } disabled:opacity-50`}
              >
                <FiThumbsUp size={16} />
                <span>Helpful</span>
                {review.helpful_count > 0 && (
                  <span className="ml-1 font-bold">({review.helpful_count})</span>
                )}
              </button>
              <button
                onClick={() => handleVote(review.id, 'not_helpful')}
                disabled={votingReviews[review.id]}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  review.user_vote === 'not_helpful'
                    ? 'bg-red-500 text-white border-2 border-red-600'
                    : 'bg-eggshell-100 text-charcoal-700 border border-eggshell-400 hover:bg-eggshell-200'
                } disabled:opacity-50`}
              >
                <FiThumbsDown size={16} />
                <span>Not Helpful</span>
                {review.not_helpful_count > 0 && (
                  <span className="ml-1 font-bold">({review.not_helpful_count})</span>
                )}
              </button>
            </div>
            <div className="text-xs text-charcoal-500">
              {review.helpful_count + review.not_helpful_count} {review.helpful_count + review.not_helpful_count === 1 ? 'vote' : 'votes'}
            </div>
          </div>

          {/* Management Response */}
          {review.management_response && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-bold text-blue-900 flex items-center gap-2">
                  Response from {review.management_response.manager_name}
                  {review.management_response.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </h5>
              </div>
              <p className="text-sm text-blue-800 mb-2 whitespace-pre-wrap">{review.management_response.text}</p>
              <p className="text-xs text-blue-600">
                {new Date(review.management_response.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {review.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${image.url}`}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md"
                  onClick={() => openGallery(review.images, index)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Photo Gallery Modal */}
      {galleryOpen && (
        <PhotoGallery
          images={galleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}

export default ReviewList

