import React, { useState, useEffect } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './DonorDashboard.css';

const DonorDashboard = ({ currentUser, setIsAuthenticated, setCurrentUser }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newDonation, setNewDonation] = useState({
    amount: '',
    purpose: '',
  });
  const [processingDonation, setProcessingDonation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadDonations();
    }
  }, [currentUser]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      setError('');
      const donorDonations = await project_backend.get_donor_donations(currentUser.email);
      setDonations(donorDonations);
    } catch (err) {
      console.error('Error loading donations:', err);
      setError('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!newDonation.amount || !newDonation.purpose) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setProcessingDonation(true);
      setError('');
      setSuccessMessage('');

      const donation = {
        id: Date.now().toString(),
        amount: parseFloat(newDonation.amount),
        donor_name: currentUser.name,
        donor_email: currentUser.email,
        date: new Date().toISOString(),
        distribution_details: [{
          amount: parseFloat(newDonation.amount),
          purpose: newDonation.purpose,
          date: new Date().toISOString()
        }]
      };

      console.log('Creating donation with data:', donation);
      const success = await project_backend.make_donation(donation);
      
      if (success) {
        setSuccessMessage('Donation processed successfully!');
        setNewDonation({ amount: '', purpose: '' });
        loadDonations();
      } else {
        setError('Failed to process donation');
      }
    } catch (err) {
      console.error('Error making donation:', err);
      setError('Failed to process donation');
    } finally {
      setProcessingDonation(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="donor-dashboard">
      <Header onLogout={handleLogout} />
      <div className="dashboard-content">
        <h1>Welcome, {currentUser.name}!</h1>
        
        <div className="donation-form-container">
          <h2>Make a Donation</h2>
          <form onSubmit={handleDonationSubmit} className="donation-form">
            <div className="form-group">
              <label htmlFor="amount">Amount ($)</label>
              <input
                type="number"
                id="amount"
                min="1"
                step="0.01"
                value={newDonation.amount}
                onChange={(e) => setNewDonation(prev => ({ ...prev, amount: e.target.value }))}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="purpose">Purpose</label>
              <select
                id="purpose"
                value={newDonation.purpose}
                onChange={(e) => setNewDonation(prev => ({ ...prev, purpose: e.target.value }))}
                required
                className="form-control"
              >
                <option value="">Select a purpose</option>
                <option value="Emergency Relief">Emergency Relief</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Food and Water">Food and Water</option>
                <option value="Shelter">Shelter</option>
                <option value="General Support">General Support</option>
              </select>
            </div>
            <button
              type="submit"
              className="donate-button"
              disabled={processingDonation}
            >
              {processingDonation ? 'Processing...' : 'Make Donation'}
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>

        <div className="donation-history">
          <h2>Your Donation History</h2>
          {donations.length === 0 ? (
            <p className="no-donations">You haven't made any donations yet.</p>
          ) : (
            <div className="donations-grid">
              {donations.map(donation => (
                <div key={donation.id} className="donation-card">
                  <div className="donation-amount">${donation.amount.toFixed(2)}</div>
                  <div className="donation-details">
                    <p className="donation-date">
                      {new Date(donation.date).toLocaleDateString()}
                    </p>
                    <div className="distribution-details">
                      {donation.distribution_details.map((detail, index) => (
                        <div key={index} className="distribution-item">
                          <span className="purpose">{detail.purpose}</span>
                          <span className="amount">${detail.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard; 