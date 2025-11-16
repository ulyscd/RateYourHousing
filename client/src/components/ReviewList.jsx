import { FiStar, FiTrash2 } from 'react-icons/fi'
import { deleteReview } from '../services/api'
import { useState } from 'react'

function ReviewList({ reviews, onReviewDeleted }) {
  const [deletingId, setDeletingId] = useState(null)
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

          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {review.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${image.url}`}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md"
                  onClick={() => window.open(image.url.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${image.url}`, '_blank')}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ReviewList

