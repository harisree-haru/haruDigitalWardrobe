import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const StylistDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-brand">Haru Digital Wardrobe</h1>
          <div className="navbar-right">
            <span className="user-info">Welcome, {user?.firstName}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>✨ Stylist Dashboard</h2>
          <div className="user-profile">
            <h3>Your Profile</h3>
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Role:</strong> Stylist</p>
          </div>

          <div className="dashboard-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn view-outfits-btn"
                onClick={() => navigate('/view-outfits')}
              >
                <span className="btn-icon">👗</span>
                <span className="btn-text">View Outfits</span>
              </button>
              <button 
                className="action-btn suggestion-btn"
                onClick={() => navigate('/add-suggestion')}
              >
                <span className="btn-icon">💡</span>
                <span className="btn-text">Add Suggestion</span>
              </button>
            </div>
          </div>

          <div className="features">
            <h3>Features</h3>
            <ul>
              <li>👥 View customer requests and consultations</li>
              <li>🎨 Create and share styling advice</li>
              <li>💼 Manage your stylist portfolio</li>
              <li>⭐ View customer ratings and reviews</li>
              <li>📊 Track your earnings and appointments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylistDashboard;
