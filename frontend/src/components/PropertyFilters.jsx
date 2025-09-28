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
    <Paper elevation={3} sx={{ 
      p: 3, 
      position: { xs: 'static', lg: 'sticky' }, 
      top: 20,
      maxHeight: { xs: 'none', lg: 'calc(100vh - 40px)' },
      overflowY: 'auto'
    }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#4267B2', mb: 3, textAlign: 'center' }}>
        🔍 Filter Properties
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Property Type Filter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Property Type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.property_type || ''}
                onChange={handleChange('property_type')}
                displayEmpty
                sx={{ 
                  '& .MuiSelect-select': { 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1
                  }
                }}
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
          </Box>
          
          {/* Price Range Filter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
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
          </Box>
          
          {/* Area Range Filter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
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
          </Box>
          
          {/* Sort By Filter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Sort By
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.sortBy || 'newest'}
                onChange={handleChange('sortBy')}
                sx={{ 
                  '& .MuiSelect-select': { 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1
                  }
                }}
              >
                <MenuItem value="newest">🆕 Newest First</MenuItem>
                <MenuItem value="oldest">📅 Oldest First</MenuItem>
                <MenuItem value="price_low">💰 Price: Low to High</MenuItem>
                <MenuItem value="price_high">💰 Price: High to Low</MenuItem>
                <MenuItem value="area_low">📏 Area: Low to High</MenuItem>
                <MenuItem value="area_high">📏 Area: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isFiltering}
            fullWidth
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
            fullWidth
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
