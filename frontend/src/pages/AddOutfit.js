import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Outfit.css';

const AddOutfit = () => {
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

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
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/outfits', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Outfit created successfully!');
      setFormData({ name: '', notes: '' });

      // Redirect to view outfits after 1.5 seconds
      setTimeout(() => {
        navigate('/view-outfits');
      }, 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].msg);
      } else {
        setError(err.response?.data?.message || 'Failed to create outfit');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outfit-container">
      <div className="outfit-card">
        <div className="outfit-header">
          <h2 className="outfit-title">➕ Add New Outfit</h2>
          <p className="outfit-subtitle">Create a new outfit combination</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="outfit-form">
          <div className="form-group">
            <label htmlFor="name">Outfit Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Summer Beach Look, Office Casual"
              required
            />
            <small className="field-hint">Give your outfit a memorable name</small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes & Description</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add details about this outfit, such as colors, items used, occasion, weather conditions, etc."
              rows="6"
            />
            <small className="field-hint">Describe your outfit, items used, occasion, etc.</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating...' : '✓ Create Outfit'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/customer-dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOutfit;
