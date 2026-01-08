import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, signup as apiSignup } from '../api/auth';
import { Brain, ArrowRight } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isLogin 
        ? await apiLogin(username, password)
        : await apiSignup(username, password);
      
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="branding-section">
        {/* Subtle background pattern */}
        <div className="background-pattern">
          <div className="pattern-circle pattern-circle-1"></div>
          <div className="pattern-circle pattern-circle-2"></div>
        </div>

        <div className="branding-content">
          {/* Logo */}
          <div className="logo-container">
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
              <Brain className="icon" style={{ color: 'white' }} />
            </div>
            <span className="logo-text" style={{ color: 'white', fontWeight: '700' }}>LearnHub</span>
          </div>

          {/* Main Heading */}
          <div className="heading-container">
            <h1 className="main-heading">
              Welcome to<br />
              LearnHub
            </h1>
            <p className="main-subtext">
              Your self-paced AI learning companion. Build knowledge systematically with personalized learning journeys, structured syllabus & revision, and comprehensive interview preparation.
            </p>
          </div>

          {/* Trust Elements - Minimal Text Block */}
          <div style={{
            marginTop: '3rem',
            paddingLeft: '1rem',
            borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
          }}>
            <p style={{
              color: '#cbd5e1',
              fontSize: '0.9375rem',
              lineHeight: '1.8',
              margin: 0
            }}>
              Personalized learning journeys tailored to your goals. Structured syllabus with intelligent revision scheduling. Interview preparation with AI-powered practice sessions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="branding-footer">
          <p className="footer-text">
            Empowering students to learn smarter, not harder
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="form-section">
        <div className="form-wrapper">
          {/* Mobile Logo */}
          <div className="mobile-logo">
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
              <Brain className="icon" style={{ color: 'white' }} />
            </div>
            <span className="logo-text" style={{ color: 'white', fontWeight: '700' }}>LearnHub</span>
          </div>

          {/* Auth Card */}
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="auth-title">
                {isLogin ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="auth-subtitle">
                {isLogin 
                  ? 'Sign in to continue your learning journey' 
                  : 'Start your personalized learning experience today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight className="button-icon" />}
              </button>
            </form>

            <div className="toggle-auth">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="toggle-button"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          {/* Mobile Trust Elements */}
          <div className="mobile-features">
            <p style={{
              fontSize: '0.8125rem',
              color: '#64748b',
              lineHeight: '1.6',
              textAlign: 'center',
              margin: 0
            }}>
              Personalized learning journeys • Structured syllabus & revision • Interview preparation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;