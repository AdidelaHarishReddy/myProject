import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Button, Box, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, 
  Select, MenuItem, Slider, Paper 
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import PropertyCard from '../components/PropertyCard';
import propertyAPI from '../api/properties';
import locationAPI from '../api/locations';
import { useNavigate } from 'react-router-dom';
import Profile from '../components/Profile';

const SellerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
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
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add filter state
  const [filters, setFilters] = useState({
    property_type: '',
    priceRange: [0, 10000000],
    areaRange: [0, 1000],
    sortBy: 'newest'
  });
  
  const [isFiltering, setIsFiltering] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
    fetchLocationData();
  }, []);

  // Refetch properties when filters change
  useEffect(() => {
    // Only refetch if we have properties already loaded (not on initial load)
    if (properties.length > 0) {
      fetchProperties();
    }
  }, [filters]);

  const fetchProperties = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if any filters are applied
    const hasFilters = filters.property_type || 
                      filters.priceRange[0] > 0 || 
                      filters.priceRange[1] < 10000000 ||
                      filters.areaRange[0] > 0 || 
                      filters.areaRange[1] < 10000 ||
                      filters.sortBy !== 'newest';
    
    // Set appropriate loading state
    if (hasFilters) {
      setIsFiltering(true);
    } else {
      setLoading(true);
    }
    
    // Use filtered API if filters are applied, otherwise use simple API
    const apiCall = hasFilters ? 
      propertyAPI.getMyPropertiesFiltered(filters, token) : 
      propertyAPI.getMyProperties(token);
    
    apiCall
      .then(response => {
        console.log('My Properties response:', response.data);
        
        // Extract properties from the response
        let propertiesData;
        if (hasFilters) {
          // For filtered results, the response structure might be different
          propertiesData = response.data.results || response.data || [];
        } else {
          propertiesData = response.data.properties || [];
        }
        
        // Ensure each property has the required structure
        const formattedProperties = propertiesData.map(property => {
          console.log('SellerDashboard - Processing property:', property.id, 'Images:', property.images);
          return {
            ...property,
            // Ensure images array exists
            images: property.images || [],
            // Ensure location object exists
            location: property.location || {
              state: 'Unknown',
              district: 'Unknown',
              sub_district: 'Unknown',
              village: 'Unknown',
              pin_code: 'Unknown'
            },
            // Ensure other required fields exist
            title: property.title || 'Untitled Property',
            price: property.price || 0,
            area: property.area || 0,
            area_display: property.area_display || 'Area not specified',
            property_type: property.property_type || 'UNKNOWN'
          };
        });
        
        setProperties(formattedProperties);
        setLoading(false);
        setIsFiltering(false);
      })
      .catch(error => {
        console.error('Error fetching my properties:', error);
        setLoading(false);
        setIsFiltering(false);
        // Set empty array to prevent errors
        setProperties([]);
      });
  };

  const handleDeleteProperty = (propertyId) => {
    if (window.confirm('⚠️ Are you sure you want to delete this property? This action cannot be undone.')) {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Call the delete API
      propertyAPI.deleteProperty(propertyId, token)
        .then(response => {
          console.log('Property deleted successfully:', response.data);
          // Remove from local state
          setProperties(properties.filter(p => p.id !== propertyId));
          alert('✅ Property deleted successfully!');
        })
        .catch(error => {
          console.error('Error deleting property:', error);
          
          let errorMessage = '❌ Error deleting property. ';
          
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 403) {
              errorMessage += 'You do not have permission to delete this property.';
            } else if (status === 404) {
              errorMessage += 'Property not found. It may have been already deleted.';
            } else if (status === 401) {
              errorMessage += 'You are not authorized. Please login again.';
            } else if (status >= 500) {
              errorMessage += 'Server error. Please try again later.';
            } else {
              errorMessage += `Server error (${status}). Please try again.`;
              if (data && typeof data === 'object') {
                const errorDetails = Object.values(data).flat().join(', ');
                errorMessage += ` Details: ${errorDetails}`;
              }
            }
          } else if (error.request) {
            errorMessage += 'Network error. Please check your connection and try again.';
          } else {
            errorMessage += 'Unexpected error occurred. Please try again.';
          }
          
          alert(errorMessage);
        });
    }
  };

  const handleEditProperty = (propertyId) => {
    // Navigate to edit page or open edit dialog
    navigate(`/edit-property/${propertyId}`);
  };

  // Filter change handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchProperties();
  };

  const handleClearFilters = () => {
    setFilters({
      property_type: '',
      priceRange: [0, 10000000],
      areaRange: [0, 10000],
      sortBy: 'newest'
    });
    // Fetch properties without filters
    setTimeout(() => fetchProperties(), 100);
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
      alert('⚠️ Please select all location fields (State, District, Taluka/Mandal, Village) first');
      return;
    }

    const locationString = `${newProperty.village}, ${newProperty.sub_district}, ${newProperty.district}, ${newProperty.state}, India`;
    
    try {
      alert('🔍 Searching for coordinates... Please wait.');
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=3&countrycodes=in&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Try to find the best match
        let bestMatch = data[0];
        
        // Look for exact matches first
        for (const result of data) {
          const address = result.display_name.toLowerCase();
          if (address.includes(newProperty.village.toLowerCase()) && 
              address.includes(newProperty.district.toLowerCase()) &&
              address.includes(newProperty.state.toLowerCase())) {
            bestMatch = result;
            break;
          }
        }
        
        const { lat, lon } = bestMatch;
        setNewProperty(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6)
        }));
        alert(`✅ Coordinates found: ${lat}, ${lon}\nLocation: ${bestMatch.display_name}`);
      } else {
        alert('❌ Could not find coordinates for this location. Please try:\n• Check if the location name is correct\n• Use the "Select on Map" button\n• Enter coordinates manually');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      alert('❌ Error getting coordinates. This could be due to:\n• Network connection issues\n• Location service temporarily unavailable\n• Invalid location name\n\nPlease try the "Select on Map" button or enter coordinates manually.');
    }
  };

  const getCurrentLocation = () => {
    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by this browser. Please enter coordinates manually.');
      return;
    }

    if (!isSecure) {
      alert('⚠️ Location access requires HTTPS. Please use the "Get from Location" button or enter coordinates manually.');
      return;
    }

    // Show loading state with mobile-specific instructions
    let loadingMessage = '📍 Getting your current location... Please allow location access when prompted.';
    if (isMobile) {
      loadingMessage += '\n\n📱 On mobile: Make sure location services are enabled in your device settings.';
    }
    alert(loadingMessage);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewProperty(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
        alert(`✅ Current location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = '❌ Error getting current location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. Please:\n';
            if (isMobile) {
              errorMessage += '📱 Mobile users:\n';
              errorMessage += '1. Go to your device Settings > Privacy > Location Services\n';
              errorMessage += '2. Make sure Location Services is ON\n';
              errorMessage += '3. Check if your browser has location permission\n';
              errorMessage += '4. Try refreshing the page\n';
            } else {
              errorMessage += '💻 Desktop users:\n';
              errorMessage += '1. Click the location icon in your browser address bar\n';
              errorMessage += '2. Select "Allow" for location access\n';
              errorMessage += '3. Refresh the page and try again\n';
            }
            errorMessage += '\nOr use the "Get from Location" button instead.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. This could be due to:\n';
            errorMessage += '• GPS is turned off\n';
            errorMessage += '• Poor network connection\n';
            errorMessage += '• Location services disabled\n';
            if (isMobile) {
              errorMessage += '• Mobile: Check if location permission is granted to your browser\n';
            }
            errorMessage += '\nPlease try the "Get from Location" button or enter coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or use the "Get from Location" button.';
            break;
          default:
            errorMessage += 'Unknown error occurred. Please use the "Get from Location" button or enter coordinates manually.';
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: false, // Changed to false for better compatibility
        timeout: 30000, // Increased timeout to 30 seconds
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const openMapSelector = () => {
    // Use India center if no coordinates are set
    const lat = newProperty.latitude || 20.5937;
    const lon = newProperty.longitude || 78.9629;
    
    const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=10`;
    window.open(mapUrl, '_blank', 'width=1000,height=700');
    
    alert('🗺️ Map opened in new window.\n\nTo get coordinates:\n1. Navigate to your property location on the map\n2. Right-click on the exact location\n3. Select "What\'s here?" or copy the coordinates from the URL\n4. Enter the coordinates in the form below');
  };

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    }
  };

  const selectLocationFromSearch = (result) => {
    const { lat, lon, display_name } = result;
    setNewProperty(prev => ({
      ...prev,
      latitude: parseFloat(lat).toFixed(6),
      longitude: parseFloat(lon).toFixed(6)
    }));
    setLocationSearch(display_name);
    setSearchResults([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Limit to 10 images
    const limitedFiles = files.slice(0, 10);
    setSelectedImages(limitedFiles);
    
    if (files.length > 10) {
      alert(`⚠️ Maximum 10 images allowed. Only first 10 images will be uploaded.`);
    }
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
        console.log('Property creation response:', response.data);
        
        // Ensure the response data has the required structure
        const newPropertyData = {
          ...response.data,
          // Ensure images array exists
          images: response.data.images || [],
          // Ensure location object exists
          location: response.data.location || {
            state: newProperty.state,
            district: newProperty.district,
            sub_district: newProperty.sub_district,
            village: newProperty.village,
            pin_code: newProperty.pin_code
          },
          // Ensure other required fields exist
          title: response.data.title || newProperty.title,
          price: response.data.price || newProperty.price,
          area: response.data.area || newProperty.area,
          area_display: response.data.area_display || `${newProperty.area} ${getAreaConfig().unit}`,
          property_type: response.data.property_type || newProperty.property_type
        };
        
        // Add the new property to the list
        setProperties([newPropertyData, ...properties]);
        
        // Reset form and close dialog
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
        alert('✅ Property created successfully!');
        
        // Refresh the properties list to get the latest data from the server
        fetchProperties();
      })
      .catch(error => {
        console.error('Error creating property:', error);
        setIsSubmitting(false);
        
        let errorMessage = '❌ Error creating property. ';
        
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 400) {
            errorMessage += 'Please check your input data and try again.';
            if (data && typeof data === 'object') {
              const errorDetails = Object.values(data).flat().join(', ');
              errorMessage += ` Details: ${errorDetails}`;
            }
          } else if (status === 401) {
            errorMessage += 'You are not authorized. Please login again.';
          } else if (status === 413) {
            errorMessage += 'File too large. Please reduce image sizes.';
          } else if (status >= 500) {
            errorMessage += 'Server error. Please try again later.';
          } else {
            errorMessage += `Server error (${status}). Please try again.`;
          }
        } else if (error.request) {
          // Network error
          errorMessage += 'Network error. Please check your connection and try again.';
        } else {
          // Other error
          errorMessage += 'Unexpected error occurred. Please try again.';
        }
        
        alert(errorMessage);
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
      {/* Back to Dashboard Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ 
            borderColor: '#4267B2',
            color: '#4267B2',
            '&:hover': { 
              borderColor: '#365899',
              backgroundColor: 'rgba(66, 103, 178, 0.04)'
            }
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#4267B2' }}>
          Your Properties
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setOpenProfile(true)}
            sx={{ borderColor: '#4267B2', color: '#4267B2', '&:hover': { borderColor: '#365899', backgroundColor: 'rgba(66, 103, 178, 0.04)' } }}
          >
            Profile
          </Button>
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
      </Box>
      
      {/* Profile Dialog */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Profile</DialogTitle>
        <DialogContent>
          <Profile token={localStorage.getItem('token')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfile(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Main Content - Filters and Properties Side by Side */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        {/* Left Side - Filters (30% width on large screens, full width on mobile) */}
        <Box sx={{ 
          width: { xs: '100%', lg: '30%' }, 
          flexShrink: 0,
          order: { xs: 2, lg: 1 }
        }}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            position: { xs: 'static', lg: 'sticky' }, 
            top: 20 
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#4267B2', mb: 3, textAlign: 'center' }}>
              🔍 Filter Properties
            </Typography>
            
            {/* Property Type Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                Property Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.property_type}
                  onChange={(e) => handleFilterChange('property_type', e.target.value)}
                  displayEmpty
                  sx={{ 
                    '& .MuiSelect-select': { 
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  <MenuItem value="AGRICULTURE">🏞️ Agriculture Land</MenuItem>
                  <MenuItem value="OPEN_PLOT">📐 Open Plot</MenuItem>
                  <MenuItem value="FLAT">🏢 Flat</MenuItem>
                  <MenuItem value="HOUSE">🏠 Independent House</MenuItem>
                  <MenuItem value="BUILDING">🏗️ Building</MenuItem>
                  <MenuItem value="COMMERCIAL">🏪 Commercial Space</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Price Range Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                💰 Price Range
              </Typography>
              <Slider
                value={filters.priceRange}
                onChange={(event, newValue) => handleFilterChange('priceRange', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={10000000}
                step={100000}
                valueLabelFormat={(value) => `₹${(value / 100000).toFixed(1)}L`}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#4267B2',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#4267B2',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#e0e0e0',
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ₹{filters.priceRange[0].toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ₹{filters.priceRange[1].toLocaleString()}
                </Typography>
              </Box>
            </Box>
            
            {/* Area Range Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                📏 Area Range
              </Typography>
              <Slider
                value={filters.areaRange}
                onChange={(event, newValue) => handleFilterChange('areaRange', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#4267B2',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#4267B2',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#e0e0e0',
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {filters.areaRange[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {filters.areaRange[1]}
                </Typography>
              </Box>
            </Box>
            
            {/* Sort By Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                📊 Sort By
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      backgroundColor: '#f8f9fa',
                      borderRadius: 1
                    }
                  }}
                >
                  <MenuItem value="newest">🆕 Newest First</MenuItem>
                  <MenuItem value="oldest">📅 Oldest First</MenuItem>
                  <MenuItem value="price_low">💰 Price: Low to High</MenuItem>
                  <MenuItem value="price_high">💰 Price: High to Low</MenuItem>
                  <MenuItem value="area_low">📏 Area: Low to High</MenuItem>
                  <MenuItem value="area_high">📏 Area: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Filter Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
                sx={{ 
                  backgroundColor: '#4267B2',
                  '&:hover': { backgroundColor: '#365899' },
                  py: 1.5,
                  fontWeight: 'bold'
                }}
              >
                ✅ Apply Filters
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
                sx={{ 
                  borderColor: '#4267B2',
                  color: '#4267B2',
                  '&:hover': { 
                    borderColor: '#365899',
                    backgroundColor: 'rgba(66, 103, 178, 0.04)'
                  },
                  py: 1.5
                }}
              >
                🗑️ Clear Filters
              </Button>
            </Box>
            
            {/* Active Filters Summary */}
            {(filters.property_type || 
              filters.priceRange[0] > 0 || 
              filters.priceRange[1] < 10000000 ||
              filters.areaRange[0] > 0 || 
              filters.areaRange[1] < 10000 ||
              filters.sortBy !== 'newest') && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                  🎯 Active Filters:
                </Typography>
                <Box sx={{ fontSize: '0.875rem', color: '#1976d2' }}>
                  {filters.property_type && <div>• Type: {filters.property_type}</div>}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) && (
                    <div>• Price: ₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()}</div>
                  )}
                  {(filters.areaRange[0] > 0 || filters.areaRange[1] < 10000) && (
                    <div>• Area: {filters.areaRange[0]} - {filters.areaRange[1]}</div>
                  )}
                  {filters.sortBy !== 'newest' && <div>• Sort: {filters.sortBy.replace('_', ' ')}</div>}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
        
        {/* Right Side - Properties Display (70% width on large screens, full width on mobile) */}
        <Box sx={{ 
          width: { xs: '100%', lg: '70%' }, 
          flexGrow: 1,
          order: { xs: 1, lg: 2 }
        }}>
          {/* Properties Count and Status */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#4267B2', fontWeight: 'bold' }}>
                Properties ({properties.length})
              </Typography>
              {(filters.property_type || 
                filters.priceRange[0] > 0 || 
                filters.priceRange[1] < 10000000 ||
                filters.areaRange[0] > 0 || 
                filters.areaRange[1] < 10000 ||
                filters.sortBy !== 'newest') && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Showing filtered results
                </Typography>
              )}
            </Box>
            
            {/* Quick Stats */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" sx={{ color: '#4267B2', fontWeight: 'bold' }}>
                  {properties.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Total
                </Typography>
              </Paper>
              {properties.length > 0 && (
                <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {properties.filter(p => p.images && p.images.length > 0).length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    With Images
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
          
          {/* Loading States */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ color: '#4267B2', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#4267B2' }}>
                  Loading your properties...
                </Typography>
              </Box>
            </Box>
          ) : isFiltering ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ color: '#4267B2', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#4267B2' }}>
                  Applying filters...
                </Typography>
              </Box>
            </Box>
          ) : properties.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h5" sx={{ color: '#666', mb: 2 }}>
                {filters.property_type || filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 || filters.areaRange[0] > 0 || filters.areaRange[1] < 10000 || filters.sortBy !== 'newest' 
                  ? '🔍 No properties match your filters' 
                  : '📝 You haven\'t listed any properties yet'
                }
              </Typography>
              <Typography variant="body1" sx={{ color: '#888', mb: 3 }}>
                {filters.property_type || filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 || filters.areaRange[0] > 0 || filters.areaRange[1] < 10000 || filters.sortBy !== 'newest' 
                  ? 'Try adjusting your search criteria or clear filters to see all properties.' 
                  : 'Start by adding your first property using the "Add New Property" button above.'
                }
              </Typography>
              {(filters.property_type || filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 || filters.areaRange[0] > 0 || filters.areaRange[1] < 10000 || filters.sortBy !== 'newest') && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ 
                    borderColor: '#4267B2',
                    color: '#4267B2',
                    '&:hover': { 
                      borderColor: '#365899',
                      backgroundColor: 'rgba(66, 103, 178, 0.04)'
                    }
                  }}
                >
                  🗑️ Clear All Filters
                </Button>
              )}
            </Box>
          ) : (
            /* Properties Grid */
            <Grid container spacing={3}>
              {properties.map(property => (
                <Grid item key={property.id} xs={12} sm={6} lg={4}>
                  <PropertyCard 
                    property={property} 
                    showShortlistCount={true}
                    onEdit={() => handleEditProperty(property.id)}
                    onDelete={() => handleDeleteProperty(property.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
      
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
                  <MenuItem value="AGRICULTURE">
                    <Box>
                      <Typography variant="body1">🌾 Agriculture Land</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Farmland, agricultural plots, cultivation land
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="OPEN_PLOT">
                    <Box>
                      <Typography variant="body1">🏞️ Open Plot</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Vacant land, residential plots, development plots
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="FLAT">
                    <Box>
                      <Typography variant="body1">🏢 Flat/Apartment</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Apartment units, condominiums, residential flats
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="HOUSE">
                    <Box>
                      <Typography variant="body1">🏠 Independent House</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Standalone houses, villas, bungalows
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="BUILDING">
                    <Box>
                      <Typography variant="body1">🏗️ Building</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Complete buildings, multi-story structures
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="COMMERCIAL">
                    <Box>
                      <Typography variant="body1">🏪 Commercial Space</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Shops, offices, retail spaces, commercial properties
                      </Typography>
                    </Box>
                  </MenuItem>
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
                
                {/* Location Search */}
                <TextField
                  label="Search Location"
                  fullWidth
                  margin="normal"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    searchLocation(e.target.value);
                  }}
                  placeholder="Search for a place (e.g., Mumbai, Maharashtra)"
                  helperText="Type to search for locations and get coordinates automatically"
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, mb: 2 }}>
                    {searchResults.map((result, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index < searchResults.length - 1 ? 1 : 0,
                          borderColor: 'divider'
                        }}
                        onClick={() => selectLocationFromSearch(result)}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {result.display_name.split(',')[0]}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {result.display_name}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                          📍 {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={getCoordinatesFromLocation}
                    disabled={!newProperty.state || !newProperty.district || !newProperty.sub_district || !newProperty.village}
                    sx={{ 
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1
                    }}
                  >
                    📍 Get from Location
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={getCurrentLocation}
                    sx={{ 
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1
                    }}
                  >
                    📱 Current Location
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={openMapSelector}
                    sx={{ 
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1
                    }}
                  >
                    🗺️ Select on Map
                  </Button>
                </Box>
                
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  💡 Tip: If "Current Location" doesn't work, try "Get from Location" or "Select on Map"
                </Typography>
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
                    helperText="North-South position (-90 to 90)"
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
                    helperText="East-West position (-180 to 180)"
                  />
                </Grid>
              </Grid>
              
              {newProperty.latitude && newProperty.longitude && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    📍 Coordinates: {newProperty.latitude}, {newProperty.longitude}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      const mapUrl = `https://www.google.com/maps?q=${newProperty.latitude},${newProperty.longitude}`;
                      window.open(mapUrl, '_blank');
                    }}
                    sx={{ mt: 1 }}
                  >
                    View on Google Maps
                  </Button>
                </Box>
              )}
              
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
              >
                Upload Images (Max 10)
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {selectedImages.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="primary">
                    📸 {selectedImages.length} image(s) selected (Max: 10)
                  </Typography>
                  {selectedImages.length > 10 && (
                    <Typography variant="caption" color="error">
                      ⚠️ Please select maximum 10 images. Only first 10 will be uploaded.
                    </Typography>
                  )}
                </Box>
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
