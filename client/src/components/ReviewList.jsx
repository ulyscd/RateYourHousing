import { FiStar } from 'react-icons/fi'

function ReviewList({ reviews }) {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        size={18}
      />
    ))
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
            <div>
              <h4 className="font-bold text-charcoal-900 text-lg mb-1">{review.user_name}</h4>
              <p className="text-sm text-charcoal-500">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center card px-3 py-1.5 rounded-full border border-eggshell-400">
              <div className="flex items-center">
                {renderStars(review.rating)}
              </div>
              <span className="ml-2 text-sm font-bold text-charcoal-800">
                {review.rating}/5
              </span>
            </div>
          </div>

          <p className="text-charcoal-700 mb-4 whitespace-pre-wrap leading-relaxed">{review.text}</p>

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

