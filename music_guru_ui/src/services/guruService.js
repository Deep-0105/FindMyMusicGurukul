import guruApi from '../api/guruApi';

export const guruService = {
  fetchAcademies: async (filters = {}) => {
    try {
      const response = await guruApi.getAcademies(filters);
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch academies from backend:', err);
      return [];
    }
  },

  fetchCities: async () => {
    try {
      const response = await guruApi.getCities();
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch cities from backend:', err);
      return [];
    }
  },

  fetchSkills: async () => {
    try {
      const response = await guruApi.getSkills();
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch skills from backend:', err);
      return [];
    }
  },

  createSkill: async (skillData) => {
    try {
      const response = await guruApi.createSkill(skillData);
      return response.data || response;
    } catch (err) {
      console.warn('Failed to create skill on backend:', err);
      return null;
    }
  },

  updateSkill: async (id, skillData) => {
    try {
      const response = await guruApi.updateSkill(id, skillData);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update skill for id ${id}:`, err);
      return null;
    }
  },

  deleteSkill: async (id) => {
    try {
      const response = await guruApi.deleteSkill(id);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to delete skill for id ${id}:`, err);
      return null;
    }
  },

  fetchFeatures: async () => {
    try {
      const response = await guruApi.getFeatures();
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch features from backend:', err);
      return [];
    }
  },

  createFeature: async (featureData) => {
    try {
      const response = await guruApi.createFeature(featureData);
      return response.data || response;
    } catch (err) {
      console.warn('Failed to create feature on backend:', err);
      return null;
    }
  },

  updateFeature: async (id, featureData) => {
    try {
      const response = await guruApi.updateFeature(id, featureData);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update feature for id ${id}:`, err);
      return null;
    }
  },

  deleteFeature: async (id) => {
    try {
      const response = await guruApi.deleteFeature(id);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to delete feature for id ${id}:`, err);
      return null;
    }
  },

  fetchGlobalFeatures: async () => {
    try {
      const response = await guruApi.getGlobalFeatures();
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch global features from backend:', err);
      return [];
    }
  },

  createGlobalFeature: async (featureData) => {
    try {
      const response = await guruApi.createGlobalFeature(featureData);
      return response.data || response;
    } catch (err) {
      console.warn('Failed to create global feature on backend:', err);
      return null;
    }
  },

  updateGlobalFeature: async (id, featureData) => {
    try {
      const response = await guruApi.updateGlobalFeature(id, featureData);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update global feature for id ${id}:`, err);
      return null;
    }
  },

  deleteGlobalFeature: async (id) => {
    try {
      const response = await guruApi.deleteGlobalFeature(id);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to delete global feature for id ${id}:`, err);
      return null;
    }
  },

  fetchPlans: async () => {
    try {
      const response = await guruApi.getPlans();
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch subscription plans from backend:', err);
      return [];
    }
  },

  createPlan: async (planData) => {
    try {
      const response = await guruApi.createPlan(planData);
      return response.data || response;
    } catch (err) {
      console.warn('Failed to create subscription plan on backend:', err);
      return null;
    }
  },

  updatePlan: async (id, planData) => {
    try {
      const response = await guruApi.updatePlan(id, planData);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update subscription plan for id ${id}:`, err);
      return null;
    }
  },

  deletePlan: async (id) => {
    try {
      const response = await guruApi.deletePlan(id);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to delete subscription plan for id ${id}:`, err);
      return null;
    }
  },

  fetchHomeStats: async () => {
    try {
      const response = await guruApi.getHomeStats();
      return response.data || response || {};
    } catch (err) {
      console.warn('Failed to fetch home stats from backend:', err);
      return {};
    }
  },

  submitInquiry: async (inquiryData) => {
    return await guruApi.createInquiry(inquiryData);
  },

  fetchInquiries: async (params = {}) => {
    try {
      const response = await guruApi.getInquiries(params);
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch inquiries from backend:', err);
      return [];
    }
  },

  updateInquiryStatus: async (id, status) => {
    try {
      const response = await guruApi.updateInquiryStatus(id, status);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update inquiry status for id ${id}:`, err);
      return null;
    }
  },

  deleteInquiry: async (id) => {
    try {
      const response = await guruApi.deleteInquiry(id);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to delete inquiry for id ${id}:`, err);
      return null;
    }
  },

  fetchInquiryStats: async (params = {}) => {
    try {
      const response = await guruApi.getInquiryStats(params);
      return response.data || response || {};
    } catch (err) {
      console.warn('Failed to fetch inquiry stats:', err);
      return {};
    }
  },

  submitReview: async (reviewData) => {
    return await guruApi.addReview(reviewData);
  },

  registerAcademy: async (academyData) => {
    return await guruApi.createAcademy(academyData);
  },

  fetchAcademyBySlug: async (slug) => {
    try {
      const response = await guruApi.getAcademyBySlug(slug);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to fetch academy profile for slug ${slug}:`, err);
      return null;
    }
  },

  updateAcademyProfile: async (id, profileData) => {
    try {
      const response = await guruApi.updateAcademyProfile(id, profileData);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update academy profile for id ${id}:`, err);
      return null;
    }
  },

  updateAcademyStatus: async (id, status, notes = '') => {
    try {
      const response = await guruApi.updateAcademyStatus(id, status, notes);
      return response.data || response;
    } catch (err) {
      console.warn(`Failed to update academy status for id ${id}:`, err);
      return null;
    }
  },

  fetchAllAcademies: async (params = {}) => {
    try {
      const response = await guruApi.getAllAcademies(params);
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch all academies from backend:', err);
      return [];
    }
  },

  fetchAcademyApprovals: async (status = 'all') => {
    try {
      const response = await guruApi.getAcademyApprovals(status);
      return response.data || response || [];
    } catch (err) {
      console.warn('Failed to fetch academy approvals from backend:', err);
      return [];
    }
  }
};

export default guruService;
