import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Card, CardContent, 
  CardActions, Button, Box, Avatar, Paper,
  CircularProgress, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Person as PersonIcon, 
  Store as StoreIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getCurrentUser, getUserType } from '../utils/dashboardRouting';

const GeneralDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      // If no user data, redirect to login
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleNavigateToProfile = () => {
    const userType = getUserType();
    if (userType === 'SELLER') {
      navigate('/seller');
    } else {
      navigate('/');
    }
  };

  const handleNavigateToBuyerDashboard = () => {
    navigate('/');
  };

  const handleNavigateToSellerDashboard = () => {
    navigate('/seller');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={60} sx={{ color: '#4267B2' }} />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Unable to load user data. Please try logging in again.
        </Alert>
      </Container>
    );
  }

  const userType = getUserType();
  const isSeller = userType === 'SELLER';
  const isBuyer = userType === 'BUYER';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ color: '#4267B2', mb: 2, fontWeight: 'bold' }}>
          Welcome to Global Real Estates
        </Typography>
        <Typography variant="h5" sx={{ color: '#666', mb: 1 }}>
          Hello, {user.first_name || user.username}!
        </Typography>
        <Typography variant="body1" sx={{ color: '#888' }}>
          {isSeller ? 'Manage your properties and grow your business' : 'Find your dream property'}
        </Typography>
      </Box>

      {/* User Type Badge */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Paper 
          elevation={2} 
          sx={{ 
            display: 'inline-block', 
            p: 2, 
            backgroundColor: isSeller ? '#e8f5e8' : '#e3f2fd',
            border: `2px solid ${isSeller ? '#4caf50' : '#2196f3'}`
          }}
        >
          <Typography variant="h6" sx={{ 
            color: isSeller ? '#2e7d32' : '#1976d2',
            fontWeight: 'bold'
          }}>
            {isSeller ? '🏠 Property Seller' : '🔍 Property Buyer'}
          </Typography>
        </Paper>
      </Box>

      {/* Main Navigation Cards */}
      <Grid container spacing={3}>
        {/* Primary Dashboard Card */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              {isSeller ? (
                <StoreIcon sx={{ fontSize: 60, mb: 2 }} />
              ) : (
                <SearchIcon sx={{ fontSize: 60, mb: 2 }} />
              )}
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {isSeller ? 'My Properties' : 'Browse Properties'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                {isSeller 
                  ? 'Manage your property listings, add new properties, and track your business'
                  : 'Discover amazing properties, shortlist your favorites, and find your perfect home'
                }
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleNavigateToProfile}
                sx={{
                  backgroundColor: 'white',
                  color: '#4267B2',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {isSeller ? 'Go to Seller Dashboard' : 'Go to Buyer Dashboard'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Secondary Options */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Profile Card */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <PersonIcon sx={{ fontSize: 40, color: '#4267B2', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    My Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Update your personal information and preferences
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/profile')}
                    sx={{ 
                      borderColor: '#4267B2',
                      color: '#4267B2',
                      '&:hover': { 
                        borderColor: '#365899',
                        backgroundColor: 'rgba(66, 103, 178, 0.04)'
                      }
                    }}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Additional Options Based on User Type */}
            {isBuyer && (
              <Grid item xs={12}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <FavoriteIcon sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      My Shortlist
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      View and manage your shortlisted properties
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/shortlist')}
                      sx={{ 
                        borderColor: '#e91e63',
                        color: '#e91e63',
                        '&:hover': { 
                          borderColor: '#c2185b',
                          backgroundColor: 'rgba(233, 30, 99, 0.04)'
                        }
                      }}
                    >
                      View Shortlist
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {isSeller && (
              <Grid item xs={12}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AddIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Add New Property
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      List a new property to attract buyers
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/seller')}
                      sx={{ 
                        borderColor: '#4caf50',
                        color: '#4caf50',
                        '&:hover': { 
                          borderColor: '#388e3c',
                          backgroundColor: 'rgba(76, 175, 80, 0.04)'
                        }
                      }}
                    >
                      Go to Seller Dashboard
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Quick Stats or Additional Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Need help? Contact our support team or check out our FAQ section.
        </Typography>
      </Box>
    </Container>
  );
};

export default GeneralDashboard;
