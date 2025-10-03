import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Link, 
  FormControl, InputLabel, Select, MenuItem, RadioGroup, 
  FormControlLabel, Radio 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authAPI from '../../api/auth';
import testAPI from '../../api/test';

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
  const [testResult, setTestResult] = useState('');
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    setUserData({ ...userData, [prop]: event.target.value });
  };

  const testConnection = async () => {
    try {
      const response = await testAPI.testConnection();
      setTestResult(`✅ Connection successful: ${response.data.message}`);
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err.message}`);
    }
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
        last_name: userData.name.split(' ').slice(1).join(' ') || 'Test1',
        user_type: userData.user_type
      });
      
      console.log('Registration successful, redirecting to OTP verification');
      navigate('/verify-otp', { state: { phone: userData.phone } });
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed');
      }
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

      {testResult && (
        <Typography color={testResult.includes('✅') ? 'success' : 'error'} align="center" gutterBottom>
          {testResult}
        </Typography>
      )}

      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={testConnection}
          sx={{ mb: 2 }}
        >
          Test Backend Connection
        </Button>
      </Box>
      
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
