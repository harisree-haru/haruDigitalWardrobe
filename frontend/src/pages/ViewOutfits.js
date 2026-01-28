import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Outfit.css';

const ViewOutfits = () => {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    fetchOutfits();
  }, []);

  const fetchOutfits = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/outfits', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOutfits(response.data.outfits);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (outfitId) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      try {
        setDeleteLoading(outfitId);
        await axios.delete(`/api/outfits/${outfitId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setOutfits(outfits.filter(outfit => outfit._id !== outfitId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete outfit');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  return (
    <div className="outfit-container">
      <div className="back-navigation">
        <button 
          className="back-arrow"
          onClick={() => navigate(`/${user?.role}-dashboard`)}
          title="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="outfit-list-header">
        <div>
          <h2 className="outfit-title">👗 Your Outfits</h2>
          <p className="outfit-subtitle">Manage your outfit collection</p>
        </div>
        {user?.role === 'customer' && (
          <button
            className="btn-add-outfit"
            onClick={() => navigate('/add-outfit')}
          >
            ➕ Add New Outfit
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading your outfits...</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">👗</p>
          <h3>No outfits yet</h3>
          <p>
            {user?.role === 'customer'
              ? 'Create your first outfit to get started!'
              : 'No outfits to display'}
          </p>
          {user?.role === 'customer' && (
            <button
              className="btn-primary"
              onClick={() => navigate('/add-outfit')}
            >
              Create First Outfit
            </button>
          )}
        </div>
      ) : (
        <div className="outfits-grid">
          {outfits.map(outfit => (
            <div key={outfit._id} className="outfit-card-item">
              <div className="outfit-card-header-item">
                <h3>{outfit.name}</h3>
                <span className="outfit-date">
                  {new Date(outfit.createdAt).toLocaleDateString()}
                </span>
              </div>

              {outfit.notes && (
                <div className="outfit-notes">
                  <p>{outfit.notes}</p>
                </div>
              )}

              {user?.role === 'customer' && (
                <div className="outfit-card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/edit-outfit/${outfit._id}`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(outfit._id)}
                    disabled={deleteLoading === outfit._id}
                  >
                    {deleteLoading === outfit._id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewOutfits;
