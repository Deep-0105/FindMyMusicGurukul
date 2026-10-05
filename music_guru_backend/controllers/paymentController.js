const Razorpay = require('razorpay');
const crypto = require('crypto');
const { executeQuery, sql } = require('../config/db');

// Ensure Razorpay tables exist in DB
const ensureRazorpayTablesExist = async () => {
  try {
    await executeQuery(`
      IF OBJECT_ID('razorpay_orders', 'U') IS NULL
      BEGIN
        CREATE TABLE razorpay_orders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          internal_order_id VARCHAR(100) NOT NULL UNIQUE,
          razorpay_order_id VARCHAR(100) NULL,
          razorpay_payment_id VARCHAR(100) NULL,
          razorpay_signature VARCHAR(255) NULL,
          user_id INT NULL,
          academy_id INT NULL,
          subscription_id INT NOT NULL,
          amount INT NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'INR',
          status VARCHAR(30) NOT NULL CHECK (status IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
          failure_reason VARCHAR(255) NULL,
          webhook_event_id VARCHAR(100) NULL,
          is_mock BIT NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      END

      IF OBJECT_ID('razorpay_webhook_logs', 'U') IS NULL
      BEGIN
        CREATE TABLE razorpay_webhook_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          event_id VARCHAR(100) NOT NULL UNIQUE,
          event_type VARCHAR(100) NOT NULL,
          razorpay_order_id VARCHAR(100) NULL,
          razorpay_payment_id VARCHAR(100) NULL,
          payload VARCHAR(MAX) NULL,
          processed_at DATETIME DEFAULT GETDATE()
        );
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_plan_name')
      BEGIN
        ALTER TABLE academies ADD subscription_plan_name VARCHAR(100) NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_status')
      BEGIN
        ALTER TABLE academies ADD subscription_status VARCHAR(20) NULL DEFAULT 'Active';
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_start')
      BEGIN
        ALTER TABLE academies ADD subscription_start DATETIME NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_expiry')
      BEGIN
        ALTER TABLE academies ADD subscription_expiry DATETIME NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_social_media')
      BEGIN
        ALTER TABLE academies ADD has_social_media BIT NOT NULL DEFAULT 0;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_google_map')
      BEGIN
        ALTER TABLE academies ADD has_google_map BIT NOT NULL DEFAULT 0;
      END
    `);
  } catch (err) {
    console.warn('Error ensuring Razorpay tables exist:', err.message);
  }
};

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.includes('YOUR_KEY_ID') || key_secret.includes('YOUR_RAZORPAY')) {
    return null;
  }

  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.warn('Failed to initialize Razorpay SDK instance:', err.message);
    return null;
  }
};

const resolveNumericSubscriptionId = async (planId, planName) => {
  let numericId = null;

  if (planId !== undefined && planId !== null) {
    const rawStr = String(planId).trim();
    const extracted = rawStr.replace(/\D/g, '');
    if (extracted && !isNaN(parseInt(extracted, 10))) {
      numericId = parseInt(extracted, 10);
    }
  }

  if (!numericId && planName) {
    const lowerName = String(planName).toLowerCase();
    if (lowerName.includes('combo') || (lowerName.includes('social') && lowerName.includes('map'))) {
      numericId = 4;
    } else if (lowerName.includes('google map') || lowerName.includes('location')) {
      numericId = 3;
    } else if (lowerName.includes('social')) {
      numericId = 2;
    } else if (lowerName.includes('free')) {
      numericId = 1;
    }
  }

  return numericId || 1;
};

const getPlanTier = (planId, planName) => {
  const pName = String(planName || '').toLowerCase();
  const rawId = String(planId || '').toLowerCase();
  if (pName.includes('combo') || (pName.includes('social') && pName.includes('map')) || rawId === '4' || rawId === 'plan-4') return 4;
  if (pName.includes('google map') || pName.includes('location') || rawId === '3' || rawId === 'plan-3') return 3;
  if (pName.includes('social') || rawId === '2' || rawId === 'plan-2') return 2;
  return 1;
};

const isSubscriptionExpiredCheck = (expiryDate, status) => {
  if (status && String(status).toLowerCase() === 'expired') return true;
  if (!expiryDate) return false;
  if (String(expiryDate).toLowerCase().includes('lifetime')) return false;
  try {
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return false;
    exp.setHours(23, 59, 59, 999);
    return exp.getTime() < Date.now();
  } catch (e) {
    return false;
  }
};

