-- =============================================================================
-- Migration Script: Drop & Re-create Database Tables with Auto-Increment IDs
-- Works for: MS SQL Server (SSMS / Azure Data Studio) & MySQL / MariaDB
-- Database: FindMyMusicGurukul
-- =============================================================================

USE FindMyMusicGurukul;
GO

-- -----------------------------------------------------------------------------
-- STEP 1: DROP EXISTING TABLES IN REVERSE FOREIGN KEY ORDER
-- -----------------------------------------------------------------------------
IF OBJECT_ID('reviews', 'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID('inquiries', 'U') IS NOT NULL DROP TABLE inquiries;
IF OBJECT_ID('academy_skills', 'U') IS NOT NULL DROP TABLE academy_skills;
IF OBJECT_ID('academies', 'U') IS NOT NULL DROP TABLE academies;
IF OBJECT_ID('skills', 'U') IS NOT NULL DROP TABLE skills;
IF OBJECT_ID('areas', 'U') IS NOT NULL DROP TABLE areas;
IF OBJECT_ID('cities', 'U') IS NOT NULL DROP TABLE cities;
IF OBJECT_ID('user_subscriptions', 'U') IS NOT NULL DROP TABLE user_subscriptions;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('subscription_features', 'U') IS NOT NULL DROP TABLE subscription_features;
IF OBJECT_ID('features', 'U') IS NOT NULL DROP TABLE features;
IF OBJECT_ID('subscriptions', 'U') IS NOT NULL DROP TABLE subscriptions;
IF OBJECT_ID('roles', 'U') IS NOT NULL DROP TABLE roles;
GO

-- -----------------------------------------------------------------------------
-- STEP 2: CREATE TABLES WITH INT AUTO-INCREMENT PRIMARY KEYS
-- (MS SQL Server: INT IDENTITY(1,1) | MySQL: INT AUTO_INCREMENT)
-- -----------------------------------------------------------------------------

-- 1. ROLES
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 2. SUBSCRIPTIONS MASTER
CREATE TABLE subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
    name VARCHAR(100) NOT NULL,
    target_role VARCHAR(50) NOT NULL DEFAULT 'student',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_months INT NOT NULL DEFAULT 1,
    description VARCHAR(MAX),
    features VARCHAR(MAX),
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 3. FEATURES MASTER
CREATE TABLE features (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
    name VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 4. SUBSCRIPTION_FEATURES JUNCTION
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

-- 5. USERS
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 6. USER_SUBSCRIPTIONS (History)
CREATE TABLE user_subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 7. CITIES
CREATE TABLE cities (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 8. AREAS
CREATE TABLE areas (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 9. SKILLS / INSTRUMENTS
CREATE TABLE skills (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 10. ACADEMIES / MUSIC GURUS
CREATE TABLE academies (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 11. ACADEMY_SKILLS JUNCTION
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

-- 12. INQUIRIES
CREATE TABLE inquiries (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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

-- 13. REVIEWS
CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Replace with: id INT AUTO_INCREMENT PRIMARY KEY in MySQL
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
-- STEP 3: INSERT SEED DATA FOR FEATURES TABLE
-- -----------------------------------------------------------------------------
INSERT INTO features (name, description, is_active) VALUES
('Send Enquiry', 'Allow potential students to submit inquiries directly to the institute.', 1),
('Social Media visible', 'Display Facebook, Instagram, YouTube, and WhatsApp links on academy profile.', 1),
('Direct Contact Details', 'Display institute direct mobile number, email, and address publicly.', 1),
('Verified Badge', 'Show verified guru status badge on academy card & profile.', 1),
('Student Inquiries Dashboard', 'Access lead tracking dashboard to follow up on prospective student inquiries.', 1),
('Priority Search Listing', 'Boost position in student search results in city/area.', 1);
GO

PRINT 'Migration complete! All tables successfully updated with Auto-Increment Primary Key IDs.';
GO
