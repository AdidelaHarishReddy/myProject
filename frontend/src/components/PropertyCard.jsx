import React from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Menu, MenuItem } from '@mui/material';
import { Favorite, FavoriteBorder, LocationOn, MoreVert, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Base64 placeholder image (simple gray rectangle)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4=';

const PropertyCard = ({ property, onShortlist, onRemoveShortlist, isShortlisted, onEdit, onDelete, showShortlistCount = false }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

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

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete();
    }
  };

  // Get the first image or use placeholder
  const getImageUrl = () => {
    console.log('PropertyCard - Images data:', images);
    if (images && images.length > 0 && images[0]) {
      // Try image_url first, then fall back to image
      const firstImage = images[0];
      console.log('PropertyCard - First image:', firstImage);
      if (firstImage.image_url) {
        console.log('PropertyCard - Using image_url:', firstImage.image_url);
        return firstImage.image_url;
      } else if (firstImage.image) {
        console.log('PropertyCard - Using image:', firstImage.image);
        return firstImage.image;
      }
    }
    console.log('PropertyCard - Using placeholder image');
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
        transition: 'all 0.3s ease-in-out',
        border: '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          transform: 'translateY(-4px)',
          borderColor: '#4267B2'
        }
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
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
            justifyContent: 'center',
            borderBottom: '1px solid #e0e0e0'
          }}
        />

        {/* Property Type Badge */}
        <Box sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          backgroundColor: 'rgba(66, 103, 178, 0.9)',
          color: 'white',
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {safeProperty.property_type?.replace('_', ' ') || 'Unknown'}
        </Box>

        {/* Action buttons overlay */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 1
        }}>
          {/* Shortlist button */}
          {onShortlist && (
            <IconButton
              onClick={handleShortlistClick}
              aria-label="shortlist"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {isShortlisted ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
          )}

          {/* More options menu for user's own properties */}
          {(onEdit || onDelete) && (
            <IconButton
              onClick={handleMenuClick}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        {/* Title and Price Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flex: 1,
              mr: 1,
              fontWeight: 'bold',
              color: '#2c3e50',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationOn
            fontSize="small"
            sx={{
              color: '#4267B2',
              mr: 1,
              flexShrink: 0
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.875rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
          >
            {getLocationText()}
          </Typography>
        </Box>

        {/* Price */}
        <Typography
          variant="h5"
          sx={{
            color: '#4267B2',
            fontWeight: 'bold',
            mb: 1.5,
            fontSize: '1.25rem'
          }}
        >
          ₹{price.toLocaleString()}
        </Typography>

        {/* Area */}
        <Typography
          variant="body2"
          sx={{
            color: '#666',
            fontWeight: '500',
            mb: 2,
            fontSize: '0.9rem'
          }}
        >
          {areaDisplay}
        </Typography>

        {/* Show shortlist count if requested */}
        {showShortlistCount && safeProperty.shortlisted_count > 0 && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 'auto',
            pt: 1,
            borderTop: '1px solid #f0f0f0'
          }}>
            <Favorite
              fontSize="small"
              sx={{ color: '#e74c3c', fontSize: '1rem' }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#666',
                fontWeight: '500'
              }}
            >
              {safeProperty.shortlisted_count} people shortlisted
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* More options menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEditClick} sx={{ py: 1.5 }}>
            <Edit fontSize="small" sx={{ mr: 1.5, color: '#4267B2' }} />
            <Typography sx={{ fontWeight: '500' }}>Edit Property</Typography>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDeleteClick} sx={{ py: 1.5, color: '#e74c3c' }}>
            <Delete fontSize="small" sx={{ mr: 1.5 }} />
            <Typography sx={{ fontWeight: '500' }}>Delete Property</Typography>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default PropertyCard;
