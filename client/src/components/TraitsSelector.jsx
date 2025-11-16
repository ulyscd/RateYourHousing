import { useState } from 'react'
import { FiSearch, FiX, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi'

const TRAIT_CATEGORIES = {
  'Living Experience': [
    'Quiet', 'Noisy', 'Safe', 'Unsafe', 'Clean', 'Dirty',
    'Well-maintained', 'Poorly maintained', 'Pest problems', 'No pest problems'
  ],
  'Neighbors & Community': [
    'Friendly neighbors', 'Rude neighbors', 'Student-friendly', 'Family-friendly',
    'Party environment', 'Strict environment', 'Pet-friendly', 'Not pet-friendly'
  ],
  'Interior Quality': [
    'Modern interior', 'Outdated interior', 'Good insulation', 'Poor insulation',
    'Good heating', 'Bad heating', 'Good AC', 'Bad AC',
    'High water pressure', 'Low water pressure', 'Good natural light', 'Dark interior'
  ],
  'Noise Sources': [
    'Thin walls', 'Loud neighbors', 'Street noise', 'Very quiet area'
  ],
  'Amenities': [
    'Laundry in unit', 'Laundry in building', 'No laundry', 'Gym available',
    'Pool available', 'Study rooms', 'Parking included', 'No parking',
    'Visitor parking available', 'Secure entry'
  ],
  'Location': [
    'Close to campus', 'Far from campus', 'Close to bus lines', 'Walkable area',
    'Poor walkability', 'Near grocery stores', 'Near restaurants',
    'Good parking availability', 'Bad parking situation'
  ],
  'Management': [
    'Responsive management', 'Unresponsive management', 'Quick maintenance',
    'Slow maintenance', 'Respectful staff', 'Rude staff'
  ],
  'Financial': [
    'Affordable', 'Overpriced', 'Good value', 'Bad value', 'Hidden fees'
  ],
  'Utilities': [
    'Fast internet', 'Slow internet', 'Frequent outages', 'Stable utilities'
  ]
}

function TraitsSelector({ selectedTraits, onTraitsChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customTrait, setCustomTrait] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const toggleTrait = (trait) => {
    if (selectedTraits.includes(trait)) {
      onTraitsChange(selectedTraits.filter(t => t !== trait))
    } else {
      onTraitsChange([...selectedTraits, trait])
    }
  }

  const addCustomTrait = () => {
    const trimmed = customTrait.trim()
    if (trimmed && !selectedTraits.includes(trimmed)) {
      onTraitsChange([...selectedTraits, trimmed])
      setCustomTrait('')
    }
  }

  const removeTrait = (trait) => {
    onTraitsChange(selectedTraits.filter(t => t !== trait))
  }

  // Get all traits flattened for search
  const allTraits = Object.values(TRAIT_CATEGORIES).flat()

  // Filter traits based on search
  const getFilteredCategories = () => {
    if (!searchQuery.trim()) return TRAIT_CATEGORIES

    const filtered = {}
    Object.entries(TRAIT_CATEGORIES).forEach(([category, traits]) => {
      const matchingTraits = traits.filter(trait =>
        trait.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (matchingTraits.length > 0) {
        filtered[category] = matchingTraits
      }
    })
    return filtered
  }

  const filteredCategories = getFilteredCategories()

  return (
    <div className="space-y-4">
      {/* Selected Traits Display */}
      {selectedTraits.length > 0 && (
        <div className="card p-4 rounded-xl border border-matcha-300 bg-matcha-50">
          <h4 className="text-sm font-bold text-charcoal-800 mb-3">
            Selected Traits ({selectedTraits.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedTraits.map(trait => (
              <span
                key={trait}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-matcha-500 text-white rounded-full text-sm font-medium shadow-sm hover:bg-matcha-600 transition-colors"
              >
                {trait}
                <button
                  onClick={() => removeTrait(trait)}
                  className="hover:bg-matcha-700 rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <FiX size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400" size={18} />
        <input
          type="text"
          placeholder="Search traits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-eggshell-50 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all"
        />
      </div>

      {/* Custom Trait Input */}
      <div className="card p-4 rounded-xl border border-eggshell-400">
        <h4 className="text-sm font-bold text-charcoal-800 mb-2">Add Custom Trait</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your own trait..."
            value={customTrait}
            onChange={(e) => setCustomTrait(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTrait())}
            className="flex-1 px-3 py-2 bg-eggshell-50 rounded-lg border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 focus:border-matcha-400 transition-all"
          />
          <button
            onClick={addCustomTrait}
            type="button"
            className="px-4 py-2 bg-matcha-500 hover:bg-matcha-600 text-white rounded-lg font-medium transition-all flex items-center gap-1.5"
          >
            <FiPlus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Traits Categories */}
      <div className="card p-4 rounded-xl border border-eggshell-400 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-bold text-charcoal-800 mb-3">Select Traits</h4>
        <div className="space-y-2">
          {Object.entries(filteredCategories).map(([category, traits]) => (
            <div key={category} className="border border-eggshell-300 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                type="button"
                className="w-full px-3 py-2.5 bg-eggshell-100 hover:bg-eggshell-200 flex items-center justify-between font-semibold text-sm text-charcoal-800 transition-colors"
              >
                <span>{category}</span>
                {expandedCategories[category] ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </button>
              {expandedCategories[category] && (
                <div className="p-3 bg-white">
                  <div className="flex flex-wrap gap-2">
                    {traits.map(trait => {
                      const isSelected = selectedTraits.includes(trait)
                      return (
                        <button
                          key={trait}
                          onClick={() => toggleTrait(trait)}
                          type="button"
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                            isSelected
                              ? 'bg-matcha-500 text-white border-matcha-500 hover:bg-matcha-600 hover:border-matcha-600'
                              : 'bg-white text-charcoal-700 border-eggshell-400 hover:border-matcha-400 hover:bg-eggshell-100'
                          }`}
                        >
                          {trait}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TraitsSelector
