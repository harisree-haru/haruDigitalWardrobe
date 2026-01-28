import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

const CustomerLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState('login'); // 'login', 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.requiresOTP) {
        // Customer needs OTP verification
        setTempToken(response.data.tempToken);
        setUserEmail(response.data.email);
        setOtpSent(true);
        setStep('otp');
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        // Stylist/Admin can login directly
        const { token, user } = response.data;

        if (user.role !== 'customer') {
          setError('This account is not a customer account. Please use the correct login page.');
          setLoading(false);
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        login(user, token);
        navigate('/customer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        otp: formData.otp,
        tempToken: tempToken
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      login(user, token);
      navigate('/customer-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/resend-otp', {
        tempToken: tempToken
      });

      setError('');
      setOtpSent(true);
      alert('OTP resent to your email!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/signup', {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'customer'
      });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      login(user, token);
      navigate('/customer-dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].msg);
      } else {
        setError(err.response?.data?.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="customer-auth-container">
        <div className="auth-banner-left">
          <div className="banner-content">
            <h2>Secure Login</h2>
            <p>2-Step Verification keeps your account safe</p>
            <div className="banner-features">
              <div className="feature">
                <span>🔐</span>
                <p>Extra Security Layer</p>
              </div>
              <div className="feature">
                <span>📧</span>
                <p>Email Verification</p>
              </div>
              <div className="feature">
                <span>⚡</span>
                <p>Fast & Easy</p>
              </div>
              <div className="feature">
                <span>✅</span>
                <p>One-Time Code</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-container-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Verify Your Identity</h2>
              <p className="auth-subtitle">Enter the OTP sent to {userEmail}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleOTPVerification} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">One-Time Password (OTP)</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="000000"
                  maxLength="6"
                  required
                  autoComplete="off"
                  className="otp-input"
                />
                <small className="field-hint">Enter the 6-digit code from your email</small>
              </div>

              <button type="submit" className="auth-button" disabled={loading || formData.otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="otp-actions">
              <button
                type="button"
                className="resend-otp-btn"
                onClick={handleResendOTP}
                disabled={loading}
              >
                Didn't receive the code? Resend OTP
              </button>
            </div>

            <div className="auth-footer">
              <button 
                type="button"
                onClick={() => {
                  setStep('login');
                  setOtpSent(false);
                  setTempToken('');
                  setError('');
                }}
                className="back-button"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/SignUp Step
  return (
    <div className="customer-auth-container">
      {/* Left Side - Ad Banner */}
      <div className="auth-banner-left">
        <div className="banner-content">
          <h2>Transform Your Style</h2>
          <p>Discover the perfect outfits with our digital wardrobe system</p>
          <div className="banner-features">
            <div className="feature">
              <span>📸</span>
              <p>Upload & Manage Wardrobe</p>
            </div>
            <div className="feature">
              <span>👗</span>
              <p>Create Outfit Combinations</p>
            </div>
            <div className="feature">
              <span>✨</span>
              <p>Get Expert Styling Tips</p>
            </div>
            <div className="feature">
              <span>📅</span>
              <p>Plan Your Looks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="auth-container-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="auth-subtitle">
              {isSignUp 
                ? 'Join our styling community' 
                : 'Login to your account'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="auth-form">
            {isSignUp && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="toggle-link"
              >
                {isSignUp ? 'Login' : 'Sign up'}
              </button>
            </p>
          </div>

          <div className="auth-footer">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="back-button"
            >
              ← Back to Role Selection
            </button>
          </div>

          {!isSignUp && (
            <div className="demo-credentials">
              <h4>Demo Credentials:</h4>
              <p><strong>Email:</strong> customer@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
