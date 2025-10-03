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
    sortBy: 'newest'
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

  useEffect(() => {
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
    
    // Check if any filters are applied
    const hasFilters = safeFilters.property_type || 
                      safePriceRange[0] > 0 || 
                      safePriceRange[1] < 10000000 ||
                      safeAreaRange[0] > 0 || 
                      safeAreaRange[1] < 10000 ||
                      safeSortBy !== 'newest';
    
    // Set appropriate loading state
    if (hasFilters) {
      setIsFiltering(true);
    } else {
      setLoading(true);
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (safeFilters.property_type && safeFilters.property_type !== '') {
      params.append('property_type', safeFilters.property_type);
    }
    
    if (safePriceRange && safePriceRange.length === 2) {
      if (safePriceRange[0] > 0) {
        params.append('price__gte', safePriceRange[0]);
      }
      if (safePriceRange[1] < 10000000) {
        params.append('price__lte', safePriceRange[1]);
      }
    }
    
    if (safeAreaRange && safeAreaRange.length === 2) {
      if (safeAreaRange[0] > 0) {
        params.append('area__gte', safeAreaRange[0]);
      }
      if (safeAreaRange[1] < 10000) {
        params.append('area__lte', safeAreaRange[1]);
      }
    }
    
    if (safeSortBy && safeSortBy !== 'newest') {
      params.append('sort_by', safeSortBy);
    }
    
    console.log('Filter params:', params.toString());
    
    propertyAPI.getProperties(params.toString())
      .then(response => {
        console.log('Properties response:', response.data);
        
        // Extract properties from the response
        let propertiesData;
        if (hasFilters) {
          // For filtered results, the response structure might be different
          propertiesData = response.data.results || response.data || [];
        } else {
          propertiesData = response.data || [];
        }
        
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
        setLoading(false);
        setIsFiltering(false);
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
              
              {/* Properties Count */}
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
