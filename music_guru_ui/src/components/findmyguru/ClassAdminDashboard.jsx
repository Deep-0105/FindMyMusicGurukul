import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import { guruService } from '../../services/guruService';
import { getSkillIcon } from '../../utils/skillIcons';
import { ZipImage, compressImageToZip } from '../../utils/zipImageUtils';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import LoaderSpinner from './LoaderSpinner';
import MockCheckoutModal from './MockCheckoutModal';
import {
  Building2,
  CheckCircle2,
  Eye,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Edit3,
  Sliders,
  ExternalLink,
  Save,
  ChevronDown,
  Check,
  X,
  Upload,
  Camera,
  Image,
  Trash2,
  AlertTriangle,
  Clock,
  AlertCircle,
  Link,
  Lock,
  Unlock,
  Globe,
  Send
} from 'lucide-react';

const parseBatchTypes = (arr) => {
  if (!Array.isArray(arr)) return ['Individual', 'Group'];
  const res = [];
  arr.forEach((b) => {
    const s = String(b).toLowerCase();
    if (s.includes('individual') && !res.includes('Individual')) res.push('Individual');
    if ((s.includes('group') || s.includes('batch')) && !res.includes('Group')) res.push('Group');
  });
  return res.length > 0 ? res : ['Individual', 'Group'];
};

const parseLanguages = (val) => {
  if (Array.isArray(val) && val.length > 0) return val;
  if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim()).filter(Boolean);
  return ['English', 'Hindi'];
};

const PREDEFINED_LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Malayalam',
  'Sanskrit',
  'Odia'
];

// Validation Helpers for Edit Profile
const hasSpecialChars = (str) => /[^a-zA-Z0-9\s.'-]/.test(str || '');

const isValidPincode = (val) => /^\d{6}$/.test((val || '').trim());

const isValidGoogleMapsUrl = (urlStr) => {
  if (!urlStr || !urlStr.trim()) return true;
  const cleaned = urlStr.trim();
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    return (
      (host.includes('google.com') && (path.includes('/maps') || path.includes('/maps/'))) ||
      host.includes('maps.google.com') ||
      host.includes('goo.gl') ||
      host.includes('maps.app.goo.gl') ||
      host.includes('g.co')
    );
  } catch (_) {
    return false;
  }
};

