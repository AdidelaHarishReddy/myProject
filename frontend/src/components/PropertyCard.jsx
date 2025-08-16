import React from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box } from '@mui/material';
import { Favorite, FavoriteBorder, LocationOn, Image } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Base64 placeholder image (simple gray rectangle)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4=';

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
    return PLACEHOLDER_IMAGE;
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
          console.log('Image failed to load, using placeholder');
          e.target.src = PLACEHOLDER_IMAGE;
        }}
        sx={{
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
