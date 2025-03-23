import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <h1>Disaster Relief Project</h1>
      <div className="home-options">
        <Link to="/request-help" className="home-option">
          Request Help
        </Link>
        <Link to="/volunteer" className="home-option">
          Volunteer
        </Link>
        <Link to="/admin" className="home-option">
          Admin
        </Link>
      </div>
    </div>
  );
}

export default Home; 