-- =============================================================================
-- Migration Script: Add subscription details and feature flags to academies table
-- Target Database: FindMyMusicGurukul
-- Engine: MS SQL Server
-- =============================================================================

USE FindMyMusicGurukul;
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_plan_name'
)
BEGIN
    ALTER TABLE academies ADD subscription_plan_name VARCHAR(100) NULL;
    PRINT '✅ Column subscription_plan_name added to academies table.';
END
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_status'
)
BEGIN
    ALTER TABLE academies ADD subscription_status VARCHAR(20) NULL DEFAULT 'Active';
    PRINT '✅ Column subscription_status added to academies table.';
END
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_start'
)
BEGIN
    ALTER TABLE academies ADD subscription_start DATETIME NULL;
    PRINT '✅ Column subscription_start added to academies table.';
END
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_expiry'
)
BEGIN
    ALTER TABLE academies ADD subscription_expiry DATETIME NULL;
    PRINT '✅ Column subscription_expiry added to academies table.';
END
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_social_media'
)
BEGIN
    ALTER TABLE academies ADD has_social_media BIT NOT NULL DEFAULT 0;
    PRINT '✅ Column has_social_media added to academies table.';
END
GO

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_google_map'
)
BEGIN
    ALTER TABLE academies ADD has_google_map BIT NOT NULL DEFAULT 0;
    PRINT '✅ Column has_google_map added to academies table.';
END
GO
