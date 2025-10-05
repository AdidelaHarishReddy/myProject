import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Box, Tabs, Tab, Badge, Paper, FormControl, 
  InputLabel, Select, MenuItem, Slider, Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import Shortlist from './Shortlist';
import propertyAPI from '../api/properties';
import { useNavigate } from 'react-router-dom';

const BuyerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  
  // Add filter state for Browse Properties
  const [filters, setFilters] = useState({
    property_type: '',
    priceRange: [0, 10000000],
    areaRange: [0, 10000],
    sortBy: 'newest',
    userLatitude: '',
    userLongitude: '',
    maxDistance: 50
  });
  
  // Ensure filters is never undefined
  const safeFilters = filters || {
    property_type: '',
    priceRange: [0, 10000000],
    areaRange: [0, 10000],
    sortBy: 'newest'
  };
  
  const [isFiltering, setIsFiltering] = useState(false);
  
  const navigate = useNavigate();

  // Function to get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by this browser.');
      return;
    }

    // Allow HTTP in development environment
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('192.168.') ||
                     window.location.hostname.includes('10.') ||
                     window.location.hostname.includes('13.') || // Allow AWS IPs
                     process.env.NODE_ENV === 'development' ||
                     process.env.REACT_APP_ENV === 'development' ||
                     window.location.hostname.includes('dev') ||
                     window.location.hostname.includes('test');

    if (!isSecure) {
      // In development, try to proceed anyway with a warning
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
        console.warn('⚠️ Geolocation may not work on HTTP in some browsers. Trying anyway...');
        // Continue with the geolocation request
      } else {
        alert('⚠️ Location access requires HTTPS or localhost. For development, please use localhost or enable HTTPS.');
        return;
      }
    }

    alert('📍 Getting your current location... Please allow location access when prompted.');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFilters(prev => ({
          ...prev,
          userLatitude: latitude.toFixed(6),
          userLongitude: longitude.toFixed(6)
        }));
        alert(`✅ Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        // Automatically fetch properties with location filter
        fetchProperties({
          ...filters,
          userLatitude: latitude.toFixed(6),
          userLongitude: longitude.toFixed(6)
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = '❌ Error getting current location. ';
        let showManualOption = false;
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. This could be due to:\n';
            errorMessage += '• Browser location permission is blocked\n';
            errorMessage += '• Site is not trusted for location access\n';
            errorMessage += '• HTTP protocol restrictions (try HTTPS)\n\n';
            errorMessage += '💡 Solutions:\n';
            errorMessage += '1. Click the location icon in your browser address bar\n';
            errorMessage += '2. Select "Allow" for location access\n';
            errorMessage += '3. Try the "Enter Location Manually" button below\n';
            errorMessage += '4. Use HTTPS instead of HTTP if possible';
            showManualOption = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. This could be due to:\n';
            errorMessage += '• GPS is turned off\n';
            errorMessage += '• Poor network connection\n';
            errorMessage += '• Location services disabled\n\n';
            errorMessage += '💡 Try the "Enter Location Manually" button below';
            showManualOption = true;
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. This could be due to:\n';
            errorMessage += '• Slow network connection\n';
            errorMessage += '• GPS signal issues\n\n';
            errorMessage += '💡 Try again or use the "Enter Location Manually" button below';
            showManualOption = true;
            break;
          default:
            errorMessage += 'Unknown error occurred. Please try the "Enter Location Manually" button below.';
            showManualOption = true;
            break;
        }
        
        alert(errorMessage);
        
        // Show manual input option if geolocation failed
        if (showManualOption) {
          setTimeout(() => {
            const useManual = confirm('Would you like to enter your location manually instead?');
            if (useManual) {
              const lat = prompt('Enter your latitude (e.g., 19.0760 for Mumbai):');
              const lng = prompt('Enter your longitude (e.g., 72.8777 for Mumbai):');
              if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                setFilters(prev => ({
                  ...prev,
                  userLatitude: parseFloat(lat).toFixed(6),
                  userLongitude: parseFloat(lng).toFixed(6)
                }));
                fetchProperties({
                  ...filters,
                  userLatitude: parseFloat(lat).toFixed(6),
                  userLongitude: parseFloat(lng).toFixed(6)
                });
                alert(`✅ Location set: ${lat}, ${lng}`);
              } else if (lat || lng) {
                alert('❌ Invalid coordinates. Please enter valid latitude and longitude numbers.');
              }
            }
          }, 1000);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 300000
      }
    );
  };

  useEffect(() => {
    console.log('BuyerDashboard mounted, fetching properties...');
    fetchProperties({}); // Pass empty object to avoid undefined filters
    fetchShortlistedCount();
  }, []);

  // Refetch properties when filters change
  useEffect(() => {
    // Only refetch if we have properties already loaded (not on initial load)
    // and filters is properly initialized
    if (properties.length > 0 && activeTab === 0 && safeFilters) {
      fetchProperties(safeFilters);
    }
  }, [safeFilters, properties.length, activeTab]);

  const fetchProperties = (filters = {}) => {
    setLoading(true);
    
    // Ensure filters is an object and has the required properties
    const safeFilters = filters || {};
    const safePriceRange = safeFilters.priceRange || [0, 10000000];
    const safeAreaRange = safeFilters.areaRange || [0, 10000];
    const safeSortBy = safeFilters.sortBy || 'newest';
    
    // Check if any filters are applied (excluding default values)
    const hasFilters = (safeFilters.property_type && safeFilters.property_type !== '') || 
                      (safePriceRange[0] > 0) || 
                      (safePriceRange[1] < 10000000) ||
                      (safeAreaRange[0] > 0) || 
                      (safeAreaRange[1] < 10000) ||
                      (safeSortBy && safeSortBy !== 'newest') ||
                      (safeFilters.userLatitude && safeFilters.userLongitude);
    
    // Set appropriate loading state
    if (hasFilters) {
      setIsFiltering(true);
    } else {
      setLoading(true);
    }
    
    console.log('Fetching properties with filters:', safeFilters);
    
    propertyAPI.getProperties(safeFilters)
      .then(response => {
        console.log('Properties response:', response.data);
        
        // Extract properties from the response
        let propertiesData;
        console.log('Response structure:', response.data);
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          propertiesData = response.data;
        } else if (response.data && response.data.results) {
          propertiesData = response.data.results;
        } else if (response.data && response.data.properties) {
          propertiesData = response.data.properties;
        } else {
          propertiesData = [];
        }
        
        console.log('Extracted properties:', propertiesData.length, 'properties');
        
        // Ensure each property has the required structure
        const formattedProperties = propertiesData.map(property => {
          console.log('BuyerDashboard - Processing property:', property.id, 'Images:', property.images);
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
        console.error('Error fetching properties:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        setLoading(false);
        setIsFiltering(false);
        // Set empty array to prevent errors
        setProperties([]);
      });
  };

  // Filter change handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchProperties(safeFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      property_type: '',
      priceRange: [0, 10000000],
      areaRange: [0, 10000],
      sortBy: 'newest'
    };
    setFilters(clearedFilters);
    // Fetch properties without filters
    setTimeout(() => fetchProperties(clearedFilters), 100);
  };

  const fetchShortlistedCount = () => {
    const token = localStorage.getItem('token');
    if (token) {
      propertyAPI.getShortlistedProperties(token)
        .then(response => {
          setShortlistedCount(response.data.length);
        })
        .catch(error => {
          console.error('Error fetching shortlisted properties:', error);
        });
    }
  };

  const handleShortlist = (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    propertyAPI.shortlistProperty(propertyId, token)
      .then(() => {
        fetchShortlistedCount();
      })
      .catch(error => {
        console.error('Error shortlisting property:', error);
      });
  };

  const handleRemoveShortlist = (propertyId) => {
    const token = localStorage.getItem('token');
    propertyAPI.removeShortlist(propertyId, token)
      .then(() => {
        fetchShortlistedCount();
        if (activeTab === 1) {
          setProperties(properties.filter(p => p.id !== propertyId));
        }
      })
      .catch(error => {
        console.error('Error removing shortlist:', error);
      });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      const token = localStorage.getItem('token');
      if (token) {
        setLoading(true);
        propertyAPI.getShortlistedProperties(token)
          .then(response => {
            console.log('Shortlisted properties response:', response.data);
            
            // Format the properties to ensure all required fields exist
            const formattedProperties = response.data.map(property => ({
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
            }));
            
            setProperties(formattedProperties);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching shortlisted properties:', error);
            setLoading(false);
          });
      } else {
        navigate('/login');
      }
    } else {
      fetchProperties();
    }
  };

  const isShortlisted = (propertyId) => {
    // Check if the property exists in the current properties list
    // and has a shortlisted_by_count greater than 0
    const property = properties.find(p => p.id === propertyId);
    return property && property.shortlisted_by_count > 0;
  };

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Browse Properties" />
          <Tab 
            label={
              <Badge badgeContent={shortlistedCount} color="primary">
                Shortlisted
              </Badge>
            } 
          />
        </Tabs>
      </Box>
      
      
      {activeTab === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3,
          alignItems: 'flex-start'
        }}>
          {/* Left Side - Filters (20% width on large screens, full width on mobile) */}
          <Box sx={{ 
            width: { xs: '100%', lg: '20%' }, 
            flexShrink: 0,
            order: { xs: 2, lg: 1 }
          }}>
            <PropertyFilters 
              filters={safeFilters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              isFiltering={isFiltering}
            />
          </Box>
          
          {/* Right Side - Properties Display (80% width on large screens, full width on mobile) */}
          <Box sx={{ 
            width: { xs: '100%', lg: '80%' }, 
            flexGrow: 1,
            order: { xs: 1, lg: 2 }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#4267B2' }}>
                Properties Near You
              </Typography>
              
              {/* Properties Count and Location Filter */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={getCurrentLocation}
                  sx={{ 
                    borderColor: '#4267B2',
                    color: '#4267B2',
                    '&:hover': { 
                      borderColor: '#365899',
                      backgroundColor: 'rgba(66, 103, 178, 0.04)'
                    }
                  }}
                >
                  📍 Find Properties Near Me
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Show common cities for quick selection
                    const commonCities = [
                      { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
                      { name: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
                      { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
                      { name: 'Chennai, India', lat: 13.0827, lng: 80.2707 },
                      { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639 },
                      { name: 'Pune, India', lat: 18.5204, lng: 73.8567 },
                      { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867 },
                      { name: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714 },
                      { name: 'Custom Location', lat: null, lng: null }
                    ];
                    
                    let cityChoice = 'Custom Location';
                    let lat, lng;
                    
                    // Try to show a selection dialog
                    const cityList = commonCities.map((city, index) => `${index + 1}. ${city.name}`).join('\n');
                    const choice = prompt(`Select a city or enter custom coordinates:\n\n${cityList}\n\nEnter number (1-${commonCities.length}) or press Cancel for custom input:`);
                    
                    if (choice && !isNaN(choice) && parseInt(choice) >= 1 && parseInt(choice) <= commonCities.length) {
                      const selectedCity = commonCities[parseInt(choice) - 1];
                      if (selectedCity.lat !== null) {
                        lat = selectedCity.lat.toString();
                        lng = selectedCity.lng.toString();
                        cityChoice = selectedCity.name;
                      }
                    }
                    
                    // If custom location or no selection, ask for coordinates
                    if (!lat || !lng) {
                      lat = prompt('Enter your latitude (e.g., 19.0760 for Mumbai):');
                      lng = prompt('Enter your longitude (e.g., 72.8777 for Mumbai):');
                    }
                    
                    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                      setFilters(prev => ({
                        ...prev,
                        userLatitude: parseFloat(lat).toFixed(6),
                        userLongitude: parseFloat(lng).toFixed(6)
                      }));
                      fetchProperties({
                        ...filters,
                        userLatitude: parseFloat(lat).toFixed(6),
                        userLongitude: parseFloat(lng).toFixed(6)
                      });
                      alert(`✅ Location set: ${cityChoice} (${lat}, ${lng})`);
                    } else if (lat || lng) {
                      alert('❌ Invalid coordinates. Please enter valid latitude and longitude numbers.');
                    }
                  }}
                  sx={{ 
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    '&:hover': { 
                      borderColor: '#f57c00',
                      backgroundColor: 'rgba(255, 152, 0, 0.04)'
                    }
                  }}
                >
                  📍 Enter Location Manually
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    console.log('Testing API...');
                    fetch(`${window._env_?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/properties/test/`)
                      .then(response => response.json())
                      .then(data => {
                        console.log('API Test Response:', data);
                        alert(`API Test: ${data.message}\nTotal Properties: ${data.total_properties_in_db}\nSerialized: ${data.serialized_count}`);
                      })
                      .catch(error => {
                        console.error('API Test Error:', error);
                        alert('API Test Failed: ' + error.message);
                      });
                  }}
                  sx={{ 
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': { 
                      borderColor: '#388e3c',
                      backgroundColor: 'rgba(76, 175, 80, 0.04)'
                    }
                  }}
                >
                  🧪 Test API
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Reset filters to defaults and clear location
                    const cleared = {
                      property_type: '',
                      priceRange: [0, 10000000],
                      areaRange: [0, 10000],
                      sortBy: 'newest',
                      userLatitude: '',
                      userLongitude: '',
                      maxDistance: 50
                    };
                    setFilters(cleared);
                    // Fetch WITHOUT passing previous filters to avoid stale keys
                    fetchProperties({});
                    alert('✅ Location filter cleared. Showing all properties.');
                  }}
                  sx={{ 
                    borderColor: '#9e9e9e',
                    color: '#9e9e9e',
                    '&:hover': { 
                      borderColor: '#757575',
                      backgroundColor: 'rgba(158, 158, 158, 0.04)'
                    }
                  }}
                >
                  🗑️ Clear Location
                </Button>
                
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
            
            {/* Filter Status */}
            {(safeFilters.property_type || 
              safeFilters.priceRange[0] > 0 || 
              safeFilters.priceRange[1] < 10000000 ||
              safeFilters.areaRange[0] > 0 || 
              safeFilters.areaRange[1] < 10000 ||
              safeFilters.sortBy !== 'newest') && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 2 }}>
                Showing filtered results
              </Typography>
            )}
            
            {/* Properties Content */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={60} sx={{ color: '#4267B2' }} />
              </Box>
            ) : isFiltering ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={40} sx={{ color: '#4267B2', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#4267B2' }}>
                  Applying filters...
                </Typography>
              </Box>
            ) : properties.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {safeFilters.property_type || 
                   safeFilters.priceRange[0] > 0 || 
                   safeFilters.priceRange[1] < 10000000 || 
                   safeFilters.areaRange[0] > 0 || 
                   safeFilters.areaRange[1] < 10000 || 
                   safeFilters.sortBy !== 'newest' 
                    ? 'No properties match your filters. Try adjusting your search criteria.' 
                    : 'No properties found matching your criteria'
                  }
                </Typography>
                
                {(safeFilters.property_type || 
                  safeFilters.priceRange[0] > 0 || 
                  safeFilters.priceRange[1] < 10000000 || 
                  safeFilters.areaRange[0] > 0 || 
                  safeFilters.areaRange[1] < 10000 || 
                  safeFilters.sortBy !== 'newest') && (
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
              <Grid container spacing={3}>
                {properties.map(property => (
                  <Grid item key={property.id} xs={12} sm={6} md={4} lg={3}>
                    <PropertyCard 
                      property={property} 
                      onShortlist={handleShortlist}
                      onRemoveShortlist={handleRemoveShortlist}
                      isShortlisted={isShortlisted(property.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="h4" gutterBottom sx={{ color: '#4267B2' }}>
            Your Shortlisted Properties
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={60} sx={{ color: '#4267B2' }} />
            </Box>
          ) : properties.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have no shortlisted properties
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {properties.map(property => (
                <Grid item key={property.id} xs={12} sm={6} md={4} lg={3}>
                  <PropertyCard 
                    property={property} 
                    onShortlist={handleShortlist}
                    onRemoveShortlist={handleRemoveShortlist}
                    isShortlisted={isShortlisted(property.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default BuyerDashboard;
