-- =============================================================================
-- Seed Data: FindMyMusicGurukul Initial Datasets
-- Idempotent script: Cleans up existing seed records first, then populates fresh datasets.
-- Compatible with INT IDENTITY / AUTO_INCREMENT database schemas.
-- =============================================================================

USE FindMyMusicGurukul;
GO

-- -----------------------------------------------------------------------------
-- CLEANUP EXISTING DATA IN REVERSE FOREIGN KEY ORDER
-- -----------------------------------------------------------------------------
DELETE FROM reviews;
DELETE FROM inquiries;
DELETE FROM academy_skills;
DELETE FROM academies;
DELETE FROM user_subscriptions;
DELETE FROM users;
DELETE FROM areas;
DELETE FROM cities;
DELETE FROM skills;
DELETE FROM subscription_features;
DELETE FROM features;
DELETE FROM subscriptions;
DELETE FROM roles;
GO

-- -----------------------------------------------------------------------------
-- 0. SEED ROLES
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT roles ON;
INSERT INTO roles (id, name, description) VALUES
(1, 'superadmin', 'System Super Administrator with full platform access'),
(2, 'admin', 'Music Teacher or Academy Owner managing their listing'),
(3, 'student', 'Registered student seeking music classes');
SET IDENTITY_INSERT roles OFF;
GO

-- -----------------------------------------------------------------------------
-- 1. SEED SUBSCRIPTIONS MASTER
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT subscriptions ON;
INSERT INTO subscriptions (id, name, target_role, price, duration_months, description, features) VALUES
(1, 'Student Free Pass', 'student', 0.00, 12, 'Basic free student search pass', 'Access to music directory, Send up to 5 inquiries/month'),
(2, 'Student Premium VIP Pass', 'student', 199.00, 12, 'Unlimited student access with priority responses', 'Unlimited Inquiries, Direct Tutor WhatsApp Chat, Discount on Music Events'),
(3, 'Gold Guru Academy', 'academy', 499.00, 12, 'Priority placement for music academies', 'Listed under up to 5 Skills, Direct Phone & WhatsApp Display, Verified Trust Seal'),
(4, 'Diamond Academy', 'academy', 999.00, 12, 'Top featured placement for music academies', 'Top 3 Search Placement, Unlimited Skills Mapping, Priority Support & Direct Leads');
SET IDENTITY_INSERT subscriptions OFF;
GO

-- -----------------------------------------------------------------------------
-- 2. SEED CITIES
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT cities ON;
INSERT INTO cities (id, name, state) VALUES
(1, 'Pune', 'Maharashtra'),
(2, 'Mumbai', 'Maharashtra'),
(3, 'Delhi', 'Delhi NCR'),
(4, 'Bangalore', 'Karnataka');
SET IDENTITY_INSERT cities OFF;
GO

-- -----------------------------------------------------------------------------
-- 3. SEED AREAS
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT areas ON;
-- Pune Areas
INSERT INTO areas (id, city_id, name, pincode) VALUES
(101, 1, 'Wakad', '411057'),
(102, 1, 'Baner', '411045'),
(103, 1, 'Aundh', '411007'),
(104, 1, 'Hinjewadi', '411057'),
(105, 1, 'Kothrud', '411038');

-- Mumbai Areas
INSERT INTO areas (id, city_id, name, pincode) VALUES
(201, 2, 'Bandra', '400050'),
(202, 2, 'Andheri West', '400058'),
(203, 2, 'Juhu', '400049'),
(204, 2, 'Dadar', '400014');

-- Delhi Areas
INSERT INTO areas (id, city_id, name, pincode) VALUES
(301, 3, 'Connaught Place', '110001'),
(302, 3, 'Hauz Khas', '110016'),
(303, 3, 'Dwarka', '110075');

-- Bangalore Areas
INSERT INTO areas (id, city_id, name, pincode) VALUES
(401, 4, 'Indiranagar', '560038'),
(402, 4, 'Koramangala', '560034'),
(403, 4, 'HSR Layout', '560102');
SET IDENTITY_INSERT areas OFF;
GO

