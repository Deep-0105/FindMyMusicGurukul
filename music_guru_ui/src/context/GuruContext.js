import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { guruService } from '../services/guruService';

const GuruContext = createContext();

export const GuruProvider = ({ children }) => {
  // Roles: 'PUBLIC_USER' | 'CLASS_ADMIN' | 'SUPER_ADMIN'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('music_guru_active_role') || 'PUBLIC_USER';
  });

  const [activeAcademyId, setActiveAcademyId] = useState(() => {
    return localStorage.getItem('music_guru_active_academy_id') || '';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('music_guru_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('music_guru_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('music_guru_current_user');
    }
  }, [currentUser]);

  const DEFAULT_4_PLANS = [
    {
      id: 'plan-1',
      name: 'Free Plan',
      price: 0,
      durationMonths: 12,
      description: 'Includes basic directory listing and student inquiries.',
      features: []
    },
    {
      id: 'plan-2',
      name: 'Social Media Plan',
      price: 499,
      durationMonths: 12,
      description: 'Free Plan features plus Social Media links visible on profile.',
      features: ['Social Media']
    },
    {
      id: 'plan-3',
      name: 'Google Map Location Plan',
      price: 999,
      durationMonths: 12,
      description: 'Free Plan features plus interactive Google Map Location on profile.',
      features: ['Google Map Location']
    },
    {
      id: 'plan-4',
      name: 'Social Media & Google Map Plan',
      price: 1499,
      durationMonths: 12,
      description: 'Includes all features: Social Media links & interactive Google Map Location.',
      features: ['Social Media', 'Google Map Location']
    }
  ];

  const [cities, setCities] = useState([]);
  const [staticPagesData, setStaticPagesData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [features, setFeatures] = useState([]);
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [plans, setPlans] = useState(DEFAULT_4_PLANS);
  const [academies, setAcademies] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [raidLogs, setRaidLogs] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchStaticPages = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/static-pages');
        const json = await res.json();
        if (json.success) {
          setStaticPagesData(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch static pages', e);
      }
    };
    fetchStaticPages();
  }, []);

  const [searchFilters, setSearchFilters] = useState({
    query: '',
    city: 'All',
    area: '',
    skill: '',
    teachingMode: '',
    batchType: '',
    language: '',
    rating: 0,
    priceMax: 10000,
    sortBy: 'featured'
  });

  useEffect(() => {
    localStorage.setItem('music_guru_active_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('music_guru_active_academy_id', activeAcademyId);
  }, [activeAcademyId]);

  useEffect(() => {
    if (currentUser) {
      const userEmail = (currentUser.email || '').toLowerCase().trim();
      const userPhone = (currentUser.phone || '').replace(/\D/g, '');
      const userAcadId = currentUser.academyId;

      const matched =
        academies.find(
          (a) =>
            (userAcadId && (a.id === userAcadId || a.slug === userAcadId)) ||
            (a.email && userEmail && a.email.toLowerCase().trim() === userEmail) ||
            (a.phone && userPhone && a.phone.replace(/\D/g, '') === userPhone)
        ) || academies.find((a) => a.status === 'Pending');

      const isSuperAdminUser = currentUser.role === 'superadmin' || currentRole === 'SUPER_ADMIN';

      if (matched && matched.id && !isSuperAdminUser) {
        if (activeAcademyId !== matched.id) {
          setActiveAcademyId(matched.id);
        }
        if (currentRole === 'PUBLIC_USER') {
          setCurrentRole('CLASS_ADMIN');
        }
      }
    }
  }, [currentUser, academies, activeAcademyId, currentRole]);

  const [homeStats, setHomeStats] = useState({
    certifiedGurusCount: 0,
    instrumentsCount: 0,
    totalInquiriesCount: 0,
    avgRating: 4.9
  });

  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [liveAcademies, liveCities, liveSkills, liveFeatures, liveGlobalFeatures, livePlans, liveStats, liveInquiries, liveReviews] = await Promise.all([
          guruService.fetchAllAcademies(),
          guruService.fetchCities(),
          guruService.fetchSkills(),
          guruService.fetchFeatures(),
          guruService.fetchGlobalFeatures(),
          guruService.fetchPlans(),
          guruService.fetchHomeStats(),
          guruService.fetchInquiries(),
          guruService.fetchReviews()
        ]);

        if (liveAcademies && Array.isArray(liveAcademies)) {
          setAcademies(liveAcademies);
        }
        if (liveCities && Array.isArray(liveCities)) {
          setCities(liveCities);
        }
        if (liveSkills && Array.isArray(liveSkills)) {
          setSkills(liveSkills);
        }
        if (liveFeatures && Array.isArray(liveFeatures)) {
          const formattedFeats = liveFeatures.map((f) => {
            const activeState = f.is_active !== undefined ? f.is_active : (f.isActive !== undefined ? f.isActive : true);
            return { ...f, is_active: activeState, isActive: activeState };
          });
          setFeatures(formattedFeats);
        }
        if (liveGlobalFeatures && Array.isArray(liveGlobalFeatures)) {
          const formattedGlobalFeats = liveGlobalFeatures.map((f) => {
            const activeState = f.is_active !== undefined ? f.is_active : (f.isActive !== undefined ? f.isActive : true);
            return { ...f, is_active: activeState, isActive: activeState };
          });
          setGlobalFeatures(formattedGlobalFeats);
        }
        if (livePlans && Array.isArray(livePlans)) {
          const formattedPlans = livePlans.map((p) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : []
          }));
          setPlans(formattedPlans);
        }
        if (liveStats && typeof liveStats === 'object' && Object.keys(liveStats).length > 0) {
          setHomeStats(liveStats);
        }
        if (liveInquiries && Array.isArray(liveInquiries)) {
          setInquiries(liveInquiries);
        }
        if (liveReviews && Array.isArray(liveReviews)) {
          setReviews(liveReviews);
        }
      } catch (err) {
        console.warn('Error loading backend data:', err);
      }
    };
    loadBackendData();
  }, []);

  const registerAcademy = async (formData) => {
    const slug = formData.academyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const tempId = `acad-${Date.now()}`;
    const freePlan = (plans || []).find((p) => p.price === 0 || (p.name || '').toLowerCase().includes('free')) || { id: 'plan-1', name: 'Free Listing' };

    const newAcademy = {
      id: tempId,
      slug,
      academyName: formData.academyName,
      teacherName: formData.teacherName,
      email: formData.email,
      phone: formData.mobile,
      whatsapp: formData.mobile.startsWith('+') ? formData.mobile : `+91${formData.mobile}`,
      city: formData.city,
      area: formData.area,
      address: `${formData.area}, ${formData.city}`,
      lat: 18.5204,
      lng: 73.8567,
      mapUrl: `https://maps.google.com/?q=${encodeURIComponent(formData.area + ', ' + formData.city)}`,
      skills: formData.skills || [],
      primarySkill: formData.skills && formData.skills.length > 0 ? formData.skills[0] : 'Guitar',
      experienceYears: 2,
      languages: ['English', 'Hindi'],
      certificates: [],
      teachingMode: ['Offline', 'Online'],
      batchType: ['1-on-1 Individual', 'Small Group (3-5 Students)'],
      pricingInfo: 'Contact for fees',
      pricingMin: 1000,
      courseDuration: 'Flexible',
      about: `${formData.academyName} led by ${formData.teacherName} provides quality music instruction in ${formData.city}.`,
      profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
      flyerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviewCount: 0,
      socialLinks: {
        website: '',
        whatsapp: `https://wa.me/${formData.mobile}`
      },
      gallery: [],
      status: 'Pending',
      subscriptionPlanId: freePlan.id || 'plan-1',
      subscriptionPlanName: freePlan.name || 'Free Listing',
      subscriptionStatus: 'Active',
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      featured: false,
      raidStatus: 'GREEN',
      profileViews: 1,
      inquiriesReceived: 0
    };

    setAcademies((prev) => [newAcademy, ...prev]);
    setActiveAcademyId(newAcademy.id);

    try {
      const res = await guruService.registerAcademy(formData);
      if (res && (res.success || res.data)) {
        const backendId = res.data?.id || res.id;
        const subId = res.data?.subscriptionPlanId || freePlan.id || 'plan-1';
        const subName = res.data?.subscriptionPlanName || freePlan.name || 'Free Listing';
        const subStatus = res.data?.subscriptionStatus || 'Active';
        if (backendId) {
          setAcademies((prev) =>
            prev.map((acc) =>
              acc.id === tempId
                ? {
                    ...acc,
                    id: backendId,
                    subscriptionPlanId: subId,
                    subscriptionPlanName: subName,
                    subscriptionStatus: subStatus
                  }
                : acc
            )
          );
          setActiveAcademyId(backendId);
        }
      }
    } catch (err) {
      console.error('Failed to submit academy to database:', err);
    }

    return newAcademy;
  };

  const updateAcademyProfile = async (academyId, updatedFields) => {
    setAcademies((prev) =>
      prev.map((acc) => (acc.id === academyId ? { ...acc, ...updatedFields } : acc))
    );
    try {
      await guruService.updateAcademyProfile(academyId, updatedFields);
    } catch (err) {
      console.warn('Failed to update academy profile on backend:', err);
    }
  };

  const updateAcademyStatus = async (academyId, status, notes = '') => {
    setAcademies((prev) =>
      prev.map((acc) => (acc.id === academyId ? { ...acc, status } : acc))
    );
    addRaidLog({
      academyId,
      academyName: academies.find((a) => a.id === academyId)?.academyName || 'Academy',
      category: 'DECISION',
      severity: status === 'Approved' ? 'LOW' : status === 'Suspended' ? 'HIGH' : 'MEDIUM',
      title: `Academy Status Changed to ${status}`,
      description: `Super Admin changed academy approval status to ${status}.`,
      status: 'RESOLVED',
      loggedBy: 'Super Admin'
    });

    try {
      await guruService.updateAcademyStatus(academyId, status, notes);
    } catch (err) {
      console.warn('Failed to update academy status on backend:', err);
    }
  };

  const submitInquiry = async (inquiryData) => {
    const newInquiry = {
      id: `inq-${Date.now()}`,
      academyId: inquiryData.academyId,
      academyName: inquiryData.academyName,
      studentName: inquiryData.studentName,
      mobile: inquiryData.mobile,
      email: inquiryData.email,
      skill: inquiryData.skill,
      mode: inquiryData.mode || 'Offline',
      preferredArea: inquiryData.preferredArea || '',
      preferredTime: inquiryData.preferredTime || '',
      message: inquiryData.message,
      status: 'New',
      createdAt: new Date().toISOString(),
      sourcePage: window.location.pathname
    };

    setInquiries((prev) => [newInquiry, ...prev]);

    setAcademies((prev) =>
      prev.map((acc) =>
        acc.id === inquiryData.academyId
          ? { ...acc, inquiriesReceived: (acc.inquiriesReceived || 0) + 1 }
          : acc
      )
    );

    try {
      const selectedSkillObj = skills?.find(
        (s) =>
          s.name?.toLowerCase() === inquiryData.skill?.toLowerCase() ||
          s.id === inquiryData.skill ||
          s.id === inquiryData.skillId
      );
      const resolvedSkillId = inquiryData.skillId || selectedSkillObj?.id || inquiryData.skill || null;

      await guruService.submitInquiry({
        academyId: inquiryData.academyId,
        skillId: resolvedSkillId,
        skill: inquiryData.skill,
        studentName: inquiryData.studentName,
        studentEmail: inquiryData.email || inquiryData.studentEmail,
        studentPhone: inquiryData.mobile || inquiryData.studentPhone,
        preferredSlot: inquiryData.mode || inquiryData.preferredSlot || 'Offline',
        message: inquiryData.message,
        state: inquiryData.state,
        city: inquiryData.city,
        area: inquiryData.area
      });
    } catch (err) {
      console.warn('Failed to submit inquiry to backend API:', err);
    }

    return newInquiry;
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
    );
    try {
      await guruService.updateInquiryStatus(inquiryId, status);
    } catch (err) {
      console.warn('Failed to update inquiry status on backend API:', err);
    }
  };

  const addSkill = async (skillObj) => {
    const tempId = `sk-${Date.now()}`;
    const newSkill = {
      id: tempId,
      slug: skillObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'Active',
      displayOrder: skills.length + 1,
      icon: skillObj.icon || '🎵',
      ...skillObj
    };
    setSkills((prev) => [...prev, newSkill]);

    try {
      const res = await guruService.createSkill(skillObj);
      if (res && res.data && res.data.id) {
        setSkills((prev) =>
          prev.map((s) => (s.id === tempId ? { ...s, id: res.data.id } : s))
        );
      }
    } catch (err) {
      console.warn('Failed to create skill on backend API:', err);
    }
  };

  const updateSkill = async (skillId, updated) => {
    setSkills((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...updated } : s)));
    try {
      await guruService.updateSkill(skillId, updated);
    } catch (err) {
      console.warn('Failed to update skill on backend API:', err);
    }
  };

  const deleteSkill = async (skillId) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    try {
      await guruService.deleteSkill(skillId);
    } catch (err) {
      console.warn('Failed to delete skill on backend API:', err);
    }
  };

  const addFeature = async (featObj) => {
    const tempId = `feat-${Date.now()}`;
    const initialActive = featObj.is_active !== undefined ? featObj.is_active : (featObj.isActive !== undefined ? featObj.isActive : true);
    const newFeat = {
      id: tempId,
      name: featObj.name,
      description: featObj.description || '',
      is_active: initialActive,
      isActive: initialActive
    };
    setFeatures((prev) => [...prev, newFeat]);

    try {
      const res = await guruService.createFeature({ ...featObj, is_active: initialActive, isActive: initialActive });
      if (res && res.data && res.data.id) {
        setFeatures((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, id: res.data.id } : f))
        );
      }
    } catch (err) {
      console.warn('Failed to create feature on backend API:', err);
    }
  };

  const updateFeature = async (featureId, updated) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featureId) {
          const nextActive = updated.is_active !== undefined
            ? updated.is_active
            : (updated.isActive !== undefined ? updated.isActive : (f.is_active !== undefined ? f.is_active : true));
          return { ...f, ...updated, is_active: nextActive, isActive: nextActive };
        }
        return f;
      })
    );
    try {
      await guruService.updateFeature(featureId, updated);
    } catch (err) {
      console.warn('Failed to update feature on backend API:', err);
    }
  };

  const deleteFeature = async (featureId) => {
    setFeatures((prev) => prev.filter((f) => f.id !== featureId));
    try {
      await guruService.deleteFeature(featureId);
    } catch (err) {
      console.warn('Failed to delete feature on backend API:', err);
    }
  };

  const addGlobalFeature = async (featObj) => {
    const tempId = `gfeat-${Date.now()}`;
    const initialActive = featObj.is_active !== undefined ? featObj.is_active : (featObj.isActive !== undefined ? featObj.isActive : true);
    const newFeat = {
      id: tempId,
      name: featObj.name,
      description: featObj.description || '',
      is_active: initialActive,
      isActive: initialActive
    };
    setGlobalFeatures((prev) => [...prev, newFeat]);

    try {
      const res = await guruService.createGlobalFeature({ ...featObj, is_active: initialActive, isActive: initialActive });
      if (res && res.data && res.data.id) {
        setGlobalFeatures((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, id: res.data.id } : f))
        );
      }
    } catch (err) {
      console.warn('Failed to create global feature on backend API:', err);
    }
  };

  const updateGlobalFeature = async (featureId, updated) => {
    setGlobalFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featureId || String(f.id) === String(featureId)) {
          const nextActive = updated.is_active !== undefined
            ? updated.is_active
            : (updated.isActive !== undefined ? updated.isActive : (f.is_active !== undefined ? f.is_active : true));
          return { ...f, ...updated, is_active: nextActive, isActive: nextActive };
        }
        return f;
      })
    );
    try {
      await guruService.updateGlobalFeature(featureId, updated);
    } catch (err) {
      console.warn('Failed to update global feature on backend API:', err);
    }
  };

  const deleteGlobalFeature = async (featureId) => {
    setGlobalFeatures((prev) => prev.filter((f) => f.id !== featureId && String(f.id) !== String(featureId)));
    try {
      await guruService.deleteGlobalFeature(featureId);
    } catch (err) {
      console.warn('Failed to delete global feature on backend API:', err);
    }
  };

  const addPlan = async (planObj) => {
    const tempId = `plan-${Date.now()}`;
    const newPlan = {
      id: tempId,
      status: 'Active',
      features: planObj.features || [],
      ...planObj
    };
    setPlans((prev) => [...prev, newPlan]);

    try {
      const res = await guruService.createPlan(planObj);
      if (res && res.data && res.data.id) {
        setPlans((prev) =>
          prev.map((p) => (p.id === tempId ? { ...p, id: res.data.id } : p))
        );
      }
    } catch (err) {
      console.warn('Failed to create plan on backend API:', err);
    }
  };

  const updatePlan = async (planId, updated) => {
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updated } : p)));
    try {
      await guruService.updatePlan(planId, updated);
    } catch (err) {
      console.warn('Failed to update plan on backend API:', err);
    }
  };

  const deletePlan = async (planId) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    try {
      await guruService.deletePlan(planId);
    } catch (err) {
      console.warn('Failed to delete plan on backend API:', err);
    }
  };

  const updateAcademySubscription = async (academyId, planId, durationMonths = 12) => {
    const plan = plans.find((p) => p.id === planId || String(p.id) === String(planId));
    if (!plan) return;

    const startDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const pName = plan.name || 'Free Plan';
    const hasSocial = pName.toLowerCase().includes('social media') || pName.toLowerCase().includes('send inquiry');
    const hasInquiry = pName.toLowerCase().includes('send inquiry');

    const updatedData = {
      subscriptionPlanId: plan.id,
      subscription_id: plan.id,
      subscriptionPlanName: plan.name,
      subscriptionStatus: 'Active',
      subscriptionStart: startDate,
      subscriptionExpiry: expiryDate,
      hasSocialMedia: hasSocial,
      hasSendInquiry: hasInquiry,
      featured: plan.listingPriority ? plan.listingPriority.includes('Featured') : false
    };

    setAcademies((prev) =>
      prev.map((acc) => {
        if (acc.id === academyId) {
          return {
            ...acc,
            ...updatedData
          };
        }
        return acc;
      })
    );

    try {
      await guruService.updateAcademyProfile(academyId, updatedData);
    } catch (err) {
      console.warn('Failed to update subscription on backend:', err);
    }
  };

  const toggleAcademySubscription = (academyId) => {
    setAcademies((prev) =>
      prev.map((acc) =>
        acc.id === academyId
          ? {
              ...acc,
              subscriptionStatus: acc.subscriptionStatus === 'Active' ? 'Disabled' : 'Active'
            }
          : acc
      )
    );
  };

  const addRaidLog = (raidObj) => {
    const newLog = {
      id: `raid-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      loggedBy: currentRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Class Admin',
      ...raidObj
    };
    setRaidLogs((prev) => [newLog, ...prev]);
  };

  const updateRaidLogStatus = (raidId, status) => {
    setRaidLogs((prev) => prev.map((r) => (r.id === raidId ? { ...r, status } : r)));
  };

  const addReview = async (reviewData) => {
    try {
      const createdReview = await guruService.createReview(reviewData);
      if (createdReview) {
        setReviews((prev) => [createdReview, ...prev]);

        const acadReviews = [...reviews.filter((r) => r.academyId === reviewData.academyId), createdReview];
        const avg = acadReviews.reduce((sum, r) => sum + r.rating, 0) / acadReviews.length;
        
        setAcademies((prev) =>
          prev.map((acc) =>
            acc.id === reviewData.academyId
              ? { ...acc, rating: parseFloat(avg.toFixed(1)), reviewCount: acadReviews.length }
              : acc
          )
        );
      }
    } catch (err) {
      console.warn('Failed to submit review to backend:', err);
    }
  };

  const exportDataToCSV = (filename, dataArray) => {
    if (!dataArray || !dataArray.length) return;
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    dataArray.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loginUser = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      if (data.success) {
        setCurrentUser(data.user);
        const userEmail = (data.user.email || '').toLowerCase();
        const userPhone = (data.user.phone || '').replace(/\D/g, '');
        const matchedAcad = academies.find(
          (a) =>
            (a.email && userEmail && a.email.toLowerCase() === userEmail) ||
            (a.phone && userPhone && a.phone.replace(/\D/g, '') === userPhone)
        );

        if (data.user.role === 'admin' || data.user.role === 'class_admin' || matchedAcad) {
          setCurrentRole('CLASS_ADMIN');
          if (matchedAcad) setActiveAcademyId(matchedAcad.id);
        } else if (data.user.role === 'superadmin') {
          setCurrentRole('SUPER_ADMIN');
        } else {
          setCurrentRole('PUBLIC_USER');
        }
        return { success: true, user: data.user, matchedAcademy: matchedAcad };
      }
      return { success: false, message: data.message || 'Invalid email or password.' };
    } catch (err) {
      const serverMessage = err.message || err.response?.data?.message || err.data?.message || 'Invalid email or password.';
      return { success: false, message: serverMessage };
    }
  };

  const registerUser = async (formData) => {
    try {
      const data = await authService.register(formData);
      if (data.success) {
        setCurrentUser(data.user);
        if (data.user.role === 'admin') setCurrentRole('CLASS_ADMIN');
        else setCurrentRole('PUBLIC_USER');
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const serverMessage = err.message || err.response?.data?.message || err.data?.message || 'Failed to register account.';
      return { success: false, message: serverMessage };
    }
  };

  const logoutUser = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentRole('PUBLIC_USER');
    setActiveAcademyId('');
  };

  const checkSocialMediaAccess = (academy) => {
    if (!academy) return false;
    if (Array.isArray(academy.planFeatures)) {
      if (academy.planFeatures.some((f) => String(f).toLowerCase().includes('social media'))) return true;
    }
    if (typeof academy.hasSocialMedia === 'boolean') return academy.hasSocialMedia;
    const pName = (academy.subscriptionPlanName || '').toLowerCase().trim();
    if (pName.includes('social media') || pName.includes('gold') || pName.includes('diamond')) return true;
    return false;
  };

  const checkSendInquiryAccess = (academy) => {
    // Send Inquiry is now included in Free Plan and all subscription plans!
    return true;
  };

  const checkGoogleMapAccess = (academy) => {
    if (!academy) return false;
    if (Array.isArray(academy.planFeatures)) {
      if (academy.planFeatures.some((f) => String(f).toLowerCase().includes('google map'))) return true;
    }
    if (typeof academy.hasGoogleMap === 'boolean') return academy.hasGoogleMap;
    const pName = (academy.subscriptionPlanName || '').toLowerCase().trim();
    if (pName.includes('google map') || pName.includes('diamond')) return true;
    return false;
  };

  const checkLeadContactAccess = (academy) => {
    if (!academy) return false;
    if (Array.isArray(academy.planFeatures)) {
      if (academy.planFeatures.some((f) => String(f).toLowerCase().includes('student contact') || String(f).toLowerCase().includes('contacts'))) return true;
    }
    const pName = (academy.subscriptionPlanName || '').toLowerCase().trim();
    if (pName.includes('view contacts') || pName.includes('all-in-one') || pName.includes('premium')) return true;
    return false;
  };

  const isGlobalFeatureActive = (featureName) => {
    if (!featureName) return true;
    const searchName = String(featureName).toLowerCase().trim();
    const feat = (globalFeatures || []).find((f) => {
      const fn = (f.name || '').toLowerCase().trim();
      if (fn === searchName) return true;
      if ((searchName.includes('inquiry') || searchName.includes('enquiry')) && (fn.includes('inquiry') || fn.includes('enquiry') || f.id === 1 || f.id === '1' || f.id === 'feat-1')) {
        return true;
      }
      return false;
    });

    if (!feat) return true;
    const val = feat.is_active !== undefined ? feat.is_active : (feat.isActive !== undefined ? feat.isActive : true);
    return val === true || val === 1 || val === '1';
  };

  return (
    <GuruContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeAcademyId,
        setActiveAcademyId,
        currentUser,
        setCurrentUser,
        cities,
        staticPagesData,
        skills,
        features,
        globalFeatures,
        plans,
        academies,
        inquiries,
        raidLogs,
        reviews,
        homeStats,
        searchFilters,
        setSearchFilters,
        registerAcademy,
        updateAcademyProfile,
        updateAcademyStatus,
        submitInquiry,
        updateInquiryStatus,
        addSkill,
        updateSkill,
        deleteSkill,
        addFeature,
        updateFeature,
        deleteFeature,
        addGlobalFeature,
        updateGlobalFeature,
        deleteGlobalFeature,
        addPlan,
        updatePlan,
        deletePlan,
        updateAcademySubscription,
        toggleAcademySubscription,
        addRaidLog,
        updateRaidLogStatus,
        addReview,
        exportDataToCSV,
        loginUser,
        registerUser,
        logoutUser,
        checkSocialMediaAccess,
        checkSendInquiryAccess,
        checkGoogleMapAccess,
        checkLeadContactAccess,
        isGlobalFeatureActive
      }}
    >
      {children}
    </GuruContext.Provider>
  );
};

export const useGuru = () => {
  const context = useContext(GuruContext);
  if (!context) {
    throw new Error('useGuru must be used within a GuruProvider');
  }
  return context;
};

export default GuruContext;
