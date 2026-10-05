const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const guruController = require('../controllers/guruController');

// Razorpay Payment Gateway Endpoints
router.post('/payments/create-order', paymentController.createOrder);
router.post('/payments/verify', paymentController.verifyPayment);
router.get('/payments/status/:orderId', paymentController.getPaymentStatus);
router.get('/payments/history', paymentController.getPaymentHistory);
router.post('/payments/webhook', paymentController.handleWebhook);

// Subscription Lifecycle Endpoint Aliases
router.get('/subscriptions/current', guruController.getCurrentSubscription);
router.post('/subscriptions/cancel', guruController.cancelSubscription);

module.exports = router;