const isValidUrl = (urlStr) => {
  if (!urlStr || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const ClassAdminDashboard = () => {
  const {
    academies,
    activeAcademyId,
    setActiveAcademyId,
    updateAcademyProfile,
    inquiries,
    updateInquiryStatus,
    skills,
    currentUser,
    plans,
    updateAcademySubscription,
    checkSocialMediaAccess,
    checkSendInquiryAccess,
    checkGoogleMapAccess,
    checkLeadContactAccess
  } = useGuru();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('inquiries');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const userPhone = (currentUser?.phone || '').replace(/\D/g, '');
  const userAcadId = currentUser?.academyId;

  const userAcademy = currentUser
    ? academies.find(
      (a) =>
        (userAcadId && (a.id === userAcadId || a.slug === userAcadId)) ||
        (a.email && userEmail && a.email.toLowerCase().trim() === userEmail) ||
        (a.phone && userPhone && a.phone.replace(/\D/g, '') === userPhone)
    ) || academies.find((a) => a.status === 'Pending')
    : null;

  const academy = userAcademy || academies.find((a) => a.id === activeAcademyId) || academies.find((a) => a.status === 'Pending') || academies[0] || {};
  const academyInquiries = inquiries.filter((inq) => inq.academyId === academy.id);

  const hasSocialAccess = checkSocialMediaAccess ? checkSocialMediaAccess(academy) : true;
  const hasInquiryAccess = checkSendInquiryAccess ? checkSendInquiryAccess(academy) : true;
  const hasGoogleMapAccess = checkGoogleMapAccess ? checkGoogleMapAccess(academy) : true;
  const hasLeadContactAccess = checkLeadContactAccess ? checkLeadContactAccess(academy) : false;

  const googleMapPlan = plans?.find((p) => p.name === 'Google Map Location Plan' || String(p.id) === '3' || String(p.id) === 'plan-3') || { name: 'Google Map Location Plan', price: 999 };
  const contactPlan = plans?.find((p) => String(p.name).toLowerCase().includes('contacts plan')) || { name: 'View Contacts Plan', price: 599 };

  const isSubscriptionExpired = (expiryDateStr, status) => {
    if (status && String(status).toLowerCase() === 'expired') return true;
    if (!expiryDateStr) return false;
    if (String(expiryDateStr).toLowerCase().includes('lifetime')) return false;
    try {
      const expDate = new Date(expiryDateStr);
      if (isNaN(expDate.getTime())) return false;
      expDate.setHours(23, 59, 59, 999);
      return expDate.getTime() < Date.now();
    } catch (e) {
      return false;
    }
  };

  const getTierFromPlan = (planObj) => {
    if (!planObj) return 1;
    const name = String(planObj.name || '').toLowerCase();
    const idStr = String(planObj.id || '').toLowerCase();
    if (name.includes('combo') || name.includes('all-in-one') || (name.includes('social') && name.includes('map')) || idStr === '4' || idStr === 'plan-4') return 5;
    if (name.includes('contacts') || name.includes('contact plan')) return 4;
    if (name.includes('google map') || name.includes('location') || idStr === '3' || idStr === 'plan-3') return 3;
    if (name.includes('social') || idStr === '2' || idStr === 'plan-2') return 2;
    return 1;
  };

  const currentIsExpired = isSubscriptionExpired(academy?.subscriptionExpiry, academy?.subscriptionStatus);
  const currentPlanTier = currentIsExpired
    ? 1
    : getTierFromPlan({
      name: academy?.subscriptionPlanName || 'Free Plan',
      id: academy?.subscriptionPlanId || academy?.subscription_id
    });
  const isPaidPlanActive = !currentIsExpired && currentPlanTier > 1 && (academy?.subscriptionStatus || 'Active').toLowerCase() === 'active';

  const handleOpenCheckout = (planObj) => {
    setSelectedPlanForCheckout(planObj);
    setIsCheckoutModalOpen(true);
    setIsUpgradeModalOpen(false);
  };

  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);

  const compressImageFile = (file, maxWidth = 600, maxHeight = 600, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleProfileImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image upload size must be less than 2 MB");
        return;
      }
      setIsSaving(true);
      const compressedDataUrl = await compressImageFile(file, 500, 500, 0.85);
      if (compressedDataUrl) {
        const zipFormatted = await compressImageToZip(compressedDataUrl, 'profile_avatar.jpg');
        setProfileForm((prev) => ({ ...prev, profileImage: zipFormatted || compressedDataUrl }));
      }
      setIsSaving(false);
    }
  };

  const handleCoverImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image upload size must be less than 2 MB");
        return;
      }
      setIsSaving(true);
      const compressedDataUrl = await compressImageFile(file, 1200, 500, 0.85);
      if (compressedDataUrl) {
        const zipFormatted = await compressImageToZip(compressedDataUrl, 'cover_banner.jpg');
        setProfileForm((prev) => ({ ...prev, coverImage: zipFormatted || compressedDataUrl }));
      }
      setIsSaving(false);
    }
  };

  const [profileForm, setProfileForm] = useState(() => ({
    ...academy,
    pincode: academy?.pincode || academy?.pinCode || '',
    teachingMode: Array.isArray(academy?.teachingMode) ? academy.teachingMode : ['Offline', 'Online'],
    batchType: parseBatchTypes(academy?.batchType),
    languages: parseLanguages(academy?.languages),
    languagesStr: parseLanguages(academy?.languages).join(', '),
    socialLinks: academy?.socialLinks || { website: '', whatsapp: '', instagram: '', youtube: '', facebook: '', linkedin: '' }
  }));

  const [validationErrors, setValidationErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (academy) {
      const langs = parseLanguages(academy.languages);
      setProfileForm({
        ...academy,
        pincode: academy.pincode || academy.pinCode || '',
        teachingMode: Array.isArray(academy.teachingMode) ? academy.teachingMode : ['Offline', 'Online'],
        batchType: parseBatchTypes(academy.batchType),
        languages: langs,
        languagesStr: langs.join(', '),
        socialLinks: academy.socialLinks || { website: '', whatsapp: '', instagram: '', youtube: '', facebook: '', linkedin: '' }
      });
      setValidationErrors({});
    }
  }, [activeAcademyId, academy]);

  const calcProfileCompletion = (ac) => {
    let count = 0;
    const fields = [
      ac.academyName,
      ac.teacherName,
      ac.email,
      ac.phone,
      ac.city,
      ac.area,
      ac.pincode || ac.pinCode,
      ac.address,
      ac.about,
      ac.skills?.length > 0,
      ac.certificates?.length > 0,
      ac.profileImage,
      ac.mapUrl
    ];
    fields.forEach((f) => {
      if (f) count++;
    });
    return Math.round((count / fields.length) * 100);
  };

  const completionPct = calcProfileCompletion(academy);

  const validateForm = () => {
    const errors = {};

    // 1. Academy Name (Compulsory, no special characters)
    if (!profileForm.academyName || !profileForm.academyName.trim()) {
      errors.academyName = 'Academy Name is compulsory.';
    } else if (hasSpecialChars(profileForm.academyName)) {
      errors.academyName = 'Academy Name cannot contain special characters (only letters, numbers, spaces, dots, hyphens allowed).';
    }

    // 2. Teacher / Guru Name (Compulsory, no special characters)
    if (!profileForm.teacherName || !profileForm.teacherName.trim()) {
      errors.teacherName = 'Teacher / Guru Name is compulsory.';
    } else if (hasSpecialChars(profileForm.teacherName)) {
      errors.teacherName = 'Teacher / Guru Name cannot contain special characters (only letters, spaces, dots, hyphens allowed).';
    }

    // 3. Pincode (Compulsory, 6-digit numeric)
    if (!profileForm.pincode || !String(profileForm.pincode).trim()) {
      errors.pincode = 'Pincode is compulsory.';
    } else if (!isValidPincode(profileForm.pincode)) {
      errors.pincode = 'Please enter a valid 6-digit postal pincode (e.g. 411057).';
    }

    // 4. Teaching Mode (At least 1 must be selected)
    if (!profileForm.teachingMode || profileForm.teachingMode.length === 0) {
      errors.teachingMode = 'Please select at least 1 Teaching Mode (Offline, Online, or Home Tuition).';
    }

    // 5. Batch Type (At least 1 must be selected)
    if (!profileForm.batchType || profileForm.batchType.length === 0) {
      errors.batchType = 'Please select at least 1 Batch Type (Individual or Group).';
    }

    // 6. Phone Number (Compulsory)
    if (!profileForm.phone || !profileForm.phone.trim()) {
      errors.phone = 'Phone Number is compulsory.';
    }

    // 7. Email Address (Compulsory)
    if (!profileForm.email || !profileForm.email.trim()) {
      errors.email = 'Email Address is compulsory.';
    }

    // 8. Google Maps URL Validation
    if (profileForm.mapUrl && !isValidGoogleMapsUrl(profileForm.mapUrl)) {
      errors.mapUrl = 'Please enter a valid Google Maps URL (e.g. https://maps.google.com/?q=... or https://maps.app.goo.gl/...).';
    }

    // 9. Other Social / Profile Link URL Validations
    const social = profileForm.socialLinks || {};
    if (social.website && !isValidUrl(social.website)) {
      errors.website = 'Please enter a valid Website URL (starting with http:// or https://).';
    }
    if (social.whatsapp && !isValidUrl(social.whatsapp)) {
      errors.whatsapp = 'Please enter a valid WhatsApp link (starting with http:// or https://).';
    }
    if (social.instagram && !isValidUrl(social.instagram)) {
      errors.instagram = 'Please enter a valid Instagram URL (starting with http:// or https://).';
    }
    if (social.youtube && !isValidUrl(social.youtube)) {
      errors.youtube = 'Please enter a valid YouTube URL (starting with http:// or https://).';
    }
    if (social.facebook && !isValidUrl(social.facebook)) {
      errors.facebook = 'Please enter a valid Facebook URL (starting with http:// or https://).';
    }
    if (social.linkedin && !isValidUrl(social.linkedin)) {
      errors.linkedin = 'Please enter a valid LinkedIn URL (starting with http:// or https://).';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleTeachingMode = (mode) => {
    const current = profileForm.teachingMode || ['Offline', 'Online'];
    const updated = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode];
    setProfileForm({ ...profileForm, teachingMode: updated });
    if (updated.length > 0 && validationErrors.teachingMode) {
      setValidationErrors((prev) => ({ ...prev, teachingMode: undefined }));
    }
  };

  const toggleBatchType = (bt) => {
    const current = profileForm.batchType || ['Individual'];
    const updated = current.includes(bt)
      ? current.filter((b) => b !== bt)
      : [...current, bt];
    setProfileForm({ ...profileForm, batchType: updated });
    if (updated.length > 0 && validationErrors.batchType) {
      setValidationErrors((prev) => ({ ...prev, batchType: undefined }));
    }
  };

  const toggleLanguage = (lang) => {
    const current = profileForm.languages || ['English', 'Hindi'];
    const updated = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setProfileForm({
      ...profileForm,
      languages: updated,
      languagesStr: updated.join(', ')
    });
  };

  const handleSocialChange = (key, val) => {
    setProfileForm({
      ...profileForm,
      socialLinks: {
        ...(profileForm.socialLinks || {}),
        [key]: val
      }
    });
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setValidationErrors({});

    const formattedLanguages = profileForm.languages && profileForm.languages.length > 0
      ? profileForm.languages
      : (typeof profileForm.languagesStr === 'string'
        ? profileForm.languagesStr.split(',').map((l) => l.trim()).filter(Boolean)
        : ['English', 'Hindi']);

    const expNum = parseFloat(profileForm.experienceYears);

    setIsSaving(true);

    let profileImgZip = profileForm.profileImage;
    let coverImgZip = profileForm.coverImage;

    if (profileForm.profileImage && typeof profileForm.profileImage === 'string' && !profileForm.profileImage.startsWith('ZIP_IMG:')) {
      profileImgZip = await compressImageToZip(profileForm.profileImage, 'profile_avatar.jpg');
    }
    if (profileForm.coverImage && typeof profileForm.coverImage === 'string' && !profileForm.coverImage.startsWith('ZIP_IMG:')) {
      coverImgZip = await compressImageToZip(profileForm.coverImage, 'cover_banner.jpg');
    }

    const payload = {
      ...profileForm,
      profileImage: profileImgZip || profileForm.profileImage,
      coverImage: coverImgZip || profileForm.coverImage,
      pincode: (profileForm.pincode || '').trim(),
      experienceYears: isNaN(expNum) ? 0 : parseFloat(expNum.toFixed(1)),
      languages: formattedLanguages,
      batchType: profileForm.batchType || ['Individual']
    };

    updateAcademyProfile(academy.id, payload);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 600);
  };

  const toggleSkill = (skillName) => {
    const currentSkills = profileForm.skills || [];
    const exists = currentSkills.includes(skillName);
    const updated = exists
      ? currentSkills.filter((s) => s !== skillName)
      : [...currentSkills, skillName];

    setProfileForm({
      ...profileForm,
      skills: updated,
      primarySkill: updated.length > 0 ? updated[0] : 'Guitar'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />

      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <ZipImage
              src={academy.profileImage}
              alt={academy.teacherName}
              className="w-16 h-16 rounded-2xl border-2 border-emerald-400 object-cover shadow-lg shrink-0 bg-slate-800"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${academy.status === 'Approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                  Status: {academy.status}
                </span>

                {!isPaidPlanActive ? (
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Plan: Free Plan • Valid until Lifetime Free
                  </span>
                ) : (
                  <>
                    {hasSocialAccess && (
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        Social Media Plan • Valid until {academy.activePlans?.find(p => p.subscriptionId === 2 || p.subscriptionId === 4)?.expiryDate || academy.subscriptionExpiry}
                      </span>
                    )}
                    {hasGoogleMapAccess && (
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        Google Map Plan • Valid until {academy.activePlans?.find(p => p.subscriptionId === 3 || p.subscriptionId === 4)?.expiryDate || academy.subscriptionExpiry}
                      </span>
                    )}
                    {hasLeadContactAccess && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        View Contacts Plan • Valid until {academy.activePlans?.find(p => p.subscriptionId === 5 || p.subscriptionId === 4)?.expiryDate || academy.subscriptionExpiry}
                      </span>
                    )}
                    {!hasSocialAccess && !hasGoogleMapAccess && !hasLeadContactAccess && (
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        Plan: {academy.subscriptionPlanName || 'Paid Plan'} • Valid until {academy.subscriptionExpiry}
                      </span>
                    )}
                  </>
                )}
              </div>
              <h1 className="text-2xl font-black text-white mt-1">{academy.academyName}</h1>
              <p className="text-xs text-slate-400">
                Tutor: {academy.teacherName} • {academy.address || [academy.area, academy.city].filter(Boolean).join(', ') || 'Bangalore'}
              </p>
            </div>
          </div>

          {/* <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Switch Academy:</span>
              <select
                value={activeAcademyId}
                onChange={(e) => {
                  setActiveAcademyId(e.target.value);
                  const sel = academies.find((a) => a.id === e.target.value);
                  if (sel) setProfileForm({ ...sel });
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {academies.map((ac) => (
                  <option key={ac.id} value={ac.id} className="bg-slate-900 text-white">
                    {ac.academyName} ({ac.city})
                  </option>
                ))}
              </select>
            </div>
          </div> */}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Approval Status Banner for Academy Owner */}
        {academy.status !== 'Approved' && (
          <div className={`p-6 rounded-2xl border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all ${academy.status === 'Pending'
              ? 'bg-amber-50/90 border-amber-200 text-amber-950'
              : academy.status === 'Rejected'
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}>
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-2xl shrink-0 mt-0.5 shadow-sm ${academy.status === 'Pending'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : academy.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-slate-200 text-slate-700 border border-slate-300'
                }`}>
                {academy.status === 'Pending' ? (
                  <Clock className="w-7 h-7 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${academy.status === 'Pending'
                      ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                      : academy.status === 'Rejected'
                        ? 'bg-rose-200/80 text-rose-900 border-rose-300'
                        : 'bg-slate-200 text-slate-800 border-slate-300'
                    }`}>
                    Status: {academy.status}
                  </span>
                  <span className="text-xs font-semibold opacity-80">
                    {academy.status === 'Pending' ? '⏳ Verification Pending' : '⚠️ Listing Not Live'}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  {academy.status === 'Pending' && 'Your Academy Profile is Pending Super Admin Approval'}
                  {academy.status === 'Rejected' && 'Your Academy Profile Registration was Rejected'}
                  {academy.status === 'Suspended' && 'Your Academy Profile Listing is Currently Suspended'}
                </h3>
                <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
                  {academy.status === 'Pending' && (
                    <>
                      Your registration is successfully saved in the database! Super Admin is currently reviewing your academy details.
                      While status is <strong>Pending</strong>, your profile will not appear in public student search results.
                      You can continue customizing your profile details, courses, and fees below!
                    </>
                  )}
                  {academy.status === 'Rejected' && (
                    <>
                      Your academy registration request was rejected during Super Admin review. Please verify your profile info and contact support or request re-verification.
                    </>
                  )}
                  {academy.status === 'Suspended' && (
                    <>
                      Your academy listing has been suspended. Public students cannot view your profile. Please contact Super Admin to reactivate your listing.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
              <RouterLink
                to={`/guru/${academy.slug || academy.id}`}
                target="_blank"
                className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Preview Profile</span>
              </RouterLink>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Profile Completion</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900">{completionPct}%</span>
              <span className="text-xs text-emerald-600 font-medium">Ready for search</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Student Inquiries</span>
              <MessageSquare className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900">{academyInquiries.length}</span>
              <span className="text-xs text-rose-600 font-medium">
                {academyInquiries.filter((i) => i.status === 'New').length} New Leads
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Direct phone & email student inquiries</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Profile Views</span>
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900">{academy.profileViews || 140}</span>
              <span className="text-xs text-purple-600 font-medium">Search impressions</span>
            </div>
            <p className="text-[11px] text-gray-400">Past 30 days discovery rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Active Plan</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-gray-900">{academy.subscriptionPlanName || 'Free Plan'}</span>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Change Plan
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                <span className="px-2 py-0.5 rounded font-bold border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                  📩 Inquiries: Included
                </span>
                <span className={`px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${hasSocialAccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                  🌐 Social: {hasSocialAccess ? 'Included' : 'Locked'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${hasGoogleMapAccess ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                  📍 Map Pin: {hasGoogleMapAccess ? 'Included' : 'Locked'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <span className="inline-flex items-center space-x-1.5 bg-slate-50 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>
                  Valid until: {!isPaidPlanActive ? 'Lifetime Free' : (academy.subscriptionExpiry || academy.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${activeTab === 'inquiries'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Received Inquiries ({academyInquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${activeTab === 'skills'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Manage Skills & Classes</span>
          </button>

          <button
            onClick={() => navigate(`/academy/${academy.slug}`)}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white text-gray-800 hover:bg-gray-100 border border-gray-200 flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4 text-rose-500" />
            <span>View Public Profile</span>
          </button>
        </div>

        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Student Inquiry Leads</h3>
                <p className="text-xs text-gray-500">Students who contacted your academy for music classes.</p>
              </div>
            </div>

            {academyInquiries.length === 0 ? (
              <div className="py-12 text-center space-y-3 text-gray-500">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-sm">No student inquiries received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!hasLeadContactAccess && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-amber-800">
                      <Lock className="w-6 h-6 text-amber-600" />
                      <div>
                        <h4 className="font-bold text-sm">Unlock Student Contacts</h4>
                        <p className="text-xs opacity-90">Upgrade to <strong>{contactPlan.name}</strong> (₹{contactPlan.price}/yr) to view full mobile numbers and emails.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors shadow-sm"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                        <th className="p-3">Date</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Mobile & Email</th>
                        <th className="p-3 text-center">Skill Interested</th>
                        <th className="p-3 text-center">Class Mode</th>
                        <th className="p-3">Message</th>
                        <th className="p-3 text-center">Lead Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {academyInquiries.map((inq) => {
                        const phone = inq.mobile || inq.studentPhone || '';
                        const email = inq.email || inq.studentEmail || '';
                        const skill = inq.skill || inq.skillName || 'Music Class';
                        const mode = inq.mode || inq.preferredSlot || 'Offline';

                        const maskedPhone = hasLeadContactAccess ? phone : phone ? `${phone.substring(0, 2)}******${phone.substring(phone.length - 2)}` : '';
                        const maskedEmail = hasLeadContactAccess ? email : email ? `${email.substring(0, 1)}****@${email.split('@')[1] || 'gmail.com'}` : '';

                        return (
                          <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-gray-400 whitespace-nowrap">
                              {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="p-3 font-bold text-gray-900">{inq.studentName || 'Student'}</td>
                            <td className="p-3 space-y-0.5">
                              {maskedPhone ? (
                                hasLeadContactAccess ? (
                                  <a href={`tel:${maskedPhone}`} className="font-semibold text-rose-600 hover:underline flex items-center gap-1">
                                    📞 {maskedPhone}
                                  </a>
                                ) : (
                                  <span className="font-semibold text-rose-600 flex items-center gap-1">
                                    📞 {maskedPhone} <Lock className="w-3 h-3 text-amber-500" />
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 text-xs">📞 Not Provided</span>
                              )}
                              {maskedEmail && (
                                <span className="text-gray-500 text-[11px] flex items-center gap-1">
                                  {maskedEmail} {!hasLeadContactAccess && <Lock className="w-3 h-3 text-amber-500" />}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-100">
                                {skill}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded border ${mode.toLowerCase().includes('online')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                {mode}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600 max-w-xs truncate" title={inq.message || ''}>
                              "{inq.message || 'Interested in joining classes'}"
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={inq.status || 'New'}
                                onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${inq.status === 'New' || inq.status === 'Pending'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : inq.status === 'Contacted'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : inq.status === 'Converted'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}
                              >
                                <option value="New">🔴 New Lead</option>
                                <option value="Pending">🟡 Pending</option>
                                <option value="Contacted">🔵 Contacted</option>
                                <option value="Converted">🟢 Enrolled (Converted)</option>
                                <option value="Closed">⚪ Closed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Profile Editor</h3>
                <p className="text-xs text-gray-500">Update your public profile details, teaching modes (Offline/Online), contact info, and social links.</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/academy/${academy.slug || academy.id}`)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>View Public Profile</span>
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                Profile updated successfully! All changes are now live on your public profile page.
              </div>
            )}

            {Object.keys(validationErrors).length > 0 && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs font-semibold space-y-1.5 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Please correct the errors below before saving profile:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-2 text-rose-700 font-medium">
                  {Object.values(validationErrors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 1: Basic Info & Lead Guru */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-emerald-500 pl-2.5">
                1. Basic Info & Lead Tutor
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Academy Name <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.academyName || ''}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, academyName: e.target.value });
                      if (validationErrors.academyName) {
                        setValidationErrors((prev) => ({ ...prev, academyName: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:ring-2 ${validationErrors.academyName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {validationErrors.academyName && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.academyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Teacher / Guru Name <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.teacherName || ''}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, teacherName: e.target.value });
                      if (validationErrors.teacherName) {
                        setValidationErrors((prev) => ({ ...prev, teacherName: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:ring-2 ${validationErrors.teacherName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {validationErrors.teacherName && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.teacherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Teaching Experience (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="60"
                    placeholder="e.g. 12.5"
                    value={profileForm.experienceYears !== undefined && profileForm.experienceYears !== null ? profileForm.experienceYears : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileForm({ ...profileForm, experienceYears: val });
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setProfileForm({ ...profileForm, experienceYears: parseFloat(val.toFixed(1)) });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400">Decimal values supported (e.g. 3.5 years)</span>
                </div>
              </div>
            </div>

            {/* Section 2: Teaching Modes & Formats (Offline / Online checkboxes) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-rose-500 pl-2.5">
                2. Teaching Modes & Class Formats
              </h4>

              <div className={`space-y-3 bg-rose-50/60 p-5 rounded-2xl border ${validationErrors.teachingMode ? 'border-red-400 ring-2 ring-red-200' : 'border-rose-100'
                }`}>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Teaching Modes Offered (Select at least 1) <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <p className="text-xs text-gray-500">You must select at least 1 mode (Offline, Online, or Home Tuition).</p>

                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { id: 'Offline', label: '🏫 Offline (Classroom / Studio)' },
                    { id: 'Online', label: '💻 Online (Live Video Classes)' },
                    { id: 'Home Tuition', label: '🏠 Home Tuition (Guru Visits Home)' }
                  ].map((modeObj) => {
                    const isChecked = (profileForm.teachingMode || []).includes(modeObj.id);
                    return (
                      <label
                        key={modeObj.id}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTeachingMode(modeObj.id)}
                          className="hidden"
                        />
                        <span>{modeObj.label}</span>
                      </label>
                    );
                  })}
                </div>
                {validationErrors.teachingMode && (
                  <p className="text-red-600 text-xs font-bold mt-1.5">{validationErrors.teachingMode}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Batch Types Multi Select Box Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Batch Types (Select at least 1) <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchDropdownOpen(!isBatchDropdownOpen);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full bg-gray-50 hover:bg-white border rounded-xl px-4 py-2.5 text-left text-sm font-semibold flex items-center justify-between transition-all focus:outline-none focus:ring-2 shadow-sm min-h-[44px] ${validationErrors.batchType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                      }`}
                  >
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(profileForm.batchType || []).length > 0 ? (
                        (profileForm.batchType || []).map((bt) => (
                          <span
                            key={bt}
                            className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1"
                          >
                            {bt === 'Individual' ? '👤 Individual' : '👥 Group'}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 font-normal">Select Batch Types...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isBatchDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {validationErrors.batchType && (
                    <p className="text-red-500 text-xs font-semibold mt-1">{validationErrors.batchType}</p>
                  )}

                  {isBatchDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsBatchDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {['Individual', 'Group'].map((bt) => {
                          const isChecked = (profileForm.batchType || []).includes(bt);
                          return (
                            <div
                              key={bt}
                              onClick={() => toggleBatchType(bt)}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all ${isChecked
                                  ? 'bg-purple-50 text-purple-900 font-extrabold'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                                />
                                <span>{bt === 'Individual' ? '👤 Individual' : '👥 Group'}</span>
                              </div>
                              {isChecked && <Check className="w-4 h-4 text-purple-600" />}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Teaching Languages Multi Select Box Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Teaching Languages (Select all that apply) <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLangDropdownOpen(!isLangDropdownOpen);
                      setIsBatchDropdownOpen(false);
                    }}
                    className="w-full bg-gray-50 hover:bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-left text-sm font-semibold flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm min-h-[44px]"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(profileForm.languages || []).length > 0 ? (
                        (profileForm.languages || []).map((lang) => (
                          <span
                            key={lang}
                            className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1"
                          >
                            {lang}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLanguage(lang);
                              }}
                              className="hover:bg-emerald-200 rounded-full p-0.5 cursor-pointer ml-0.5"
                            >
                              <X className="w-3 h-3 text-emerald-700" />
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 font-normal">Select Teaching Languages...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsLangDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
                        <div className="px-1 pt-1 pb-2 border-b border-gray-100">
                          <input
                            type="text"
                            placeholder="Search or add custom language..."
                            value={langSearch}
                            onChange={(e) => setLangSearch(e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="space-y-1">
                          {PREDEFINED_LANGUAGES
                            .filter((l) => l.toLowerCase().includes(langSearch.toLowerCase()))
                            .map((lang) => {
                              const isChecked = (profileForm.languages || []).includes(lang);
                              return (
                                <div
                                  key={lang}
                                  onClick={() => toggleLanguage(lang)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-bold transition-all ${isChecked
                                      ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                                      : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => { }}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                    />
                                    <span>{lang}</span>
                                  </div>
                                  {isChecked && <Check className="w-4 h-4 text-emerald-600" />}
                                </div>
                              );
                            })}

                          {langSearch.trim() &&
                            !PREDEFINED_LANGUAGES.some((l) => l.toLowerCase() === langSearch.trim().toLowerCase()) && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleLanguage(langSearch.trim());
                                  setLangSearch('');
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between"
                              >
                                <span>+ Add custom language "{langSearch.trim()}"</span>
                              </button>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Location */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-amber-500 pl-2.5">
                3. Contact Info & Google Location
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone || ''}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, phone: e.target.value });
                      if (validationErrors.phone) {
                        setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm ${validationErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    disabled
                    value="Feature will be released soon."
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm text-gray-500 opacity-60 cursor-not-allowed font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email || ''}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, email: e.target.value });
                      if (validationErrors.email) {
                        setValidationErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. #12, 4th Cross, Indiranagar"
                    value={profileForm.address || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={profileForm.area || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 411057"
                    value={profileForm.pincode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setProfileForm({ ...profileForm, pincode: val });
                      if (validationErrors.pincode) {
                        setValidationErrors((prev) => ({ ...prev, pincode: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:ring-2 ${validationErrors.pincode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {validationErrors.pincode && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.pincode}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Google Maps Pin URL</label>
                    {!hasGoogleMapAccess && (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked on {academy.subscriptionPlanName || 'Free Plan'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={!hasGoogleMapAccess}
                    placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                    value={profileForm.mapUrl || ''}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, mapUrl: e.target.value });
                      if (validationErrors.mapUrl) {
                        setValidationErrors((prev) => ({ ...prev, mapUrl: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-2 ${!hasGoogleMapAccess ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-300' : validationErrors.mapUrl ? 'bg-gray-50 border-red-500 focus:ring-red-500' : 'bg-gray-50 border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  {!hasGoogleMapAccess && (
                    <p className="text-amber-800 text-[11px] mt-1 flex items-center justify-between font-medium">
                      <span>Upgrade to <strong>{googleMapPlan.name}</strong> (₹{googleMapPlan.price}/yr) to enable live map pins.</span>
                      <button
                        type="button"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="text-indigo-700 hover:underline font-bold text-[11px] ml-2"
                      >
                        Upgrade Plan
                      </button>
                    </p>
                  )}
                  {hasGoogleMapAccess && validationErrors.mapUrl && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.mapUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Profile Images & Banner Media */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-blue-500 pl-2.5">
                  4. Profile Images & Banner Media
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guru Profile Avatar Photo */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Guru Profile Avatar Photo
                      </label>
                      <span className="text-[10px] text-gray-500 font-medium">Square format (JPG, PNG, WEBP)</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Upload a photo of yourself or your academy logo directly from your device.
                    </p>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={profileImageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageFileChange}
                    />

                    {/* Preview & Upload Controls */}
                    <div className="flex items-center space-x-4">
                      <div className="relative group shrink-0">
                        {profileForm.profileImage ? (
                          <ZipImage
                            src={profileForm.profileImage}
                            alt="Profile Avatar Preview"
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-500">
                            <Camera className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-semibold">No Photo</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {profileForm.profileImage ? 'Upload New Photo' : 'Upload Photo'}
                        </button>

                        {profileForm.profileImage && (
                          <button
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, profileImage: '' })}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Optional URL paste toggle */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <details className="group">
                      <summary className="text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1 select-none">
                        <Link className="w-3 h-3" />
                        <span>Or paste an image link directly</span>
                      </summary>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={profileForm.profileImage || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </details>
                  </div>
                </div>

                {/* Cover Banner Image */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Cover Banner Photo
                      </label>
                      <span className="text-[10px] text-gray-500 font-medium">Landscape format (16:9 or 3:1)</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Upload a landscape banner photo for your academy profile header.
                    </p>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={coverImageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageFileChange}
                    />

                    {/* Preview & Upload Controls */}
                    <div className="space-y-3">
                      {profileForm.coverImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                          <ZipImage
                            src={profileForm.coverImage}
                            alt="Cover Banner Preview"
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => coverImageInputRef.current?.click()}
                              className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 text-xs font-bold rounded-lg shadow cursor-pointer flex items-center"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => setProfileForm({ ...profileForm, coverImage: '' })}
                              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => coverImageInputRef.current?.click()}
                          className="w-full h-28 rounded-xl bg-blue-50/60 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Image className="w-8 h-8 mb-1" />
                          <span className="text-xs font-semibold">Click to Upload Banner Photo</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => coverImageInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {profileForm.coverImage ? 'Upload New Banner' : 'Upload Banner Photo'}
                        </button>

                        {profileForm.coverImage && (
                          <button
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, coverImage: '' })}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Remove Banner
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Optional URL paste toggle */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <details className="group">
                      <summary className="text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1 select-none">
                        <Link className="w-3 h-3" />
                        <span>Or paste a banner link directly</span>
                      </summary>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={profileForm.coverImage || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, coverImage: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Social Media Links */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-indigo-500 pl-2.5 flex items-center gap-2">
                  <span>6. Social Media & Online Profiles</span>
                  {!hasSocialAccess && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked on {academy.subscriptionPlanName || 'Free Plan'}
                    </span>
                  )}
                </h4>
                {!hasSocialAccess && (
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl transition-colors self-start sm:self-auto"
                  >
                    Upgrade to Unlock Social Links
                  </button>
                )}
              </div>

              {!hasSocialAccess && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Social Media Integration is Locked on {academy.subscriptionPlanName || 'Free Plan'}</p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Upgrade to the <strong>Social Media Plan</strong> (₹499/yr) or <strong>Social Media & Google Map Plan</strong> (₹1499/yr) to link your WhatsApp, Instagram, YouTube, Facebook, LinkedIn, and Website on your public listing page!
                    </p>
                  </div>
                </div>
              )}

              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${!hasSocialAccess ? 'opacity-60 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Website URL</label>
                  <input
                    type="text"
                    disabled={!hasSocialAccess}
                    placeholder="https://myacademy.com"
                    value={profileForm.socialLinks?.website || ''}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs ${validationErrors.website ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.website && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Chat Link</label>
                  <input
                    type="text"
                    disabled
                    value="Feature will be released soon."
                    className="w-full px-3.5 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs text-gray-500 opacity-60 cursor-not-allowed font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Instagram Profile URL</label>
                  <input
                    type="text"
                    disabled={!hasSocialAccess}
                    placeholder="https://instagram.com/..."
                    value={profileForm.socialLinks?.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs ${validationErrors.instagram ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.instagram && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.instagram}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">YouTube Channel URL</label>
                  <input
                    type="text"
                    disabled={!hasSocialAccess}
                    placeholder="https://youtube.com/..."
                    value={profileForm.socialLinks?.youtube || ''}
                    onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs ${validationErrors.youtube ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.youtube && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.youtube}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Facebook Page URL</label>
                  <input
                    type="text"
                    disabled={!hasSocialAccess}
                    placeholder="https://facebook.com/..."
                    value={profileForm.socialLinks?.facebook || ''}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs ${validationErrors.facebook ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.facebook && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.facebook}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    disabled={!hasSocialAccess}
                    placeholder="https://linkedin.com/..."
                    value={profileForm.socialLinks?.linkedin || ''}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs ${validationErrors.linkedin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.linkedin && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.linkedin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 7: About Bio */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-emerald-500 pl-2.5">
                7. About Bio & Guru Teaching Philosophy
              </h4>

              <div>
                <textarea
                  rows={5}
                  value={profileForm.about || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(`/academy/${academy.slug || academy.id}`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center space-x-1.5"
              >
                <Eye className="w-4 h-4 text-rose-600" />
                <span>View Public Profile</span>
              </button>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'skills' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Skill Selection</h3>
              <p className="text-xs text-gray-500">Select which music classes & instruments your academy offers. (No course SKUs required!)</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Taught Music Skills
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {skills.map((sk) => {
                  const isChecked = (profileForm.skills || []).includes(sk.name);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleSkill(sk.name)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${isChecked
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <span>{getSkillIcon(sk)}</span>
                      <span className="truncate">{sk.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  updateAcademyProfile(academy.id, { skills: profileForm.skills });
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2000);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-all"
              >
                Save Selected Skills
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isSaving && <LoaderSpinner fullPage text="Saving Profile Changes..." />}

      {/* Toast Notification at Bottom Right of Screen */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500 flex items-center space-x-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-white/20 p-1.5 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight">Profile updated successfully!</p>
            <p className="text-[11px] text-emerald-100 mt-0.5">Your academy details are saved and live.</p>
          </div>
        </div>
      )}

      {/* Upgrade Subscription Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-[95vw] xl:max-w-7xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-gray-100 my-8">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Select Subscription Tier
              </span>
              <h3 className="text-2xl font-black text-gray-900">Choose the Right Plan for {academy.academyName}</h3>
              <p className="text-xs text-gray-500 max-w-lg mx-auto">
                Unlock higher student engagement and lead generation with our simple subscription plans.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pt-2">
              {plans
                .filter((p) => p.is_active !== false && p.isActive !== false)
                .sort((a, b) => getTierFromPlan(a) - getTierFromPlan(b))
                .map((planObj) => {
                  const tier = getTierFromPlan(planObj);
                  const isCurrent = currentPlanTier === tier && (!isPaidPlanActive ? tier === 1 && !currentIsExpired : isPaidPlanActive);
                  
                  let isIncluded = isCurrent;
                  if (!isIncluded && isPaidPlanActive) {
                    if (tier === 1) isIncluded = true;
                    if (tier === 2 && hasSocialAccess) isIncluded = true;
                    if (tier === 3 && hasGoogleMapAccess) isIncluded = true;
                    if (tier === 4 && hasLeadContactAccess) isIncluded = true;
                    if (tier === 5 && hasSocialAccess && hasGoogleMapAccess && hasLeadContactAccess) isIncluded = true;
                  }

                  let theme = {
                    base: isCurrent ? 'border-gray-400 bg-slate-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white',
                    tierText: 'text-gray-500',
                    title: 'text-gray-900',
                    price: 'text-emerald-700',
                    btn: isIncluded ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white shadow'
                  };

                  if (tier === 2) theme = { ...theme, base: isCurrent ? 'border-indigo-600 bg-indigo-50/30 shadow-md' : 'border-indigo-200 hover:border-indigo-400 bg-white', tierText: 'text-indigo-600', price: 'text-indigo-900', btn: isIncluded ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' };
                  else if (tier === 3) theme = { ...theme, base: isCurrent ? 'border-purple-600 bg-purple-50/30 shadow-md' : 'border-purple-200 hover:border-purple-400 bg-white', tierText: 'text-purple-600', price: 'text-purple-900', btn: isIncluded ? 'bg-purple-100 text-purple-700 border border-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' };
                  else if (tier === 4) theme = { ...theme, base: isCurrent ? 'border-rose-500 bg-rose-50/40 shadow-md' : 'border-gray-200 hover:border-rose-500 bg-white hover:shadow-lg', tierText: 'text-gray-400', price: 'text-rose-900', btn: isIncluded ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md' };
                  else if (tier === 5) theme = { ...theme, base: isCurrent ? 'border-amber-500 bg-amber-50/40 shadow-md' : 'border-amber-300 hover:border-amber-500 bg-white ring-2 ring-amber-400/20', tierText: 'text-amber-700', price: 'text-amber-900', btn: isIncluded ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' };

                  const parsedFeatures = (typeof planObj.features === 'string' ? planObj.features.split(',') : (Array.isArray(planObj.features) ? planObj.features : [])).map(f => String(f).trim()).filter(Boolean);

                  return (
                    <div key={planObj.id} className={`p-5 rounded-2xl border-2 flex flex-col justify-between space-y-4 transition-all relative ${theme.base}`}>
                      {tier === 5 && (
                        <span className="absolute -top-3 right-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow uppercase tracking-wider">
                          ALL-IN-ONE
                        </span>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.tierText}`}>Tier {tier}</span>
                          {isCurrent && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${tier === 5 ? 'bg-amber-600 text-white' : tier === 4 ? 'bg-rose-100 text-rose-700' : tier === 3 ? 'bg-purple-600 text-white' : tier === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Current</span>
                          )}
                        </div>
                        <h4 className={`text-lg font-extrabold ${theme.title}`}>{planObj.name}</h4>

                        <div className="flex items-baseline space-x-2">
                          {planObj.price === 0 || !planObj.price ? (
                            <span className={`text-2xl font-black ${theme.price}`}>Lifetime Free</span>
                          ) : (
                            <div className={`text-2xl font-black ${theme.price}`}>
                              ₹{planObj.price} <span className="text-xs font-normal text-gray-500">/ year</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed min-h-[3rem]">
                          {planObj.description || 'Includes basic directory listing.'}
                        </p>

                        <ul className="space-y-2 text-[11px] text-gray-700 pt-3 border-t border-gray-100">
                          <li className="flex items-center gap-1.5 font-medium text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Directory Listing & Search</span>
                          </li>
                          <li className="flex items-center gap-1.5 font-medium text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Student Inquiry Forms</span>
                          </li>
                          {parsedFeatures.map((feat, i) => (
                            <li key={i} className="flex items-center gap-1.5 font-bold text-gray-800">
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${tier === 5 ? 'text-amber-600' : tier === 4 ? 'text-rose-600' : tier === 3 ? 'text-purple-600' : 'text-indigo-600'}`} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleOpenCheckout(planObj)}
                        disabled={isIncluded}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${theme.btn}`}
                      >
                        {isIncluded ? 'Active Plan' : (planObj.price === 0 ? 'Select Free Plan' : 'Activate Plan')}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Mock Checkout Modal Component */}
      <MockCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        plan={selectedPlanForCheckout}
        academy={academy}
        onSuccess={(txnRef, activatedPlan) => {
          setIsCheckoutModalOpen(false);
        }}
      />

      <GuruFooter />
    </div>
  );
};

export default ClassAdminDashboard;
