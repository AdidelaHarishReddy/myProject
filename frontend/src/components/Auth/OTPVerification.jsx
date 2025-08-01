import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, 
  FormControl, InputLabel, OutlinedInput 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import authAPI from '../../api/auth';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const phone = location.state?.phone || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyOTP({
        phone,
        otp
      });
      
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await authAPI.resendOTP(phone);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#4267B2' }}>
        OTP Verification
      </Typography>
      
      <Typography align="center" gutterBottom>
        We've sent an OTP to {phone}
      </Typography>
      
      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel htmlFor="otp">Enter OTP</InputLabel>
          <OutlinedInput
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            label="Enter OTP"
            required
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
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>
      </form>
      
      <Typography align="center">
        Didn't receive OTP?{' '}
        <Button 
          onClick={handleResendOTP} 
          disabled={resendLoading}
          sx={{ color: '#4267B2' }}
        >
          {resendLoading ? 'Sending...' : 'Resend OTP'}
        </Button>
      </Typography>
    </Box>
  );
};

export default OTPVerification;
