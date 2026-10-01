const crypto = require('crypto');
const { executeQuery, sql } = require('../config/db');

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
  const expDate = formatDateStr(row.subscriptionExpiry || row.subscription_expiry || row.expiry_date)
    || (row.created_at ? formatDateStr(new Date(new Date(row.created_at).getTime() + 365 * 24 * 60 * 60 * 1000)) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const planName = (row.subscriptionPlanName || row.subscription_name || 'Free Plan').trim();
  const planNameLower = planName.toLowerCase();

  const hasSocialMedia = planNameLower.includes('social media') || planNameLower.includes('google map') || planNameLower.includes('send inquiry');
  const hasGoogleMap = planNameLower.includes('google map') || planNameLower.includes('diamond');
  const hasSendInquiry = true; // Send Inquiry included in Free Plan and all subscription tiers

  return {
    ...row,
    pincode: row.pincode || row.pin_code || row.areaPincode || '',
    skills: row.skillsList ? row.skillsList.split(', ') : ['Guitar', 'Western Music', 'Vocal'],
    subscriptionPlanId: row.subscriptionPlanId || row.subscription_id || 'plan-1',
    subscriptionPlanName: planName,
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
        a.id, a.slug, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, ar.pincode AS areaPincode, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.whatsapp, a.social_website AS socialWebsite, a.social_instagram AS socialInstagram,
        a.social_youtube AS socialYoutube, a.social_facebook AS socialFacebook,
        a.social_linkedin AS socialLinkedin, a.profile_views AS profileViews,
        sub.name AS subscriptionPlanName, COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS subscriptionPlanId,
        us.expiry_date AS subscriptionExpiry, us.start_date AS subscriptionStart, us.status AS subscriptionStatus,
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
      LEFT JOIN user_subscriptions us ON (u.id = us.user_id OR CAST(u.id AS VARCHAR(100)) = CAST(us.user_id AS VARCHAR(100)))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
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
        a.id, a.slug, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.created_at AS createdAt, sub.name AS subscriptionPlanName, COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS subscriptionPlanId,
        us.expiry_date AS subscriptionExpiry, us.start_date AS subscriptionStart, us.status AS subscriptionStatus,
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
      LEFT JOIN user_subscriptions us ON (u.id = us.user_id OR CAST(u.id AS VARCHAR(100)) = CAST(us.user_id AS VARCHAR(100)))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
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
        a.id, a.slug, a.academy_name AS academyName, a.teacher_name AS teacherName,
        a.email, a.phone, c.name AS city, ar.name AS area, a.experience_years AS experienceYears,
        a.rating, a.status, a.fees_per_month AS feesPerMonth, a.address, a.bio AS about,
        a.teaching_modes AS teachingModesRaw, a.batch_types AS batchTypesRaw, a.languages AS languagesRaw,
        a.profile_image AS profileImage, a.cover_image AS coverImage, a.map_url AS mapUrl,
        a.whatsapp, a.social_website AS socialWebsite, a.social_instagram AS socialInstagram,
        a.social_youtube AS socialYoutube, a.social_facebook AS socialFacebook,
        a.social_linkedin AS socialLinkedin, a.profile_views AS profileViews,
        sub.name AS subscriptionPlanName, COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS subscriptionPlanId,
        us.expiry_date AS subscriptionExpiry, us.start_date AS subscriptionStart, us.status AS subscriptionStatus,
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
      LEFT JOIN user_subscriptions us ON (u.id = us.user_id OR CAST(u.id AS VARCHAR(100)) = CAST(us.user_id AS VARCHAR(100)))
      LEFT JOIN subscriptions sub ON (
        COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) = sub.id 
        OR CAST(COALESCE(a.subscription_id, us.subscription_id, u.subscription_id) AS VARCHAR(100)) = CAST(sub.id AS VARCHAR(100))
      )
      WHERE a.deleted = 0 AND (a.slug = @slug OR a.id = TRY_CAST(@slug AS INT) OR CAST(a.id AS VARCHAR(100)) = @slug)
    `, [
      { name: 'slug', type: sql.VarChar, value: String(slug) }
    ]);

    if (result && result.recordset && result.recordset.length > 0) {
      const acad = formatAcademyRow(result.recordset[0]);
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
    const { academyId, skillId, skill, studentName, studentEmail, studentPhone, preferredSlot, mode, message } = req.body;
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
        (SELECT ISNULL(AVG(rating), 4.9) FROM academies WHERE deleted = 0 AND status = 'Approved' AND rating > 0) AS avgRating
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
    const plansResult = await executeQuery(`
      SELECT s.id, s.name, s.description, s.price, s.duration_months AS durationMonths, s.features AS rawFeatures
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
          features: planFeatures
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
      INSERT INTO subscriptions (name, target_role, price, duration_months, description, features, deleted, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@name, 'academy', @price, @duration_months, @description, @features, 0, GETDATE(), GETDATE())
    `, [
      { name: 'name', type: sql.VarChar, value: cleanName },
      { name: 'price', type: sql.Decimal, value: cleanPrice },
      { name: 'duration_months', type: sql.Int, value: cleanDuration },
      { name: 'description', type: sql.VarChar, value: description || '' },
      { name: 'features', type: sql.VarChar, value: featuresJsonStr }
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
        features: featureList
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
        updated_at = GETDATE()
      WHERE deleted = 0 AND (id = TRY_CAST(@id AS INT) OR CAST(id AS VARCHAR(100)) = @id)
    `, [
      { name: 'id', type: sql.VarChar, value: String(id) },
      { name: 'name', type: sql.VarChar, value: name ? name.trim() : null },
      { name: 'description', type: sql.VarChar, value: description !== undefined ? description : null },
      { name: 'price', type: sql.Decimal, value: price !== undefined ? Number(price) : null },
      { name: 'duration_months', type: sql.Int, value: durationMonths !== undefined ? Number(durationMonths) : null },
      { name: 'features', type: sql.VarChar, value: featuresJsonStr }
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
