const { executeQuery } = require('../config/db');

const expireSubscriptions = async () => {
  console.log('[Cron] Running subscription expiration check...');
  try {
    // 1. Update academies
    // 1. Update academies
    await executeQuery(`
      -- Expire full subscription if main expiry passed
      UPDATE academies 
      SET subscription_id = '1',
          subscription_plan_name = 'Free Plan',
          subscription_status = 'Active',
          subscription_expiry = '2099-12-31',
          updated_at = GETDATE()
      WHERE (subscription_expiry IS NOT NULL AND subscription_expiry < GETDATE() AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1')) 
         OR (subscription_status = 'Expired' AND CAST(subscription_id AS VARCHAR(50)) NOT IN ('1', 'plan-1'));
    `);

    // 2. Update users table based on user_subscriptions expiry (only for their main overarching plan)
    // Actually we can skip updating user's main plan here since they might have multiple active ones. 
    // We'll let the user_subscriptions table handle the source of truth for active features.
    
    // 3. Update user_subscriptions
    await executeQuery(`
      UPDATE user_subscriptions
      SET status = 'Expired',
          updated_at = GETDATE()
      WHERE status = 'Active' 
        AND expiry_date IS NOT NULL 
        AND expiry_date < GETDATE();
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
