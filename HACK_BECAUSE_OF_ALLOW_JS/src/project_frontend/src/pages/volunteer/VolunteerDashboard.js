import React, { useState, useEffect } from 'react';
import { project_backend } from '@declarations/project_backend';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './VolunteerDashboard.css';
// Create marker icons once, outside the component
const createIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
    });
};
const ICONS = {
    low: createIcon('#2563EB'), // Blue
    medium: createIcon('#EAB308'), // Yellow
    high: createIcon('#EA580C'), // Orange
    critical: createIcon('#DC2626'), // Red
    volunteer: createIcon('#22C55E'), // Green
};
// Component to update map center when location changes
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};
const VolunteerDashboard = ({ currentUser }) => {
    const [nearbyRequests, setNearbyRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        address: ''
    });
    const [gpsLoading, setGpsLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [verificationNote, setVerificationNote] = useState('');
    const defaultCenter = [12.9716, 77.5946]; // Bangalore coordinates
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapKey, setMapKey] = useState(0);
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
    useEffect(() => {
        if (location.latitude && location.longitude) {
            setMapCenter([parseFloat(location.latitude), parseFloat(location.longitude)]);
            loadNearbyRequests();
            setMapKey(prev => prev + 1); // Force map re-render when location changes
        }
    }, [location]);
    const getGPSLocation = async () => {
        setGpsLoading(true);
        setError('');
        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            const { latitude, longitude } = position.coords;
            let address = `${latitude}, ${longitude}`;
            try {
                // Try to get address from OpenStreetMap
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: {
                        'User-Agent': 'DisasterReliefApp/1.0'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    address = data.display_name || address;
                }
            }
            catch (geocodeError) {
                console.warn('Reverse geocoding failed:', geocodeError);
                // Continue with coordinates as address
            }
            setLocation({
                latitude,
                longitude,
                address
            });
            setSuccess('Location updated successfully');
            // Update volunteer's location in the backend
            await project_backend.update_volunteer_location(currentUser.email, latitude.toString(), longitude.toString(), address);
            // Load nearby requests after updating location
            await loadNearbyRequests();
        }
        catch (err) {
            console.error('Error getting location:', err);
            setError('Failed to get location: ' + (err.message || 'Please ensure location access is enabled'));
        }
        finally {
            setGpsLoading(false);
        }
    };
    const loadNearbyRequests = async () => {
        try {
            setLoading(true);
            const requests = await project_backend.get_nearby_requests(location.latitude.toString(), location.longitude.toString());
            setNearbyRequests(requests);
        }
        catch (err) {
            console.error('Error loading nearby requests:', err);
            setError('Failed to load nearby requests');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerifyRequest = async (request) => {
        try {
            setLoading(true);
            const success = await project_backend.verify_help_request(request.victim_id, request.timestamp, verificationNote, currentUser.email);
            if (success) {
                setSuccess('Request verified successfully');
                loadNearbyRequests(); // Reload the list
                setSelectedRequest(null);
                setVerificationNote('');
            }
            else {
                setError('Failed to verify request');
            }
        }
        catch (err) {
            console.error('Error verifying request:', err);
            setError('Failed to verify request: ' + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1); // Distance in km
    };
    return (<div className="volunteer-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <p className="user-type">Volunteer Dashboard</p>
      </div>

      <div className="dashboard-content">
        <div className="map-section">
          <h2>Help Requests Map</h2>
          <div className="location-controls">
            <button onClick={getGPSLocation} disabled={gpsLoading} className="gps-button">
              {gpsLoading ? (<span className="loading-spinner"></span>) : ('📍 Update My Location')}
            </button>
            {location.address && (<p className="current-location">
                Current Location: {location.address}
              </p>)}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="map-container">
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '500px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>
              {location.latitude && location.longitude && (<Marker position={[parseFloat(location.latitude), parseFloat(location.longitude)]} icon={ICONS.volunteer}>
                  <Popup>Your Location</Popup>
                </Marker>)}
              {nearbyRequests.map((request) => {
            const lat = parseFloat(request.latitude);
            const lng = parseFloat(request.longitude);
            if (isNaN(lat) || isNaN(lng))
                return null;
            return (<Marker key={`${request.victim_id}-${request.timestamp}`} position={[lat, lng]} icon={ICONS[request.urgency.toLowerCase()] || ICONS.low}>
                    <Popup>
                      <div className="map-popup">
                        <h3>{request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)}</h3>
                        <p>{request.description}</p>
                        <p><strong>Urgency:</strong> {getUrgencyDescription(request.request_type, request.urgency)}</p>
                        <p><strong>Location:</strong> {request.location}</p>
                        <p><strong>Status:</strong> {request.status}</p>
                        {request.status.toLowerCase() === 'pending' && (<button onClick={() => setSelectedRequest(request)} className="verify-button">
                            Verify Request
                          </button>)}
                      </div>
                    </Popup>
                  </Marker>);
        })}
            </MapContainer>
          </div>

          <div className="map-legend">
            <h3>Map Legend</h3>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#2563EB' }}></div>
              <span>Low Urgency</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#EAB308' }}></div>
              <span>Medium Urgency</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#EA580C' }}></div>
              <span>High Urgency</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#DC2626' }}></div>
              <span>Critical Urgency</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#22C55E' }}></div>
              <span>Your Location</span>
            </div>
          </div>
        </div>

        <div className="nearby-requests">
          <h2>Nearby Help Requests</h2>
          {loading ? (<div className="loading">Loading nearby requests...</div>) : nearbyRequests.length === 0 ? (<p className="no-requests">No nearby requests found.</p>) : (<div className="requests-list">
              {nearbyRequests.map((request, index) => (<div key={index} className="request-card">
                  <div className="request-header">
                    <h3>{request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)}</h3>
                    <div className="request-header-right">
                      <span className={`status ${request.status.toLowerCase()}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="description">{request.description}</p>
                  <div className="request-details">
                    <span className={`urgency ${request.urgency.toLowerCase()}`} title={request.urgency.toUpperCase()}>
                      {getUrgencyDescription(request.request_type, request.urgency)}
                    </span>
                    <span className="location">📍 {request.location}</span>
                    {location.latitude && request.latitude && (<span className="distance">
                        📏 {calculateDistance(location.latitude, location.longitude, parseFloat(request.latitude), parseFloat(request.longitude))} km away
                      </span>)}
                    <span className="timestamp">
                      🕒 {new Date(request.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {request.status.toLowerCase() === 'pending' && (<div className="verification-section">
                      <textarea placeholder="Add verification notes..." value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} className="verification-notes"/>
                      <button onClick={() => handleVerifyRequest(request)} disabled={loading || !verificationNote.trim()} className="verify-button">
                        ✓ Verify & Forward to Organization
                      </button>
                    </div>)}
                </div>))}
            </div>)}
        </div>
      </div>
    </div>);
};
export default VolunteerDashboard;
