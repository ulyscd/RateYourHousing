import React, { useState } from 'react';
import './AddHousingModal.css';

export default function AddHousingModal({ location, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    address: location.address,
    bedrooms: '',
    bathrooms: '',
    price: '',
    description: '',
    image_url: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          latitude: location.lat,
          longitude: location.lng
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit housing information');
      }

      const newListing = await response.json();
      onSubmit(newListing);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Housing</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Building/Property Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Maple Apartments"
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="address-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms</label>
              <input
                type="text"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="e.g., 2"
              />
            </div>

            <div className="form-group">
              <label>Bathrooms</label>
              <input
                type="text"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="e.g., 1"
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., $1200/mo"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Any additional information about this housing..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Image URL (optional)</label>
            <input
              type="text"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Add Housing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
