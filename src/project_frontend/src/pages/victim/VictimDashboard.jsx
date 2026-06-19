import React, { useState, useEffect } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './VictimDashboard.css';

const VictimDashboard = ({ currentUser, setIsAuthenticated, setCurrentUser }) => {
  const navigate = useNavigate();
  const [activeRequests, setActiveRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    type: 'food',
    description: '',
    urgency: 'medium',
    location: '',
    status: 'pending',
    numberOfPeople: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  useEffect(() => {
    loadUserRequests();
  }, [currentUser]);

  const loadUserRequests = async () => {
    try {
      console.log('Loading requests for user:', currentUser?.email);
      const requests = await project_backend.get_user_requests(currentUser?.email);
      console.log('User requests:', requests);
      setActiveRequests(requests);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load your requests. Please refresh the page.');
    }
  };

  const getUrgencyOptions = (type) => {
    switch (type) {
      case 'food':
        return [
          { value: 'low', label: 'Have some food but running low' },
          { value: 'medium', label: 'Will run out of food in 24 hours' },
          { value: 'high', label: 'No food available' },
          { value: 'critical', label: 'Haven\'t eaten for over 24 hours' }
        ];
      case 'medical':
        return [
          { value: 'low', label: 'Non-urgent medical attention needed' },
          { value: 'medium', label: 'Need medical attention within 24 hours' },
          { value: 'high', label: 'Need immediate medical attention' },
          { value: 'critical', label: 'Life-threatening situation' }
        ];
      case 'shelter':
        return [
          { value: 'low', label: 'Current shelter is inadequate' },
          { value: 'medium', label: 'Need shelter within 24 hours' },
          { value: 'high', label: 'Need immediate shelter' },
          { value: 'critical', label: 'Exposed to dangerous conditions' }
        ];
      case 'evacuation':
        return [
          { value: 'low', label: 'Can evacuate within 24 hours' },
          { value: 'medium', label: 'Need to evacuate soon' },
          { value: 'high', label: 'Need immediate evacuation' },
          { value: 'critical', label: 'Life-threatening situation, immediate evacuation required' }
        ];
      case 'supplies':
        return [
          { value: 'low', label: 'Running low on supplies' },
          { value: 'medium', label: 'Will run out of supplies soon' },
          { value: 'high', label: 'Urgently need supplies' },
          { value: 'critical', label: 'Critical supplies depleted' }
        ];
      default:
        return [
          { value: 'low', label: 'Low urgency' },
          { value: 'medium', label: 'Medium urgency' },
          { value: 'high', label: 'High urgency' },
          { value: 'critical', label: 'Critical urgency' }
        ];
    }
  };

  const getUrgencyDescription = (type, urgencyLevel) => {
    const options = getUrgencyOptions(type);
    const option = options.find(opt => opt.value === urgencyLevel);
    return option ? option.label : urgencyLevel.toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({
      ...prev,
      [name]: value,
      // Reset urgency to medium when type changes
      ...(name === 'type' ? { urgency: 'medium' } : {})
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get GPS coordinates first
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      let locationAddress = newRequest.location || `${latitude}, ${longitude}`;
      
      try {
        // Try to get address from OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'DisasterReliefApp/1.0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          locationAddress = data.display_name || locationAddress;
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        // Continue with existing location or coordinates
      }
      
      const helpRequest = {
        victim_id: currentUser.email,
        request_type: newRequest.type,
        description: `${newRequest.type.charAt(0).toUpperCase() + newRequest.type.slice(1)} needed for ${newRequest.numberOfPeople} people. ${newRequest.description}`,
        urgency: newRequest.urgency,
        location: locationAddress,
        status: 'pending',
        timestamp: new Date().toISOString(),
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        verification_note: [], // Empty array represents None/null in Candid
        verified_by: [], // Empty array represents None/null in Candid
        organization_id: [], // Empty array represents None/null in Candid
        assigned_volunteer: [] // Empty array represents None/null in Candid
      };

      console.log('Submitting help request:', helpRequest);
      const success = await project_backend.create_help_request(helpRequest);

      if (success) {
        setSuccess('Your request has been submitted successfully!');
        setNewRequest({
          type: 'food',
          description: '',
          urgency: 'medium',
          location: '',
          status: 'pending',
          numberOfPeople: '1'
        });
        // Reload the requests list
        await loadUserRequests();
      } else {
        setError('Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request: ' + (err.message || 'Please ensure location access is enabled'));
    } finally {
      setLoading(false);
    }
  };

  const getGPSLocation = () => {
    setGpsLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `${latitude}, ${longitude}`;
        
        try {
          // Try to get address from OpenStreetMap
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'DisasterReliefApp/1.0'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            address = data.display_name || address;
          }
        } catch (geocodeError) {
          console.warn('Reverse geocoding failed:', geocodeError);
          // Continue with coordinates as address
        }

        setNewRequest(prev => ({
          ...prev,
          location: address
        }));
        setGpsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Failed to get location: ' + (error.message || 'Please ensure location access is enabled'));
        setGpsLoading(false);
      }
    );
  };

  const handleCancelRequest = async (timestamp) => {
    try {
      console.log('Attempting to cancel request with timestamp:', timestamp);
      setCancellingRequestId(timestamp);
      
      if (!timestamp) {
        throw new Error('Request timestamp is undefined');
      }

      console.log('Calling backend to cancel request...');
      // Pass both email and timestamp to uniquely identify the request
      const success = await project_backend.cancel_help_request(currentUser.email, timestamp);
      console.log('Cancel request response:', success);
      
      if (success) {
        setSuccess('Request cancelled successfully');
        // Reload the requests list
        await loadUserRequests();
      } else {
        throw new Error('Backend returned false for cancellation');
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError(`Failed to cancel request: ${err.message}`);
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <div className="victim-dashboard">
      <Header onLogout={handleLogout} />
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <p className="user-type">Victim Dashboard</p>
      </div>

      <div className="dashboard-content">
        <div className="request-section">
          <h2>Request Help</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmitRequest} className="request-form">
            <div className="form-group">
              <label htmlFor="type">Type of Help Needed:</label>
              <select
                id="type"
                name="type"
                value={newRequest.type}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="form-control"
              >
                <option value="food">Food</option>
                <option value="medical">Medical</option>
                <option value="shelter">Shelter</option>
                <option value="evacuation">Evacuation</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="numberOfPeople">Number of People Needing {newRequest.type.charAt(0).toUpperCase() + newRequest.type.slice(1)}:</label>
              <input
                type="number"
                id="numberOfPeople"
                name="numberOfPeople"
                value={newRequest.numberOfPeople}
                onChange={handleInputChange}
                min="1"
                step="1"
                required
                disabled={loading}
                className="form-control"
                placeholder="Enter number of people"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={newRequest.description}
                onChange={handleInputChange}
                placeholder="Please describe your needs in detail..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Urgency Level:</label>
              <select
                id="urgency"
                name="urgency"
                value={newRequest.urgency}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="form-control"
              >
                {getUrgencyOptions(newRequest.type).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location:</label>
              <div className="location-input-group">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newRequest.location}
                  onChange={handleInputChange}
                  placeholder="Your current location..."
                  required
                  disabled={loading || gpsLoading}
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={getGPSLocation}
                  disabled={loading || gpsLoading}
                  className="gps-button"
                >
                  {gpsLoading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    '📍 Get Location'
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="active-requests">
          <h2>Your Active Requests</h2>
          {activeRequests.length === 0 ? (
            <p className="no-requests">You don't have any active requests.</p>
          ) : (
            <div className="requests-list">
              {activeRequests.map((request, index) => (
                <div key={index} className="request-card">
                  <div className="request-header">
                    <h3>{request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)}</h3>
                    <div className="request-header-right">
                      <span className={`status ${request.status.toLowerCase()}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.status.toLowerCase() === 'pending' && (
                        <button
                          className="cancel-button"
                          onClick={() => handleCancelRequest(request.timestamp)}
                          disabled={cancellingRequestId === request.timestamp}
                        >
                          {cancellingRequestId === request.timestamp ? (
                            <span className="loading-spinner"></span>
                          ) : (
                            '❌ Cancel'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="description">{request.description}</p>
                  <div className="request-details">
                    <span className={`urgency ${request.urgency}`} title={request.urgency.toUpperCase()}>
                      {getUrgencyDescription(request.request_type, request.urgency)}
                    </span>
                    <span className="location">{request.location}</span>
                    <span className="timestamp">
                      {new Date(request.timestamp).toLocaleString()}
                    </span>
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

export default VictimDashboard; 