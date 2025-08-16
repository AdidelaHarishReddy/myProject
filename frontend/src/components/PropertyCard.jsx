import React from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box } from '@mui/material';
import { Favorite, FavoriteBorder, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property, onShortlist, onRemoveShortlist, isShortlisted }) => {
  const navigate = useNavigate();

  // Add safety checks for property data
  const safeProperty = property || {};
  const images = safeProperty.images || [];
  const location = safeProperty.location || {};
  const title = safeProperty.title || 'Untitled Property';
  const price = safeProperty.price || 0;
  const areaDisplay = safeProperty.area_display || 'Area not specified';

  const handleShortlistClick = (e) => {
    e.stopPropagation();
    if (isShortlisted) {
      onRemoveShortlist(safeProperty.id);
    } else {
      onShortlist(safeProperty.id);
    }
  };

  const handleCardClick = () => {
    if (safeProperty.id) {
      navigate(`/property/${safeProperty.id}`);
    }
  };

  // Get the first image or use placeholder
  const getImageUrl = () => {
    if (images && images.length > 0 && images[0] && images[0].image) {
      return images[0].image;
    }
    return '/placeholder.jpg';
  };

  // Get location display text
  const getLocationText = () => {
    if (location && location.district && location.state) {
      return `${location.district}, ${location.state}`;
    }
    return 'Location not specified';
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 3,
        }
      }}
      onClick={handleCardClick}
    >
      <CardMedia
        component="img"
        height="160"
        image={getImageUrl()}
        alt={title}
        onError={(e) => {
          e.target.src = '/placeholder.jpg';
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <IconButton 
            onClick={handleShortlistClick}
            aria-label="shortlist"
            sx={{ color: isShortlisted ? 'red' : 'inherit' }}
          >
            {isShortlisted ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {getLocationText()}
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, color: '#4267B2' }}>
          ₹{price.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {areaDisplay}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
