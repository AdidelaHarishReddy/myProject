import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Link, 
  FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authAPI from '../../api/auth';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP and new password
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
    setError(''); // Clear error when user types
  };

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  const handleClickShowConfirmPassword = () => {
    setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.forgotPassword(formData.phone);
      setSuccess(response.data.message);
      setStep(2);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    
    try {
      const response = await authAPI.resetPassword(
        formData.phone, 
        formData.otp, 
        formData.newPassword
      );
      setSuccess(response.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.forgotPassword(formData.phone);
      setSuccess('OTP resent successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#4267B2' }}>
        {step === 1 ? 'Forgot Password' : 'Reset Password'}
      </Typography>
      
      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}
      
      {success && (
        <Typography color="success.main" align="center" gutterBottom>
          {success}
        </Typography>
      )}
      
      {step === 1 ? (
        <form onSubmit={handleSendOTP}>
          <Typography variant="body2" align="center" gutterBottom sx={{ mb: 2 }}>
            Enter your phone number to receive a password reset OTP
          </Typography>
          
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.phone}
            onChange={handleChange('phone')}
            required
          />
          
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
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <Typography variant="body2" align="center" gutterBottom sx={{ mb: 2 }}>
            Enter the OTP sent to your phone and your new password
          </Typography>
          
          <TextField
            label="OTP"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.otp}
            onChange={handleChange('otp')}
            required
            placeholder="Enter 6-digit OTP"
          />
          
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel htmlFor="newPassword">New Password</InputLabel>
            <OutlinedInput
              id="newPassword"
              type={formData.showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange('newPassword')}
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="New Password"
            />
          </FormControl>
          
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
            <OutlinedInput
              id="confirmPassword"
              type={formData.showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                  >
                    {formData.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Confirm Password"
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
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={handleResendOTP}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Resend OTP
          </Button>
        </form>
      )}
      
      <Typography align="center">
        Remember your password? <Link href="/login" sx={{ color: '#4267B2' }}>Login</Link>
      </Typography>
    </Box>
  );
};

export default ForgotPassword;
