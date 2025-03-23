import React, { useState, useEffect } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './OrganizationDashboard.css';

const OrganizationDashboard = ({ currentUser, setIsAuthenticated, setCurrentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [helpRequests, setHelpRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [supplyBundles, setSupplyBundles] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newBundle, setNewBundle] = useState({
    name: '',
    description: '',
    items: []
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading data for organization dashboard...');
      
      console.log('Fetching requests...');
      const requests = await project_backend.get_all_requests();
      console.log('Received requests:', requests);

      console.log('Fetching volunteers...');
      const vols = await project_backend.get_all_volunteers();
      console.log('Received volunteers:', vols);

      console.log('Fetching supply bundles...');
      const bundles = await project_backend.get_organization_supply_bundles();
      console.log('Received supply bundles:', bundles);

      console.log('Fetching donations...');
      const don = await project_backend.get_organization_donations();
      console.log('Received donations:', JSON.stringify(don, null, 2));

      setHelpRequests(requests || []);
      setVolunteers(vols || []);
      setSupplyBundles(bundles || []);
      setDonations(don || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
      setHelpRequests([]);
      setVolunteers([]);
      setSupplyBundles([]);
      setDonations([]);
      setLoading(false);
    }
  };

  const handleVerifyRequest = async (requestId) => {
    try {
      console.log('Verifying request:', requestId);
      // Split the requestId into victim_id and timestamp
      const [victim_id, timestamp] = requestId.split('_');
      const success = await project_backend.verify_help_request(
        victim_id,
        timestamp,
        "Request verified by organization",
        "organization"
      );
      
      if (success) {
        console.log('Request verified successfully');
        loadData(); // Reload all data
        setError('');
      } else {
        console.error('Failed to verify request');
        setError('Failed to verify request. Please ensure the request is still pending.');
      }
    } catch (err) {
      console.error('Error verifying request:', err);
      setError('An error occurred while verifying the request. Please try again.');
    }
  };

  const handleAssignVolunteer = async (requestId, volunteerId) => {
    if (!volunteerId) {
      setError('Please select a volunteer');
      return;
    }
    try {
      console.log('Assigning volunteer:', volunteerId, 'to request:', requestId);
      // Split the requestId into victim_id and timestamp
      const [victim_id, timestamp] = requestId.split('_');
      
      // Get all requests for this victim
      const victimRequests = helpRequests.filter(req => req.victim_id === victim_id);
      
      // Assign volunteer to all requests for this victim
      const assignments = await Promise.all(
        victimRequests.map(request => 
          project_backend.assign_volunteer_to_request(
            `${request.victim_id}_${request.timestamp}`,
            volunteerId
          )
        )
      );
      
      const success = assignments.every(result => result === true);
      console.log('Assign volunteer result:', success);
      
      if (success) {
        loadData(); // Reload data to show updated assignments
      } else {
        setError('Failed to assign volunteer to some requests');
      }
    } catch (err) {
      console.error('Error assigning volunteer:', err);
      setError('Failed to assign volunteer');
    }
  };

  const handleApproveVolunteerRequest = async (requestId) => {
    try {
      console.log('Approving volunteer request:', requestId);
      const [victim_id, timestamp] = requestId.split('_');
      
      const success = await project_backend.approve_volunteer_request(victim_id, timestamp);
      console.log('Approve volunteer request result:', success);
      
      if (success) {
        loadData(); // Reload data to show updated status
        setError('');
      } else {
        setError('Failed to approve volunteer request');
      }
    } catch (err) {
      console.error('Error approving volunteer request:', err);
      setError('Failed to approve volunteer request');
    }
  };

  const handleCreateBundle = async (e) => {
    e.preventDefault();
    try {
      const bundle = {
        ...newBundle,
        id: Date.now().toString(),
        status: 'available',
        created_at: new Date().toISOString()
      };
      console.log('Creating bundle:', bundle);
      const success = await project_backend.create_supply_bundle(bundle);
      console.log('Create bundle result:', success);
      if (success) {
        setNewBundle({ name: '', description: '', items: [] });
        loadData(); // Reload data to show new bundle
      } else {
        setError('Failed to create supply bundle');
      }
    } catch (err) {
      console.error('Error creating bundle:', err);
      setError('Failed to create supply bundle');
    }
  };

  const handleDistributeBundle = async (bundleId, volunteerId) => {
    if (!volunteerId) {
      setError('Please select a volunteer');
      return;
    }
    try {
      console.log('Distributing bundle:', bundleId, 'to volunteer:', volunteerId);
      const success = await project_backend.distribute_supply_bundle(bundleId, volunteerId);
      console.log('Distribute bundle result:', success);
      if (success) {
        loadData(); // Reload data to show updated distribution
      } else {
        setError('Failed to distribute bundle');
      }
    } catch (err) {
      console.error('Error distributing bundle:', err);
      setError('Failed to distribute bundle');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="error">No organization user found</div>;
  }

  return (
    <div className="organization-dashboard">
      <Header onLogout={handleLogout} />
      <div className="dashboard-header">
        <h1>Organization Dashboard - {currentUser.name}</h1>
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Help Requests
          </button>
          <button
            className={`tab-button ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteers')}
          >
            Volunteers
          </button>
          <button
            className={`tab-button ${activeTab === 'supplies' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplies')}
          >
            Supply Bundles
          </button>
          <button
            className={`tab-button ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            Donations
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {activeTab === 'requests' && (
          <div className="requests-section">
            <h2>Help Requests</h2>
            <div className="requests-list">
              {(() => {
                // Group requests by victim_id
                const groupedRequests = helpRequests.reduce((acc, request) => {
                  if (!acc[request.victim_id]) {
                    acc[request.victim_id] = {
                      victim_id: request.victim_id,
                      requests: [],
                      combined_needs: new Set(),
                      status: request.status,
                      location: request.location,
                      assigned_volunteer: null
                    };
                  }
                  acc[request.victim_id].requests.push(request);
                  acc[request.victim_id].combined_needs.add(request.request_type);
                  // Update status to show the most urgent one
                  if (request.status === "pending" && acc[request.victim_id].status !== "pending") {
                    acc[request.victim_id].status = "pending";
                  } else if (request.status === "completed") {
                    acc[request.victim_id].status = "completed";
                  } else if (request.status === "verified" && acc[request.victim_id].status !== "pending") {
                    acc[request.victim_id].status = "verified";
                  }
                  // Update assigned volunteer if this request has one
                  if (request.assigned_volunteer && typeof request.assigned_volunteer === 'string') {
                    acc[request.victim_id].assigned_volunteer = request.assigned_volunteer;
                  }
                  return acc;
                }, {});

                // Convert grouped requests to array and sort by status
                return Object.values(groupedRequests)
                  .sort((a, b) => {
                    // Custom sort order: pending -> verified -> assigned -> completed
                    const statusOrder = {
                      'pending': 0,
                      'verified': 1,
                      'assigned': 2,
                      'completed': 3
                    };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map(group => {
                    const requestId = `${group.victim_id}_${group.requests[0].timestamp}`;
                    return (
                      <div key={requestId} className={`request-card ${group.status}`}>
                        <h3>Combined Requests for Victim {group.victim_id}</h3>
                        <div className="combined-needs">
                          <h4>Needs:</h4>
                          <ul>
                            {Array.from(group.combined_needs).map(need => (
                              <li key={need}>{need}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="request-details">
                          <span className="location">{group.location}</span>
                          <span className={`status ${group.status}`}>
                            {group.status}
                          </span>
                        </div>
                        <div className="request-actions">
                          {group.status === "pending" && (
                            <button
                              onClick={() => handleVerifyRequest(requestId)}
                              className="verify-button"
                            >
                              Verify All Requests
                            </button>
                          )}
                          {group.status === "verified" && !group.assigned_volunteer && (
                            <select
                              onChange={(e) => handleAssignVolunteer(requestId, e.target.value)}
                              className="volunteer-select"
                            >
                              <option value="">Select Volunteer</option>
                              {volunteers.map(vol => (
                                <option key={vol.email} value={vol.email}>
                                  {vol.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {group.assigned_volunteer && group.status !== "completed" && (
                            <>
                              <div className="assigned-volunteer">
                                Assigned to: {(() => {
                                  const volunteer = volunteers.find(v => v.email === group.assigned_volunteer);
                                  return volunteer ? volunteer.name : 'Unknown Volunteer';
                                })()}
                              </div>
                              <button
                                onClick={() => handleApproveVolunteerRequest(requestId)}
                                className="approve-button"
                              >
                                Approve Volunteer Completion
                              </button>
                            </>
                          )}
                          {group.status === "completed" && (
                            <div className="completion-status">
                              ✅ Request completed and approved
                            </div>
                          )}
                        </div>
                        <div className="individual-requests">
                          <h4>Individual Requests:</h4>
                          <ul>
                            {group.requests.map((request, index) => (
                              <li key={`${requestId}_${index}`}>
                                <strong>{request.request_type}</strong>: {request.description}
                                <span className={`urgency ${request.urgency}`}>
                                  {request.urgency}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="volunteers-section">
            <h2>Volunteers</h2>
            <div className="volunteers-list">
              {volunteers.map(volunteer => (
                <div key={volunteer.id} className="volunteer-card">
                  <h3>{volunteer.name}</h3>
                  <p>Email: {volunteer.email}</p>
                  <p>Phone: {volunteer.phone}</p>
                  <p>Active Assignments: {volunteer.active_assignments}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplies' && (
          <div className="supplies-section">
            <h2>Supply Bundles</h2>
            <form onSubmit={handleCreateBundle} className="bundle-form">
              <h3>Create New Bundle</h3>
              <div className="form-group">
                <label>Bundle Name:</label>
                <input
                  type="text"
                  value={newBundle.name}
                  onChange={(e) => setNewBundle(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newBundle.description}
                  onChange={(e) => setNewBundle(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="create-bundle-button">
                Create Bundle
              </button>
            </form>

            <div className="bundles-list">
              {supplyBundles.map(bundle => (
                <div key={bundle.id} className="bundle-card">
                  <h3>{bundle.name}</h3>
                  <p>{bundle.description}</p>
                  <div className="bundle-actions">
                    <select
                      onChange={(e) => handleDistributeBundle(bundle.id, e.target.value)}
                      className="volunteer-select"
                    >
                      <option value="">Assign to Volunteer</option>
                      {volunteers.map(vol => (
                        <option key={vol.id} value={vol.id}>
                          {vol.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="donations-section">
            <h2>Donations</h2>
            <div className="donations-list">
              {donations.map(donation => (
                <div key={donation.id} className="donation-card">
                  <div className="donation-header">
                    <div className="donor-info">
                      <h3>{donation.donor_name}</h3>
                      <p className="donor-email">{donation.donor_email}</p>
                    </div>
                    <div className="donation-amount">${donation.amount.toFixed(2)}</div>
                  </div>
                  <div className="donation-date">
                    Date: {new Date(donation.date).toLocaleDateString()}
                  </div>
                  <div className="donation-details">
                    <h4>Distribution Details:</h4>
                    <ul>
                      {donation.distribution_details.map((detail, index) => (
                        <li key={index} className="distribution-item">
                          <span className="purpose">{detail.purpose}</span>
                          <span className="amount">${detail.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboard; 