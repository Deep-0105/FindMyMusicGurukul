-- =============================================================================
-- Migration: Add Missing Profile Fields to Academies Table
-- Target Table: [FindMyMusicGurukul].[dbo].[academies]
-- Description: Adds missing columns for teaching modes, batch types, languages,
--              profile & cover images, google map link, whatsapp, social links,
--              and profile view counter.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'teaching_modes')
BEGIN
    ALTER TABLE academies ADD teaching_modes VARCHAR(255) DEFAULT 'Offline, Online';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'batch_types')
BEGIN
    ALTER TABLE academies ADD batch_types VARCHAR(255) DEFAULT 'Individual, Group';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'languages')
BEGIN
    ALTER TABLE academies ADD languages VARCHAR(255) DEFAULT 'English, Hindi';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'profile_image')
BEGIN
    ALTER TABLE academies ADD profile_image VARCHAR(MAX) NULL;
END
ELSE
BEGIN
    ALTER TABLE academies ALTER COLUMN profile_image VARCHAR(MAX) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'cover_image')
BEGIN
    ALTER TABLE academies ADD cover_image VARCHAR(MAX) NULL;
END
ELSE
BEGIN
    ALTER TABLE academies ALTER COLUMN cover_image VARCHAR(MAX) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'map_url')
BEGIN
    ALTER TABLE academies ADD map_url VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'whatsapp')
BEGIN
    ALTER TABLE academies ADD whatsapp VARCHAR(20) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'social_website')
BEGIN
    ALTER TABLE academies ADD social_website VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'social_instagram')
BEGIN
    ALTER TABLE academies ADD social_instagram VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'social_youtube')
BEGIN
    ALTER TABLE academies ADD social_youtube VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'social_facebook')
BEGIN
    ALTER TABLE academies ADD social_facebook VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'social_linkedin')
BEGIN
    ALTER TABLE academies ADD social_linkedin VARCHAR(500) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'profile_views')
BEGIN
    ALTER TABLE academies ADD profile_views INT NOT NULL DEFAULT 0;
END;
GO
