import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const RoleSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="role-selector-container">
      <div className="role-selector-card">
        <h1 className="role-selector-title">Haru Digital Wardrobe</h1>
        <p className="role-selector-subtitle">Select your role to continue</p>

        <div className="role-buttons-grid">
          <button 
            className="role-button customer-button"
            onClick={() => navigate('/customer-login')}
          >
            <div className="role-icon">👤</div>
            <h3>Customer</h3>
            <p>I want styling help & outfit planning</p>
          </button>

          <button 
            className="role-button stylist-button"
            onClick={() => navigate('/stylist-login')}
          >
            <div className="role-icon">✨</div>
            <h3>Stylist</h3>
            <p>I offer professional styling services</p>
          </button>

          <button 
            className="role-button admin-button"
            onClick={() => navigate('/admin-login')}
          >
            <div className="role-icon">⚙️</div>
            <h3>Admin</h3>
            <p>System administration access</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
