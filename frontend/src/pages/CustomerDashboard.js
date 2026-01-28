import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
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
          <h2>👤 Customer Dashboard</h2>
          <div className="user-profile">
            <h3>Your Profile</h3>
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Role:</strong> Customer</p>
          </div>

          <div className="dashboard-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn add-outfit-btn"
                onClick={() => navigate('/add-outfit')}
              >
                <span className="btn-icon">➕</span>
                <span className="btn-text">Add Outfit</span>
              </button>
              <button 
                className="action-btn view-outfits-btn"
                onClick={() => navigate('/view-outfits')}
              >
                <span className="btn-icon">👗</span>
                <span className="btn-text">View Outfits</span>
              </button>
              <button 
                className="action-btn upload-design-btn"
                onClick={() => navigate('/upload-design')}
              >
                <span className="btn-icon">🔐</span>
                <span className="btn-text">Upload Design (Secure)</span>
              </button>
              <button 
                className="action-btn my-designs-btn"
                onClick={() => navigate('/my-designs')}
              >
                <span className="btn-icon">📋</span>
                <span className="btn-text">My Designs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
