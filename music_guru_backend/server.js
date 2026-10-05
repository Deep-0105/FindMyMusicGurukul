require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const guruRoutes = require('./routes/guruRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const staticPagesRoutes = require('./routes/staticPagesRoutes');
const { apiLogger, apiErrorHandler } = require('./middleware/loggerMiddleware');
const { startSubscriptionCron } = require('./utils/subscriptionCron');

const app = express();
const PORT = process.env.PORT || 5001;

// Start background cron jobs
startSubscriptionCron();

app.use(helmet());
app.use(cors());
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Request Logging Middleware
app.use(apiLogger);

app.use('/api/auth', authRoutes);
app.use('/api/static-pages', staticPagesRoutes);
app.use('/api', paymentRoutes);
app.use('/api', guruRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'FindMyMusicGurukul API', timestamp: new Date() });
});

// Global API Error Handler Middleware
app.use(apiErrorHandler);

app.listen(PORT, () => {
  console.log(`🎵 FindMyMusicGurukul API Server running on port ${PORT}`);
});
