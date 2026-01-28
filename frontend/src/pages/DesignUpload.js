import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DesignUpload.css';

const DesignUpload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Type selection, 2: Upload/Options, 3: Stylist, 4: Confirm
  const [designType, setDesignType] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [styleOptions, setStyleOptions] = useState({
    colors: [],
    style: '',
    occasion: '',
    preferences: ''
  });
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch stylists on component mount
  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/stylists/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStylists(response.data.stylists);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleOptionChange = (field, value) => {
    setStyleOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorToggle = (color) => {
    setStyleOptions(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const password = localStorage.getItem('userPassword'); // Get stored password
      
      if (!password) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      
      formData.append('designType', designType);
      formData.append('password', password);
      
      if (designType === 'photo' && imageFile) {
        formData.append('image', imageFile);
      } else if (designType === 'options') {
        formData.append('styleOptions', JSON.stringify(styleOptions));
      }
      
      if (!autoAssign && selectedStylist) {
        formData.append('stylistId', selectedStylist);
      }

      const response = await axios.post('/api/designs/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Design uploaded successfully! 🎉');
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Type</div>
      </div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 2 ? 'active' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Design</div>
      </div>
      <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Stylist</div>
      </div>
      <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 4 ? 'active' : ''}`}>
        <div className="step-number">4</div>
        <div className="step-label">Confirm</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Choose Design Type</h2>
      <div className="design-type-options">
        <div
          className={`type-card ${designType === 'photo' ? 'selected' : ''}`}
          onClick={() => setDesignType('photo')}
        >
          <div className="type-icon">📸</div>
          <h3>Upload Photo</h3>
          <p>Upload a photo of your design or inspiration</p>
        </div>
        <div
          className={`type-card ${designType === 'options' ? 'selected' : ''}`}
          onClick={() => setDesignType('options')}
        >
          <div className="type-icon">✨</div>
          <h3>Style Options</h3>
          <p>Describe your preferences and style</p>
        </div>
      </div>
      <button
        className="btn-next"
        onClick={() => setStep(2)}
        disabled={!designType}
      >
        Next →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      {designType === 'photo' ? (
        <>
          <h2>Upload Design Photo</h2>
          <div className="image-upload-area">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  className="btn-remove"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-placeholder">
                  <div className="upload-icon">📁</div>
                  <p>Click to upload or drag and drop</p>
                  <small>PNG, JPG, GIF up to 10MB</small>
                </div>
              </label>
            )}
          </div>
        </>
      ) : (
        <>
          <h2>Describe Your Style</h2>
          <div className="style-options-form">
            <div className="form-group">
              <label>Preferred Colors</label>
              <div className="color-grid">
                {['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple'].map(color => (
                  <div
                    key={color}
                    className={`color-option ${styleOptions.colors.includes(color) ? 'selected' : ''}`}
                    onClick={() => handleColorToggle(color)}
                  >
                    {color}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Style Type</label>
              <select
                value={styleOptions.style}
                onChange={(e) => handleStyleOptionChange('style', e.target.value)}
              >
                <option value="">Select a style</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="business">Business</option>
                <option value="streetwear">Streetwear</option>
                <option value="minimalist">Minimalist</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label>Occasion</label>
              <select
                value={styleOptions.occasion}
                onChange={(e) => handleStyleOptionChange('occasion', e.target.value)}
              >
                <option value="">Select an occasion</option>
                <option value="everyday">Everyday</option>
                <option value="work">Work</option>
                <option value="party">Party</option>
                <option value="wedding">Wedding</option>
                <option value="date">Date</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Preferences</label>
              <textarea
                value={styleOptions.preferences}
                onChange={(e) => handleStyleOptionChange('preferences', e.target.value)}
                placeholder="Tell us more about what you're looking for..."
                rows="4"
              />
            </div>
          </div>
        </>
      )}
      <div className="step-buttons">
        <button className="btn-back" onClick={() => setStep(1)}>
          ← Back
        </button>
        <button
          className="btn-next"
          onClick={() => setStep(3)}
          disabled={designType === 'photo' ? !imageFile : !styleOptions.style}
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Choose Your Stylist</h2>
      
      <div className="auto-assign-option">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoAssign}
            onChange={(e) => {
              setAutoAssign(e.target.checked);
              if (e.target.checked) setSelectedStylist(null);
            }}
          />
          <span>Let the system automatically assign the best available stylist</span>
        </label>
      </div>

      {!autoAssign && (
        <div className="stylists-grid">
          {stylists.map(stylist => (
            <div
              key={stylist.id}
              className={`stylist-card ${selectedStylist === stylist.id ? 'selected' : ''} ${!stylist.isAvailable ? 'unavailable' : ''}`}
              onClick={() => stylist.isAvailable && setSelectedStylist(stylist.id)}
            >
              <div className="stylist-avatar">
                {stylist.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3>{stylist.name}</h3>
              <p className="stylist-bio">{stylist.bio}</p>
              <div className="stylist-workload">
                <span className={`status-badge ${stylist.isAvailable ? 'available' : 'busy'}`}>
                  {stylist.isAvailable ? 'Available' : 'Busy'}
                </span>
                <span className="workload">{stylist.workload}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="step-buttons">
        <button className="btn-back" onClick={() => setStep(2)}>
          ← Back
        </button>
        <button
          className="btn-next"
          onClick={() => setStep(4)}
          disabled={!autoAssign && !selectedStylist}
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Confirm & Upload</h2>
      
      <div className="confirmation-summary">
        <div className="summary-item">
          <strong>Design Type:</strong>
          <span>{designType === 'photo' ? '📸 Photo Upload' : '✨ Style Options'}</span>
        </div>
        
        {designType === 'photo' && imagePreview && (
          <div className="summary-item">
            <strong>Image:</strong>
            <img src={imagePreview} alt="Preview" className="summary-image" />
          </div>
        )}
        
        {designType === 'options' && (
          <div className="summary-item">
            <strong>Style Details:</strong>
            <div className="style-summary">
              <p><strong>Colors:</strong> {styleOptions.colors.join(', ') || 'None'}</p>
              <p><strong>Style:</strong> {styleOptions.style}</p>
              <p><strong>Occasion:</strong> {styleOptions.occasion}</p>
            </div>
          </div>
        )}
        
        <div className="summary-item">
          <strong>Stylist Assignment:</strong>
          <span>{autoAssign ? '🤖 Automatic' : `👤 ${stylists.find(s => s.id === selectedStylist)?.name}`}</span>
        </div>
      </div>

      <div className="encryption-notice">
        <div className="notice-icon">🔐</div>
        <div className="notice-content">
          <h4>Automatic Secure Encryption</h4>
          <p>Your design will be automatically encrypted with AES-256 and protected with digital signatures before upload. No additional action required!</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="step-buttons">
        <button type="button" className="btn-back" onClick={() => setStep(3)}>
          ← Back
        </button>
        <button type="button" className="btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Uploading...' : '🔐 Upload Securely'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="design-upload-container">
      <div className="upload-header">
        <h1>Upload New Design</h1>
        <p>Share your design ideas securely with our professional stylists</p>
      </div>

      {renderStepIndicator()}

      <div className="upload-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default DesignUpload;
