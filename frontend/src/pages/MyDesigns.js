import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyDesigns.css';

const MyDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAndDecryptDesigns();
  }, []);

  const fetchAndDecryptDesigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const password = localStorage.getItem('userPassword');
      
      if (!password) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch all designs
      const response = await axios.get('/api/designs/list/my-designs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Automatically decrypt each design
      const decryptedDesigns = await Promise.all(
        response.data.designs.map(async (design) => {
          try {
            const decryptResponse = await axios.post(
              `/api/designs/${design.id}/decrypt`,
              { password },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              ...design,
              decryptedData: decryptResponse.data.design,
              decryptionError: null
            };
          } catch (err) {
            return {
              ...design,
              decryptedData: null,
              decryptionError: err.response?.data?.message || 'Decryption failed'
            };
          }
        })
      );

      setDesigns(decryptedDesigns);
    } catch (error) {
      console.error('Error fetching designs:', error);
      setError(error.response?.data?.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: '⏳ Pending' },
      in_progress: { class: 'status-progress', text: '🔄 In Progress' },
      completed: { class: 'status-completed', text: '✅ Completed' },
      cancelled: { class: 'status-cancelled', text: '❌ Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔐</div>
        <p>Decrypting your designs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-designs-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-designs-container">
      <div className="designs-header">
        <h1>My Designs</h1>
        <p>All your designs are automatically decrypted and ready to view</p>
      </div>

      {designs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No designs yet</h2>
          <p>Upload your first design to get started!</p>
        </div>
      ) : (
        <div className="designs-grid">
          {designs.map(design => {
            const statusBadge = getStatusBadge(design.status);
            const decrypted = design.decryptedData;
            
            return (
              <div key={design.id} className="design-card">
                <div className="design-header">
                  <div className="design-type-badge">
                    {design.designType === 'photo' ? '📸 Photo' : '✨ Options'}
                  </div>
                  <div className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.text}
                  </div>
                </div>

                {design.decryptionError ? (
                  <div className="decryption-error">
                    <p>⚠️ {design.decryptionError}</p>
                  </div>
                ) : decrypted ? (
                  <>
                    <div className="signature-status">
                      {decrypted.signatureValid ? (
                        <div className="signature-valid">
                          ✅ Verified
                        </div>
                      ) : (
                        <div className="signature-invalid">
                          ⚠️ Unverified
                        </div>
                      )}
                    </div>

                    <div className="design-content">
                      {(() => {
                        console.log('Decrypted data:', decrypted.data);
                        console.log('Image filename:', decrypted.data.imageFilename);
                        return null;
                      })()}
                      
                      {decrypted.data.imageFilename && (
                        <div className="image-display">
                          <img 
                            src={`/api/designs/image/${decrypted.data.imageFilename}`}
                            alt="Design"
                            className="design-image"
                            onError={(e) => {
                              console.error('Image failed to load:', e.target.src);
                              console.error('Filename:', decrypted.data.imageFilename);
                            }}
                          />
                        </div>
                      )}

                      {decrypted.data.styleOptions && (
                        <div className="style-options-display">
                          <strong>Style Preferences:</strong>
                          <div className="options-list">
                            {decrypted.data.styleOptions.colors?.length > 0 && (
                              <p><strong>Colors:</strong> {decrypted.data.styleOptions.colors.join(', ')}</p>
                            )}
                            {decrypted.data.styleOptions.style && (
                              <p><strong>Style:</strong> {decrypted.data.styleOptions.style}</p>
                            )}
                            {decrypted.data.styleOptions.occasion && (
                              <p><strong>Occasion:</strong> {decrypted.data.styleOptions.occasion}</p>
                            )}
                            {decrypted.data.styleOptions.preferences && (
                              <p><strong>Notes:</strong> {decrypted.data.styleOptions.preferences}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="content-item">
                        <strong>👤 Customer:</strong>
                        <span>{decrypted.data.customerName}</span>
                      </div>

                      <div className="content-item">
                        <strong>📅 Uploaded:</strong>
                        <span>{new Date(decrypted.data.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : null}

                {design.stylist && (
                  <div className="stylist-info">
                    <strong>💼 Stylist:</strong>
                    <span>{design.stylist.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDesigns;
