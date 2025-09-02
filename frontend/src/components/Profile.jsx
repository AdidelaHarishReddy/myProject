import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/actions';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Avatar, 
  Button, 
  TextField,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Edit, 
  LocationOn, 
  AttachMoney, 
  SquareFoot, 
  CalendarToday,
  Person,
  Email,
  Phone,
  Business,
  Favorite,
  Visibility
} from '@mui/icons-material';
import PropertyCard from './PropertyCard';
import propertyAPI from '../api/properties';

const Profile = ({ token }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [myProperties, setMyProperties] = useState([]);
  const [shortlistedProperties, setShortlistedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

    // Fetch user's properties and shortlisted properties
    fetchUserProperties();
  }, [token]);

  const fetchUserProperties = async () => {
    setLoadingProperties(true);
    try {
      // Fetch user's own properties
      const myPropsResponse = await propertyAPI.getMyProperties(token);
      setMyProperties(myPropsResponse.data || []);

      // Fetch shortlisted properties
      const shortlistedResponse = await propertyAPI.getShortlistedProperties(token);
      setShortlistedProperties(shortlistedResponse.data || []);
    } catch (error) {
      console.error('Error fetching user properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

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

  const handleEditProperty = (propertyId) => {
    // Navigate to edit property page
    window.location.href = `/edit-property/${propertyId}`;
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyAPI.deleteProperty(propertyId, token);
        fetchUserProperties(); // Refresh the list
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property');
      }
    }
  };

  const handleShortlist = async (propertyId) => {
    try {
      await propertyAPI.shortlistProperty(propertyId, token);
      fetchUserProperties(); // Refresh to update shortlist status
    } catch (error) {
      console.error('Error shortlisting property:', error);
    }
  };

  const handleRemoveShortlist = async (propertyId) => {
    try {
      await propertyAPI.removeShortlist(propertyId, token);
      fetchUserProperties(); // Refresh to update shortlist status
    } catch (error) {
      console.error('Error removing from shortlist:', error);
    }
  };

  const isShortlisted = (propertyId) => {
    return shortlistedProperties.some(prop => prop.id === propertyId);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#2c3e50' }}>
        Profile Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Section 1: Profile Details (25%) */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                src={preview || user.profile_pic || 'https://via.placeholder.com/120'}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                {displayName}
              </Typography>
              <Chip 
                label={user.user_type || 'User'} 
                color="primary" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ mr: 1, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  {user.phone || 'Not provided'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 1, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(user.date_joined).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setEditDialogOpen(true)}
              fullWidth
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* Section 2: Land Details & Properties (50%) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              My Properties ({myProperties.length})
            </Typography>
            
            {loadingProperties ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading properties...</Typography>
              </Box>
            ) : myProperties.length > 0 ? (
              <Grid container spacing={2}>
                {myProperties.map(property => (
                  <Grid item xs={12} sm={6} key={property.id}>
                    <PropertyCard
                      property={property}
                      onEdit={() => handleEditProperty(property.id)}
                      onDelete={() => handleDeleteProperty(property.id)}
                      showShortlistCount={true}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Business sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No properties listed yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start by creating your first property listing
                </Typography>
                <Button variant="contained" href="/seller-dashboard">
                  Add Property
                </Button>
              </Box>
            )}
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Shortlisted Properties ({shortlistedProperties.length})
            </Typography>
            
            {loadingProperties ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading shortlisted properties...</Typography>
              </Box>
            ) : shortlistedProperties.length > 0 ? (
              <Grid container spacing={2}>
                {shortlistedProperties.map(property => (
                  <Grid item xs={12} sm={6} key={property.id}>
                    <PropertyCard
                      property={property}
                      onShortlist={handleShortlist}
                      onRemoveShortlist={handleRemoveShortlist}
                      isShortlisted={isShortlisted(property.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Favorite sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No shortlisted properties
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Browse properties and add them to your shortlist
                </Typography>
                <Button variant="contained" href="/buyer-dashboard">
                  Browse Properties
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Section 3: Ads (25%) */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Featured Properties
            </Typography>
            
            {/* Sample ads - you can replace with real ads */}
            <Box sx={{ mb: 3 }}>
              <Card sx={{ mb: 2 }}>
                <CardMedia
                  component="img"
                  height="120"
                  image="https://via.placeholder.com/300x120/4267B2/ffffff?text=Premium+Land"
                  alt="Premium Land Ad"
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Premium Agricultural Land
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Best deals on agricultural properties
                  </Typography>
                  <Button size="small" variant="outlined" fullWidth>
                    View Details
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardMedia
                  component="img"
                  height="120"
                  image="https://via.placeholder.com/300x120/2ECC71/ffffff?text=Commercial+Space"
                  alt="Commercial Space Ad"
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Commercial Properties
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Invest in commercial real estate
                  </Typography>
                  <Button size="small" variant="outlined" fullWidth>
                    Learn More
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardMedia
                  component="img"
                  height="120"
                  image="https://via.placeholder.com/300x120/E74C3C/ffffff?text=Property+Services"
                  alt="Property Services Ad"
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Property Services
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Legal, valuation & documentation
                  </Typography>
                  <Button size="small" variant="outlined" fullWidth>
                    Get Quote
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                src={preview || user.profile_pic || 'https://via.placeholder.com/120'}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="outlined" component="span" size="small">
                  Change Photo
                </Button>
              </label>
            </Box>

            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={user.email}
              disabled
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={user.phone || ''}
              disabled
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
