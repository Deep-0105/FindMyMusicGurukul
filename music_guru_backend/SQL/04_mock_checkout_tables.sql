-- -----------------------------------------------------------------------------
-- 04_mock_checkout_tables.sql
-- FindMyMusicGurukul - Mock Payment Checkout & Subscription History Tables
-- -----------------------------------------------------------------------------

IF OBJECT_ID('mock_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE mock_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        transaction_ref VARCHAR(100) NOT NULL UNIQUE,
        user_id INT NULL,
        academy_id INT NULL,
        subscription_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        billing_period_months INT DEFAULT 12,
        payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('SUCCESS', 'FAILED', 'CANCELLED', 'PENDING')),
        payment_method VARCHAR(50) DEFAULT 'MOCK_CHECKOUT',
        failure_reason VARCHAR(255) NULL,
        is_mock BIT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_mock_txn_ref ON mock_transactions(transaction_ref);
    CREATE INDEX idx_mock_txn_academy ON mock_transactions(academy_id);
    CREATE INDEX idx_mock_txn_user ON mock_transactions(user_id);
END
GO

IF OBJECT_ID('subscription_history', 'U') IS NULL
BEGIN
    CREATE TABLE subscription_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        academy_id INT NULL,
        subscription_id INT NOT NULL,
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('ACTIVATED', 'UPGRADED', 'DOWNGRADED', 'CANCELLED', 'EXPIRED')),
        start_date DATETIME NOT NULL DEFAULT GETDATE(),
        expiry_date DATETIME NOT NULL,
        transaction_ref VARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_sub_hist_academy ON subscription_history(academy_id);
    CREATE INDEX idx_sub_hist_user ON subscription_history(user_id);
END
GO
