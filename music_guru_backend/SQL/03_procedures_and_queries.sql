-- =============================================================================
-- Useful Queries, Views & Stored Procedures
-- FindMyMusicGurukul Platform
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VIEW: vw_academy_details
-- Denormalized view joining Academy info with City, Area, and Skills list.
-- -----------------------------------------------------------------------------
CREATE VIEW vw_academy_details AS
SELECT 
    a.id AS academy_id,
    a.slug,
    a.academy_name,
    a.teacher_name,
    a.email,
    a.phone,
    c.name AS city,
    ar.name AS area,
    a.experience_years,
    a.rating,
    a.status,
    a.fees_per_month,
    a.created_at
FROM academies a
JOIN cities c ON a.city_id = c.id
JOIN areas ar ON a.area_id = ar.id;

-- -----------------------------------------------------------------------------
-- VIEW: vw_user_active_subscriptions
-- Joining Users with Active Subscriptions & Expiry Dates to see student subscriptions
-- -----------------------------------------------------------------------------
CREATE VIEW vw_user_active_subscriptions AS
SELECT 
    u.id AS user_id,
    u.username,
    u.email,
    u.full_name,
    r.name AS role,
    s.id AS subscription_id,
    s.name AS subscription_name,
    s.price,
    us.start_date,
    us.expiry_date,
    us.status AS subscription_status
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.status = 'Active' AND us.deleted = 0;

-- -----------------------------------------------------------------------------
-- QUERY: Get Active Subscription for a Specific Student / User
-- -----------------------------------------------------------------------------
-- Example usage: Filter by user_id = 'usr-3' (Student Rahul Sharma)
SELECT 
    u.id AS student_id,
    u.full_name,
    u.email,
    s.name AS active_plan,
    s.price,
    us.start_date,
    us.expiry_date,
    us.status
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscriptions s ON us.subscription_id = s.id
WHERE u.id = 'usr-3' AND us.status = 'Active';

-- -----------------------------------------------------------------------------
-- QUERY: Search Approved Academies by City, Area, and Skill
-- -----------------------------------------------------------------------------
SELECT DISTINCT 
    a.id,
    a.slug,
    a.academy_name,
    a.teacher_name,
    a.email,
    a.phone,
    c.name AS city,
    ar.name AS area,
    a.experience_years,
    a.rating,
    a.status
FROM academies a
JOIN cities c ON a.city_id = c.id
JOIN areas ar ON a.area_id = ar.id
JOIN academy_skills ask ON a.id = ask.academy_id
JOIN skills s ON ask.skill_id = s.id
WHERE a.status = 'Approved'
  AND LOWER(c.name) = LOWER('Pune')
  AND LOWER(ar.name) = LOWER('Wakad')
  AND LOWER(s.name) = LOWER('Guitar');

-- -----------------------------------------------------------------------------
-- QUERY: SuperAdmin Dashboard Summary Report
-- -----------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM academies) AS total_academies,
    (SELECT COUNT(*) FROM academies WHERE status = 'Approved') AS approved_academies,
    (SELECT COUNT(*) FROM academies WHERE status = 'Pending') AS pending_academies,
    (SELECT COUNT(*) FROM inquiries) AS total_inquiries,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'Active') AS active_subscriptions;
