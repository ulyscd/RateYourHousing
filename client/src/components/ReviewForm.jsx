import { useState } from 'react'
import { FiStar, FiUpload, FiX } from 'react-icons/fi'
import { submitReview } from '../services/api'
import TraitsSelector from './TraitsSelector'

function ReviewForm({ listingId, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [userName, setUserName] = useState('')
  const [selectedTraits, setSelectedTraits] = useState([])
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [rentPrice, setRentPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleStarClick = (value) => {
    setRating(value)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setImages([...images, ...newImages])
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!rating || rating === 0) {
      alert('Please select a rating')
      return
    }

    if (!text.trim()) {
      alert('Please write a review')
      return
    }

    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('listing_id', listingId)
      formData.append('user_name', userName)
      formData.append('rating', rating)
      formData.append('text', text)
      formData.append('traits', JSON.stringify(selectedTraits))
      
      // Add optional fields only if they have values
      if (bedrooms) formData.append('bedrooms', bedrooms)
      if (bathrooms) formData.append('bathrooms', bathrooms)
      if (rentPrice) formData.append('rent_price', rentPrice)

      images.forEach((img, index) => {
        formData.append('images', img.file)
      })

      await submitReview(formData)
      
      // Reset form
      setRating(0)
      setHoveredRating(0)
      setText('')
      setImages([])
      setUserName('')
      setSelectedTraits([])
      setBedrooms('')
      setBathrooms('')
      setRentPrice('')
      
      alert('Review submitted successfully!')
      onSubmit()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-charcoal-800 mb-3">
          Your Name
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full px-5 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-charcoal-800 mb-3">
          Rating *
        </label>
        <div className="flex items-center space-x-2 card p-4 rounded-xl border border-eggshell-400">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transform transition-transform duration-200 hover:scale-125"
            >
              <FiStar
                className={
                  value <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current drop-shadow-lg'
                    : 'text-eggshell-400'
                }
                size={36}
              />
            </button>
          ))}
          <span className="ml-4 text-lg font-bold text-charcoal-900 card px-4 py-2 rounded-lg border border-eggshell-400">
            {hoveredRating || rating || 0} / 5
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-charcoal-800 mb-3">
          Your Review *
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-5 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm resize-none"
          placeholder="Share your experience..."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-charcoal-800 mb-3">
            Bedrooms
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full px-5 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm"
            placeholder="e.g. 2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-charcoal-800 mb-3">
            Bathrooms
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className="w-full px-5 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm"
            placeholder="e.g. 1.5"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-charcoal-800 mb-3">
            Rent/Month
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-charcoal-600 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={rentPrice}
              onChange={(e) => setRentPrice(e.target.value)}
              className="w-full pl-9 pr-5 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all duration-200 placeholder:text-charcoal-400 text-charcoal-900 font-medium shadow-sm"
              placeholder="1200"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-charcoal-800 mb-3">
          Upload Images (Optional)
        </label>
        <div className="mt-1 flex items-center">
          <label className="cursor-pointer inline-flex items-center px-6 py-3 card rounded-xl text-charcoal-700 font-semibold hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg border border-eggshell-400 hover:bg-eggshell-200">
            <FiUpload className="mr-2" size={18} />
            Choose Images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 border border-eggshell-400"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg hover:scale-110 transition-all duration-200"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-charcoal-800 mb-3">
          Housing Traits (Optional)
        </label>
        <TraitsSelector
          selectedTraits={selectedTraits}
          onTraitsChange={setSelectedTraits}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-matcha-500 hover:bg-matcha-600 text-white py-4 rounded-xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-matcha-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl shadow-lg"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

export default ReviewForm

