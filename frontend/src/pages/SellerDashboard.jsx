import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Button, Box, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, 
  Select, MenuItem, Slider 
} from '@mui/material';
import PropertyCard from '../components/PropertyCard';
import propertyAPI from '../api/properties';
import locationAPI from '../api/locations';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [locationData, setLocationData] = useState({
    states: [],
    districts: [],
    subDistricts: [],
    villages: [],
    pinCodes: []
  });
  const [newProperty, setNewProperty] = useState({
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
    longitude: '',
    images: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
    fetchLocationData();
  }, []);

  const fetchProperties = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    propertyAPI.getProperties({}, token)
      .then(response => {
        setProperties(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching properties:', error);
        setLoading(false);
      });
  };

  const fetchLocationData = () => {
    locationAPI.getStates().then(data => {
      setLocationData(prev => ({ ...prev, states: data.states }));
    });
  };

  const handleStateChange = (state) => {
    setNewProperty({
      ...newProperty,
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
    setNewProperty({
      ...newProperty,
      district,
      sub_district: '',
      village: '',
      pin_code: ''
    });
    
    locationAPI.getSubDistricts(newProperty.state, district).then(data => {
      setLocationData(prev => ({
        ...prev,
        subDistricts: data.sub_districts,
        villages: [],
        pinCodes: []
      }));
    });
  };

  const handleSubDistrictChange = (subDistrict) => {
    setNewProperty({
      ...newProperty,
      sub_district: subDistrict,
      village: '',
      pin_code: ''
    });
    
    locationAPI.getVillages(newProperty.state, newProperty.district, subDistrict).then(data => {
      setLocationData(prev => ({
        ...prev,
        villages: data.villages,
        pinCodes: []
      }));
    });
  };

  const handleVillageChange = (village) => {
    setNewProperty({
      ...newProperty,
      village,
      pin_code: ''
    });
    locationAPI.getPinCodes(
      newProperty.state, 
      newProperty.district, 
      newProperty.sub_district, 
      village
    ).then(data => {
      setLocationData(prev => ({
        ...prev,
        pinCodes: data.pin_codes
      }));
    });
  };

  const getCoordinatesFromLocation = async () => {
    if (!newProperty.state || !newProperty.district || !newProperty.sub_district || !newProperty.village) {
      alert('Please select location fields first');
      return;
    }

    const locationString = `${newProperty.village}, ${newProperty.sub_district}, ${newProperty.district}, ${newProperty.state}, India`;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setNewProperty(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6)
        }));
        alert(`Coordinates found: ${lat}, ${lon}`);
      } else {
        alert('Could not find coordinates for this location. Please enter manually.');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      alert('Error getting coordinates. Please enter manually.');
    }
  };

  const handleImageChange = (e) => {
    setSelectedImages([...e.target.files]);
  };

  const handleSubmit = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Basic validation
    if (!newProperty.title.trim()) {
      alert('Please enter a property title');
      return;
    }
    if (!newProperty.description.trim()) {
      alert('Please enter a property description');
      return;
    }
    if (!newProperty.address.trim()) {
      alert('Please enter a property address');
      return;
    }
    if (!newProperty.state || !newProperty.district || !newProperty.sub_district || !newProperty.village || !newProperty.pin_code) {
      alert('Please select all location fields');
      return;
    }
    if (newProperty.price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (newProperty.area <= 0) {
      alert('Please enter a valid area');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('property_type', newProperty.property_type);
    formData.append('title', newProperty.title);
    formData.append('description', newProperty.description);
    formData.append('address', newProperty.address);
    formData.append('state', newProperty.state);
    formData.append('district', newProperty.district);
    formData.append('sub_district', newProperty.sub_district);
    formData.append('village', newProperty.village);
    formData.append('pin_code', newProperty.pin_code);
    formData.append('price', newProperty.price);
    formData.append('area', newProperty.area);
    if (newProperty.youtube_link) {
      formData.append('youtube_link', newProperty.youtube_link);
    }
    if (newProperty.latitude) {
      formData.append('latitude', newProperty.latitude);
    }
    if (newProperty.longitude) {
      formData.append('longitude', newProperty.longitude);
    }
    
    selectedImages.forEach((image, index) => {
      formData.append('images', image);
    });

    propertyAPI.createProperty(formData, token)
      .then(response => {
        setProperties([response.data, ...properties]);
        setOpenDialog(false);
        setNewProperty({
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
          longitude: '',
          images: []
        });
        setSelectedImages([]);
        setIsSubmitting(false);
        alert('Property created successfully!');
      })
      .catch(error => {
        console.error('Error creating property:', error);
        setIsSubmitting(false);
        if (error.response && error.response.data) {
          alert(`Error: ${JSON.stringify(error.response.data)}`);
        } else {
          alert('Error creating property. Please try again.');
        }
      });
  };

  const getAreaConfig = () => {
    switch(newProperty.property_type) {
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#4267B2' }}>
          Your Properties
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
          sx={{ 
            backgroundColor: '#4267B2',
            '&:hover': { backgroundColor: '#365899' }
          }}
        >
          Add New Property
        </Button>
      </Box>
      
      {loading ? (
        <CircularProgress />
      ) : properties.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          You haven't listed any properties yet
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {properties.map(property => (
            <Grid item key={property.id} xs={12} sm={6} md={4} lg={3}>
              <PropertyCard 
                property={property} 
                showShortlistCount={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Property</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={newProperty.property_type}
                  onChange={(e) => setNewProperty({
                    ...newProperty,
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
                {newProperty.property_type === 'AGRICULTURE' && 'Agriculture land typically ranges from 0.1 to 100 acres'}
                {newProperty.property_type === 'OPEN_PLOT' && 'Open plots typically range from 10 to 2000 sq yards'}
                {newProperty.property_type === 'FLAT' && 'Flats typically range from 100 to 10000 sq feet'}
                {newProperty.property_type === 'HOUSE' && 'Independent houses typically range from 10 to 2000 sq yards'}
                {newProperty.property_type === 'BUILDING' && 'Buildings typically range from 50 to 1000 sq yards'}
                {newProperty.property_type === 'COMMERCIAL' && 'Commercial spaces typically range from 100 to 10000 sq feet'}
              </Typography>
              
              <TextField
                label="Title"
                fullWidth
                margin="normal"
                value={newProperty.title}
                onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
              />
              
              <TextField
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={newProperty.description}
                onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
              />
              
              <TextField
                label="Address"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={newProperty.address}
                onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
              />
              
              <TextField
                label="YouTube Link (optional)"
                fullWidth
                margin="normal"
                value={newProperty.youtube_link}
                onChange={(e) => setNewProperty({ ...newProperty, youtube_link: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>State</InputLabel>
                <Select
                  value={newProperty.state}
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
                  value={newProperty.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  label="District"
                  disabled={!newProperty.state}
                >
                  {locationData.districts.map(district => (
                    <MenuItem key={district} value={district}>{district}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Taluka/Mandal</InputLabel>
                <Select
                  value={newProperty.sub_district}
                  onChange={(e) => handleSubDistrictChange(e.target.value)}
                  label="Taluka/Mandal"
                  disabled={!newProperty.district}
                >
                  {locationData.subDistricts.map(subDist => (
                    <MenuItem key={subDist} value={subDist}>{subDist}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Village/Area</InputLabel>
                <Select
                  value={newProperty.village}
                  onChange={(e) => handleVillageChange(e.target.value)}
                  label="Village/Area"
                  disabled={!newProperty.sub_district}
                >
                  {locationData.villages.map(village => (
                    <MenuItem key={village} value={village}>{village}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>PIN Code</InputLabel>
                <Select
                  value={newProperty.pin_code}
                  onChange={(e) => setNewProperty({ ...newProperty, pin_code: e.target.value })}
                  label="PIN Code"
                  disabled={!newProperty.village && !newProperty.sub_district}
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
                value={newProperty.area}
                onChange={(e, value) => setNewProperty({ ...newProperty, area: value })}
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
                value={newProperty.price}
                onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
              />
              
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Location Coordinates (optional)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={getCoordinatesFromLocation}
                  sx={{ mb: 2 }}
                  disabled={!newProperty.state || !newProperty.district || !newProperty.sub_district || !newProperty.village}
                >
                  Get Coordinates from Location
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Latitude"
                    fullWidth
                    margin="normal"
                    type="number"
                    step="any"
                    placeholder="e.g., 19.0760"
                    value={newProperty.latitude}
                    onChange={(e) => setNewProperty({ ...newProperty, latitude: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Longitude"
                    fullWidth
                    margin="normal"
                    type="number"
                    step="any"
                    placeholder="e.g., 72.8777"
                    value={newProperty.longitude}
                    onChange={(e) => setNewProperty({ ...newProperty, longitude: e.target.value })}
                  />
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {selectedImages.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedImages.length} image(s) selected
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              backgroundColor: '#4267B2',
              '&:hover': { backgroundColor: '#365899' }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerDashboard;
