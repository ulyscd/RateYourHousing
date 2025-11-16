import { useState, useEffect } from 'react'
import { FiX, FiSliders, FiStar } from 'react-icons/fi'

function FilterModal({ isOpen, onClose, onApplyFilters, initialFilters }) {
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

  const [customTrait, setCustomTrait] = useState('')

  // Common traits for filtering
  const commonTraits = [
    'Pet Friendly',
    'Parking',
    'Gym',
    'Pool',
    'Laundry',
    'Dishwasher',
    'AC',
    'Heating',
    'Furnished',
    'Utilities Included',
    'Quiet',
    'Safe Area',
    'Close to Campus',
    'Public Transit',
    'Elevator',
    'Balcony'
  ]

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      minRating: '',
      maxRating: '',
      minBedrooms: '',
      maxBedrooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      minPrice: '',
      maxPrice: '',
      traits: []
    }
    setFilters(resetFilters)
    onApplyFilters(resetFilters)
  }

  const toggleTrait = (trait) => {
    setFilters(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }))
  }

  const addCustomTrait = () => {
    if (customTrait.trim() && !filters.traits.includes(customTrait.trim())) {
      setFilters(prev => ({
        ...prev,
        traits: [...prev.traits, customTrait.trim()]
      }))
      setCustomTrait('')
    }
  }

  const removeTrait = (trait) => {
    setFilters(prev => ({
      ...prev,
      traits: prev.traits.filter(t => t !== trait)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-eggshell-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-eggshell-400 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <FiSliders className="text-matcha-600 mr-3" size={24} />
            <h2 className="text-2xl font-bold text-charcoal-900">Filter Listings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-500 hover:text-charcoal-700 hover:bg-eggshell-200 p-2 rounded-lg transition-all duration-200"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-bold text-charcoal-800 mb-3 flex items-center">
              <FiStar className="mr-2 text-yellow-400 fill-current" size={16} />
              Star Rating
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Minimum</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                >
                  <option value="">Any</option>
                  <option value="1">1+ ⭐</option>
                  <option value="2">2+ ⭐⭐</option>
                  <option value="3">3+ ⭐⭐⭐</option>
                  <option value="4">4+ ⭐⭐⭐⭐</option>
                  <option value="5">5 ⭐⭐⭐⭐⭐</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Maximum</label>
                <select
                  value={filters.maxRating}
                  onChange={(e) => setFilters({ ...filters, maxRating: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                >
                  <option value="">Any</option>
                  <option value="1">1 ⭐</option>
                  <option value="2">2 ⭐⭐</option>
                  <option value="3">3 ⭐⭐⭐</option>
                  <option value="4">4 ⭐⭐⭐⭐</option>
                  <option value="5">5 ⭐⭐⭐⭐⭐</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-bold text-charcoal-800 mb-3">Bedrooms</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Minimum</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Any"
                  value={filters.minBedrooms}
                  onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Maximum</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Any"
                  value={filters.maxBedrooms}
                  onChange={(e) => setFilters({ ...filters, maxBedrooms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block text-sm font-bold text-charcoal-800 mb-3">Bathrooms</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Minimum</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Any"
                  value={filters.minBathrooms}
                  onChange={(e) => setFilters({ ...filters, minBathrooms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Maximum</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Any"
                  value={filters.maxBathrooms}
                  onChange={(e) => setFilters({ ...filters, maxBathrooms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-bold text-charcoal-800 mb-3">Monthly Rent</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Minimum</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-charcoal-600 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Any"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-600 mb-2">Maximum</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-charcoal-600 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traits */}
          <div>
            <label className="block text-sm font-bold text-charcoal-800 mb-3">Traits & Amenities</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {commonTraits.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 ${
                    filters.traits.includes(trait)
                      ? 'bg-matcha-500 text-white border-matcha-600 shadow-md'
                      : 'bg-eggshell-100 text-charcoal-700 border-eggshell-400 hover:bg-eggshell-200'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>

            {/* Selected Custom Traits */}
            {filters.traits.some(t => !commonTraits.includes(t)) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.traits.filter(t => !commonTraits.includes(t)).map((trait) => (
                  <div
                    key={trait}
                    className="px-4 py-2 rounded-lg font-medium bg-matcha-500 text-white border-2 border-matcha-600 shadow-md flex items-center gap-2"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTrait(trait)}
                      className="hover:bg-matcha-600 rounded-full p-0.5"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Trait */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTrait}
                onChange={(e) => setCustomTrait(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTrait()}
                placeholder="Add custom trait..."
                className="flex-1 px-4 py-2.5 bg-eggshell-100 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium"
              />
              <button
                type="button"
                onClick={addCustomTrait}
                className="px-6 py-2.5 bg-matcha-500 text-white rounded-lg font-semibold hover:bg-matcha-600 transition-all duration-200 border-2 border-matcha-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-eggshell-400 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-eggshell-200 text-charcoal-700 rounded-lg font-semibold hover:bg-eggshell-300 transition-all duration-200 border border-eggshell-400"
          >
            Reset All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-eggshell-200 text-charcoal-700 rounded-lg font-semibold hover:bg-eggshell-300 transition-all duration-200 border border-eggshell-400"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-8 py-3 bg-matcha-500 text-white rounded-lg font-semibold hover:bg-matcha-600 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-matcha-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterModal
