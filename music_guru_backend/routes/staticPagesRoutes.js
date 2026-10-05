const express = require('express');
const router = express.Router();
const { getStaticPages, updateStaticPages } = require('../controllers/staticPagesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get static pages data (public)
router.get('/', getStaticPages);

// Update static pages data (protected - should ideally check for super admin, but using standard protect for now)
router.put('/', authenticateToken, updateStaticPages);

module.exports = router;
