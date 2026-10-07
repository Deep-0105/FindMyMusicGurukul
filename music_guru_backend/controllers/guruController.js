const crypto = require('crypto');
const { executeQuery, sql } = require('../config/db');
const { sendEmail } = require('../utils/mailer');

const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

const resolveAcademyId = async (inputAcadId) => {
  if (!inputAcadId) return inputAcadId;
  try {
    const res = await executeQuery(`
      SELECT TOP 1 id FROM academies WHERE deleted = 0 AND (id = TRY_CAST(@inputAcadId AS INT) OR CAST(id AS VARCHAR(100)) = @inputAcadId OR slug = @inputAcadId)
    `, [{ name: 'inputAcadId', type: sql.VarChar, value: String(inputAcadId) }]);
    if (res?.recordset?.[0]?.id !== undefined) {
      return res.recordset[0].id;
    }
    const digits = String(inputAcadId).replace(/\D/g, '');
    if (digits) {
      const resDigits = await executeQuery(`
        SELECT TOP 1 id FROM academies WHERE deleted = 0 AND id = TRY_CAST(@digits AS INT)
      `, [{ name: 'digits', type: sql.VarChar, value: digits }]);
      if (resDigits?.recordset?.[0]?.id !== undefined) {
        return resDigits.recordset[0].id;
      }
    }
    const resFallback = await executeQuery(`SELECT TOP 1 id FROM academies WHERE deleted = 0 ORDER BY id ASC`);
    if (resFallback?.recordset?.[0]?.id !== undefined) {
      return resFallback.recordset[0].id;
    }
  } catch (e) {
    console.warn('resolveAcademyId warning:', e.message);
  }
  return inputAcadId;
};

const resolveSkillId = async (inputSkillId) => {
  if (!inputSkillId) return inputSkillId;
  try {
    const res = await executeQuery(`
      SELECT TOP 1 id FROM skills WHERE deleted = 0 AND (id = TRY_CAST(@inputSkillId AS INT) OR CAST(id AS VARCHAR(100)) = @inputSkillId OR LOWER(name) = LOWER(@inputSkillId) OR LOWER(slug) = LOWER(@inputSkillId))
    `, [{ name: 'inputSkillId', type: sql.VarChar, value: String(inputSkillId) }]);
    if (res?.recordset?.[0]?.id !== undefined) {
      return res.recordset[0].id;
    }
    const digits = String(inputSkillId).replace(/\D/g, '');
    if (digits) {
      const resDigits = await executeQuery(`
        SELECT TOP 1 id FROM skills WHERE deleted = 0 AND id = TRY_CAST(@digits AS INT)
      `, [{ name: 'digits', type: sql.VarChar, value: digits }]);
      if (resDigits?.recordset?.[0]?.id !== undefined) {
        return resDigits.recordset[0].id;
      }
    }
  } catch (e) {
    console.warn('resolveSkillId warning:', e.message);
  }
  return inputSkillId;
};

exports.getCities = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT c.id, c.name, c.state, a.name AS area_name
      FROM cities c
      LEFT JOIN areas a ON (c.id = a.city_id OR CAST(c.id AS VARCHAR(100)) = CAST(a.city_id AS VARCHAR(100))) AND a.deleted = 0
      WHERE c.deleted = 0 AND c.is_active = 1
      ORDER BY c.name, a.name
    `);

    if (result && result.recordset && result.recordset.length > 0) {
      const cityMap = {};
      result.recordset.forEach((row) => {
        if (!cityMap[row.id]) {
          cityMap[row.id] = {
            id: row.id,
            name: row.name,
            state: row.state,
            areas: []
          };
        }
        if (row.area_name && !cityMap[row.id].areas.includes(row.area_name)) {
          cityMap[row.id].areas.push(row.area_name);
        }
      });
      return res.json({ success: true, data: Object.values(cityMap) });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching cities:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving cities.', error: error.message });
  }
};

const SKILL_ICON_MAP = {
  'guitar': '🎸',
  'keyboard': '🎹',
  'piano': '🎹',
  'vocal': '🎤',
  'harmonium': '🪗',
  'tabla': '🥁',
  'drums': '🥁',
  'violin': '🎻',
  'flute': '🪈',
  'indian-classical': '🎼',
  'western-music': '🎵'
};

const resolveSkillIcon = (name, slug, dbIcon) => {
  if (dbIcon && dbIcon !== '?' && dbIcon !== '??' && dbIcon.trim() !== '') {
    return dbIcon;
  }
  const key = (slug || name || '').toLowerCase();
  for (const [k, icon] of Object.entries(SKILL_ICON_MAP)) {
    if (key.includes(k)) return icon;
  }
  return '🎵';
};

exports.getSkills = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, name, slug, icon, category, description
      FROM skills
      WHERE deleted = 0
      ORDER BY name ASC
    `);

    if (result && result.recordset && result.recordset.length > 0) {
      const skillsWithIcons = result.recordset.map((sk) => ({
        ...sk,
        icon: resolveSkillIcon(sk.name, sk.slug, sk.icon)
      }));
      return res.json({ success: true, data: skillsWithIcons });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching skills:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving skills.', error: error.message });
  }
};

const parseCommaList = (str, fallback) => {
  if (typeof str === 'string' && str.trim()) {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return fallback;
};

const formatDateStr = (val) => {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (e) {
    return String(val).split('T')[0];
  }
};

const formatAcademyRow = (row) => {
  const planIdStr = String(row.subscriptionPlanId || row.subscription_id || '').trim();
  let cleanPlanName = (row.subscriptionPlanName || row.subscription_name || 'Free Plan').trim();
  
  if (planIdStr === '2') cleanPlanName = 'Social Media Plan';
  else if (planIdStr === '3') cleanPlanName = 'Google Map Location Plan';
  else if (planIdStr === '4') cleanPlanName = 'All-in-One Premium Plan';
  else if (planIdStr === '5') cleanPlanName = 'View Contacts Plan';

  const planNameLower = cleanPlanName.toLowerCase();
  const isFree = planIdStr === '1' || planIdStr === '';

  let expDateRaw = formatDateStr(row.subscriptionExpiry || row.subscription_expiry || row.expiry_date);
  if (expDateRaw && expDateRaw.startsWith('2099') && !isFree) {
    expDateRaw = null;
  }
  
  const expDate = isFree
    ? 'Lifetime Free'
    : (expDateRaw || (row.created_at ? formatDateStr(new Date(new Date(row.created_at).getTime() + 365 * 24 * 60 * 60 * 1000)) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]));

  const hasSocialMedia = row.hasSocialMedia === true || row.hasSocialMedia === 1 || row.has_social_media === true || row.has_social_media === 1 || planNameLower.includes('social media') || planNameLower.includes('google map');
  const hasGoogleMap = row.hasGoogleMap === true || row.hasGoogleMap === 1 || row.has_google_map === true || row.has_google_map === 1 || planNameLower.includes('google map') || planNameLower.includes('diamond');
  const hasSendInquiry = true; // Send Inquiry included in Free Plan and all subscription tiers

  return {
    ...row,
    pincode: row.pincode || row.pin_code || row.areaPincode || '',
    skills: row.skillsList ? row.skillsList.split(', ') : ['Guitar', 'Western Music', 'Vocal'],
    subscriptionPlanId: row.subscriptionPlanId || row.subscription_id || 'plan-1',
    subscriptionPlanName: cleanPlanName,
    subscriptionStatus: row.subscriptionStatus || row.subscription_status || 'Active',
    subscriptionStart: formatDateStr(row.subscriptionStart || row.subscription_start || row.start_date) || (row.created_at ? formatDateStr(row.created_at) : new Date().toISOString().split('T')[0]),
    subscriptionExpiry: expDate,
    validUntil: expDate,
    hasSocialMedia,
    hasGoogleMap,
    hasSendInquiry,
    profileImage: row.profileImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    coverImage: row.coverImage || 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    teachingMode: parseCommaList(row.teachingModesRaw, ['Offline', 'Online']),
    batchType: parseCommaList(row.batchTypesRaw, ['Individual', 'Group']),
    languages: parseCommaList(row.languagesRaw, ['English', 'Hindi']),
    socialLinks: {
      website: row.socialWebsite || '',
      whatsapp: row.whatsapp ? (row.whatsapp.startsWith('http') ? row.whatsapp : `https://wa.me/${row.whatsapp.replace(/\+/g, '')}`) : '',
      instagram: row.socialInstagram || '',
      youtube: row.socialYoutube || '',
      facebook: row.socialFacebook || '',
      linkedin: row.socialLinkedin || ''
    },
    mapUrl: row.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(row.address || row.city || '')}`,
    rating: row.rating ? parseFloat(row.rating) : 4.9,
    reviewCount: row.reviewCount || 0
  };
};

exports.getAcademies = async (req, res) => {
  try {
    const { city, area, skill, status } = req.query;

    let queryText = `
      SELECT 
        a.id, a.slug, a.user_id AS userId, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, ar.pincode AS areaPincode, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.whatsapp, a.social_website AS socialWebsite, a.social_instagram AS socialInstagram,
        a.social_youtube AS socialYoutube, a.social_facebook AS socialFacebook,
        a.social_linkedin AS socialLinkedin, a.profile_views AS profileViews,
        COALESCE(a.subscription_plan_name, sub.name) AS subscriptionPlanName, COALESCE(a.subscription_id, u.subscription_id) AS subscriptionPlanId,
        a.subscription_expiry AS subscriptionExpiry, a.subscription_start AS subscriptionStart, a.subscription_status AS subscriptionStatus,
        a.has_social_media AS hasSocialMedia, a.has_google_map AS hasGoogleMap,
        (SELECT COUNT(*) FROM reviews r WHERE (r.academy_id = a.id OR CAST(r.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100))) AND r.deleted = 0) AS reviewCount,
        (
          SELECT STRING_AGG(s.name, ', ') 
          FROM academy_skills ask 
          JOIN skills s ON (ask.skill_id = s.id OR CAST(ask.skill_id AS VARCHAR(100)) = CAST(s.id AS VARCHAR(100))) 
          WHERE (ask.academy_id = a.id OR CAST(ask.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100))) AND ask.deleted = 0
        ) AS skillsList
      FROM academies a
      LEFT JOIN cities c ON (a.city_id = c.id OR CAST(a.city_id AS VARCHAR(100)) = CAST(c.id AS VARCHAR(100)))
      LEFT JOIN areas ar ON (a.area_id = ar.id OR CAST(a.area_id AS VARCHAR(100)) = CAST(ar.id AS VARCHAR(100)))
      LEFT JOIN users u ON (a.user_id = u.id OR CAST(a.user_id AS VARCHAR(100)) = CAST(u.id AS VARCHAR(100)) OR LOWER(a.email) = LOWER(u.email))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
      )
      WHERE a.deleted = 0
    `;

    const params = [];

    if (status) {
      if (status.toLowerCase() !== 'all') {
        queryText += ` AND LOWER(a.status) = LOWER(@status)`;
        params.push({ name: 'status', type: sql.VarChar, value: status });
      }
    } else {
      queryText += ` AND a.status = 'Approved'`;
    }

    if (city) {
      queryText += ` AND LOWER(c.name) = LOWER(@city)`;
      params.push({ name: 'city', type: sql.VarChar, value: city });
    }

    if (area) {
      queryText += ` AND LOWER(ar.name) = LOWER(@area)`;
      params.push({ name: 'area', type: sql.VarChar, value: area });
    }

    const result = await executeQuery(queryText, params);

    if (result && result.recordset) {
      const formattedAcademies = result.recordset.map(formatAcademyRow);

      const userIds = formattedAcademies.map(a => a.userId).filter(Boolean);
      let subscriptionsMap = {};
      
      if (userIds.length > 0) {
        const subsQuery = await executeQuery(`
          SELECT user_id, subscription_id, expiry_date 
          FROM user_subscriptions 
          WHERE status = 'Active' AND expiry_date > GETDATE() AND user_id IN (${userIds.map(id => `'${id}'`).join(',')})
        `);
        
        if (subsQuery && subsQuery.recordset) {
          subsQuery.recordset.forEach(sub => {
            if (!subscriptionsMap[sub.user_id]) subscriptionsMap[sub.user_id] = [];
            subscriptionsMap[sub.user_id].push({
              subscriptionId: sub.subscription_id,
              expiryDate: formatDateStr(sub.expiry_date)
            });
          });
        }
      }

      formattedAcademies.forEach(a => {
        a.activePlans = a.userId && subscriptionsMap[a.userId] ? subscriptionsMap[a.userId] : [];
      });

      if (skill) {
        const filtered = formattedAcademies.filter((a) =>
          a.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
        );
        return res.json({ success: true, count: filtered.length, data: filtered });
      }

      return res.json({ success: true, count: formattedAcademies.length, data: formattedAcademies });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('Error fetching academies:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving academies.', error: error.message });
  }
};

exports.getAcademyApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    let queryText = `
      SELECT 
        a.id, a.slug, a.user_id AS userId, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.created_at AS createdAt, COALESCE(a.subscription_plan_name, sub.name) AS subscriptionPlanName, COALESCE(a.subscription_id, u.subscription_id) AS subscriptionPlanId,
        a.subscription_expiry AS subscriptionExpiry, a.subscription_start AS subscriptionStart, a.subscription_status AS subscriptionStatus,
        (
          SELECT STRING_AGG(s.name, ', ') 
          FROM academy_skills ask 
          JOIN skills s ON (ask.skill_id = s.id OR CAST(ask.skill_id AS VARCHAR(100)) = CAST(s.id AS VARCHAR(100))) 
          WHERE (ask.academy_id = a.id OR CAST(ask.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100))) AND ask.deleted = 0
        ) AS skillsList
      FROM academies a
      LEFT JOIN cities c ON (a.city_id = c.id OR CAST(a.city_id AS VARCHAR(100)) = CAST(c.id AS VARCHAR(100)))
      LEFT JOIN areas ar ON (a.area_id = ar.id OR CAST(a.area_id AS VARCHAR(100)) = CAST(ar.id AS VARCHAR(100)))
      LEFT JOIN users u ON (a.user_id = u.id OR CAST(a.user_id AS VARCHAR(100)) = CAST(u.id AS VARCHAR(100)) OR LOWER(a.email) = LOWER(u.email))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
      )
      WHERE a.deleted = 0
    `;

    const params = [];
    if (status && status.toLowerCase() !== 'all') {
      queryText += ` AND LOWER(a.status) = LOWER(@status)`;
      params.push({ name: 'status', type: sql.VarChar, value: status });
    }

    queryText += ` ORDER BY a.created_at DESC`;

    const result = await executeQuery(queryText, params);

    if (result && result.recordset) {
      const formatted = result.recordset.map(formatAcademyRow);

      const userIds = formatted.map(a => a.userId).filter(Boolean);
      let subscriptionsMap = {};
      
      if (userIds.length > 0) {
        const subsQuery = await executeQuery(`
          SELECT user_id, subscription_id, expiry_date 
          FROM user_subscriptions 
          WHERE status = 'Active' AND expiry_date > GETDATE() AND user_id IN (${userIds.map(id => `'${id}'`).join(',')})
        `);
        
        if (subsQuery && subsQuery.recordset) {
          subsQuery.recordset.forEach(sub => {
            if (!subscriptionsMap[sub.user_id]) subscriptionsMap[sub.user_id] = [];
            subscriptionsMap[sub.user_id].push({
              subscriptionId: sub.subscription_id,
              expiryDate: formatDateStr(sub.expiry_date)
            });
          });
        }
      }

      formatted.forEach(a => {
        a.activePlans = a.userId && subscriptionsMap[a.userId] ? subscriptionsMap[a.userId] : [];
      });

      return res.json({ success: true, count: formatted.length, data: formatted });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('Error fetching academy approvals:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch academy approvals.', error: error.message });
  }
};

exports.updateAcademyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rejectionReason } = req.body;

    if (!status || typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid status string is required.'
      });
    }

    const cleanStatus = status.trim();
    const resolvedId = await resolveAcademyId(id);

    const checkRes = await executeQuery(`
      SELECT id, academy_name, status FROM academies WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR slug = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (!checkRes || !checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academy not found or deleted.'
      });
    }

    const academy = checkRes.recordset[0];

    // Drop check constraint if present on status column
    try {
      await executeQuery(`
        DECLARE @chkName NVARCHAR(256);
        SELECT TOP 1 @chkName = cc.name
        FROM sys.check_constraints cc
        JOIN sys.columns col ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
        WHERE cc.parent_object_id = OBJECT_ID(N'academies') AND col.name = 'status';

        IF @chkName IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE dbo.academies DROP CONSTRAINT [' + @chkName + ']');
        END
      `);
    } catch (chkErr) {
      // Ignore if constraint was already dropped
    }

    await executeQuery(`
      UPDATE academies
      SET status = @status, updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR slug = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(academy.id) },
      { name: 'status', type: sql.VarChar, value: cleanStatus }
    ]);

    return res.json({
      success: true,
      message: `Academy '${academy.academy_name}' status updated to '${cleanStatus}' successfully.`,
      data: {
        id: academy.id,
        status: cleanStatus,
        notes: notes || rejectionReason || null
      }
    });
  } catch (error) {
    console.error('Error updating academy status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update academy status.',
      error: error.message
    });
  }
};

exports.getAcademyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    try {
      await executeQuery(`
        UPDATE academies SET profile_views = ISNULL(profile_views, 0) + 1 WHERE deleted = 0 AND (slug = @slug OR id = TRY_CAST(@slug AS INT) OR CAST(id AS VARCHAR(100)) = @slug)
      `, [{ name: 'slug', type: sql.VarChar, value: String(slug) }]);
    } catch (e) {
      // ignore
    }

    const result = await executeQuery(`
      SELECT 
        a.id, a.slug, a.user_id AS userId, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.whatsapp, a.social_website AS socialWebsite, a.social_instagram AS socialInstagram,
        a.social_youtube AS socialYoutube, a.social_facebook AS socialFacebook,
        a.social_linkedin AS socialLinkedin, a.profile_views AS profileViews,
        COALESCE(a.subscription_plan_name, sub.name) AS subscriptionPlanName, COALESCE(a.subscription_id, u.subscription_id) AS subscriptionPlanId,
        a.subscription_expiry AS subscriptionExpiry, a.subscription_start AS subscriptionStart, a.subscription_status AS subscriptionStatus,
        a.has_social_media AS hasSocialMedia, a.has_google_map AS hasGoogleMap,
        (SELECT COUNT(*) FROM reviews r WHERE (r.academy_id = a.id OR CAST(r.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100))) AND r.deleted = 0) AS reviewCount,
        (
          SELECT STRING_AGG(s.name, ', ') 
          FROM academy_skills ask 
          JOIN skills s ON (ask.skill_id = s.id OR CAST(ask.skill_id AS VARCHAR(100)) = CAST(s.id AS VARCHAR(100))) 
          WHERE (ask.academy_id = a.id OR CAST(ask.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100))) AND ask.deleted = 0
        ) AS skillsList
      FROM academies a
      LEFT JOIN cities c ON (a.city_id = c.id OR CAST(a.city_id AS VARCHAR(100)) = CAST(c.id AS VARCHAR(100)))
      LEFT JOIN areas ar ON (a.area_id = ar.id OR CAST(a.area_id AS VARCHAR(100)) = CAST(ar.id AS VARCHAR(100)))
      LEFT JOIN users u ON (a.user_id = u.id OR CAST(a.user_id AS VARCHAR(100)) = CAST(u.id AS VARCHAR(100)) OR LOWER(a.email) = LOWER(u.email))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
      )
      WHERE a.deleted = 0 AND (a.slug = @slug OR a.id = TRY_CAST(@slug AS INT) OR CAST(a.id AS VARCHAR(100)) = @slug)
    `, [
      { name: 'slug', type: sql.VarChar, value: String(slug) }
    ]);

    if (result && result.recordset && result.recordset.length > 0) {
      const acad = formatAcademyRow(result.recordset[0]);
      
      if (acad.userId) {
        const subsQuery = await executeQuery(`
          SELECT subscription_id, expiry_date 
          FROM user_subscriptions 
          WHERE status = 'Active' AND expiry_date > GETDATE() AND user_id = @userId
        `, [
          { name: 'userId', type: sql.VarChar, value: String(acad.userId) }
        ]);
        
        if (subsQuery && subsQuery.recordset) {
          acad.activePlans = subsQuery.recordset.map(sub => ({
            subscriptionId: sub.subscription_id,
            expiryDate: formatDateStr(sub.expiry_date)
          }));
        } else {
          acad.activePlans = [];
        }
      } else {
        acad.activePlans = [];
      }

      return res.json({
        success: true,
        data: acad
      });
    }

    return res.status(404).json({ success: false, message: 'Academy not found' });
  } catch (error) {
    console.error('Database query error in getAcademyBySlug:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving academy detail.' });
  }
};

exports.updateAcademyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const targetAcadId = await resolveAcademyId(id);

    const {
      academyName, teacherName, phone, email, experienceYears,
      teachingMode, batchType, languages, about, address,
      mapUrl, whatsapp, profileImage, coverImage, socialLinks,
      skills, skillsList: rawSkillsList
    } = req.body;

    const teachingModesStr = Array.isArray(teachingMode) ? teachingMode.join(', ') : (teachingMode || 'Offline, Online');
    const batchTypesStr = Array.isArray(batchType) ? batchType.join(', ') : (batchType || 'Individual, Group');
    const languagesStr = Array.isArray(languages) ? languages.join(', ') : (languages || 'English, Hindi');
    const expNum = parseFloat(experienceYears);

    const cleanStr = (val) => {
      if (val === undefined || val === null) return null;
      const s = String(val).trim();
      return s === '' ? null : s;
    };

    await executeQuery(`
      UPDATE academies SET
        academy_name = ISNULL(@academyName, academy_name),
        teacher_name = ISNULL(@teacherName, teacher_name),
        phone = ISNULL(@phone, phone),
        email = ISNULL(@email, email),
        experience_years = @experienceYears,
        teaching_modes = @teachingModes,
        batch_types = @batchTypes,
        languages = @languages,
        bio = ISNULL(@about, bio),
        address = ISNULL(@address, address),
        pincode = ISNULL(@pincode, pincode),
        map_url = @mapUrl,
        whatsapp = @whatsapp,
        profile_image = ISNULL(@profileImage, profile_image),
        cover_image = ISNULL(@coverImage, cover_image),
        social_website = @website,
        social_instagram = @instagram,
        social_youtube = @youtube,
        social_facebook = @facebook,
        social_linkedin = @linkedin,
        updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(targetAcadId) },
      { name: 'academyName', type: sql.VarChar, value: cleanStr(academyName) },
      { name: 'teacherName', type: sql.VarChar, value: cleanStr(teacherName) },
      { name: 'phone', type: sql.VarChar, value: cleanStr(phone) },
      { name: 'email', type: sql.VarChar, value: cleanStr(email) },
      { name: 'experienceYears', type: sql.Decimal(4, 1), value: isNaN(expNum) ? 0 : parseFloat(expNum.toFixed(1)) },
      { name: 'teachingModes', type: sql.VarChar, value: teachingModesStr },
      { name: 'batchTypes', type: sql.VarChar, value: batchTypesStr },
      { name: 'languages', type: sql.VarChar, value: languagesStr },
      { name: 'about', type: sql.VarChar, value: cleanStr(about) },
      { name: 'address', type: sql.VarChar, value: cleanStr(address) },
      { name: 'pincode', type: sql.VarChar, value: cleanStr(req.body.pincode ?? req.body.pinCode) },
      { name: 'mapUrl', type: sql.VarChar, value: cleanStr(mapUrl) },
      { name: 'whatsapp', type: sql.VarChar, value: cleanStr(whatsapp) },
      { name: 'profileImage', type: sql.VarChar(sql.MAX), value: cleanStr(profileImage) },
      { name: 'coverImage', type: sql.VarChar(sql.MAX), value: cleanStr(coverImage) },
      { name: 'website', type: sql.VarChar, value: cleanStr(socialLinks?.website ?? req.body.website) },
      { name: 'instagram', type: sql.VarChar, value: cleanStr(socialLinks?.instagram ?? req.body.instagram) },
      { name: 'youtube', type: sql.VarChar, value: cleanStr(socialLinks?.youtube ?? req.body.youtube) },
      { name: 'facebook', type: sql.VarChar, value: cleanStr(socialLinks?.facebook ?? req.body.facebook) },
      { name: 'linkedin', type: sql.VarChar, value: cleanStr(socialLinks?.linkedin ?? req.body.linkedin) }
    ]);

    const targetSkills = Array.isArray(skills)
      ? skills
      : (Array.isArray(rawSkillsList)
        ? rawSkillsList
        : (typeof skills === 'string' && skills.trim()
          ? skills.split(',').map((s) => s.trim()).filter(Boolean)
          : (typeof rawSkillsList === 'string' && rawSkillsList.trim()
            ? rawSkillsList.split(',').map((s) => s.trim()).filter(Boolean)
            : null)));

    if (targetSkills && Array.isArray(targetSkills)) {
      await executeQuery(
        `UPDATE academy_skills SET deleted = 1, updated_at = GETDATE() WHERE (academy_id = TRY_CAST(@academyId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @academyId)`,
        [{ name: 'academyId', type: sql.VarChar, value: String(targetAcadId) }]
      );

      for (const skName of targetSkills) {
        if (!skName || !skName.trim()) continue;
        const cleanSkName = skName.trim();

        let skillId = await resolveSkillId(cleanSkName);
        if (!skillId) {
          skillId = `skill-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const skSlug = cleanSkName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          await executeQuery(
            `INSERT INTO skills (id, name, slug, icon, deleted, created_at, updated_at) VALUES (@id, @name, @slug, '🎵', 0, GETDATE(), GETDATE())`,
            [
              { name: 'id', type: sql.VarChar, value: String(skillId) },
              { name: 'name', type: sql.VarChar, value: cleanSkName },
              { name: 'slug', type: sql.VarChar, value: skSlug }
            ]
          );
        }

        const existingAsk = await executeQuery(
          `SELECT 1 as rowExists FROM academy_skills WHERE (academy_id = TRY_CAST(@academyId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @academyId) AND (skill_id = TRY_CAST(@skillId AS INT) OR CAST(skill_id AS VARCHAR(100)) = @skillId)`,
          [
            { name: 'academyId', type: sql.VarChar, value: String(targetAcadId) },
            { name: 'skillId', type: sql.VarChar, value: String(skillId) }
          ]
        );

        if (existingAsk?.recordset?.length > 0) {
          await executeQuery(
            `UPDATE academy_skills SET deleted = 0, updated_at = GETDATE() WHERE (academy_id = TRY_CAST(@academyId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @academyId) AND (skill_id = TRY_CAST(@skillId AS INT) OR CAST(skill_id AS VARCHAR(100)) = @skillId)`,
            [
              { name: 'academyId', type: sql.VarChar, value: String(targetAcadId) },
              { name: 'skillId', type: sql.VarChar, value: String(skillId) }
            ]
          );
        } else {
          await executeQuery(
            `INSERT INTO academy_skills (academy_id, skill_id, deleted, created_at, updated_at) VALUES (@academyId, @skillId, 0, GETDATE(), GETDATE())`,
            [
              { name: 'academyId', type: sql.VarChar, value: String(targetAcadId) },
              { name: 'skillId', type: sql.VarChar, value: String(skillId) }
            ]
          );
        }
      }
    }

    res.json({ success: true, message: 'Academy profile and skills updated in database successfully.' });
  } catch (error) {
    console.error('Error updating academy profile:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update academy profile.', error: error.message });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const { academyId, skillId, skill, studentName, studentEmail, studentPhone, preferredSlot, mode, message, state, city, area } = req.body;
    const classMode = mode || preferredSlot || 'Offline';

    if (!academyId || !studentName || !studentPhone) {
      return res.status(400).json({
        success: false,
        message: 'Academy ID, Student Name, and Phone are required.'
      });
    }

    const cleanPhone = String(studentPhone || '').trim().replace(/[\s\-\+]/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must contain exactly 10 digits.'
      });
    }

    const resolvedAcademyId = await resolveAcademyId(academyId);
    let resolvedSkillId = await resolveSkillId(skillId || skill);

    try {
      await executeQuery(`
        INSERT INTO inquiries (academy_id, skill_id, student_name, student_email, student_phone, preferred_slot, message, status, deleted, created_at, updated_at)
        VALUES (@academyId, @skillId, @studentName, @studentEmail, @studentPhone, @preferredSlot, @message, 'New', 0, GETDATE(), GETDATE())
      `, [
        { name: 'academyId', type: sql.VarChar, value: String(resolvedAcademyId) },
        { name: 'skillId', type: sql.VarChar, value: resolvedSkillId ? String(resolvedSkillId) : null },
        { name: 'studentName', type: sql.VarChar, value: studentName },
        { name: 'studentEmail', type: sql.VarChar, value: studentEmail },
        { name: 'studentPhone', type: sql.VarChar, value: studentPhone },
        { name: 'preferredSlot', type: sql.VarChar, value: classMode },
        { name: 'message', type: sql.VarChar, value: message || '' }
      ]);
    } catch (insertErr) {
      const newId = `inq-${Date.now()}`;
      await executeQuery(`
        INSERT INTO inquiries (id, academy_id, skill_id, student_name, student_email, student_phone, preferred_slot, message, status, deleted, created_at, updated_at)
        VALUES (@id, @academyId, @skillId, @studentName, @studentEmail, @studentPhone, @preferredSlot, @message, 'New', 0, GETDATE(), GETDATE())
      `, [
        { name: 'id', type: sql.VarChar, value: newId },
        { name: 'academyId', type: sql.VarChar, value: String(resolvedAcademyId) },
        { name: 'skillId', type: sql.VarChar, value: resolvedSkillId ? String(resolvedSkillId) : null },
        { name: 'studentName', type: sql.VarChar, value: studentName },
        { name: 'studentEmail', type: sql.VarChar, value: studentEmail },
        { name: 'studentPhone', type: sql.VarChar, value: studentPhone },
        { name: 'preferredSlot', type: sql.VarChar, value: classMode },
        { name: 'message', type: sql.VarChar, value: message || '' }
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully to database',
      data: { academyId: resolvedAcademyId, skillId: resolvedSkillId, studentName, studentEmail, studentPhone }
    });

    // Fire-and-forget Email Notification
    try {
      const academyResult = await executeQuery(`
        SELECT 
          a.academy_name, 
          a.teacher_name,
          a.email, 
          a.subscription_plan_name,
          a.subscription_status,
          a.subscription_expiry,
          c.name AS city_name,
          ar.name AS area_name,
          s.name AS skill_name
        FROM academies a
        LEFT JOIN cities c ON a.city_id = c.id OR CAST(a.city_id AS VARCHAR(100)) = CAST(c.id AS VARCHAR(100))
        LEFT JOIN areas ar ON a.area_id = ar.id OR CAST(a.area_id AS VARCHAR(100)) = CAST(ar.id AS VARCHAR(100))
        LEFT JOIN skills s ON s.id = TRY_CAST(@skillId AS INT) OR CAST(s.id AS VARCHAR(100)) = @skillId
        WHERE (a.id = TRY_CAST(@academyId AS INT) OR CAST(a.id AS VARCHAR(100)) = @academyId)
          AND a.deleted = 0
      `, [
        { name: 'academyId', type: sql.VarChar, value: String(resolvedAcademyId) },
        { name: 'skillId', type: sql.VarChar, value: String(resolvedSkillId) }
      ]);

      if (academyResult.recordset.length > 0) {
        const acad = academyResult.recordset[0];
        const teacherName = acad.teacher_name || acad.academy_name || 'Director';
        const skillName = acad.skill_name || 'Music Classes';
        
        // Use student-provided location if available, otherwise fallback to academy location
        const finalArea = area || acad.area_name || 'N/A';
        const finalCity = city || acad.city_name || 'N/A';
        const finalState = state || 'Maharashtra';
        
        let isPlanActive = false;
        if (acad.subscription_status && acad.subscription_status.toLowerCase() !== 'expired') {
          const expDate = acad.subscription_expiry ? new Date(acad.subscription_expiry) : null;
          if (expDate && !isNaN(expDate.getTime())) {
            expDate.setHours(23, 59, 59, 999);
            if (expDate.getTime() >= Date.now()) {
              isPlanActive = true;
            }
          } else {
            isPlanActive = true;
          }
        }
        
        const planName = isPlanActive ? (acad.subscription_plan_name || 'Free Plan').toLowerCase() : 'free plan';
        const hasViewContacts = planName.includes('view contacts') || planName.includes('google business') || planName.includes('social media') || planName.includes('premium') || planName.includes('combo') || planName.includes('all-in-one');
        
        let emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #eaeaea;">
          <h2 style="color: #007bff; margin-bottom: 20px; font-weight: bold; letter-spacing: -0.5px;">FindMyMusicGurukul</h2>
          
          <p style="font-size: 15px; color: #333; margin-bottom: 25px; text-align: center;">
            Dear Mr/Ms ${teacherName} (Director)
          </p>
          
          <p style="font-size: 15px; color: #333; margin-bottom: 25px; text-align: center;">
            <strong>${studentName}</strong> enquired for Music Classes for ${skillName}.
          </p>
          
          <table style="width: 100%; max-width: 450px; margin: 0 auto 30px; text-align: left; font-size: 14px; color: #555;">
            <tr>
              <td style="padding: 8px 0; width: 40%;">User Area :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${finalArea}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">User City :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${finalCity}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">User State :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${finalState}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Search Date & Time :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>
            ${hasViewContacts ? `
            <tr>
              <td style="padding: 8px 0;">Student Email :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Student Phone :</td>
              <td style="padding: 8px 0; font-weight: bold; color: #000;">${studentPhone}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background-color: #f1f1f1; padding: 20px; border-top: 1px solid #ddd; margin: -20px; margin-top: 20px;">
            <a href="https://findmymusicgurukul.com/guru/admin" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; font-size: 14px;">View Contact Details</a>
          </div>
        </div>
        `;

        await sendEmail({
          to: acad.email,
          subject: `New Student Inquiry - ${acad.academy_name}`,
          html: emailBody
        });
      }
    } catch (emailErr) {
      console.error('Error sending inquiry notification email:', emailErr.message);
    }

  } catch (error) {
    console.error('Error creating inquiry:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit inquiry.', error: error.message });
  }
};

exports.getInquiries = async (req, res) => {
  try {
    const { academyId, status, search } = req.query;
    const resolvedAcadId = academyId ? await resolveAcademyId(academyId) : null;

    let queryText = `
      SELECT 
        i.id,
        i.academy_id AS academyId,
        i.skill_id AS skillId,
        i.student_name AS studentName,
        i.student_email AS studentEmail,
        i.student_email AS email,
        i.student_phone AS studentPhone,
        i.student_phone AS mobile,
        i.preferred_slot AS preferredSlot,
        i.preferred_slot AS mode,
        i.message,
        i.status,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt,
        a.academy_name AS academyName,
        a.teacher_name AS teacherName,
        a.email AS teacherEmail,
        a.phone AS teacherPhone,
        s.name AS skillName,
        ISNULL(s.name, 'Music Class') AS skill,
        s.icon AS skillIcon
      FROM inquiries i
      LEFT JOIN academies a ON (i.academy_id = a.id OR CAST(i.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100)))
      LEFT JOIN skills s ON (i.skill_id = s.id OR CAST(i.skill_id AS VARCHAR(100)) = CAST(s.id AS VARCHAR(100)))
      WHERE i.deleted = 0
    `;

    const params = [];
    if (academyId) {
      queryText += ` AND (i.academy_id = TRY_CAST(@academyId AS INT) OR CAST(i.academy_id AS VARCHAR(100)) = @academyId)`;
      params.push({ name: 'academyId', type: sql.VarChar, value: String(resolvedAcadId || academyId) });
    }

    if (status) {
      queryText += ` AND LOWER(i.status) = LOWER(@status)`;
      params.push({ name: 'status', type: sql.VarChar, value: status });
    }

    if (search) {
      queryText += ` AND (LOWER(i.student_name) LIKE LOWER(@search) OR LOWER(i.student_phone) LIKE LOWER(@search) OR LOWER(i.student_email) LIKE LOWER(@search))`;
      params.push({ name: 'search', type: sql.VarChar, value: `%${search.trim()}%` });
    }

    queryText += ` ORDER BY i.created_at DESC`;

    const result = await executeQuery(queryText, params);

    if (result && result.recordset) {
      return res.json({ success: true, count: result.recordset.length, data: result.recordset });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('Error fetching inquiries:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving inquiries.', error: error.message });
  }
};

exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(`
      SELECT 
        i.id,
        i.academy_id AS academyId,
        i.skill_id AS skillId,
        i.student_name AS studentName,
        i.student_email AS studentEmail,
        i.student_email AS email,
        i.student_phone AS studentPhone,
        i.student_phone AS mobile,
        i.preferred_slot AS preferredSlot,
        i.preferred_slot AS mode,
        i.message,
        i.status,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt,
        a.academy_name AS academyName,
        a.teacher_name AS teacherName,
        a.email AS teacherEmail,
        a.phone AS teacherPhone,
        s.name AS skillName,
        ISNULL(s.name, 'Music Class') AS skill,
        s.icon AS skillIcon
      FROM inquiries i
      LEFT JOIN academies a ON (i.academy_id = a.id OR CAST(i.academy_id AS VARCHAR(100)) = CAST(a.id AS VARCHAR(100)))
      LEFT JOIN skills s ON (i.skill_id = s.id OR CAST(i.skill_id AS VARCHAR(100)) = CAST(s.id AS VARCHAR(100)))
      WHERE i.deleted = 0 AND (i.id = TRY_CAST(@id AS INT) OR CAST(i.id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (result && result.recordset && result.recordset.length > 0) {
      return res.json({ success: true, data: result.recordset[0] });
    }

    return res.status(404).json({ success: false, message: 'Inquiry not found.' });
  } catch (error) {
    console.error('Error fetching inquiry by ID:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving inquiry detail.', error: error.message });
  }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid status string is required.'
      });
    }

    const cleanStatus = status.trim();

    const checkRes = await executeQuery(`
      SELECT id, status FROM inquiries WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (!checkRes || !checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found or deleted.'
      });
    }

    try {
      await executeQuery(`
        DECLARE @chkName NVARCHAR(256);
        SELECT TOP 1 @chkName = cc.name
        FROM sys.check_constraints cc
        JOIN sys.columns col ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
        WHERE cc.parent_object_id = OBJECT_ID(N'inquiries') AND col.name = 'status';

        IF @chkName IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE dbo.inquiries DROP CONSTRAINT [' + @chkName + ']');
        END
      `);
    } catch (chkErr) {
      // Ignore
    }

    await executeQuery(`
      UPDATE inquiries
      SET status = @status, updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'status', type: sql.VarChar, value: cleanStatus }
    ]);

    return res.json({
      success: true,
      message: `Inquiry status updated to '${cleanStatus}' successfully.`,
      data: {
        id,
        status: cleanStatus
      }
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry status.',
      error: error.message
    });
  }
};

exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const checkRes = await executeQuery(`
      SELECT id FROM inquiries WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (!checkRes || !checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found or already deleted.'
      });
    }

    await executeQuery(`
      UPDATE inquiries SET deleted = 1, updated_at = GETDATE() WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    return res.json({
      success: true,
      message: 'Inquiry deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting inquiry:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry.',
      error: error.message
    });
  }
};

exports.getInquiryStats = async (req, res) => {
  try {
    const { academyId } = req.query;
    const resolvedAcadId = academyId ? await resolveAcademyId(academyId) : null;

    let queryText = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN LOWER(status) IN ('pending', 'new') THEN 1 ELSE 0 END) AS pendingCount,
        SUM(CASE WHEN LOWER(status) = 'contacted' THEN 1 ELSE 0 END) AS contactedCount,
        SUM(CASE WHEN LOWER(status) = 'converted' THEN 1 ELSE 0 END) AS convertedCount,
        SUM(CASE WHEN LOWER(status) = 'closed' THEN 1 ELSE 0 END) AS closedCount
      FROM inquiries
      WHERE deleted = 0
    `;

    const params = [];
    if (academyId) {
      queryText += ` AND (academy_id = TRY_CAST(@academyId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @academyId)`;
      params.push({ name: 'academyId', type: sql.VarChar, value: String(resolvedAcadId || academyId) });
    }

    const result = await executeQuery(queryText, params);
    const stats = result.recordset[0] || {};

    return res.json({
      success: true,
      data: {
        total: stats.total || 0,
        pending: stats.pendingCount || 0,
        contacted: stats.contactedCount || 0,
        converted: stats.convertedCount || 0,
        closed: stats.closedCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching inquiry stats:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving inquiry stats.', error: error.message });
  }
};

exports.getHomeStats = async (req, res) => {
  try {
    const statsResult = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM academies WHERE deleted = 0 AND status = 'Approved') AS certifiedGurusCount,
        (SELECT COUNT(*) FROM skills WHERE deleted = 0) AS instrumentsCount,
        (SELECT COUNT(*) FROM inquiries WHERE deleted = 0) AS totalInquiriesCount,
        (SELECT ISNULL(AVG(CAST(rating AS FLOAT)), 4.9) FROM reviews WHERE deleted = 0 AND is_published = 1) AS avgRating
    `);

    const stats = statsResult.recordset[0] || {};

    res.json({
      success: true,
      data: {
        certifiedGurusCount: stats.certifiedGurusCount || 0,
        instrumentsCount: stats.instrumentsCount || 0,
        totalInquiriesCount: stats.totalInquiriesCount || 0,
        avgRating: stats.avgRating ? parseFloat(parseFloat(stats.avgRating).toFixed(1)) : 4.9
      }
    });
  } catch (error) {
    console.error('Error fetching home stats:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching home stats.', error: error.message });
  }
};

