const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guruController');

router.get('/cities', guruController.getCities);
router.get('/skills', guruController.getSkills);
router.post('/skills', guruController.createSkill);
router.put('/skills/:id', guruController.updateSkill);
router.delete('/skills/:id', guruController.deleteSkill);

router.get('/features', guruController.getFeatures);
router.post('/features', guruController.createFeature);
router.put('/features/:id', guruController.updateFeature);
router.delete('/features/:id', guruController.deleteFeature);

router.get('/global-features', guruController.getGlobalFeatures);
router.post('/global-features', guruController.createGlobalFeature);
router.put('/global-features/:id', guruController.updateGlobalFeature);
router.delete('/global-features/:id', guruController.deleteGlobalFeature);

// Subscription Pricing Plans Endpoints
router.get('/plans', guruController.getPlans);
router.post('/plans', guruController.createPlan);
router.put('/plans/:id', guruController.updatePlan);
router.delete('/plans/:id', guruController.deletePlan);
router.get('/academies', guruController.getAcademies);
router.get('/academies/approvals', guruController.getAcademyApprovals);
router.post('/academies', guruController.createAcademy);
router.put('/academies/:id/status', guruController.updateAcademyStatus);
router.patch('/academies/:id/status', guruController.updateAcademyStatus);
router.get('/academies/:slug', guruController.getAcademyBySlug);
router.put('/academies/:id', guruController.updateAcademyProfile);

// Inquiries Endpoints
router.post('/inquiries', guruController.createInquiry);
router.get('/inquiries', guruController.getInquiries);
router.get('/inquiries/stats', guruController.getInquiryStats);
router.get('/inquiries/:id', guruController.getInquiryById);
router.put('/inquiries/:id/status', guruController.updateInquiryStatus);
router.patch('/inquiries/:id/status', guruController.updateInquiryStatus);
router.put('/inquiries/:id', guruController.updateInquiryStatus);
router.delete('/inquiries/:id', guruController.deleteInquiry);

// Reviews Endpoints
router.get('/reviews', guruController.getReviews);
router.post('/reviews', guruController.createReview);

router.get('/home/stats', guruController.getHomeStats);
router.get('/super-admin/reports', guruController.getSuperAdminReports);

// Mock Payment Checkout & Subscription Lifecycle Endpoints
router.post('/checkout/initiate', guruController.initiateCheckout);
router.post('/checkout/confirm', guruController.confirmCheckout);
router.get('/subscriptions/current', guruController.getCurrentSubscription);
router.post('/subscriptions/cancel', guruController.cancelSubscription);

module.exports = router;