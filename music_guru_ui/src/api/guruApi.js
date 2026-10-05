import axiosClient from './axiosClient';

export const guruApi = {
  getAcademies: async (params = {}) => {
    return await axiosClient.get('/academies', { params });
  },

  getAcademyBySlug: async (slug) => {
    return await axiosClient.get(`/academies/${slug}`);
  },

  createInquiry: async (inquiryData) => {
    return await axiosClient.post('/inquiries', inquiryData);
  },

  getInquiries: async (params = {}) => {
    return await axiosClient.get('/inquiries', { params });
  },

  getInquiryById: async (id) => {
    return await axiosClient.get(`/inquiries/${id}`);
  },

  updateInquiryStatus: async (id, status) => {
    return await axiosClient.put(`/inquiries/${id}/status`, { status });
  },

  deleteInquiry: async (id) => {
    return await axiosClient.delete(`/inquiries/${id}`);
  },

  getInquiryStats: async (params = {}) => {
    return await axiosClient.get('/inquiries/stats', { params });
  },

  getReviews: async () => {
    return await axiosClient.get('/reviews');
  },

  addReview: async (reviewData) => {
    return await axiosClient.post('/reviews', reviewData);
  },

  getCities: async () => {
    return await axiosClient.get('/cities');
  },

  getSkills: async () => {
    return await axiosClient.get('/skills');
  },

  createSkill: async (skillData) => {
    return await axiosClient.post('/skills', skillData);
  },

  updateSkill: async (id, skillData) => {
    return await axiosClient.put(`/skills/${id}`, skillData);
  },

  deleteSkill: async (id) => {
    return await axiosClient.delete(`/skills/${id}`);
  },

  getFeatures: async () => {
    return await axiosClient.get('/features');
  },

  createFeature: async (featureData) => {
    return await axiosClient.post('/features', featureData);
  },

  updateFeature: async (id, featureData) => {
    return await axiosClient.put(`/features/${id}`, featureData);
  },

  deleteFeature: async (id) => {
    return await axiosClient.delete(`/features/${id}`);
  },

  getGlobalFeatures: async () => {
    return await axiosClient.get('/global-features');
  },

  createGlobalFeature: async (featureData) => {
    return await axiosClient.post('/global-features', featureData);
  },

  updateGlobalFeature: async (id, featureData) => {
    return await axiosClient.put(`/global-features/${id}`, featureData);
  },

  deleteGlobalFeature: async (id) => {
    return await axiosClient.delete(`/global-features/${id}`);
  },

  getPlans: async () => {
    return await axiosClient.get('/plans');
  },

  createPlan: async (planData) => {
    return await axiosClient.post('/plans', planData);
  },

  updatePlan: async (id, planData) => {
    return await axiosClient.put(`/plans/${id}`, planData);
  },

  deletePlan: async (id) => {
    return await axiosClient.delete(`/plans/${id}`);
  },

  getHomeStats: async () => {
    return await axiosClient.get('/home/stats');
  },

  createAcademy: async (academyData) => {
    return await axiosClient.post('/academies', academyData);
  },

  updateAcademyProfile: async (id, profileData) => {
    return await axiosClient.put(`/academies/${id}`, profileData);
  },

  updateAcademyStatus: async (id, status, notes = '') => {
    return await axiosClient.put(`/academies/${id}/status`, { status, notes });
  },

  getAllAcademies: async (params = {}) => {
    return await axiosClient.get('/academies', { params: { status: 'all', ...params } });
  },

  getAcademyApprovals: async (status = 'all') => {
    return await axiosClient.get('/academies/approvals', { params: { status } });
  },

  initiateCheckout: async (checkoutData) => {
    return await axiosClient.post('/checkout/initiate', checkoutData);
  },

  confirmCheckout: async (confirmData) => {
    return await axiosClient.post('/checkout/confirm', confirmData);
  },

  createRazorpayOrder: async (orderData) => {
    return await axiosClient.post('/payments/create-order', orderData);
  },

  verifyRazorpayPayment: async (verifyData) => {
    return await axiosClient.post('/payments/verify', verifyData);
  },

  getPaymentHistory: async (params = {}) => {
    return await axiosClient.get('/payments/history', { params });
  },

  getCurrentSubscription: async (academyId) => {
    return await axiosClient.get('/subscriptions/current', { params: { academyId } });
  },

  cancelSubscription: async (academyId) => {
    return await axiosClient.post('/subscriptions/cancel', { academyId });
  }
};

export default guruApi;
