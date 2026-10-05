-- -----------------------------------------------------------------------------
-- 06_razorpay_payments_tables.sql
-- FindMyMusicGurukul - Real Razorpay Payment Orders & Webhook Log Tables
-- -----------------------------------------------------------------------------

USE FindMyMusicGurukul;
GO

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
        amount INT NOT NULL, -- Amount in paise (e.g., 49900 paise = ₹499.00)
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(30) NOT NULL CHECK (status IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
        failure_reason VARCHAR(255) NULL,
        webhook_event_id VARCHAR(100) NULL,
        is_mock BIT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_rzp_internal_order ON razorpay_orders(internal_order_id);
    CREATE INDEX idx_rzp_order_id ON razorpay_orders(razorpay_order_id);
    CREATE INDEX idx_rzp_payment_id ON razorpay_orders(razorpay_payment_id);
    CREATE INDEX idx_rzp_user_id ON razorpay_orders(user_id);
    CREATE INDEX idx_rzp_academy_id ON razorpay_orders(academy_id);
END
GO

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

    CREATE INDEX idx_rzp_webhook_evt ON razorpay_webhook_logs(event_id);
END
GO
