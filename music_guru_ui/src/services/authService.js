import authApi from '../api/authApi';

export const authService = {
  login: async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      if (data.token) {
        localStorage.setItem('music_guru_auth_token', data.token);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  register: async (formData) => {
    try {
      const data = await authApi.register(formData);
      if (data.token) {
        localStorage.setItem('music_guru_auth_token', data.token);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('music_guru_auth_token');
    localStorage.removeItem('music_guru_current_user');
  },

  getCurrentUser: async () => {
    try {
      return await authApi.getMe();
    } catch (err) {
      return null;
    }
  }
};

export default authService;
