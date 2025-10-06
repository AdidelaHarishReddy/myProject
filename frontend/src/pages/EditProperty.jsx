import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Button, Box, TextField, FormControl, InputLabel, 
  Select, MenuItem, Slider, Paper, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import propertyAPI from '../api/properties';
import locationAPI from '../api/locations';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [property, setProperty] = useState({
    property_type: 'AGRICULTURE',
    title: '',
    description: '',
    address: '',
    state: '',
    district: '',
    sub_district: '',
    village: '',
    pin_code: '',
    price: 0,
    area: 0,
    youtube_link: '',
    latitude: '',
    longitude: ''
  });
  
  const [locationData, setLocationData] = useState({
    states: [],
    districts: [],
    subDistricts: [],
    villages: [],
    pinCodes: []
  });

  useEffect(() => {
    fetchProperty();
    fetchLocationData();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await propertyAPI.getMyPropertyDetail(id, token);
      const propertyData = response.data.property;
      
      setProperty({
        property_type: propertyData.property_type || 'AGRICULTURE',
        title: propertyData.title || '',
        description: propertyData.description || '',
        address: propertyData.address || '',
        state: propertyData.location?.state || '',
        district: propertyData.location?.district || '',
        sub_district: propertyData.location?.sub_district || '',
        village: propertyData.location?.village || '',
        pin_code: propertyData.location?.pin_code || '',
        price: propertyData.price || 0,
        area: propertyData.area || 0,
        youtube_link: propertyData.youtube_link || '',
        latitude: propertyData.latitude || '',
        longitude: propertyData.longitude || ''
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Failed to load property details');
      setLoading(false);
    }
  };

  const fetchLocationData = () => {
    locationAPI.getStates().then(data => {
      setLocationData(prev => ({ ...prev, states: data.states }));
    });
  };

  const handleStateChange = (state) => {
    setProperty({
      ...property,
      state,
      district: '',
      sub_district: '',
      village: '',
      pin_code: ''
    });
    
    locationAPI.getDistricts(state).then(data => {
      setLocationData(prev => ({
        ...prev,
        districts: data.districts,
        subDistricts: [],
        villages: [],
        pinCodes: []
      }));
    });
  };

  const handleDistrictChange = (district) => {
    setProperty({
      ...property,
      district,
      sub_district: '',
      village: '',
      pin_code: ''
    });
    
    locationAPI.getSubDistricts(property.state, district).then(data => {
      setLocationData(prev => ({
        ...prev,
        subDistricts: data.sub_districts,
        villages: [],
        pinCodes: []
      }));
    });
  };

  const handleSubDistrictChange = (subDistrict) => {
    setProperty({
      ...property,
      sub_district: subDistrict,
      village: '',
      pin_code: ''
    });
    
    locationAPI.getVillages(property.state, property.district, subDistrict).then(data => {
      setLocationData(prev => ({
        ...prev,
        villages: data.villages,
        pinCodes: []
      }));
    });
  };

  const handleVillageChange = (village) => {
    setProperty({
      ...property,
      village,
      pin_code: ''
    });
    
    locationAPI.getPinCodes(
      property.state, 
      property.district, 
      property.sub_district, 
      village
    ).then(data => {
      setLocationData(prev => ({
        ...prev,
        pinCodes: data.pin_codes
      }));
    });
  };

  const getAreaConfig = () => {
    switch(property.property_type) {
      case 'AGRICULTURE': return { min: 0, max: 100, step: 1, unit: 'acres' };
      case 'OPEN_PLOT': return { min: 10, max: 2000, step: 10, unit: 'sq yds' };
      case 'FLAT': return { min: 100, max: 10000, step: 50, unit: 'sq ft' };
      case 'HOUSE': return { min: 10, max: 2000, step: 10, unit: 'sq yds' };
      case 'BUILDING': return { min: 50, max: 1000, step: 10, unit: 'sq yds' };
      case 'COMMERCIAL': return { min: 100, max: 10000, step: 50, unit: 'sq ft' };
      default: return { min: 0, max: 100, step: 1, unit: '' };
    }
  };

  const areaConfig = getAreaConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!property.title.trim()) {
      setError('Please enter a property title');
      return;
    }
    if (!property.description.trim()) {
      setError('Please enter a property description');
      return;
    }
    if (!property.address.trim()) {
      setError('Please enter a property address');
      return;
    }
    if (!property.state || !property.district || !property.sub_district || !property.village || !property.pin_code) {
      setError('Please select all location fields');
      return;
    }
    if (property.price <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (property.area <= 0) {
      setError('Please enter a valid area');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('property_type', property.property_type);
      formData.append('title', property.title);
      formData.append('description', property.description);
      formData.append('address', property.address);
      formData.append('state', property.state);
      formData.append('district', property.district);
      formData.append('sub_district', property.sub_district);
      formData.append('village', property.village);
      formData.append('pin_code', property.pin_code);
      formData.append('price', property.price);
      formData.append('area', property.area);
      if (property.youtube_link) {
        formData.append('youtube_link', property.youtube_link);
      }
      if (property.latitude) {
        formData.append('latitude', property.latitude);
      }
      if (property.longitude) {
        formData.append('longitude', property.longitude);
      }

      // Use the update endpoint
      await propertyAPI.updateProperty(id, formData, token);
      
      setSuccess('Property updated successfully!');
      setTimeout(() => {
        navigate('/seller');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating property:', error);
      setError('Failed to update property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={60} sx={{ color: '#4267B2' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#4267B2', mb: 3 }}>
          Edit Property
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={property.property_type}
                  onChange={(e) => setProperty({
                    ...property,
                    property_type: e.target.value,
                    area: 0
                  })}
                  label="Property Type"
                >
                  <MenuItem value="AGRICULTURE">Agriculture Land</MenuItem>
                  <MenuItem value="OPEN_PLOT">Open Plot</MenuItem>
                  <MenuItem value="FLAT">Flat</MenuItem>
                  <MenuItem value="HOUSE">Independent House</MenuItem>
                  <MenuItem value="BUILDING">Building</MenuItem>
                  <MenuItem value="COMMERCIAL">Commercial Space</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {property.property_type === 'AGRICULTURE' && 'Agriculture land typically ranges from 0.1 to 100 acres'}
                {property.property_type === 'OPEN_PLOT' && 'Open plots typically range from 10 to 2000 sq yards'}
                {property.property_type === 'FLAT' && 'Flats typically range from 100 to 10000 sq feet'}
                {property.property_type === 'HOUSE' && 'Independent houses typically range from 10 to 2000 sq yards'}
                {property.property_type === 'BUILDING' && 'Buildings typically range from 50 to 1000 sq yards'}
                {property.property_type === 'COMMERCIAL' && 'Commercial spaces typically range from 100 to 10000 sq feet'}
              </Typography>
              
              <TextField
                label="Title"
                fullWidth
                margin="normal"
                value={property.title}
                onChange={(e) => setProperty({ ...property, title: e.target.value })}
              />
              
              <TextField
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={property.description}
                onChange={(e) => setProperty({ ...property, description: e.target.value })}
              />
              
              <TextField
                label="Address"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={property.address}
                onChange={(e) => setProperty({ ...property, address: e.target.value })}
              />
              
              <TextField
                label="YouTube Link (optional)"
                fullWidth
                margin="normal"
                value={property.youtube_link}
                onChange={(e) => setProperty({ ...property, youtube_link: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>State</InputLabel>
                <Select
                  value={property.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  label="State"
                >
                  {locationData.states.map(state => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>District</InputLabel>
                <Select
                  value={property.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  label="District"
                  disabled={!property.state}
                >
                  {locationData.districts.map(district => (
                    <MenuItem key={district} value={district}>{district}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Taluka/Mandal</InputLabel>
                <Select
                  value={property.sub_district}
                  onChange={(e) => handleSubDistrictChange(e.target.value)}
                  label=Taluka/Mandal/sub-dist
                  disabled={!property.district}
                >
                  {locationData.subDistricts.map(subDist => (
                    <MenuItem key={subDist} value={subDist}>{subDist}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Village/Area</InputLabel>
                <Select
                  value={property.village}
                  onChange={(e) => handleVillageChange(e.target.value)}
                  label="Village/Area"
                  disabled={!property.sub_district}
                >
                  {locationData.villages.map(village => (
                    <MenuItem key={village} value={village}>{village}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>PIN Code</InputLabel>
                <Select
                  value={property.pin_code}
                  onChange={(e) => setProperty({ ...property, pin_code: e.target.value })}
                  label="PIN Code"
                  disabled={!property.village}
                >
                  {locationData.pinCodes.map(pinCode => (
                    <MenuItem key={pinCode} value={pinCode}>{pinCode}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography gutterBottom sx={{ mt: 2 }}>
                Area ({areaConfig.unit})
              </Typography>
              <Slider
                value={property.area}
                onChange={(e, value) => setProperty({ ...property, area: value })}
                valueLabelDisplay="auto"
                min={areaConfig.min}
                max={areaConfig.max}
                step={areaConfig.step}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Range: {areaConfig.min} - {areaConfig.max} {areaConfig.unit}
              </Typography>
              
              <TextField
                label="Price (₹)"
                fullWidth
                margin="normal"
                type="number"
                value={property.price}
                onChange={(e) => setProperty({ ...property, price: e.target.value })}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ 
                backgroundColor: '#4267B2',
                '&:hover': { backgroundColor: '#365899' },
                px: 4,
                py: 1.5
              }}
            >
              {saving ? 'Updating...' : 'Update Property'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/seller')}
              sx={{ px: 4, py: 1.5 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProperty;
