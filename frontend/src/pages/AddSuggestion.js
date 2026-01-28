import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddSuggestion.css';

const AddSuggestion = () => {
  const [designId, setDesignId] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/suggestions',
        { designId, suggestion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Suggestion added successfully!');
      setSuggestion('');
      setDesignId('');
      
      setTimeout(() => {
        navigate('/stylist-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-suggestion-container">
      <div className="suggestion-card">
        <div className="card-header">
          <h1>💡 Add Styling Suggestion</h1>
          <p>Provide personalized styling advice for your client's design</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="suggestion-form">
          <div className="form-group">
            <label htmlFor="designId">Design ID</label>
            <input
              type="text"
              id="designId"
              value={designId}
              onChange={(e) => setDesignId(e.target.value)}
              placeholder="Enter the design ID"
              required
            />
            <small>You can find the design ID in "My Designs"</small>
          </div>

          <div className="form-group">
            <label htmlFor="suggestion">Your Suggestion</label>
            <textarea
              id="suggestion"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Write your styling suggestions here..."
              rows="8"
              required
            />
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate('/stylist-dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Add Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSuggestion;
