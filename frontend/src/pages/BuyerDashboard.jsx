import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, CircularProgress, 
  Box, Tabs, Tab, Badge
} from '@mui/material';
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
    fetchShortlistedCount();
  }, []);

  const fetchProperties = (filters = {}) => {
    setLoading(true);
    propertyAPI.getProperties(filters)
      .then(response => {
        setProperties(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching properties:', error);
        setLoading(false);
      });
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
            setProperties(response.data);
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
    return properties.some(p => p.id === propertyId && p.shortlisted_by_count > 0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
        <>
          <Typography variant="h4" gutterBottom sx={{ color: '#4267B2' }}>
            Properties Near You
          </Typography>
          
          <PropertyFilters onFilter={fetchProperties} />
        </>
      ) : (
        <Typography variant="h4" gutterBottom sx={{ color: '#4267B2' }}>
          Your Shortlisted Properties
        </Typography>
      )}
      
      {loading ? (
        <CircularProgress />
      ) : properties.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          {activeTab === 0 ? 'No properties found matching your criteria' : 'You have no shortlisted properties'}
        </Typography>
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
    </Container>
  );
};

export default BuyerDashboard;
