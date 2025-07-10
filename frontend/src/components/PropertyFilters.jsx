import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider,
  Button
} from '@mui/material';

const PropertyFilters = ({ onFilter }) => {
  const [filters, setFilters] = React.useState({
    propertyType: '',
    priceRange: [0, 10000000],
    areaRange: [0, 10000],
    location: {
      state: '',
      district: '',
      subDistrict: '',
      village: ''
    }
  });

  const handleChange = (name) => (event) => {
    setFilters({
      ...filters,
      [name]: event.target.value
    });
  };

  const handleRangeChange = (name) => (event, newValue) => {
    setFilters({
      ...filters,
      [name]: newValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filter Properties
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Property Type</InputLabel>
        <Select
          value={filters.propertyType}
          onChange={handleChange('propertyType')}
          label="Property Type"
        >
          <MenuItem value="AGRICULTURE">Agriculture Land</MenuItem>
          <MenuItem value="OPEN_PLOT">Open Plot</MenuItem>
          <MenuItem value="FLAT">Flat</MenuItem>
          <MenuItem value="HOUSE">Independent House</MenuItem>
          <MenuItem value="BUILDING">Building</MenuItem>
          <MenuItem value="COMMERCIAL">Commercial Space</MenuItem>
        </Select>
      </FormControl>

      <Typography gutterBottom>Price Range (₹)</Typography>
      <Slider
        value={filters.priceRange}
        onChange={handleRangeChange('priceRange')}
        valueLabelDisplay="auto"
        min={0}
        max={10000000}
        step={100000}
        sx={{ mb: 3 }}
      />

      <Typography gutterBottom>Area Range</Typography>
      <Slider
        value={filters.areaRange}
        onChange={handleRangeChange('areaRange')}
        valueLabelDisplay="auto"
        min={0}
        max={10000}
        step={100}
        sx={{ mb: 3 }}
      />

      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        sx={{ mt: 2 }}
      >
        Apply Filters
      </Button>
    </Box>
  );
};

export default PropertyFilters;
