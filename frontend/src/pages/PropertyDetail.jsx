import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Box, 
  Button, IconButton, Divider, Chip, 
  Paper, Avatar, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { 
  LocationOn, Favorite, FavoriteBorder, 
  Share, Phone, Email, WhatsApp 
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import propertyAPI from '../api/properties';
import authAPI from '../api/auth';

// Base64 placeholder image (simple gray rectangle)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4=';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProperty();
    checkShortlisted();
  }, [id]);

  const fetchProperty = () => {
    setLoading(true);
    propertyAPI.getPropertyById(id)
      .then(response => {
        setProperty(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching property:', error);
        setLoading(false);
      });
  };

  const checkShortlisted = () => {
    const token = localStorage.getItem('token');
    if (token) {
      propertyAPI.getShortlistedProperties(token)
        .then(response => {
          const isShortlisted = response.data.some(p => p.id === parseInt(id));
          setIsShortlisted(isShortlisted);
        })
        .catch(error => {
          console.error('Error checking shortlist:', error);
        });
    }
  };

  const handleShortlist = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (isShortlisted) {
      propertyAPI.removeShortlist(id, token)
        .then(() => {
          setIsShortlisted(false);
          setProperty({
            ...property,
            shortlisted_by_count: property.shortlisted_by_count - 1
          });
        })
        .catch(error => {
          console.error('Error removing shortlist:', error);
        });
    } else {
      propertyAPI.shortlistProperty(id, token)
        .then(() => {
          setIsShortlisted(true);
          setProperty({
            ...property,
            shortlisted_by_count: property.shortlisted_by_count + 1
          });
        })
        .catch(error => {
          console.error('Error shortlisting property:', error);
        });
    }
  };

  const handleContactSeller = () => {
    setOpenContactDialog(true);
  };

  const handleSendMessage = () => {
    // Implement message sending logic
    setOpenContactDialog(false);
    setMessage('');
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  const getPriceDisplay = () => {
    if (!property) return '';
    
    // Try to use computed price_per_unit_display if available
    if (property.price_per_unit_display) {
      return `₹${property.price_per_unit_display}`;
    }
    
    // Fallback to basic price display
    if (property.price) {
      return `₹${property.price.toLocaleString()}`;
    }
    
    return 'Price not specified';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Property not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <img
              src={property.images && property.images.length > 0 ? property.images[currentImageIndex]?.image : PLACEHOLDER_IMAGE}
              alt={property.title}
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => {
                console.log('Main image failed to load, using placeholder');
                e.target.src = PLACEHOLDER_IMAGE;
              }}
            />
            <Box sx={{ 
              position: 'absolute', 
              bottom: 16, 
              right: 16,
              display: 'flex',
              gap: 1
            }}>
              <IconButton
                onClick={handleShortlist}
                sx={{ 
                  backgroundColor: 'background.paper',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                {isShortlisted ? (
                  <Favorite color="error" />
                ) : (
                  <FavoriteBorder />
                )}
              </IconButton>
              <IconButton
                sx={{ 
                  backgroundColor: 'background.paper',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Share />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
            {property.images && property.images.length > 0 ? (
              property.images.map((image, index) => (
                <img
                  key={index}
                  src={image.image}
                  alt={`Property ${index + 1}`}
                  style={{ 
                    width: '80px', 
                    height: '60px', 
                    objectFit: 'cover', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: currentImageIndex === index ? '2px solid #4267B2' : '1px solid #ddd'
                  }}
                  onClick={() => handleImageChange(index)}
                  onError={(e) => {
                    console.log('Gallery image failed to load, using placeholder');
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ))
            ) : (
              <Box
                sx={{
                  width: '80px',
                  height: '60px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  No Images
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#4267B2' }}>
            {property.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn color="action" />
            <Typography variant="body1" sx={{ ml: 1 }}>
              {property.location ? 
                `${property.location.village || 'N/A'}, ${property.location.district || 'N/A'}, ${property.location.state || 'N/A'}` : 
                'Location not specified'
              }
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Chip 
              label={property.property_type} 
              color="primary" 
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label={property.area_display || 'Area not specified'} 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Typography variant="h4" sx={{ color: '#4267B2', mb: 2 }}>
            {getPriceDisplay()}
          </Typography>
          
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleContactSeller}
            sx={{ 
              mb: 3,
              backgroundColor: '#4267B2',
              '&:hover': { backgroundColor: '#365899' }
            }}
          >
            Contact Seller
          </Button>
          
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#4267B2' }}>
              Property Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Property Type
                </Typography>
                <Typography variant="body1">
                  {property.property_type}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Area
                </Typography>
                <Typography variant="body1">
                  {property.area_display}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1">
                  {getPriceDisplay()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Shortlisted By
                </Typography>
                <Typography variant="body1">
                  {property.shortlisted_by_count} people
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {property.address}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  PIN Code
                </Typography>
                <Typography variant="body1">
                  {property.location.pin_code}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#4267B2' }}>
              Description
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              {property.description}
            </Typography>
          </Paper>
        </Grid>
        
        {property.youtube_link && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#4267B2' }}>
                Video Tour
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ 
                position: 'relative', 
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden'
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${property.youtube_link.split('v=')[1]}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Dialog open={openContactDialog} onClose={() => setOpenContactDialog(false)}>
        <DialogTitle>Contact Seller</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar src={property.seller.profile_pic} />
            <Box>
              <Typography variant="subtitle1">
                {property.seller.first_name} {property.seller.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {property.seller.phone}
              </Typography>
            </Box>
          </Box>
          
          <TextField
            label="Your Message"
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton color="primary">
              <Phone />
            </IconButton>
            <IconButton color="primary">
              <Email />
            </IconButton>
            <IconButton color="primary">
              <WhatsApp />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContactDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendMessage}
            variant="contained"
            sx={{ 
              backgroundColor: '#4267B2',
              '&:hover': { backgroundColor: '#365899' }
            }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PropertyDetail;
