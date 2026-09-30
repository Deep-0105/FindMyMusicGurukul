-- =============================================================================
-- Database Schema: FindMyMusicGurukul Platform
-- Engine Compatibility: MS SQL Server (SSMS / Azure Data Studio), PostgreSQL, MySQL 8.0+
-- Description: Core tables for managing Roles, Users, Subscriptions, User Subscriptions,
--              Cities, Areas, Skills, Academies, Academy-Skills, Inquiries, and Reviews.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ROLES TABLE
-- Master table for system roles (superadmin, admin, student).
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 2. SUBSCRIPTIONS MASTER TABLE
-- Master table for student & academy subscription plans.
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    target_role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student' or 'academy'
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_months INT NOT NULL DEFAULT 1,
    description VARCHAR(MAX),
    features VARCHAR(MAX),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 3. USERS TABLE
-- Stores administrative users, academy owners, and students.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    phone VARCHAR(20),
    role_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_users_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);
GO

-- -----------------------------------------------------------------------------
-- 4. USER_SUBSCRIPTIONS TABLE (Junction / History Table)
-- Tracks active and historic student & academy subscriptions.
-- -----------------------------------------------------------------------------
CREATE TABLE user_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL DEFAULT GETDATE(),
    expiry_date DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded')),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_usersubs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_usersubs_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);
GO

-- -----------------------------------------------------------------------------
-- 5. CITIES TABLE
-- Master table for supported cities.
-- -----------------------------------------------------------------------------
CREATE TABLE cities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 6. AREAS TABLE
-- Localities/Areas belonging to specific cities.
-- -----------------------------------------------------------------------------
CREATE TABLE areas (
    id VARCHAR(50) PRIMARY KEY,
    city_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_areas_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    CONSTRAINT uq_city_area UNIQUE (city_id, name)
);
GO

-- -----------------------------------------------------------------------------
-- 7. SKILLS / INSTRUMENTS TABLE
-- Master table for musical instruments and vocal skills taught.
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    category VARCHAR(50) DEFAULT 'General',
    description VARCHAR(MAX),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 8. ACADEMIES / MUSIC GURUS TABLE
-- Profile information for music teachers and academies.
-- -----------------------------------------------------------------------------
CREATE TABLE academies (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    academy_name VARCHAR(200) NOT NULL,
    teacher_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_id VARCHAR(50),
    subscription_id VARCHAR(50) NULL,
    city_id VARCHAR(50) NOT NULL,
    area_id VARCHAR(50) NOT NULL,
    experience_years DECIMAL(4, 1) NOT NULL DEFAULT 0.0 CHECK (experience_years >= 0),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    bio VARCHAR(MAX),
    address VARCHAR(MAX),
    fees_per_month DECIMAL(10, 2),
    operating_hours VARCHAR(100),
    teaching_modes VARCHAR(255) DEFAULT 'Offline, Online',
    batch_types VARCHAR(255) DEFAULT 'Individual, Group',
    languages VARCHAR(255) DEFAULT 'English, Hindi',
    profile_image VARCHAR(MAX),
    cover_image VARCHAR(MAX),
    map_url VARCHAR(500),
    whatsapp VARCHAR(20),
    social_website VARCHAR(500),
    social_instagram VARCHAR(500),
    social_youtube VARCHAR(500),
    social_facebook VARCHAR(500),
    social_linkedin VARCHAR(500),
    profile_views INT NOT NULL DEFAULT 0,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_academies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_academies_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    CONSTRAINT fk_academies_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT fk_academies_area FOREIGN KEY (area_id) REFERENCES areas(id)
);
GO

-- -----------------------------------------------------------------------------
-- 9. ACADEMY_SKILLS TABLE (Junction Table)
-- Many-to-Many mapping between Academies and Skills/Instruments.
-- -----------------------------------------------------------------------------
CREATE TABLE academy_skills (
    academy_id VARCHAR(50) NOT NULL,
    skill_id VARCHAR(50) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'All Levels',
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (academy_id, skill_id),
    CONSTRAINT fk_academyskills_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT fk_academyskills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
GO

-- -----------------------------------------------------------------------------
-- 10. INQUIRIES TABLE
-- Student leads/inquiries submitted to music academies.
-- -----------------------------------------------------------------------------
CREATE TABLE inquiries (
    id VARCHAR(50) PRIMARY KEY,
    academy_id VARCHAR(50) NOT NULL,
    skill_id VARCHAR(50),
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    preferred_slot VARCHAR(50),
    message VARCHAR(MAX),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Contacted', 'Converted', 'Closed')),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_inquiries_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT fk_inquiries_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);
GO

-- -----------------------------------------------------------------------------
-- 11. REVIEWS TABLE
-- Ratings and feedback submitted by students.
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id VARCHAR(50) PRIMARY KEY,
    academy_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    student_name VARCHAR(150) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(MAX),
    is_published BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_reviews_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
GO

-- -----------------------------------------------------------------------------
-- INDEXES FOR OPTIMIZED QUERYING
-- -----------------------------------------------------------------------------
CREATE INDEX idx_academies_status ON academies(status);
CREATE INDEX idx_academies_city_area ON academies(city_id, area_id);
CREATE INDEX idx_academies_slug ON academies(slug);
CREATE INDEX idx_areas_city ON areas(city_id);
CREATE INDEX idx_inquiries_academy ON inquiries(academy_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_reviews_academy ON reviews(academy_id);
CREATE INDEX idx_usersubs_user ON user_subscriptions(user_id);
CREATE INDEX idx_usersubs_status ON user_subscriptions(status);
GO
