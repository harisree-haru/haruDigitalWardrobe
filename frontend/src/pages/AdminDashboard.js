import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
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
          <h1 className="navbar-brand">Haru Digital Wardrobe - Admin</h1>
          <div className="navbar-right">
            <span className="user-info">Welcome, {user?.firstName}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>⚙️ Admin Dashboard</h2>
          <div className="user-profile">
            <h3>Your Profile</h3>
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Role:</strong> Administrator</p>
          </div>

          <div className="dashboard-actions">
            <h3>Admin Functions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn manage-users-btn"
                onClick={() => navigate('/manage-users')}
              >
                <span className="btn-icon">👥</span>
                <span className="btn-text">Manage Users</span>
              </button>
            </div>
          </div>

          <div className="features">
            <h3>Admin Capabilities</h3>
            <ul>
              <li>👥 Manage all users (customers & stylists)</li>
              <li>🔐 Create and manage stylist accounts</li>
              <li>📊 View system statistics and analytics</li>
              <li>⚙️ Configure system settings</li>
              <li>📝 Monitor user activity and logs</li>
              <li>⭐ Manage reports and complaints</li>
              <li>💰 Track transactions and payments</li>
              <li>🔧 System maintenance tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
