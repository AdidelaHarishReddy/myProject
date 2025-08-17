import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ token }) => {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch user details
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/auth/user/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => {
        setUser(res.data);
        setName(res.data.full_name || res.data.first_name || res.data.name || '');
      })
      .catch(err => console.error(err));
  }, [token]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    setSaving(true);
    const formData = new FormData();
    if (photo) formData.append('photo', photo);
    if (name) formData.append('full_name', name); // Adjust field name as per backend
    axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/user/`, formData, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
      .then(res => {
        setUser(res.data);
        setEditing(false);
        setPhoto(null);
        setPreview(null);
        setSaving(false);
      })
      .catch(err => {
        setSaving(false);
        alert('Failed to update profile.');
      });
  };

  if (!user) return <div>Loading...</div>;

  // Prefer full_name, first_name, name, then username
  const displayName = user.full_name || user.first_name || user.name || user.username || '';

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Profile</h2>
      <div style={{ textAlign: 'center' }}>
        <img
          src={preview || user.photo || 'https://via.placeholder.com/120'}
          alt="Profile"
          style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }}
        />
        <div style={{ margin: '10px 0' }}>
          <strong>Name:</strong>{' '}
          {editing ? (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: '70%' }}
            />
          ) : (
            <span>{displayName}</span>
          )}
        </div>
        <div><strong>Email:</strong> {user.email}</div>
        {/* Add more fields as needed */}
        <br />
        {editing ? (
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => { setEditing(false); setPhoto(null); setPreview(null); setName(displayName); }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
        <div style={{ marginTop: 10, color: '#888', fontSize: 12 }}>
          {/* Note for backend integration */}
          <em>Note: If photo or name changes do not save, ensure your backend supports PATCH /api/auth/user/ with 'photo' and 'full_name' fields.</em>
        </div>
      </div>
    </div>
  );
};

export default Profile;
