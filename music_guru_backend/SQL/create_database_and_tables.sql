-- =============================================================================
-- Single Master SQL Script: Create Database & All Tables
-- Engine Compatibility: MS SQL Server (SSMS / Azure Data Studio) & MySQL (AUTO_INCREMENT)
-- Database: FindMyMusicGurukul
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE DATABASE
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FindMyMusicGurukul')
BEGIN
    CREATE DATABASE FindMyMusicGurukul;
END
GO

USE FindMyMusicGurukul;
GO

-- -----------------------------------------------------------------------------
-- 2. ROLES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 3. SUBSCRIPTIONS MASTER TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
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
-- 3A. FEATURES MASTER TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE features (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    name VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 3B. SUBSCRIPTION_FEATURES JUNCTION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE subscription_features (
    subscription_id INT NOT NULL,
    feature_id INT NOT NULL,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (subscription_id, feature_id),
    CONSTRAINT fk_subfeat_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_subfeat_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);
GO

-- -----------------------------------------------------------------------------
-- 4. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    phone VARCHAR(20),
    role_id INT NOT NULL,
    subscription_id INT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_users_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);
GO

-- -----------------------------------------------------------------------------
-- 5. USER_SUBSCRIPTIONS TABLE (Junction / History Table)
-- -----------------------------------------------------------------------------
CREATE TABLE user_subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
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
-- 6. CITIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE cities (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- 7. AREAS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE areas (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    city_id INT NOT NULL,
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
-- 8. SKILLS / INSTRUMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
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
-- 9. ACADEMIES / MUSIC GURUS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE academies (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    slug VARCHAR(150) NOT NULL UNIQUE,
    academy_name VARCHAR(200) NOT NULL,
    teacher_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_id INT NULL,
    subscription_id INT NULL,
    city_id INT NOT NULL,
    area_id INT NOT NULL,
    experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    bio VARCHAR(MAX),
    address VARCHAR(MAX),
    pincode VARCHAR(10),
    fees_per_month DECIMAL(10, 2),
    operating_hours VARCHAR(100),
    teaching_modes VARCHAR(255) DEFAULT 'Offline, Online',
    batch_types VARCHAR(255) DEFAULT '1-on-1 Individual, Small Group',
    languages VARCHAR(255) DEFAULT 'English, Hindi',
    profile_image VARCHAR(MAX),
    cover_image VARCHAR(MAX),
    map_url VARCHAR(MAX),
    whatsapp VARCHAR(50),
    social_website VARCHAR(255),
    social_instagram VARCHAR(255),
    social_youtube VARCHAR(255),
    social_facebook VARCHAR(255),
    social_linkedin VARCHAR(255),
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
-- 10. ACADEMY_SKILLS JUNCTION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE academy_skills (
    academy_id INT NOT NULL,
    skill_id INT NOT NULL,
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
-- 11. INQUIRIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE inquiries (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    academy_id INT NOT NULL,
    skill_id INT NULL,
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
-- 12. REVIEWS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Use AUTO_INCREMENT in MySQL
    academy_id INT NOT NULL,
    user_id INT NULL,
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
-- 13. PERFORMANCE INDEXES
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
