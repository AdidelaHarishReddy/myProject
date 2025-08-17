import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ token }) => {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Fetch user details
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/auth/user/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  }, [token]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = () => {
    if (!photo) return;
    const formData = new FormData();
    formData.append('photo', photo);
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
      })
      .catch(err => console.error(err));
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Profile</h2>
      <div style={{ textAlign: 'center' }}>
        <img
          src={preview || user.photo || 'https://via.placeholder.com/120'}
          alt="Profile"
          style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }}
        />
        <div><strong>Name:</strong> {user.name || user.username}</div>
        <div><strong>Email:</strong> {user.email}</div>
        {/* Add more fields as needed */}
        <br />
        {editing ? (
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <button onClick={handlePhotoUpload}>Save Photo</button>
            <button onClick={() => { setEditing(false); setPhoto(null); setPreview(null); }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Photo</button>
        )}
      </div>
    </div>
  );
};

export default Profile;
