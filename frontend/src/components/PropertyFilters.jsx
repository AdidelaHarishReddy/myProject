import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider,
  Button,
  Paper,
  Grid
} from '@mui/material';

const PropertyFilters = ({ 
  filters = {}, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  isFiltering = false 
}) => {
  const handleChange = (name) => (event) => {
    if (onFilterChange) {
      onFilterChange(name, event.target.value);
    }
  };

  const handleRangeChange = (name) => (event, newValue) => {
    if (onFilterChange) {
      onFilterChange(name, newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const handleClear = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#4267B2', mb: 3, textAlign: 'center' }}>
        🔍 Filter Properties
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={filters.property_type || ''}
                onChange={handleChange('property_type')}
                label="Property Type"
                displayEmpty
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
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="body2" gutterBottom>
              💰 Price Range (₹)
            </Typography>
            <Slider
              value={filters.priceRange || [0, 10000000]}
              onChange={handleRangeChange('priceRange')}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ₹{(filters.priceRange?.[0] || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ₹{(filters.priceRange?.[1] || 10000000).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="body2" gutterBottom>
              📏 Area Range
            </Typography>
            <Slider
              value={filters.areaRange || [0, 10000]}
              onChange={handleRangeChange('areaRange')}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {filters.areaRange?.[0] || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {filters.areaRange?.[1] || 10000}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'newest'}
                onChange={handleChange('sortBy')}
                label="Sort By"
              >
                <MenuItem value="newest">🆕 Newest First</MenuItem>
                <MenuItem value="oldest">📅 Oldest First</MenuItem>
                <MenuItem value="price_low">💰 Price: Low to High</MenuItem>
                <MenuItem value="price_high">💰 Price: High to Low</MenuItem>
                <MenuItem value="area_low">📏 Area: Low to High</MenuItem>
                <MenuItem value="area_high">📏 Area: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isFiltering}
            sx={{ 
              backgroundColor: '#4267B2',
              '&:hover': { backgroundColor: '#365899' },
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            {isFiltering ? 'Applying...' : '✅ Apply Filters'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
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
          (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000)) ||
          (filters.areaRange && (filters.areaRange[0] > 0 || filters.areaRange[1] < 10000)) ||
          filters.sortBy !== 'newest') && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
              🎯 Active Filters:
            </Typography>
            <Box sx={{ fontSize: '0.875rem', color: '#1976d2' }}>
              {filters.property_type && <div>• Type: {filters.property_type}</div>}
              {(filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000)) && (
                <div>• Price: ₹{(filters.priceRange[0] || 0).toLocaleString()} - ₹{(filters.priceRange[1] || 10000000).toLocaleString()}</div>
              )}
              {(filters.areaRange && (filters.areaRange[0] > 0 || filters.areaRange[1] < 10000)) && (
                <div>• Area: {filters.areaRange[0] || 0} - {filters.areaRange[1] || 10000}</div>
              )}
              {filters.sortBy !== 'newest' && <div>• Sort: {filters.sortBy?.replace('_', ' ') || 'newest'}</div>}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PropertyFilters;
