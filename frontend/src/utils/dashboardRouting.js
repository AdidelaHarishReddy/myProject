// Utility function to get the appropriate dashboard route based on user type
export const getDashboardRoute = (userType) => {
  switch (userType) {
    case 'SELLER':
      return '/seller';
    case 'BUYER':
      return '/';
    default:
      return '/'; // Default to buyer dashboard
  }
};

// Utility function to get user type from localStorage
export const getUserType = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.user_type;
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return null;
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  return !!(token && userData);
};

// Utility function to get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return null;
};
