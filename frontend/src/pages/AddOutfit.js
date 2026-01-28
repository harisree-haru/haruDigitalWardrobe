import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Outfit.css';

const AddOutfit = () => {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    assignmentMethod: 'automatic',
    stylistId: ''
  });
  const [stylists, setStylists] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const response = await axios.get('/api/stylists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStylists(response.data.stylists);
    } catch (err) {
      console.error('Error fetching stylists:', err);
    }
  };

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

      setSuccess(`Outfit created successfully! Assigned to ${response.data.outfit.stylist.name}`);
      setFormData({ name: '', notes: '', assignmentMethod: 'automatic', stylistId: '' });

      // Redirect to view outfits after 2 seconds
      setTimeout(() => {
        navigate('/view-outfits');
      }, 2000);
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
          <p className="outfit-subtitle">Create a new outfit and get stylist suggestions</p>
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

          <div className="form-group">
            <label>Stylist Assignment *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="automatic"
                  checked={formData.assignmentMethod === 'automatic'}
                  onChange={handleChange}
                />
                <span>🤖 Automatic Assignment</span>
                <small>System will assign the best available stylist</small>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="manual"
                  checked={formData.assignmentMethod === 'manual'}
                  onChange={handleChange}
                />
                <span>👤 Choose My Stylist</span>
                <small>Select a specific stylist</small>
              </label>
            </div>
          </div>

          {formData.assignmentMethod === 'manual' && (
            <div className="form-group">
              <label htmlFor="stylistId">Select Stylist *</label>
              <select
                id="stylistId"
                name="stylistId"
                value={formData.stylistId}
                onChange={handleChange}
                required
              >
                <option value="">-- Choose a stylist --</option>
                {stylists.map(stylist => (
                  <option key={stylist._id} value={stylist._id}>
                    {stylist.firstName} {stylist.lastName} - {stylist.bio}
                  </option>
                ))}
              </select>
            </div>
          )}

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
