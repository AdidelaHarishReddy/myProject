import React from 'react';
import { 
  AppBar, Toolbar, Typography, Button, 
  Box, Avatar, Menu, MenuItem, IconButton 
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/actions';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#4267B2' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Global Real Estates
          </Link>
        </Typography>
        
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/dashboard"
              sx={{ mr: 2 }}
            >
              Dashboard
            </Button>
            {user?.user_type === 'BUYER' && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/shortlist"
                sx={{ mr: 2 }}
              >
                Shortlist
              </Button>
            )}
            {user?.user_type === 'SELLER' && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/seller"
                sx={{ mr: 2 }}
              >
                My Properties
              </Button>
            )}
            
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar alt={user?.first_name} src={user?.profile_pic} />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => {
                navigate('/profile');
                handleMenuClose();
              }}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">Login</Button>
            <Button color="inherit" component={Link} to="/register">Register</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
