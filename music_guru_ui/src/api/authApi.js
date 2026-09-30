import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    return await axiosClient.post('/auth/login', credentials);
  },

  register: async (formData) => {
    return await axiosClient.post('/auth/register', formData);
  },

  getMe: async () => {
    return await axiosClient.get('/auth/me');
  }
};

export default authApi;