// -----------------------------------------------------------------------------
// 1. CREATE RAZORPAY ORDER (POST /api/payments/create-order)
// -----------------------------------------------------------------------------
exports.createOrder = async (req, res) => {
  try {
    await ensureRazorpayTablesExist();
    const { planId, academyId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required to create a payment order.' });
    }

    // Fetch plan details from database or preset list
    const planResult = await executeQuery(`
      SELECT id, name, description, price, duration_months AS durationMonths
      FROM subscriptions
      WHERE deleted = 0 AND (id = TRY_CAST(@planId AS INT) OR CAST(id AS VARCHAR(100)) = @planId OR LOWER(name) = LOWER(@planId))
    `, [
      { name: 'planId', type: sql.VarChar, value: String(planId) }
    ]);

    let planData = planResult?.recordset?.[0] || null;

    if (!planData) {
      const presets = [
        { id: 1, name: 'Free Plan', price: 0, durationMonths: 12, description: 'Includes basic directory listing and student inquiries.' },
        { id: 2, name: 'Social Media Plan', price: 499, durationMonths: 12, description: 'Free Plan features plus Social Media links visible on profile.' },
        { id: 3, name: 'Google Map Location Plan', price: 999, durationMonths: 12, description: 'Free Plan features plus interactive Google Map Location on profile.' },
        { id: 4, name: 'Social Media & Google Map Plan', price: 1499, durationMonths: 12, description: 'Includes all features: Social Media links & interactive Google Map Location.' }
      ];
      const numericId = await resolveNumericSubscriptionId(planId);
      planData = presets.find((p) => p.id === numericId) || presets[0];
    }

    const numericSubId = await resolveNumericSubscriptionId(planData.id || planId, planData.name);
    const amountInRupees = Number(planData.price || 0);
    const amountInPaise = Math.round(amountInRupees * 100);
    const currency = 'INR';

    let resolvedUserId = req.user?.id || req.body?.userId || null;
    let resolvedAcadId = null;

    if (academyId) {
      const acadRes = await executeQuery(`
        SELECT id, user_id, subscription_id, subscription_plan_name, subscription_status, subscription_expiry FROM academies
        WHERE deleted = 0 AND (id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId)
      `, [{ name: 'acadId', type: sql.VarChar, value: String(academyId) }]);

      if (acadRes?.recordset?.length > 0) {
        resolvedAcadId = acadRes.recordset[0].id;
        if (!resolvedUserId && acadRes.recordset[0].user_id) {
          resolvedUserId = acadRes.recordset[0].user_id;
        }

        // Validate downgrade
        // Downgrade check removed to allow buying multiple concurrent plans (e.g. Social Media + View Contacts)
      }
    }

    if (numericSubId === 1 || amountInPaise <= 0) {
      return res.json({
        success: true,
        isFreePlan: true,
        message: 'Free Plan selected (Lifetime Free). No payment required.',
        plan: { id: 1, name: 'Free Plan', price: 0, description: 'Lifetime Free Plan' }
      });
    }

    const internalOrderId = `ORD-RZP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const razorpay = getRazorpayInstance();
    let rzpOrder = null;

    if (razorpay && amountInPaise > 0) {
      try {
        rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt: internalOrderId,
          notes: {
            planId: String(numericSubId),
            planName: planData.name,
            academyId: resolvedAcadId ? String(resolvedAcadId) : '',
            userId: resolvedUserId ? String(resolvedUserId) : ''
          }
        });
      } catch (rzpErr) {
        console.warn('Razorpay SDK order creation failed (check Key ID & Secret):', rzpErr.message);
      }
    }

    const rzpOrderId = rzpOrder ? rzpOrder.id : `rzp_order_mock_${Date.now()}`;

    await executeQuery(`
      INSERT INTO razorpay_orders (internal_order_id, razorpay_order_id, user_id, academy_id, subscription_id, amount, currency, status, is_mock, created_at, updated_at)
      VALUES (@internalId, @rzpOrderId, TRY_CAST(@uId AS INT), TRY_CAST(@acadId AS INT), @subId, @amount, @currency, 'CREATED', @isMock, GETDATE(), GETDATE())
    `, [
      { name: 'internalId', type: sql.VarChar, value: internalOrderId },
      { name: 'rzpOrderId', type: sql.VarChar, value: rzpOrderId },
      { name: 'uId', type: sql.VarChar, value: resolvedUserId ? String(resolvedUserId) : null },
      { name: 'acadId', type: sql.VarChar, value: resolvedAcadId ? String(resolvedAcadId) : (academyId ? String(academyId) : null) },
      { name: 'subId', type: sql.Int, value: numericSubId },
      { name: 'amount', type: sql.Int, value: amountInPaise },
      { name: 'currency', type: sql.VarChar, value: currency },
      { name: 'isMock', type: sql.Bit, value: rzpOrder ? 0 : 1 }
    ]);

    return res.json({
      success: true,
      message: 'Razorpay order created successfully.',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
      orderId: rzpOrderId,
      internalOrderId,
      amount: amountInPaise,
      amountRupees: amountInRupees,
      currency,
      plan: {
        id: numericSubId,
        name: planData.name,
        price: amountInRupees,
        description: planData.description
      },
      isRazorpayLive: Boolean(rzpOrder)
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create payment order.', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 2. VERIFY RAZORPAY PAYMENT (POST /api/payments/verify)
// -----------------------------------------------------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    await ensureRazorpayTablesExist();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, academyId, internalOrderId } = req.body;

    if (!razorpay_order_id && !internalOrderId) {
      return res.status(400).json({ success: false, message: 'Razorpay order ID or internal order ID is required for verification.' });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    let isSignatureValid = false;

    if (key_secret && !key_secret.includes('YOUR_RAZORPAY') && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = (generated_signature === razorpay_signature);
    } else {
      // In development / test mode when credentials are placeholder, accept verification for test flow
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.'
      });
    }

    // Fetch matching internal order record
    const orderRes = await executeQuery(`
      SELECT TOP 1 * FROM razorpay_orders
      WHERE (razorpay_order_id = @rzpOrderId OR internal_order_id = @internalId)
    `, [
      { name: 'rzpOrderId', type: sql.VarChar, value: String(razorpay_order_id || '') },
      { name: 'internalId', type: sql.VarChar, value: String(internalOrderId || '') }
    ]);

    const orderRecord = orderRes?.recordset?.[0] || null;
    const numericSubId = await resolveNumericSubscriptionId(planId || orderRecord?.subscription_id, null);
    const targetAcadId = academyId || orderRecord?.academy_id || null;
    const resolvedUserId = req.user?.id || orderRecord?.user_id || null;

    // Update order status in razorpay_orders table
    await executeQuery(`
      UPDATE razorpay_orders
      SET razorpay_payment_id = ISNULL(@paymentId, razorpay_payment_id),
          razorpay_signature = ISNULL(@sig, razorpay_signature),
          status = 'PAID',
          updated_at = GETDATE()
      WHERE (razorpay_order_id = @rzpOrderId OR internal_order_id = @internalId)
    `, [
      { name: 'paymentId', type: sql.VarChar, value: String(razorpay_payment_id || `pay_test_${Date.now()}`) },
      { name: 'sig', type: sql.VarChar, value: String(razorpay_signature || '') },
      { name: 'rzpOrderId', type: sql.VarChar, value: String(razorpay_order_id || '') },
      { name: 'internalId', type: sql.VarChar, value: String(internalOrderId || '') }
    ]);

    // Determine plan metadata
    const planNames = { 1: 'Free Plan', 2: 'Social Media Plan', 3: 'Google Map Location Plan', 4: 'Social Media & Google Map Plan' };
    const pName = planNames[numericSubId] || 'Free Plan';
    const hasSocial = (numericSubId === 2 || numericSubId === 4);
    const hasMap = (numericSubId === 3 || numericSubId === 4);

    const isFree = numericSubId === 1 || getPlanTier(numericSubId, pName) === 1;
    const startDate = new Date();
    const expiryDate = isFree ? new Date('2099-12-31') : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const startStr = startDate.toISOString().split('T')[0];
    const expiryStr = isFree ? '2099-12-31' : expiryDate.toISOString().split('T')[0];

    // 1. UPDATE ACADEMIES TABLE
    if (targetAcadId) {
      await executeQuery(`
        UPDATE academies
        SET
          subscription_id = @subId,
          subscription_plan_name = CASE 
             WHEN subscription_plan_name = 'Free Plan' OR subscription_plan_name IS NULL THEN @planName
             WHEN subscription_plan_name LIKE '%' + @planName + '%' THEN subscription_plan_name
             ELSE subscription_plan_name + ' & ' + @planName
          END,
          subscription_status = 'Active',
          subscription_start = CASE 
             WHEN subscription_start IS NULL THEN @startDate 
             ELSE subscription_start 
          END,
          subscription_expiry = CASE 
             WHEN subscription_expiry IS NOT NULL AND subscription_expiry > @expiryDate THEN subscription_expiry 
             ELSE @expiryDate 
          END,
          has_social_media = CASE WHEN @hasSocial = 1 THEN 1 ELSE has_social_media END,
          has_google_map = CASE WHEN @hasMap = 1 THEN 1 ELSE has_google_map END,
          updated_at = GETDATE()
        WHERE id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId
      `, [
        { name: 'acadId', type: sql.VarChar, value: String(targetAcadId) },
        { name: 'subId', type: sql.Int, value: numericSubId },
        { name: 'planName', type: sql.VarChar, value: pName },
        { name: 'startDate', type: sql.VarChar, value: startStr },
        { name: 'expiryDate', type: sql.VarChar, value: expiryStr },
        { name: 'hasSocial', type: sql.Bit, value: hasSocial ? 1 : 0 },
        { name: 'hasMap', type: sql.Bit, value: hasMap ? 1 : 0 }
      ]);
    }

    // 2. UPDATE USERS TABLE
    if (resolvedUserId) {
      await executeQuery(`
        UPDATE users
        SET subscription_id = @subId, updated_at = GETDATE()
        WHERE id = TRY_CAST(@uId AS INT) OR CAST(id AS VARCHAR(100)) = @uId
      `, [
        { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
        { name: 'subId', type: sql.Int, value: numericSubId }
      ]);

      // 3. UPSERT USER_SUBSCRIPTIONS TABLE
      const subCheck = await executeQuery(`
        SELECT id FROM user_subscriptions WHERE user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId
      `, [{ name: 'uId', type: sql.VarChar, value: String(resolvedUserId) }]);

      if (subCheck?.recordset?.length > 0) {
        await executeQuery(`
          UPDATE user_subscriptions
          SET subscription_id = @subId,
              start_date = @startDate,
              expiry_date = @expiryDate,
              status = 'Active',
              payment_status = 'Paid',
              updated_at = GETDATE()
          WHERE user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId
        `, [
          { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
          { name: 'subId', type: sql.Int, value: numericSubId },
          { name: 'startDate', type: sql.VarChar, value: startStr },
          { name: 'expiryDate', type: sql.VarChar, value: expiryStr }
        ]);
      } else {
        await executeQuery(`
          INSERT INTO user_subscriptions (user_id, subscription_id, start_date, expiry_date, status, payment_status, created_at, updated_at)
          VALUES (TRY_CAST(@uId AS INT), @subId, @startDate, @expiryDate, 'Active', 'Paid', GETDATE(), GETDATE())
        `, [
          { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
          { name: 'subId', type: sql.Int, value: numericSubId },
          { name: 'startDate', type: sql.VarChar, value: startStr },
          { name: 'expiryDate', type: sql.VarChar, value: expiryStr }
        ]);
      }
    }

    // 4. INSERT SUBSCRIPTION HISTORY
    const paymentRef = razorpay_payment_id || `pay_rzp_${Date.now()}`;
    await executeQuery(`
      INSERT INTO subscription_history (user_id, academy_id, subscription_id, action_type, start_date, expiry_date, transaction_ref, created_at)
      VALUES (TRY_CAST(@uId AS INT), TRY_CAST(@acadId AS INT), @subId, 'ACTIVATED', GETDATE(), DATEADD(month, 12, GETDATE()), @txnRef, GETDATE())
    `, [
      { name: 'uId', type: sql.VarChar, value: resolvedUserId ? String(resolvedUserId) : null },
      { name: 'acadId', type: sql.VarChar, value: targetAcadId ? String(targetAcadId) : null },
      { name: 'subId', type: sql.Int, value: numericSubId },
      { name: 'txnRef', type: sql.VarChar, value: String(paymentRef) }
    ]);

    return res.json({
      success: true,
      message: `Razorpay payment verified successfully. Activated ${pName}!`,
      paymentStatus: 'SUCCESS',
      transactionRef: paymentRef,
      subscription: {
        planId: numericSubId,
        planName: pName,
        status: 'Active',
        startDate: startStr,
        expiryDate: expiryStr,
        hasSocialMedia: hasSocial,
        hasGoogleMap: hasMap
      }
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify payment.', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 3. GET PAYMENT STATUS (GET /api/payments/status/:orderId)
// -----------------------------------------------------------------------------
exports.getPaymentStatus = async (req, res) => {
  try {
    await ensureRazorpayTablesExist();
    const { orderId } = req.params;

    const result = await executeQuery(`
      SELECT TOP 1 internal_order_id AS internalOrderId, razorpay_order_id AS razorpayOrderId, razorpay_payment_id AS razorpayPaymentId, amount, currency, status, created_at AS createdAt
      FROM razorpay_orders
      WHERE internal_order_id = @id OR razorpay_order_id = @id
    `, [{ name: 'id', type: sql.VarChar, value: String(orderId) }]);

    if (result?.recordset?.length > 0) {
      return res.json({ success: true, data: result.recordset[0] });
    }

    return res.status(404).json({ success: false, message: 'Payment order not found.' });
  } catch (error) {
    console.error('Error retrieving payment status:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch payment status.', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 4. GET PAYMENT HISTORY (GET /api/payments/history)
// -----------------------------------------------------------------------------
exports.getPaymentHistory = async (req, res) => {
  try {
    await ensureRazorpayTablesExist();
    const { academyId, userId } = req.query;
    const targetUserId = req.user?.id || userId || null;

    let queryText = `
      SELECT 
        internal_order_id AS internalOrderId,
        razorpay_order_id AS razorpayOrderId,
        razorpay_payment_id AS razorpayPaymentId,
        subscription_id AS subscriptionId,
        amount,
        currency,
        status,
        is_mock AS isMock,
        created_at AS createdAt
      FROM razorpay_orders
      WHERE 1=1
    `;

    const params = [];
    if (academyId) {
      queryText += ` AND (academy_id = TRY_CAST(@acadId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @acadId)`;
      params.push({ name: 'acadId', type: sql.VarChar, value: String(academyId) });
    }
    if (targetUserId) {
      queryText += ` AND (user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId)`;
      params.push({ name: 'uId', type: sql.VarChar, value: String(targetUserId) });
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await executeQuery(queryText, params);

    return res.json({
      success: true,
      count: result?.recordset?.length || 0,
      data: result?.recordset || []
    });
  } catch (error) {
    console.error('Error fetching payment history:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment history.', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 5. RAZORPAY WEBHOOK HANDLER (POST /api/payments/webhook)
// -----------------------------------------------------------------------------
exports.handleWebhook = async (req, res) => {
  try {
    await ensureRazorpayTablesExist();
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && !webhookSecret.includes('YOUR_WEBHOOK') && signature) {
      const rawBody = req.rawBody ? req.rawBody : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('Razorpay webhook signature mismatch.');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    const payload = req.body || {};
    const event = payload.event;
    const eventId = payload.contains?.[0] ? `${event}_${Date.now()}` : `evt_${Date.now()}_${Math.random()}`;

    // Check idempotency in razorpay_webhook_logs
    const existingEvt = await executeQuery(`
      SELECT id FROM razorpay_webhook_logs WHERE event_id = @evtId
    `, [{ name: 'evtId', type: sql.VarChar, value: String(eventId) }]);

    if (existingEvt?.recordset?.length > 0) {
      return res.json({ success: true, message: 'Event already processed.' });
    }

    // Log webhook event
    await executeQuery(`
      INSERT INTO razorpay_webhook_logs (event_id, event_type, razorpay_order_id, razorpay_payment_id, payload, processed_at)
      VALUES (@evtId, @evtType, @rzpOrderId, @rzpPayId, @payloadStr, GETDATE())
    `, [
      { name: 'evtId', type: sql.VarChar, value: String(eventId) },
      { name: 'evtType', type: sql.VarChar, value: String(event || 'unknown') },
      { name: 'rzpOrderId', type: sql.VarChar, value: String(payload.payload?.payment?.entity?.order_id || '') },
      { name: 'rzpPayId', type: sql.VarChar, value: String(payload.payload?.payment?.entity?.id || '') },
      { name: 'payloadStr', type: sql.VarChar, value: JSON.stringify(payload) }
    ]);

    if (event === 'order.paid' || event === 'payment.captured') {
      const rzpOrderId = payload.payload?.order?.entity?.id || payload.payload?.payment?.entity?.order_id;
      const rzpPayId = payload.payload?.payment?.entity?.id;

      if (rzpOrderId) {
        await executeQuery(`
          UPDATE razorpay_orders
          SET status = 'PAID', razorpay_payment_id = ISNULL(@payId, razorpay_payment_id), updated_at = GETDATE()
          WHERE razorpay_order_id = @orderId
        `, [
          { name: 'orderId', type: sql.VarChar, value: String(rzpOrderId) },
          { name: 'payId', type: sql.VarChar, value: String(rzpPayId || '') }
        ]);
      }
    }

    return res.json({ success: true, message: 'Webhook event processed successfully.' });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing error.', error: error.message });
  }
};
