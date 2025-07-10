export const loginSuccess = (token, user) => {
  return {
    type: 'LOGIN_SUCCESS',
    payload: { token, user }
  };
};

export const logout = () => {
  return {
    type: 'LOGOUT'
  };
};

export const updateUser = (user) => {
  return {
    type: 'UPDATE_USER',
    payload: user
  };
};
