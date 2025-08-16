import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Box, Button 
} from '@mui/material';
import PropertyCard from '../components/PropertyCard';
import propertyAPI from '../api/properties';
import { useNavigate } from 'react-router-dom';

const Shortlist = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShortlistedProperties();
  }, []);

  const fetchShortlistedProperties = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

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
  };

  const handleRemoveShortlist = (propertyId) => {
    const token = localStorage.getItem('token');
    propertyAPI.removeShortlist(propertyId, token)
      .then(() => {
        setProperties(properties.filter(p => p.id !== propertyId));
      })
      .catch(error => {
        console.error('Error removing shortlist:', error);
      });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#4267B2' }}>
        Your Shortlisted Properties
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : properties.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            You haven't shortlisted any properties yet
          </Typography>
          <Button 
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ 
              mt: 2,
              backgroundColor: '#4267B2',
              '&:hover': { backgroundColor: '#365899' }
            }}
          >
            Browse Properties
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {properties.map(property => (
            <Grid item key={property.id} xs={12} sm={6} md={4} lg={3}>
              <PropertyCard 
                property={property} 
                onRemoveShortlist={handleRemoveShortlist}
                isShortlisted={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Shortlist;
