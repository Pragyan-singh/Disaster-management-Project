import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout = () => {} }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    try {
      if (typeof onLogout === 'function') {
        onLogout();
      }
      navigate('/login');
    } catch (error) {
      console.error('Error in handleHomeClick:', error);
      navigate('/login');
    }
  };

  return (
    <div className="header">
      <button onClick={handleHomeClick} className="home-button">
        🏠 Home
      </button>
    </div>
  );
};

export default Header; 