import React, { useState } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import './RequestHelp.css';

function RequestHelp() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    location: '',
    description: '',
    urgency: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await project_backend.createHelpRequest({
        name: formData.name,
        contact: formData.contact,
        location: formData.location,
        description: formData.description,
        urgency: formData.urgency,
        status: 'pending',
        timestamp: Date.now().toString()
      });
      alert('Help request submitted successfully!');
      setFormData({
        name: '',
        contact: '',
        location: '',
        description: '',
        urgency: 'medium'
      });
    } catch (error) {
      console.error('Error submitting help request:', error);
      alert('Failed to submit help request. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="request-help">
      <h1>Request Help</h1>
      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact">Contact Information:</label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description of Need:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="urgency">Urgency Level:</label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button type="submit" className="submit-button">Submit Request</button>
      </form>
    </div>
  );
}

export default RequestHelp; 