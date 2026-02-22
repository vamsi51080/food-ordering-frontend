import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.login(formData.username, formData.password);
      localStorage.setItem('adminToken', response.data.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <p>Sign in to manage orders and inventory.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
