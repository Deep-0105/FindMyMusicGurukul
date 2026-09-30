-- =============================================================================
-- Migration Script: Add subscription_id column to users table
-- Target Database: FindMyMusicGurukul
-- Engine: MS SQL Server
-- =============================================================================

USE FindMyMusicGurukul;
GO

-- 1. Add subscription_id column if it doesn't already exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'subscription_id'
)
BEGIN
    ALTER TABLE users ADD subscription_id VARCHAR(50) NULL;
    PRINT '✅ Column subscription_id added successfully to users table.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Column subscription_id already exists in users table.';
END
GO

-- 2. Add foreign key constraint to subscriptions table if constraint does not exist
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'fk_users_subscription' AND parent_object_id = OBJECT_ID('users')
)
BEGIN
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'subscriptions')
    BEGIN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_subscription 
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
        PRINT '✅ Foreign Key fk_users_subscription created successfully.';
    END
END
GO
