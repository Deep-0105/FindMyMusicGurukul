const { executeQuery } = require('../config/db');

const expireSubscriptions = async () => {
  console.log('[Cron] Running subscription expiration check...');
  try {
    // 1. Update academies
    await executeQuery(`
      UPDATE academies 
      SET subscription_id = '1',
          subscription_plan_name = 'Free Plan',
          subscription_status = 'Active',
          subscription_expiry = '2099-12-31',
          has_social_media = 0,
          has_google_map = 0,
          updated_at = GETDATE()
      WHERE (subscription_expiry IS NOT NULL AND subscription_expiry < GETDATE() AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1')) 
         OR (subscription_status = 'Expired' AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'));
    `);

    // 2. Update users table based on user_subscriptions expiry
    await executeQuery(`
      UPDATE users
      SET subscription_id = '1',
          updated_at = GETDATE()
      WHERE id IN (
        SELECT user_id FROM user_subscriptions 
        WHERE (expiry_date IS NOT NULL AND expiry_date < GETDATE() AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'))
           OR (status = 'Expired' AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'))
      );
    `);

    // 3. Update user_subscriptions
    await executeQuery(`
      UPDATE user_subscriptions
      SET subscription_id = '1',
          start_date = GETDATE(),
          expiry_date = '2099-12-31',
          status = 'Active',
          payment_status = 'Paid',
          updated_at = GETDATE()
      WHERE (expiry_date IS NOT NULL AND expiry_date < GETDATE() AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'))
         OR (status = 'Expired' AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'));
    `);

    console.log('[Cron] Subscription expiration check completed.');
  } catch (err) {
    console.error('[Cron] Error running subscription expiration check:', err.message);
  }
};

const startSubscriptionCron = () => {
  // Run once on startup
  expireSubscriptions();
  
  // Run every 12 hours
  const INTERVAL_MS = 12 * 60 * 60 * 1000;
  setInterval(expireSubscriptions, INTERVAL_MS);
};

module.exports = {
  startSubscriptionCron
};
