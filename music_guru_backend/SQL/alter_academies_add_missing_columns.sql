-- =============================================================================
-- Alter Table Script: Add Missing Columns to Academies Table
-- Works for: MS SQL Server (SSMS / Azure Data Studio)
-- Database: FindMyMusicGurukul
-- =============================================================================

USE FindMyMusicGurukul;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'teaching_modes')
BEGIN
    ALTER TABLE academies ADD teaching_modes VARCHAR(255) DEFAULT 'Offline, Online';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'batch_types')
BEGIN
    ALTER TABLE academies ADD batch_types VARCHAR(255) DEFAULT '1-on-1 Individual, Small Group';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'languages')
BEGIN
    ALTER TABLE academies ADD languages VARCHAR(255) DEFAULT 'English, Hindi';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'profile_image')
BEGIN
    ALTER TABLE academies ADD profile_image VARCHAR(MAX);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'cover_image')
BEGIN
    ALTER TABLE academies ADD cover_image VARCHAR(MAX);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'map_url')
BEGIN
    ALTER TABLE academies ADD map_url VARCHAR(MAX);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'whatsapp')
BEGIN
    ALTER TABLE academies ADD whatsapp VARCHAR(50);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'social_website')
BEGIN
    ALTER TABLE academies ADD social_website VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'social_instagram')
BEGIN
    ALTER TABLE academies ADD social_instagram VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'social_youtube')
BEGIN
    ALTER TABLE academies ADD social_youtube VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'social_facebook')
BEGIN
    ALTER TABLE academies ADD social_facebook VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'social_linkedin')
BEGIN
    ALTER TABLE academies ADD social_linkedin VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('academies') AND name = 'profile_views')
BEGIN
    ALTER TABLE academies ADD profile_views INT NOT NULL DEFAULT 0;
END
GO

PRINT 'Successfully added missing columns to academies table!';
GO