-- -----------------------------------------------------------------------------
-- 4. SEED SKILLS
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT skills ON;
INSERT INTO skills (id, name, slug, icon, category, description) VALUES
(1, 'Guitar', 'guitar', '🎸', 'Strings', 'Acoustic, Electric, and Bass Guitar training'),
(2, 'Keyboard', 'keyboard', '🎹', 'Keys', 'Electronic Keyboard & Synthesizer training'),
(3, 'Piano', 'piano', '🎹', 'Keys', 'Classical & Modern Piano instruction'),
(4, 'Vocal', 'vocal', '🎤', 'Vocals', 'Classical, Western, and Pop Vocal coaching'),
(5, 'Harmonium', 'harmonium', '🪗', 'Indian Classical', 'Harmonium accompaniment & vocals'),
(6, 'Tabla', 'tabla', '🥁', 'Percussion', 'Indian Classical Rhythm & Percussion'),
(7, 'Drums', 'drums', '🥁', 'Percussion', 'Acoustic & Digital Drum kit training'),
(8, 'Violin', 'violin', '🎻', 'Strings', 'Carnatic, Hindustani & Western Violin'),
(9, 'Flute', 'flute', '🪈', 'Wind', 'Bansuri & Classical Flute classes');
SET IDENTITY_INSERT skills OFF;
GO

-- -----------------------------------------------------------------------------
-- 5. SEED USERS (Admins, Teachers, and Students)
-- Passwords:
-- admin@musicgurukul.com => admin123
-- gaurav.mehra@musicgurukul.com => password123
-- rahul.s@example.com => password123
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, username, email, password_hash, full_name, phone, role_id, subscription_id) VALUES
(1, 'admin', 'admin@musicgurukul.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Super Admin', '+91 99000 00000', 1, NULL),
(2, 'gaurav_mehra', 'gaurav.mehra@musicgurukul.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Gaurav Mehra', '+91 98230 44112', 2, 4),
(3, 'rahul_student', 'rahul.s@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Rahul Sharma', '+91 98765 43210', 3, 2);
SET IDENTITY_INSERT users OFF;
GO

-- -----------------------------------------------------------------------------
-- 6. SEED USER_SUBSCRIPTIONS (Active Subscriptions History)
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT user_subscriptions ON;
INSERT INTO user_subscriptions (id, user_id, subscription_id, start_date, expiry_date, status, payment_status) VALUES
(1, 3, 2, '2026-01-01', '2027-01-01', 'Active', 'Paid'),
(2, 2, 4, '2026-01-10', '2027-01-10', 'Active', 'Paid');
SET IDENTITY_INSERT user_subscriptions OFF;
GO

-- -----------------------------------------------------------------------------
-- 7. SEED ACADEMIES
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT academies ON;
INSERT INTO academies (id, slug, academy_name, teacher_name, email, phone, user_id, subscription_id, city_id, area_id, experience_years, rating, status, fees_per_month) VALUES
(1, 'gaurav-mehra-guitar-academy', 'Gaurav Mehra Guitar Academy', 'Gaurav Mehra', 'gaurav.mehra@musicgurukul.com', '+91 98230 44112', 2, 4, 1, 101, 12, 4.90, 'Approved', 2500.00);
SET IDENTITY_INSERT academies OFF;
GO

-- -----------------------------------------------------------------------------
-- 8. SEED ACADEMY_SKILLS MAPPINGS
-- -----------------------------------------------------------------------------
INSERT INTO academy_skills (academy_id, skill_id, proficiency_level) VALUES
(1, 1, 'Beginner to Advanced'),
(1, 4, 'Intermediate');
GO

-- -----------------------------------------------------------------------------
-- 9. SEED INQUIRIES
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT inquiries ON;
INSERT INTO inquiries (id, academy_id, skill_id, student_name, student_email, student_phone, preferred_slot, message, status) VALUES
(1, 1, 1, 'Rahul Sharma', 'rahul.s@example.com', '+91 98765 43210', 'Offline', 'Interested in beginner acoustic guitar classes.', 'New');
SET IDENTITY_INSERT inquiries OFF;
GO

-- -----------------------------------------------------------------------------
-- 10. SEED REVIEWS
-- -----------------------------------------------------------------------------
SET IDENTITY_INSERT reviews ON;
INSERT INTO reviews (id, academy_id, student_name, rating, comment) VALUES
(1, 1, 'Aarav Patel', 5, 'Great teaching technique! Highly recommended for beginners.'),
(2, 1, 'Priya Deshmukh', 5, 'Patient teacher and nice ambiance for learning.');
SET IDENTITY_INSERT reviews OFF;
GO