exports.getSuperAdminReports = async (req, res) => {
  try {
    const academyStats = await executeQuery(`
      SELECT 
        COUNT(*) AS totalAcademies,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approvedAcademies
      FROM academies WHERE deleted = 0
    `);

    const inquiryStats = await executeQuery(`
      SELECT COUNT(*) AS totalInquiries FROM inquiries WHERE deleted = 0
    `);

    res.json({
      success: true,
      data: {
        totalAcademies: academyStats.recordset[0]?.totalAcademies || 0,
        approvedAcademies: academyStats.recordset[0]?.approvedAcademies || 0,
        totalInquiries: inquiryStats.recordset[0]?.totalInquiries || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin reports:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving super admin reports.', error: error.message });
  }
};

exports.createAcademy = async (req, res) => {
  try {
    const { academyName, teacherName, username, mobile, email, city, area, skills, password } = req.body;

    if (!academyName || !teacherName || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Academy Name, Teacher Name, Mobile, Email, and Password are required.'
      });
    }

    const cleanPhone = String(mobile || '').trim().replace(/[\s\-\+]/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must contain exactly 10 digits.'
      });
    }

    const finalUsername = (username || email.split('@')[0]).trim();
    let userId = null;

    const roleResult = await executeQuery(
      `SELECT id FROM roles WHERE LOWER(name) = 'admin' AND deleted = 0`
    );
    const adminRoleId = roleResult?.recordset?.[0]?.id || 'role-2';

    const existingUser = await executeQuery(
      `SELECT id FROM users WHERE (LOWER(email) = LOWER(@email) OR LOWER(username) = LOWER(@username)) AND deleted = 0`,
      [
        { name: 'email', type: sql.VarChar, value: email.toLowerCase() },
        { name: 'username', type: sql.VarChar, value: finalUsername.toLowerCase() }
      ]
    );

    if (existingUser?.recordset?.length > 0) {
      userId = existingUser.recordset[0].id;
    } else {
      userId = `usr-${Date.now()}`;
      const passwordHash = hashPassword(password);
      try {
        await executeQuery(`
          INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active, deleted, created_at, updated_at)
          VALUES (@username, @email, @passwordHash, @fullName, @phone, @roleId, 1, 0, GETDATE(), GETDATE())
        `, [
          { name: 'username', type: sql.VarChar, value: finalUsername },
          { name: 'email', type: sql.VarChar, value: email.toLowerCase() },
          { name: 'passwordHash', type: sql.VarChar, value: passwordHash },
          { name: 'fullName', type: sql.VarChar, value: teacherName },
          { name: 'phone', type: sql.VarChar, value: cleanPhone },
          { name: 'roleId', type: sql.VarChar, value: String(adminRoleId) }
        ]);
      } catch (uErr) {
        await executeQuery(`
          INSERT INTO users (id, username, email, password_hash, full_name, phone, role_id, is_active, deleted, created_at, updated_at)
          VALUES (@id, @username, @email, @passwordHash, @fullName, @phone, @roleId, 1, 0, GETDATE(), GETDATE())
        `, [
          { name: 'id', type: sql.VarChar, value: userId },
          { name: 'username', type: sql.VarChar, value: finalUsername },
          { name: 'email', type: sql.VarChar, value: email.toLowerCase() },
          { name: 'passwordHash', type: sql.VarChar, value: passwordHash },
          { name: 'fullName', type: sql.VarChar, value: teacherName },
          { name: 'phone', type: sql.VarChar, value: cleanPhone },
          { name: 'roleId', type: sql.VarChar, value: String(adminRoleId) }
        ]);
      }
    }

    const slug = academyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    let cityId = null;
    let areaId = null;

    if (city) {
      const cityRes = await executeQuery(
        `SELECT id FROM cities WHERE deleted = 0 AND LOWER(name) = LOWER(@cityName)`,
        [{ name: 'cityName', type: sql.VarChar, value: city.trim() }]
      );
      if (cityRes?.recordset?.length > 0) {
        cityId = cityRes.recordset[0].id;
      }
    }

    if (area && cityId) {
      const areaRes = await executeQuery(
        `SELECT id FROM areas WHERE deleted = 0 AND LOWER(name) = LOWER(@areaName) AND (city_id = TRY_CAST(@cityId AS INT) OR CAST(city_id AS VARCHAR(100)) = @cityId)`,
        [
          { name: 'areaName', type: sql.VarChar, value: area.trim() },
          { name: 'cityId', type: sql.VarChar, value: String(cityId) }
        ]
      );
      if (areaRes?.recordset?.length > 0) {
        areaId = areaRes.recordset[0].id;
      }
    }

    let freeSubId = null;
    let freeSubName = 'Free Academy Listing';
    try {
      const freeSubRes = await executeQuery(`
        SELECT TOP 1 id, name FROM subscriptions 
        WHERE deleted = 0 AND (LOWER(target_role) = 'academy' OR price = 0 OR LOWER(name) LIKE '%free%') 
        ORDER BY price ASC
      `);
      if (freeSubRes?.recordset?.length > 0) {
        freeSubId = freeSubRes.recordset[0].id;
        freeSubName = freeSubRes.recordset[0].name;
      }
    } catch (sErr) { }

    let createdAcadId = null;

    try {
      const res = await executeQuery(`
        INSERT INTO academies (
          slug, academy_name, teacher_name, email, phone, city_id, area_id, address,
          user_id, subscription_id, status, deleted, created_at, updated_at
        )
        OUTPUT INSERTED.id
        VALUES (
          @slug, @academyName, @teacherName, @email, @phone, @cityId, @areaId, @address,
          @userId, @subId, 'Pending', 0, GETDATE(), GETDATE()
        )
      `, [
        { name: 'slug', type: sql.VarChar, value: slug },
        { name: 'academyName', type: sql.VarChar, value: academyName },
        { name: 'teacherName', type: sql.VarChar, value: teacherName },
        { name: 'email', type: sql.VarChar, value: email },
        { name: 'phone', type: sql.VarChar, value: cleanPhone },
        { name: 'cityId', type: sql.VarChar, value: cityId ? String(cityId) : null },
        { name: 'areaId', type: sql.VarChar, value: areaId ? String(areaId) : null },
        { name: 'address', type: sql.VarChar, value: `${area || ''}, ${city || ''}` },
        { name: 'userId', type: sql.VarChar, value: userId ? String(userId) : null },
        { name: 'subId', type: sql.VarChar, value: freeSubId ? String(freeSubId) : null }
      ]);
      createdAcadId = res?.recordset?.[0]?.id;
    } catch (aErr) {
      const newId = `acad-${Date.now()}`;
      await executeQuery(`
        INSERT INTO academies (
          id, slug, academy_name, teacher_name, email, phone, city_id, area_id, address,
          user_id, subscription_id, status, deleted, created_at, updated_at
        ) VALUES (
          @id, @slug, @academyName, @teacherName, @email, @phone, @cityId, @areaId, @address,
          @userId, @subId, 'Pending', 0, GETDATE(), GETDATE()
        )
      `, [
        { name: 'id', type: sql.VarChar, value: newId },
        { name: 'slug', type: sql.VarChar, value: slug },
        { name: 'academyName', type: sql.VarChar, value: academyName },
        { name: 'teacherName', type: sql.VarChar, value: teacherName },
        { name: 'email', type: sql.VarChar, value: email },
        { name: 'phone', type: sql.VarChar, value: cleanPhone },
        { name: 'cityId', type: sql.VarChar, value: cityId ? String(cityId) : null },
        { name: 'areaId', type: sql.VarChar, value: areaId ? String(areaId) : null },
        { name: 'address', type: sql.VarChar, value: `${area || ''}, ${city || ''}` },
        { name: 'userId', type: sql.VarChar, value: userId ? String(userId) : null },
        { name: 'subId', type: sql.VarChar, value: freeSubId ? String(freeSubId) : null }
      ]);
      createdAcadId = newId;
    }

    if (userId && freeSubId) {
      try {
        await executeQuery(`
          UPDATE users SET subscription_id = ISNULL(subscription_id, @subId) WHERE (id = TRY_CAST(@userId AS INT) OR CAST(id AS VARCHAR(100)) = @userId)
        `, [
          { name: 'userId', type: sql.VarChar, value: String(userId) },
          { name: 'subId', type: sql.VarChar, value: String(freeSubId) }
        ]);
      } catch (uSubErr) { }
    }

    if (Array.isArray(skills) && skills.length > 0 && createdAcadId) {
      for (const skName of skills) {
        const skillId = await resolveSkillId(skName.trim());
        if (skillId) {
          await executeQuery(
            `INSERT INTO academy_skills (academy_id, skill_id, deleted, created_at, updated_at) VALUES (@academyId, @skillId, 0, GETDATE(), GETDATE())`,
            [
              { name: 'academyId', type: sql.VarChar, value: String(createdAcadId) },
              { name: 'skillId', type: sql.VarChar, value: String(skillId) }
            ]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Academy registered successfully in database with active free plan.',
      data: {
        id: createdAcadId,
        slug,
        academyName,
        teacherName,
        email,
        phone: cleanPhone,
        city,
        area,
        status: 'Pending',
        subscriptionPlanId: freeSubId || 'plan-1',
        subscriptionPlanName: freeSubName || 'Free Academy Listing',
        subscriptionStatus: 'Active'
      }
    });
  } catch (error) {
    console.error('Error creating academy listing:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create academy listing in database.',
      error: error.message
    });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { name, category, icon, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Skill / Instrument name is required.'
      });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await executeQuery(`
      SELECT id, deleted FROM skills WHERE LOWER(name) = LOWER(@name) OR LOWER(slug) = LOWER(@slug)
    `, [
      { name: 'name', type: sql.VarChar, value: cleanName },
      { name: 'slug', type: sql.VarChar, value: slug }
    ]);

    if (existing && existing.recordset && existing.recordset.length > 0) {
      const row = existing.recordset[0];
      if (row.deleted === 1) {
        await executeQuery(`
          UPDATE skills
          SET deleted = 0, name = @name, category = @category, icon = @icon, description = @description, updated_at = GETDATE()
          WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
        `, [
          { name: 'id', type: sql.VarChar, value: String(row.id) },
          { name: 'name', type: sql.VarChar, value: cleanName },
          { name: 'category', type: sql.VarChar, value: category || 'General' },
          { name: 'icon', type: sql.VarChar, value: icon || '🎵' },
          { name: 'description', type: sql.VarChar, value: description || '' }
        ]);

        return res.status(200).json({
          success: true,
          message: 'Skill restored and updated successfully in database.',
          data: { id: row.id, name: cleanName, slug, category: category || 'General', icon: icon || '🎵', description: description || '' }
        });
      }

      return res.status(400).json({
        success: false,
        message: `Skill / Instrument '${cleanName}' already exists.`
      });
    }

    let newSkillId = null;
    try {
      const res = await executeQuery(`
        INSERT INTO skills (name, slug, icon, category, description, deleted, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @slug, @icon, @category, @description, 0, GETDATE(), GETDATE())
      `, [
        { name: 'name', type: sql.VarChar, value: cleanName },
        { name: 'slug', type: sql.VarChar, value: slug },
        { name: 'icon', type: sql.VarChar, value: icon || '🎵' },
        { name: 'category', type: sql.VarChar, value: category || 'General' },
        { name: 'description', type: sql.VarChar, value: description || '' }
      ]);
      newSkillId = res?.recordset?.[0]?.id;
    } catch (skErr) {
      newSkillId = `sk-${Date.now()}`;
      await executeQuery(`
        INSERT INTO skills (id, name, slug, icon, category, description, deleted, created_at, updated_at)
        VALUES (@id, @name, @slug, @icon, @category, @description, 0, GETDATE(), GETDATE())
      `, [
        { name: 'id', type: sql.VarChar, value: String(newSkillId) },
        { name: 'name', type: sql.VarChar, value: cleanName },
        { name: 'slug', type: sql.VarChar, value: slug },
        { name: 'icon', type: sql.VarChar, value: icon || '🎵' },
        { name: 'category', type: sql.VarChar, value: category || 'General' },
        { name: 'description', type: sql.VarChar, value: description || '' }
      ]);
    }

    return res.status(201).json({
      success: true,
      message: 'Skill created successfully in database.',
      data: {
        id: newSkillId,
        name: cleanName,
        slug,
        icon: icon || '🎵',
        category: category || 'General',
        description: description || ''
      }
    });
  } catch (error) {
    console.error('Error creating skill:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create skill.', error: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, icon, description } = req.body;

    const checkRes = await executeQuery(`
      SELECT id, name, slug FROM skills WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (!checkRes || !checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found or deleted.'
      });
    }

    const current = checkRes.recordset[0];
    const newName = name && name.trim() ? name.trim() : current.name;
    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    await executeQuery(`
      UPDATE skills
      SET 
        name = @name,
        slug = @slug,
        category = ISNULL(@category, category),
        icon = ISNULL(@icon, icon),
        description = ISNULL(@description, description),
        updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'name', type: sql.VarChar, value: newName },
      { name: 'slug', type: sql.VarChar, value: newSlug },
      { name: 'category', type: sql.VarChar, value: category !== undefined ? category : null },
      { name: 'icon', type: sql.VarChar, value: icon !== undefined ? icon : null },
      { name: 'description', type: sql.VarChar, value: description !== undefined ? description : null }
    ]);

    return res.json({
      success: true,
      message: 'Skill updated successfully in database.',
      data: {
        id,
        name: newName,
        slug: newSlug,
        category,
        icon,
        description
      }
    });
  } catch (error) {
    console.error('Error updating skill:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update skill.', error: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    const checkRes = await executeQuery(`
      SELECT id FROM skills WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    if (!checkRes || !checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found or already deleted.'
      });
    }

    await executeQuery(`
      UPDATE skills SET deleted = 1, updated_at = GETDATE() WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(id) }]);

    return res.json({
      success: true,
      message: 'Skill deleted successfully from database.'
    });
  } catch (error) {
    console.error('Error deleting skill:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete skill.', error: error.message });
  }
};

