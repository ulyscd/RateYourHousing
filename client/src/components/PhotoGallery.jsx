import { useState } from 'react'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function PhotoGallery({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'kitchen', 'bathroom', 'bedroom', 'common areas', 'exterior', 'other']

  // Filter images by category if they have category metadata
  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category?.toLowerCase() === selectedCategory)

  const currentImage = filteredImages[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-matcha-400 transition-colors duration-200 z-50"
      >
        <FiX size={36} />
      </button>

      {/* Category Filter */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
        {categories.map((category) => (
          <button
            key={category}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedCategory(category)
              setCurrentIndex(0)
            }}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-matcha-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold z-50">
        {currentIndex + 1} / {filteredImages.length}
      </div>

      {/* Previous Button */}
      {filteredImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-matcha-400 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-75"
        >
          <FiChevronLeft size={36} />
        </button>
      )}

      {/* Image */}
      <div 
        className="max-w-7xl max-h-[85vh] flex items-center justify-center px-20"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage?.url?.startsWith('http') ? currentImage.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${currentImage?.url}`}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Next Button */}
      {filteredImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-matcha-400 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-75"
        >
          <FiChevronRight size={36} />
        </button>
      )}

      {/* Thumbnail Strip */}
      {filteredImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-4xl px-4">
          {filteredImages.map((img, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? 'border-matcha-500 scale-110'
                  : 'border-gray-600 hover:border-gray-400 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.url?.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${img.url}`}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PhotoGallery
