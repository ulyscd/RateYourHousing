import React, { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({ onLocationSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim API for address search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Eugene, Oregon')}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (suggestion) => {
    onLocationSelect({
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <div className="search-bar-container">
      <p className="text-xs text-charcoal-600 mb-2 italic">
        Don't see your place? Search and create a new entry.
      </p>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search for an apartment address..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {loading && <span className="search-loading">Loading...</span>}
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSelectLocation(suggestion)}
            >
              {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