exports.getFeatures = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, name, description, is_active AS isActive
      FROM features
      WHERE deleted = 0
      ORDER BY name ASC
    `);

    if (result && result.recordset) {
      return res.json({ success: true, data: result.recordset });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching features:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving features.', error: error.message });
  }
};

exports.getGlobalFeatures = async (req, res) => {
  try {
    const result = await executeQuery(`
      IF OBJECT_ID('global_features', 'U') IS NOT NULL
        SELECT id, name, description, is_active AS isActive FROM global_features WHERE deleted = 0 ORDER BY name ASC
      ELSE
        SELECT id, name, description, is_active AS isActive FROM features WHERE deleted = 0 ORDER BY name ASC
    `);

    if (result && result.recordset) {
      return res.json({ success: true, data: result.recordset });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching global features:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving global features.', error: error.message });
  }
};

exports.createFeature = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Feature name is required.' });
    }

    const cleanName = name.trim();

    const result = await executeQuery(`
      INSERT INTO features (name, description, is_active, deleted, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@name, @description, 1, 0, GETDATE(), GETDATE())
    `, [
      { name: 'name', type: sql.VarChar, value: cleanName },
      { name: 'description', type: sql.VarChar, value: description || '' }
    ]);

    const newId = result && result.recordset && result.recordset[0] ? result.recordset[0].id : Date.now();

    return res.status(201).json({
      success: true,
      message: 'Feature created successfully.',
      data: { id: newId, name: cleanName, description: description || '', isActive: true }
    });
  } catch (error) {
    console.error('Error creating feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create feature.', error: error.message });
  }
};

exports.updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, isActive } = req.body;
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : (isActive !== undefined ? (isActive ? 1 : 0) : null);

    await executeQuery(`
      UPDATE features
      SET
        name = ISNULL(@name, name),
        description = ISNULL(@description, description),
        is_active = ISNULL(@is_active, is_active),
        updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR LOWER(name) = LOWER(@id))
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'name', type: sql.VarChar, value: name ? name.trim() : null },
      { name: 'description', type: sql.VarChar, value: description !== undefined ? description : null },
      { name: 'is_active', type: sql.Bit, value: activeVal }
    ]);

    return res.json({ success: true, message: 'Feature updated successfully.' });
  } catch (error) {
    console.error('Error updating feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update feature.', error: error.message });
  }
};

