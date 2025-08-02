import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Link, 
  FormControl, InputLabel, Select, MenuItem, RadioGroup, 
  FormControlLabel, Radio 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authAPI from '../../api/auth';

const Register = () => {
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'BUYER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    setUserData({ ...userData, [prop]: event.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const response = await authAPI.register({
        username: userData.phone,
        phone: userData.phone,
        email: userData.email,
        password: userData.password,
        first_name: userData.name.split(' ')[0],
        last_name: userData.name.split(' ').slice(1).join(' ') || 'Test',
        user_type: userData.user_type
      });
      
      navigate('/verify-otp', { state: { phone: userData.phone } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#4267B2' }}>
        Register
      </Typography>
      
      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={userData.name}
          onChange={handleChange('name')}
          required
        />
        
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={userData.phone}
          onChange={handleChange('phone')}
          required
        />
        
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          type="email"
          value={userData.email}
          onChange={handleChange('email')}
        />
        
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          margin="normal"
          type="password"
          value={userData.password}
          onChange={handleChange('password')}
          required
        />
        
        <TextField
          label="Confirm Password"
          variant="outlined"
          fullWidth
          margin="normal"
          type="password"
          value={userData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          required
        />
        
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <Typography component="legend">Register as</Typography>
          <RadioGroup
            row
            value={userData.user_type}
            onChange={handleChange('user_type')}
          >
            <FormControlLabel 
              value="BUYER" 
              control={<Radio color="primary" />} 
              label="Buyer" 
            />
            <FormControlLabel 
              value="SELLER" 
              control={<Radio color="primary" />} 
              label="Seller" 
            />
          </RadioGroup>
        </FormControl>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ 
            mt: 3, 
            mb: 2,
            backgroundColor: '#4267B2',
            '&:hover': { backgroundColor: '#365899' }
          }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      
      <Typography align="center">
        Already have an account? <Link href="/login" sx={{ color: '#4267B2' }}>Login</Link>
      </Typography>
    </Box>
  );
};

export default Register;
