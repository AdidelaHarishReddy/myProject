import React from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box } from '@mui/material';
import { Favorite, FavoriteBorder, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property, onShortlist, onRemoveShortlist, isShortlisted }) => {
  const navigate = useNavigate();

  const handleShortlistClick = (e) => {
    e.stopPropagation();
    if (isShortlisted) {
      onRemoveShortlist(property.id);
    } else {
      onShortlist(property.id);
    }
  };

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
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
        image={property.images[0]?.image || '/placeholder.jpg'}
        alt={property.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            {property.title}
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
          {property.location.district}, {property.location.state}
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, color: '#4267B2' }}>
          ₹{property.price.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {property.area_display}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