exports.deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery(`
      UPDATE features SET deleted = 1, updated_at = GETDATE() WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR LOWER(name) = LOWER(@id))
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) }
    ]);
    return res.json({ success: true, message: 'Feature deleted successfully.' });
  } catch (error) {
    console.error('Error deleting feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete feature.', error: error.message });
  }
};

exports.createGlobalFeature = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Global feature name is required.' });
    }

    const cleanName = name.trim();

    const result = await executeQuery(`
      IF OBJECT_ID('global_features', 'U') IS NOT NULL
      BEGIN
        INSERT INTO global_features (name, description, is_active, deleted, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @description, 1, 0, GETDATE(), GETDATE())
      END
    `, [
      { name: 'name', type: sql.VarChar, value: cleanName },
      { name: 'description', type: sql.VarChar, value: description || '' }
    ]);

    const newId = result && result.recordset && result.recordset[0] ? result.recordset[0].id : Date.now();

    return res.status(201).json({
      success: true,
      message: 'Global feature created successfully.',
      data: { id: newId, name: cleanName, description: description || '', isActive: true, is_active: true }
    });
  } catch (error) {
    console.error('Error creating global feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create global feature.', error: error.message });
  }
};

exports.updateGlobalFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, isActive } = req.body;
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : (isActive !== undefined ? (isActive ? 1 : 0) : null);

    await executeQuery(`
      IF OBJECT_ID('global_features', 'U') IS NOT NULL
      BEGIN
        UPDATE global_features
        SET
          name = ISNULL(@name, name),
          description = ISNULL(@description, description),
          is_active = ISNULL(@is_active, is_active),
          updated_at = GETDATE()
        WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR LOWER(name) = LOWER(@id))
      END
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'name', type: sql.VarChar, value: name ? name.trim() : null },
      { name: 'description', type: sql.VarChar, value: description !== undefined ? description : null },
      { name: 'is_active', type: sql.Bit, value: activeVal }
    ]);

    return res.json({ success: true, message: 'Global feature updated successfully.' });
  } catch (error) {
    console.error('Error updating global feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update global feature.', error: error.message });
  }
};

exports.deleteGlobalFeature = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery(`
      IF OBJECT_ID('global_features', 'U') IS NOT NULL
      BEGIN
        UPDATE global_features SET deleted = 1, updated_at = GETDATE() WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR LOWER(name) = LOWER(@id))
      END
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) }
    ]);
    return res.json({ success: true, message: 'Global feature deleted successfully.' });
  } catch (error) {
    console.error('Error deleting global feature:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete global feature.', error: error.message });
  }
};

exports.getPlans = async (req, res) => {
  try {
    await executeQuery(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'subscriptions' AND COLUMN_NAME = 'is_active')
      BEGIN
        ALTER TABLE subscriptions ADD is_active BIT NOT NULL DEFAULT 1;
      END
    `);

    const plansResult = await executeQuery(`
      SELECT s.id, s.name, s.description, s.price, s.duration_months AS durationMonths, s.features AS rawFeatures, s.is_active
      FROM subscriptions s
      WHERE s.deleted = 0
      ORDER BY s.price ASC
    `);

    if (plansResult && plansResult.recordset) {
      const featuresResult = await executeQuery(`
        SELECT sf.subscription_id, f.name AS feature_name
        FROM subscription_features sf
        JOIN features f ON (sf.feature_id = f.id OR CAST(sf.feature_id AS VARCHAR(100)) = CAST(f.id AS VARCHAR(100)))
        WHERE sf.deleted = 0 AND f.deleted = 0
      `);

      const featuresByPlan = {};
      if (featuresResult && featuresResult.recordset) {
        featuresResult.recordset.forEach((row) => {
          const subId = String(row.subscription_id);
          if (!featuresByPlan[subId]) featuresByPlan[subId] = [];
          if (!featuresByPlan[subId].includes(row.feature_name)) {
            featuresByPlan[subId].push(row.feature_name);
          }
        });
      }

      const formattedPlans = plansResult.recordset.map((plan) => {
        const subIdStr = String(plan.id);
        let planFeatures = featuresByPlan[subIdStr] || [];

        if (planFeatures.length === 0 && plan.rawFeatures) {
          if (plan.rawFeatures.startsWith('[')) {
            try {
              planFeatures = JSON.parse(plan.rawFeatures);
            } catch (e) {
              planFeatures = plan.rawFeatures.split(',').map((s) => s.trim());
            }
          } else {
            planFeatures = plan.rawFeatures.split(',').map((s) => s.trim());
          }
        }

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          price: Number(plan.price || 0),
          durationMonths: Number(plan.durationMonths || 12),
          features: planFeatures,
          is_active: plan.is_active !== undefined ? Boolean(plan.is_active) : true
        };
      });

      return res.json({ success: true, data: formattedPlans });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching pricing plans:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing plans.', error: error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, description, price, durationMonths, features } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Plan name is required.' });
    }

    const cleanName = name.trim();
    const cleanPrice = Number(price) || 0;
    const cleanDuration = Number(durationMonths) || 12;
    const featureList = Array.isArray(features) ? features : [];
    const featuresJsonStr = JSON.stringify(featureList);

    const result = await executeQuery(`
      INSERT INTO subscriptions (name, target_role, price, duration_months, description, features, is_active, deleted, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@name, 'academy', @price, @duration_months, @description, @features, @is_active, 0, GETDATE(), GETDATE())
    `, [
      { name: 'name', type: sql.VarChar, value: cleanName },
      { name: 'price', type: sql.Decimal, value: cleanPrice },
      { name: 'duration_months', type: sql.Int, value: cleanDuration },
      { name: 'description', type: sql.VarChar, value: description || '' },
      { name: 'features', type: sql.VarChar, value: featuresJsonStr },
      { name: 'is_active', type: sql.Bit, value: req.body.is_active !== undefined ? req.body.is_active : true }
    ]);

    const newPlanId = result && result.recordset && result.recordset[0] ? result.recordset[0].id : null;

    if (newPlanId && featureList.length > 0) {
      for (const featName of featureList) {
        const featRes = await executeQuery(`SELECT id FROM features WHERE name = @name AND deleted = 0`, [
          { name: 'name', type: sql.VarChar, value: featName }
        ]);
        if (featRes && featRes.recordset && featRes.recordset[0]) {
          const featId = featRes.recordset[0].id;
          await executeQuery(`
            INSERT INTO subscription_features (subscription_id, feature_id, deleted, created_at, updated_at)
            VALUES (@sub_id, @feat_id, 0, GETDATE(), GETDATE())
          `, [
            { name: 'sub_id', type: sql.VarChar, value: String(newPlanId) },
            { name: 'feat_id', type: sql.VarChar, value: String(featId) }
          ]);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully.',
      data: {
        id: newPlanId,
        name: cleanName,
        description: description || '',
        price: cleanPrice,
        durationMonths: cleanDuration,
        features: featureList,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true
      }
    });
  } catch (error) {
    console.error('Error creating pricing plan:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create pricing plan.', error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationMonths, features } = req.body;

    const featureList = Array.isArray(features) ? features : [];
    const featuresJsonStr = JSON.stringify(featureList);

    await executeQuery(`
      UPDATE subscriptions
      SET
        name = ISNULL(@name, name),
        description = ISNULL(@description, description),
        price = ISNULL(@price, price),
        duration_months = ISNULL(@duration_months, duration_months),
        features = @features,
        is_active = ISNULL(@is_active, is_active),
        updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'name', type: sql.VarChar, value: name ? name.trim() : null },
      { name: 'description', type: sql.VarChar, value: description !== undefined ? description : null },
      { name: 'price', type: sql.Decimal, value: price !== undefined ? Number(price) : null },
      { name: 'duration_months', type: sql.Int, value: durationMonths !== undefined ? Number(durationMonths) : null },
      { name: 'features', type: sql.VarChar, value: featuresJsonStr },
      { name: 'is_active', type: sql.Bit, value: req.body.is_active !== undefined ? req.body.is_active : null }
    ]);

    if (features !== undefined) {
      await executeQuery(`DELETE FROM subscription_features WHERE (subscription_id = TRY_CAST(@id AS INT) OR CAST(subscription_id AS VARCHAR(100)) = @id)`, [
        { name: 'id', type: sql.VarChar, value: String(id) }
      ]);

      for (const featName of featureList) {
        const featRes = await executeQuery(`SELECT id FROM features WHERE name = @name AND deleted = 0`, [
          { name: 'name', type: sql.VarChar, value: featName }
        ]);
        if (featRes && featRes.recordset && featRes.recordset[0]) {
          const featId = featRes.recordset[0].id;
          await executeQuery(`
            INSERT INTO subscription_features (subscription_id, feature_id, deleted, created_at, updated_at)
            VALUES (@sub_id, @feat_id, 0, GETDATE(), GETDATE())
          `, [
            { name: 'sub_id', type: sql.VarChar, value: String(id) },
            { name: 'feat_id', type: sql.VarChar, value: String(featId) }
          ]);
        }
      }
    }

    return res.json({ success: true, message: 'Subscription plan updated successfully.' });
  } catch (error) {
    console.error('Error updating pricing plan:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update pricing plan.', error: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery(`UPDATE subscriptions SET deleted = 1, updated_at = GETDATE() WHERE (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)`, [
      { name: 'id', type: sql.VarChar, value: String(id) }
    ]);
    return res.json({ success: true, message: 'Subscription plan deleted successfully.' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete pricing plan.', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// MOCK CHECKOUT & SUBSCRIPTION LIFECYCLE CONTROLLERS
// -----------------------------------------------------------------------------

const ensureMockTablesExist = async () => {
  try {
    await executeQuery(`
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
      END

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
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_plan_name')
      BEGIN
        ALTER TABLE academies ADD subscription_plan_name VARCHAR(100) NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_status')
      BEGIN
        ALTER TABLE academies ADD subscription_status VARCHAR(20) NULL DEFAULT 'Active';
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_start')
      BEGIN
        ALTER TABLE academies ADD subscription_start DATETIME NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'subscription_expiry')
      BEGIN
        ALTER TABLE academies ADD subscription_expiry DATETIME NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_social_media')
      BEGIN
        ALTER TABLE academies ADD has_social_media BIT NOT NULL DEFAULT 0;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'academies' AND COLUMN_NAME = 'has_google_map')
      BEGIN
        ALTER TABLE academies ADD has_google_map BIT NOT NULL DEFAULT 0;
      END
    `);
  } catch (err) {
    console.warn('Error creating mock tables / altering academies table:', err.message);
  }
};

const resolveNumericSubscriptionId = async (planId, planName) => {
  let numericId = null;

  if (planId !== undefined && planId !== null) {
    const rawStr = String(planId).trim();
    const extracted = rawStr.replace(/\D/g, '');
    if (extracted && !isNaN(parseInt(extracted, 10))) {
      numericId = parseInt(extracted, 10);
    }
  }

  if (!numericId && planName) {
    const lowerName = String(planName).toLowerCase();
    if (lowerName.includes('combo') || (lowerName.includes('social') && lowerName.includes('map'))) {
      numericId = 4;
    } else if (lowerName.includes('google map') || lowerName.includes('location')) {
      numericId = 3;
    } else if (lowerName.includes('social')) {
      numericId = 2;
    } else if (lowerName.includes('free')) {
      numericId = 1;
    }
  }

  if (!numericId && planId) {
    try {
      const res = await executeQuery(`
        SELECT TOP 1 id FROM subscriptions
        WHERE deleted = 0 AND (id = TRY_CAST(@planId AS INT) OR CAST(id AS VARCHAR(100)) = @planId OR LOWER(name) = LOWER(@planId))
      `, [
        { name: 'planId', type: sql.VarChar, value: String(planId) }
      ]);
      if (res && res.recordset && res.recordset.length > 0) {
        numericId = res.recordset[0].id;
      }
    } catch (e) {
      console.warn('Error fetching numeric sub ID:', e.message);
    }
  }

  return numericId || 1;
};

const getPlanTier = (planId, planName) => {
  const pName = String(planName || '').toLowerCase();
  const rawId = String(planId || '').toLowerCase();
  if (pName.includes('combo') || (pName.includes('social') && pName.includes('map')) || rawId === '4' || rawId === 'plan-4') return 4;
  if (pName.includes('google map') || pName.includes('location') || rawId === '3' || rawId === 'plan-3') return 3;
  if (pName.includes('social') || rawId === '2' || rawId === 'plan-2') return 2;
  return 1;
};

const isSubscriptionExpiredCheck = (expiryDate, status) => {
  if (status && String(status).toLowerCase() === 'expired') return true;
  if (!expiryDate) return false;
  if (String(expiryDate).toLowerCase().includes('lifetime')) return false;
  try {
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return false;
    exp.setHours(23, 59, 59, 999);
    return exp.getTime() < Date.now();
  } catch (e) {
    return false;
  }
};

exports.initiateCheckout = async (req, res) => {
  try {
    await ensureMockTablesExist();
    const { planId, academyId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required to initiate checkout.' });
    }

    const planResult = await executeQuery(`
      SELECT id, name, description, price, duration_months AS durationMonths, features
      FROM subscriptions
      WHERE deleted = 0 AND (id = TRY_CAST(@planId AS INT) OR CAST(id AS VARCHAR(100)) = @planId OR LOWER(name) = LOWER(@planId))
    `, [
      { name: 'planId', type: sql.VarChar, value: String(planId) }
    ]);

    let planData = planResult && planResult.recordset && planResult.recordset[0] ? planResult.recordset[0] : null;

    if (!planData) {
      const presets = [
        { id: '1', name: 'Free Plan', price: 0, durationMonths: 12, description: 'Includes basic directory listing and student inquiries.', features: '' },
        { id: '2', name: 'Social Media Plan', price: 499, durationMonths: 12, description: 'Free Plan features plus Social Media links visible on profile.', features: 'Social Media' },
        { id: '3', name: 'Google Map Location Plan', price: 999, durationMonths: 12, description: 'Free Plan features plus interactive Google Map Location on profile.', features: 'Google Map Location' },
        { id: '4', name: 'Social Media & Google Map Plan', price: 1499, durationMonths: 12, description: 'Includes all features: Social Media links & interactive Google Map Location.', features: 'Social Media, Google Map Location' }
      ];
      const found = presets.find((p) => p.id === String(planId) || p.name.toLowerCase().includes(String(planId).toLowerCase()));
      if (found) {
        planData = found;
      }
    }

    if (!planData) {
      return res.status(404).json({ success: false, message: 'Selected subscription plan not found.' });
    }

    if (academyId) {
      const acadRes = await executeQuery(`
        SELECT subscription_id, subscription_plan_name, subscription_status, subscription_expiry
        FROM academies
        WHERE deleted = 0 AND (id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId)
      `, [{ name: 'acadId', type: sql.VarChar, value: String(academyId) }]);

      if (acadRes && acadRes.recordset && acadRes.recordset.length > 0) {
        const curAcad = acadRes.recordset[0];
        const isExp = isSubscriptionExpiredCheck(curAcad.subscription_expiry, curAcad.subscription_status);
        if (!isExp && (curAcad.subscription_status || 'Active').toLowerCase() === 'active') {
          const curTier = getPlanTier(curAcad.subscription_id, curAcad.subscription_plan_name);
          const reqTier = getPlanTier(planData.id, planData.name);
          if (reqTier < curTier) {
            return res.status(400).json({
              success: false,
              message: `Cannot downgrade to a lower plan (${planData.name}) while your current plan (${curAcad.subscription_plan_name || 'Tier ' + curTier}) is active. Lower plans can only be selected after your current subscription expires.`
            });
          }
        }
      }
    }

    const transactionRef = `MOCK-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amount = Number(planData.price || 0);

    return res.json({
      success: true,
      message: 'Mock checkout initiated.',
      checkoutSession: {
        transactionRef,
        plan: {
          id: planData.id,
          name: planData.name,
          description: planData.description,
          price: amount,
          durationMonths: Number(planData.durationMonths || 12)
        },
        amount,
        billingCycle: `${planData.durationMonths || 12} Months`,
        academyId: academyId || null,
        isMockMode: true
      }
    });
  } catch (error) {
    console.error('Error initiating checkout:', error.message);
    res.status(500).json({ success: false, message: 'Failed to initiate checkout session.', error: error.message });
  }
};

