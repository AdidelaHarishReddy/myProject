import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/actions';

const Profile = ({ token }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch user details
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/auth/user/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => {
        setUser(res.data);
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
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
    if (photo) formData.append('profile_pic', photo);
    if (firstName) formData.append('first_name', firstName);
    if (lastName) formData.append('last_name', lastName);
    
    axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/user/`, formData, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
      .then(res => {
        setUser(res.data);
        // Update Redux store so other components can see the changes
        dispatch(updateUser(res.data));
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

  // Create display name from first and last name
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Profile</h2>
      <div style={{ textAlign: 'center' }}>
        <img
          src={preview || user.profile_pic || 'https://via.placeholder.com/120'}
          alt="Profile"
          style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }}
        />
        <div style={{ margin: '10px 0' }}>
          <strong>Name:</strong>{' '}
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: '70%' }}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: '70%' }}
              />
            </div>
          ) : (
            <span>{displayName}</span>
          )}
        </div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Phone:</strong> {user.phone}</div>
        <div><strong>User Type:</strong> {user.user_type}</div>
        {/* Add more fields as needed */}
        <br />
        {editing ? (
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => { setEditing(false); setPhoto(null); setPreview(null); setFirstName(user.first_name || ''); setLastName(user.last_name || ''); }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}

      </div>
    </div>
  );
};

export default Profile;
