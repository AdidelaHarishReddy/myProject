import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Link, 
  FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authAPI from '../../api/auth';
import { getDashboardRoute } from '../../utils/dashboardRouting';

const Login = () => {
  const [credentials, setCredentials] = useState({
    phone: '',
    password: '',
    showPassword: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (prop) => (event) => {
    setCredentials({ ...credentials, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setCredentials({ ...credentials, showPassword: !credentials.showPassword });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({
        phone: credentials.phone,
        password: credentials.password
      });
      
      localStorage.setItem('token', response.data.token);
      
      // Store user data in localStorage for easy access
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Update Redux store with login success
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: response.data.token,
          user: response.data.user
        }
      });
      
      // Redirect based on user type
      const userType = response.data.user?.user_type;
      const dashboardRoute = getDashboardRoute(userType);
      console.log('Login successful, redirecting to:', dashboardRoute);
      navigate(dashboardRoute);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#4267B2' }}>
        Login
      </Typography>
      
      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={credentials.phone}
          onChange={handleChange('phone')}
          required
        />
        
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel htmlFor="password">Password</InputLabel>
          <OutlinedInput
            id="password"
            type={credentials.showPassword ? 'text' : 'password'}
            value={credentials.password}
            onChange={handleChange('password')}
            required
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {credentials.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
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
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      
      <Typography align="center">
        Don't have an account? <Link href="/register" sx={{ color: '#4267B2' }}>Register</Link>
      </Typography>
      <Typography align="center">
        <Link href="/forgot-password" sx={{ color: '#4267B2' }}>Forgot password?</Link>
      </Typography>
    </Box>
  );
};

export default Login;