exports.confirmCheckout = async (req, res) => {
  try {
    await ensureMockTablesExist();
    const { transactionRef, planId, academyId, status, failureReason } = req.body;

    const mockEnabled = process.env.ENABLE_MOCK_PAYMENT === 'true' || process.env.NODE_ENV !== 'production';
    if (!mockEnabled) {
      return res.status(403).json({ success: false, message: 'Mock payment checkout is disabled in production.' });
    }

    if (!transactionRef || !planId) {
      return res.status(400).json({ success: false, message: 'Transaction reference and plan ID are required.' });
    }

    const paymentStatus = (status || 'SUCCESS').toUpperCase();

    const existingTxn = await executeQuery(`
      SELECT id, payment_status FROM mock_transactions WHERE transaction_ref = @txnRef
    `, [
      { name: 'txnRef', type: sql.VarChar, value: String(transactionRef) }
    ]);

    if (existingTxn && existingTxn.recordset && existingTxn.recordset.length > 0) {
      const prev = existingTxn.recordset[0];
      return res.status(409).json({
        success: false,
        message: `Transaction ${transactionRef} has already been processed with status ${prev.payment_status}.`,
        transactionRef,
        paymentStatus: prev.payment_status
      });
    }

    const planResult = await executeQuery(`
      SELECT id, name, description, price, duration_months AS durationMonths, features
      FROM subscriptions
      WHERE deleted = 0 AND (id = TRY_CAST(@planId AS INT) OR CAST(id AS VARCHAR(100)) = @planId OR LOWER(name) = LOWER(@planId))
    `, [
      { name: 'planId', type: sql.VarChar, value: String(planId) }
    ]);

    let planData = planResult && planResult.recordset && planResult.recordset[0] ? planResult.recordset[0] : null;

    if (!planData) {
      const presets = [
        { id: '1', name: 'Free Plan', price: 0, durationMonths: 12, description: 'Includes basic directory listing and student inquiries.', features: '' },
        { id: '2', name: 'Social Media Plan', price: 499, durationMonths: 12, description: 'Free Plan features plus Social Media links visible on profile.', features: 'Social Media' },
        { id: '3', name: 'Google Map Location Plan', price: 999, durationMonths: 12, description: 'Free Plan features plus interactive Google Map Location on profile.', features: 'Google Map Location' },
        { id: '4', name: 'Social Media & Google Map Plan', price: 1499, durationMonths: 12, description: 'Includes all features: Social Media links & interactive Google Map Location.', features: 'Social Media, Google Map Location' }
      ];
      planData = presets.find((p) => p.id === String(planId) || p.name.toLowerCase().includes(String(planId).toLowerCase())) || presets[0];
    }

    const amount = Number(planData.price || 0);
    const durationMonths = Number(planData.durationMonths || 12);
    const pName = planData.name || 'Free Plan';
    const hasSocial = pName.toLowerCase().includes('social media');
    const hasMap = pName.toLowerCase().includes('google map');

    const numericSubId = await resolveNumericSubscriptionId(planData.id || planId, pName);

    // Try to resolve user_id and academy_id
    let resolvedAcadId = null;
    let resolvedUserId = req.user?.id || req.body?.userId || null;

    if (academyId) {
      const acadRes = await executeQuery(`
        SELECT id, user_id, subscription_id, subscription_plan_name, subscription_status, subscription_expiry FROM academies
        WHERE deleted = 0 AND (id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId)
      `, [{ name: 'acadId', type: sql.VarChar, value: String(academyId) }]);

      if (acadRes && acadRes.recordset && acadRes.recordset.length > 0) {
        resolvedAcadId = acadRes.recordset[0].id;
        if (!resolvedUserId && acadRes.recordset[0].user_id) {
          resolvedUserId = acadRes.recordset[0].user_id;
        }

        // Validate downgrade
        // Downgrade check removed to allow buying multiple concurrent plans
      }
    }

    if (!resolvedAcadId && resolvedUserId) {
      const acadRes2 = await executeQuery(`
        SELECT id, subscription_id, subscription_plan_name, subscription_status, subscription_expiry FROM academies WHERE deleted = 0 AND (user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId)
      `, [{ name: 'uId', type: sql.VarChar, value: String(resolvedUserId) }]);
      if (acadRes2 && acadRes2.recordset && acadRes2.recordset.length > 0) {
        resolvedAcadId = acadRes2.recordset[0].id;
        const curAcad2 = acadRes2.recordset[0];
        // Downgrade check removed to allow buying multiple concurrent plans
      }
    }

    const targetAcadId = resolvedAcadId || (academyId ? String(academyId) : null);

    await executeQuery(`
      INSERT INTO mock_transactions (transaction_ref, user_id, academy_id, subscription_id, amount, billing_period_months, payment_status, payment_method, failure_reason, is_mock, created_at, updated_at)
      VALUES (@txnRef, TRY_CAST(@uId AS INT), TRY_CAST(@acadId AS INT), @subId, @amount, @durationMonths, @status, 'MOCK_CHECKOUT', @failReason, 1, GETDATE(), GETDATE())
    `, [
      { name: 'txnRef', type: sql.VarChar, value: String(transactionRef) },
      { name: 'uId', type: sql.VarChar, value: resolvedUserId ? String(resolvedUserId) : null },
      { name: 'acadId', type: sql.VarChar, value: targetAcadId ? String(targetAcadId) : null },
      { name: 'subId', type: sql.Int, value: numericSubId },
      { name: 'amount', type: sql.Decimal, value: amount },
      { name: 'durationMonths', type: sql.Int, value: durationMonths },
      { name: 'status', type: sql.VarChar, value: paymentStatus },
      { name: 'failReason', type: sql.VarChar, value: paymentStatus === 'FAILED' ? (failureReason || 'Simulated payment decline') : null }
    ]);

    if (paymentStatus === 'SUCCESS') {
      const isFree = numericSubId === 1 || getPlanTier(numericSubId, pName) === 1;
      const startDate = new Date();
      const expiryDate = isFree ? new Date('2099-12-31') : new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);
      const startStr = startDate.toISOString().split('T')[0];
      const expiryStr = isFree ? '2099-12-31' : expiryDate.toISOString().split('T')[0];

      // 1. UPDATE ACADEMIES TABLE
      if (targetAcadId) {
        await executeQuery(`
          UPDATE academies
          SET
            subscription_id = @subId,
            subscription_plan_name = CASE 
               WHEN subscription_plan_name = 'Free Plan' OR subscription_plan_name IS NULL THEN @planName
               WHEN subscription_plan_name LIKE '%' + @planName + '%' THEN subscription_plan_name
               ELSE subscription_plan_name + ' & ' + @planName
            END,
            subscription_status = 'Active',
            subscription_start = CASE 
               WHEN subscription_start IS NULL THEN @startDate 
               ELSE subscription_start 
            END,
            subscription_expiry = CASE 
               WHEN subscription_expiry IS NOT NULL AND subscription_expiry > @expiryDate THEN subscription_expiry 
               ELSE @expiryDate 
            END,
            has_social_media = CASE WHEN @hasSocial = 1 THEN 1 ELSE has_social_media END,
            has_google_map = CASE WHEN @hasMap = 1 THEN 1 ELSE has_google_map END,
            updated_at = GETDATE()
          WHERE id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId
        `, [
          { name: 'acadId', type: sql.VarChar, value: String(targetAcadId) },
          { name: 'subId', type: sql.Int, value: numericSubId },
          { name: 'planName', type: sql.VarChar, value: pName },
          { name: 'startDate', type: sql.VarChar, value: startStr },
          { name: 'expiryDate', type: sql.VarChar, value: expiryStr },
          { name: 'hasSocial', type: sql.Bit, value: hasSocial ? 1 : 0 },
          { name: 'hasMap', type: sql.Bit, value: hasMap ? 1 : 0 }
        ]);
      }

      // 2. UPDATE USERS TABLE
      if (resolvedUserId) {
        await executeQuery(`
          UPDATE users
          SET subscription_id = @subId, updated_at = GETDATE()
          WHERE id = TRY_CAST(@uId AS INT) OR CAST(id AS VARCHAR(100)) = @uId
        `, [
          { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
          { name: 'subId', type: sql.Int, value: numericSubId }
        ]);

        // 3. UPDATE/INSERT USER_SUBSCRIPTIONS TABLE
        const subCheck = await executeQuery(`
          SELECT id FROM user_subscriptions WHERE user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId
        `, [{ name: 'uId', type: sql.VarChar, value: String(resolvedUserId) }]);

        if (subCheck && subCheck.recordset && subCheck.recordset.length > 0) {
          await executeQuery(`
            UPDATE user_subscriptions
            SET subscription_id = @subId,
                start_date = @startDate,
                expiry_date = @expiryDate,
                status = 'Active',
                payment_status = 'Paid',
                updated_at = GETDATE()
            WHERE user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId
          `, [
            { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
            { name: 'subId', type: sql.Int, value: numericSubId },
            { name: 'startDate', type: sql.VarChar, value: startStr },
            { name: 'expiryDate', type: sql.VarChar, value: expiryStr }
          ]);
        } else {
          await executeQuery(`
            INSERT INTO user_subscriptions (user_id, subscription_id, start_date, expiry_date, status, payment_status, created_at, updated_at)
            VALUES (TRY_CAST(@uId AS INT), @subId, @startDate, @expiryDate, 'Active', 'Paid', GETDATE(), GETDATE())
          `, [
            { name: 'uId', type: sql.VarChar, value: String(resolvedUserId) },
            { name: 'subId', type: sql.Int, value: numericSubId },
            { name: 'startDate', type: sql.VarChar, value: startStr },
            { name: 'expiryDate', type: sql.VarChar, value: expiryStr }
          ]);
        }
      }

      // 4. INSERT SUBSCRIPTION HISTORY
      await executeQuery(`
        INSERT INTO subscription_history (user_id, academy_id, subscription_id, action_type, start_date, expiry_date, transaction_ref, created_at)
        VALUES (TRY_CAST(@uId AS INT), TRY_CAST(@acadId AS INT), @subId, 'ACTIVATED', GETDATE(), DATEADD(month, @months, GETDATE()), @txnRef, GETDATE())
      `, [
        { name: 'uId', type: sql.VarChar, value: resolvedUserId ? String(resolvedUserId) : null },
        { name: 'acadId', type: sql.VarChar, value: targetAcadId ? String(targetAcadId) : null },
        { name: 'subId', type: sql.Int, value: numericSubId },
        { name: 'months', type: sql.Int, value: durationMonths },
        { name: 'txnRef', type: sql.VarChar, value: String(transactionRef) }
      ]);

      return res.json({
        success: true,
        message: `Payment successful! Upgraded to ${pName} (Subscription ID: ${numericSubId}).`,
        transactionRef,
        paymentStatus: 'SUCCESS',
        subscription: {
          planId: numericSubId,
          planName: pName,
          price: amount,
          status: 'Active',
          startDate: startStr,
          expiryDate: expiryStr,
          hasSocialMedia: hasSocial,
          hasGoogleMap: hasMap
        }
      });
    } else if (paymentStatus === 'FAILED') {
      return res.json({
        success: false,
        message: failureReason || 'Simulated payment failed (card declined / insufficient test funds).',
        transactionRef,
        paymentStatus: 'FAILED'
      });
    } else {
      return res.json({
        success: false,
        message: 'Mock payment checkout session was cancelled by user.',
        transactionRef,
        paymentStatus: 'CANCELLED'
      });
    }
  } catch (error) {
    console.error('Error confirming checkout:', error.message);
    res.status(500).json({ success: false, message: 'Failed to confirm checkout.', error: error.message });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    await ensureMockTablesExist();
    const { academyId } = req.query;

    if (!academyId) {
      return res.status(400).json({ success: false, message: 'Academy ID is required.' });
    }

    const academyResult = await executeQuery(`
      SELECT id, academy_name AS academyName, subscription_id AS subscriptionPlanId, subscription_plan_name AS subscriptionPlanName, subscription_status AS subscriptionStatus, subscription_start AS subscriptionStart, subscription_expiry AS subscriptionExpiry, has_social_media AS hasSocialMedia, has_google_map AS hasGoogleMap
      FROM academies
      WHERE deleted = 0 AND (id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId)
    `, [
      { name: 'acadId', type: sql.VarChar, value: String(academyId) }
    ]);

    const acad = academyResult && academyResult.recordset && academyResult.recordset[0] ? academyResult.recordset[0] : null;

    const txnsResult = await executeQuery(`
      SELECT transaction_ref AS transactionRef, amount, billing_period_months AS billingPeriodMonths, payment_status AS paymentStatus, payment_method AS paymentMethod, failure_reason AS failureReason, created_at AS createdAt
      FROM mock_transactions
      WHERE academy_id = TRY_CAST(@acadId AS INT) OR CAST(academy_id AS VARCHAR(100)) = @acadId
      ORDER BY created_at DESC
    `, [
      { name: 'acadId', type: sql.VarChar, value: String(academyId) }
    ]);

    const transactions = txnsResult && txnsResult.recordset ? txnsResult.recordset : [];

    return res.json({
      success: true,
      data: {
        academy: acad,
        transactions
      }
    });
  } catch (error) {
    console.error('Error getting current subscription:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve subscription info.', error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    await ensureMockTablesExist();
    const { academyId } = req.body;

    if (!academyId) {
      return res.status(400).json({ success: false, message: 'Academy ID is required to cancel subscription.' });
    }

    const acadOwnerRes = await executeQuery(`
      SELECT user_id FROM academies WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id OR slug = @id)
    `, [{ name: 'id', type: sql.VarChar, value: String(academyId) }]);

    const uId = acadOwnerRes?.recordset?.[0]?.user_id || null;

    await executeQuery(`
      UPDATE academies
      SET
        subscription_id = 1,
        subscription_plan_name = 'Free Plan',
        subscription_status = 'Disabled',
        has_social_media = 0,
        has_google_map = 0,
        updated_at = GETDATE()
      WHERE id = TRY_CAST(@acadId AS INT) OR CAST(id AS VARCHAR(100)) = @acadId OR slug = @acadId
    `, [
      { name: 'acadId', type: sql.VarChar, value: String(academyId) }
    ]);

    if (uId) {
      await executeQuery(`
        UPDATE users SET subscription_id = 1, updated_at = GETDATE()
        WHERE id = TRY_CAST(@uId AS INT) OR CAST(id AS VARCHAR(100)) = @uId
      `, [{ name: 'uId', type: sql.VarChar, value: String(uId) }]);

      await executeQuery(`
        UPDATE user_subscriptions SET status = 'Cancelled', updated_at = GETDATE()
        WHERE user_id = TRY_CAST(@uId AS INT) OR CAST(user_id AS VARCHAR(100)) = @uId
      `, [{ name: 'uId', type: sql.VarChar, value: String(uId) }]);
    }

    await executeQuery(`
      INSERT INTO subscription_history (user_id, academy_id, subscription_id, action_type, start_date, expiry_date, created_at)
      VALUES (TRY_CAST(@uId AS INT), TRY_CAST(@acadId AS INT), 1, 'CANCELLED', GETDATE(), GETDATE(), GETDATE())
    `, [
      { name: 'uId', type: sql.VarChar, value: uId ? String(uId) : null },
      { name: 'acadId', type: sql.VarChar, value: String(academyId) }
    ]);

    return res.json({ success: true, message: 'Subscription cancelled successfully. Reverted to Free Plan.' });
  } catch (error) {
    console.error('Error cancelling subscription:', error.message);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription.', error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, student_name AS userName, rating, comment, FORMAT(created_at, 'MMM dd, yyyy') AS date, academy_id AS academyId, 'Approved' AS status
      FROM reviews
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.', error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { userName, rating, comment, academyId, userId } = req.body;
    if (!userName || !rating || !academyId) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const result = await executeQuery(`
      INSERT INTO reviews (student_name, rating, comment, academy_id, user_id, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.student_name AS userName, INSERTED.rating, INSERTED.comment, FORMAT(INSERTED.created_at, 'MMM dd, yyyy') AS date, INSERTED.academy_id AS academyId, 'Approved' AS status
      VALUES (@userName, @rating, @comment, TRY_CAST(@academyId AS INT), TRY_CAST(@userId AS INT), GETDATE(), GETDATE())
    `, [
      { name: 'userName', type: sql.VarChar, value: userName },
      { name: 'rating', type: sql.Int, value: Number(rating) },
      { name: 'comment', type: sql.VarChar, value: comment || '' },
      { name: 'academyId', type: sql.VarChar, value: String(academyId) },
      { name: 'userId', type: sql.VarChar, value: userId ? String(userId) : null }
    ]);

    const newReview = result.recordset[0];
    res.status(201).json({ success: true, message: 'Review created successfully.', data: newReview });
  } catch (error) {
    console.error('Error creating review:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create review.', error: error.message });
  }
};

