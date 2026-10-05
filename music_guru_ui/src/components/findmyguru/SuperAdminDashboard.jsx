import React, { useState, useEffect } from 'react';
import { useGuru } from '../../context/GuruContext';
import { getSkillIcon } from '../../utils/skillIcons';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import LoaderSpinner from './LoaderSpinner';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Music,
  DollarSign,
  TrendingUp,
  Download,
  X,
  Sparkles,
  Check,
  Save,
  FileText
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PRESET_ICONS = [
  '🎸', '🎹', '🎤', '🎙️', '🥁', '🎻', '🪈', '🪗', '🎼', '🎵',
  '🎶', '🎺', '🎷', '🪕', '🪘', '🪇', '🔔', '📻', '🎧', '📢',
  '🔊', '🎭', '💃', '🕺', '🌟', '⭐', '👑', '🏆', '🎛️'
];

const PRESET_CATEGORIES = [
  'Strings',
  'Keyboard & Piano',
  'Vocals & Singing',
  'Percussion & Drums',
  'Wind Instruments',
  'Indian Classical',
  'Western Music',
  'General'
];

const SuperAdminDashboard = () => {
  const {
    academies,
    updateAcademyStatus,
    skills,
    addSkill,
    updateSkill,
    deleteSkill,
    features,
    globalFeatures,
    addFeature,
    updateFeature,
    deleteFeature,
    addGlobalFeature,
    updateGlobalFeature,
    deleteGlobalFeature,
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    toggleAcademySubscription,
    raidLogs,
    addRaidLog,
    updateRaidLogStatus,
    inquiries,
    cities,
    exportDataToCSV,
    updatePlanStatus
  } = useGuru();

  const [activeTab, setActiveTab] = useState('approvals');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Static Pages State
  const [staticPagesData, setStaticPagesData] = useState({});
  const [selectedStaticPage, setSelectedStaticPage] = useState('aboutUs');

  useEffect(() => {
    // Fetch static pages data
    const fetchStaticPages = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/static-pages');
        const result = await res.json();
        if (result.success) {
          setStaticPagesData(result.data);
        }
      } catch (err) {
        console.error('Error fetching static pages:', err);
      }
    };
    fetchStaticPages();
  }, []);

  const handleStaticPageContentChange = (content) => {
    setStaticPagesData(prev => ({
      ...prev,
      [selectedStaticPage]: content
    }));
  };

  const handleActionWithLoader = (actionFn, message = 'Processing Request...') => {
    setIsProcessing(true);
    setTimeout(() => {
      actionFn();
      setIsProcessing(false);
    }, 400);
  };

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillForm, setSkillForm] = useState({ name: '', category: 'Strings', icon: '🎸', description: '' });

  const handleOpenAddSkillModal = () => {
    setEditingSkillId(null);
    setSkillForm({ name: '', category: 'Strings', icon: '🎸', description: '' });
    setIsSkillModalOpen(true);
  };

  const handleOpenEditSkillModal = (sk) => {
    setEditingSkillId(sk.id);
    setSkillForm({
      name: sk.name || '',
      category: sk.category || 'General',
      icon: getSkillIcon(sk) || '🎵',
      description: sk.description || ''
    });
    setIsSkillModalOpen(true);
  };

  const handleSkillSubmit = (e) => {
    e.preventDefault();
    if (editingSkillId) {
      updateSkill(editingSkillId, skillForm);
    } else {
      addSkill(skillForm);
    }
    setSkillForm({ name: '', category: 'Strings', icon: '🎸', description: '' });
    setEditingSkillId(null);
    setIsSkillModalOpen(false);
  };

  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [featureForm, setFeatureForm] = useState({ name: '', description: '', is_active: true });


  const handleToggleFeatureActive = (feat) => {
    const currentActive = feat.is_active !== undefined ? feat.is_active : (feat.isActive !== undefined ? feat.isActive : true);
    const nextActive = !currentActive;
    updateGlobalFeature(feat.id, {
      ...feat,
      is_active: nextActive,
      isActive: nextActive
    });
  };

  const handleOpenAddFeatureModal = () => {
    setEditingFeatureId(null);
    setFeatureForm({ name: '', description: '', is_active: true });
    setIsFeatureModalOpen(true);
  };

  const handleOpenEditFeatureModal = (feat) => {
    const featActive = feat.is_active !== undefined ? feat.is_active : (feat.isActive !== undefined ? feat.isActive : true);
    setEditingFeatureId(feat.id);
    setFeatureForm({
      name: feat.name || '',
      description: feat.description || '',
      is_active: featActive
    });
    setIsFeatureModalOpen(true);
  };

  const handleFeatureSubmit = (e) => {
    e.preventDefault();
    if (!featureForm.name.trim()) return;
    if (editingFeatureId) {
      updateGlobalFeature(editingFeatureId, {
        name: featureForm.name.trim(),
        description: featureForm.description.trim(),
        is_active: featureForm.is_active,
        isActive: featureForm.is_active
      });
    } else {
      addGlobalFeature({
        name: featureForm.name.trim(),
        description: featureForm.description.trim(),
        is_active: featureForm.is_active,
        isActive: featureForm.is_active
      });
    }
    setFeatureForm({ name: '', description: '', is_active: true });
    setEditingFeatureId(null);
    setIsFeatureModalOpen(false);
  };

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: 999,
    durationMonths: 12,
    selectedFeatures: ['Send Enquiry', 'Social Media visible'],
    is_active: true
  });
  const togglePlanFeature = (featName) => {
    setPlanForm((prev) => {
      const current = prev.selectedFeatures || [];
      const exists = current.includes(featName);
      const updated = exists ? current.filter((f) => f !== featName) : [...current, featName];
      return { ...prev, selectedFeatures: updated };
    });
  };

  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
  const [raidForm, setRaidForm] = useState({
    academyId: academies[0]?.id || '',
    category: 'RISK',
    severity: 'MEDIUM',
    title: '',
    description: ''
  });

  const [acadFilter, setAcadFilter] = useState({ search: '', status: '', city: '' });

  const pendingAcademies = academies.filter((a) => a.status === 'Pending');

  const filteredAcademies = academies.filter((a) => {
    if (acadFilter.search && !a.academyName.toLowerCase().includes(acadFilter.search.toLowerCase()) && !a.teacherName.toLowerCase().includes(acadFilter.search.toLowerCase())) {
      return false;
    }
    if (acadFilter.status && a.status !== acadFilter.status) return false;
    if (acadFilter.city && a.city !== acadFilter.city) return false;
    return true;
  });

  const totalAcademiesCount = academies.length;
  const activeSubsCount = academies.filter((a) => a.subscriptionStatus === 'Active').length;
  const totalRevenue = academies.reduce((sum, a) => {
    const pl = plans.find((p) => p.id === a.subscriptionPlanId);
    return sum + (pl ? pl.price : 0);
  }, 0);

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    const finalFeatures = planForm.selectedFeatures || [];
    if (editingPlanId) {
      updatePlan(editingPlanId, {
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        durationMonths: Number(planForm.durationMonths),
        features: finalFeatures,
        is_active: planForm.is_active
      });
    } else {
      addPlan({
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        durationMonths: Number(planForm.durationMonths),
        features: finalFeatures,
        is_active: planForm.is_active
      });
    }
    setIsPlanModalOpen(false);
    setEditingPlanId(null);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationMonths: plan.durationMonths,
      selectedFeatures: Array.isArray(plan.features) ? [...plan.features] : [],
      is_active: plan.is_active !== undefined ? plan.is_active : (plan.isActive !== undefined ? plan.isActive : true)
    });
    setIsPlanModalOpen(true);
  };

  const handleTogglePlanActive = (pl) => {
    const currentActive = pl.is_active !== undefined ? pl.is_active : (pl.isActive !== undefined ? pl.isActive : true);
    const nextActive = !currentActive;
    if (updatePlanStatus) {
      updatePlanStatus(pl.id, nextActive);
    } else {
      updatePlan(pl.id, {
        ...pl,
        is_active: nextActive,
        isActive: nextActive
      });
    }
  };

  const handleRaidSubmit = (e) => {
    e.preventDefault();
    const targetAcad = academies.find((a) => a.id === raidForm.academyId);
    addRaidLog({
      academyId: raidForm.academyId,
      academyName: targetAcad?.academyName || 'Academy',
      category: raidForm.category,
      severity: raidForm.severity,
      title: raidForm.title,
      description: raidForm.description
    });
    setIsRaidModalOpen(false);
  };

  const handleExportAcademiesCSV = () => {
    const exportData = academies.map((a) => ({
      ID: a.id,
      AcademyName: a.academyName,
      GuruName: a.teacherName,
      City: a.city,
      Area: a.area,
      Skills: Array.isArray(a.skills) ? a.skills.join('; ') : '',
      Status: a.status,
      PlanName: a.subscriptionPlanName,
      SubscriptionStatus: a.subscriptionStatus,
      InquiriesReceived: a.inquiriesReceived,
      Phone: a.phone,
      Email: a.email
    }));
    exportDataToCSV('FindMyGuru_Academies_Report', exportData);
  };

  const handleExportInquiriesCSV = () => {
    const exportData = (inquiries || []).map((i) => ({
      InquiryID: i.id,
      Date: i.createdAt,
      AcademyName: i.academyName,
      StudentName: i.studentName,
      Phone: i.mobile,
      Email: i.email,
      Skill: i.skill,
      Mode: i.mode,
      Status: i.status
    }));
    exportDataToCSV('FindMyGuru_Inquiries_Report', exportData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      {isProcessing && <LoaderSpinner fullPage text="Processing Super Admin Request..." />}

      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Super Admin Master Console
              </span>
              <h1 className="text-2xl font-black text-white mt-0.5">Platform Operations & Quality Control</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportAcademiesCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Academies CSV</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Academies</span>
            <span className="text-2xl font-black text-gray-900">{totalAcademiesCount}</span>
            <span className="text-xs text-emerald-600 font-medium block">Across {cities.length} Cities</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Pending Approvals</span>
            <span className="text-2xl font-black text-amber-600">{pendingAcademies.length}</span>
            <span className="text-xs text-amber-700 font-medium block">Action required</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Subscriptions</span>
            <span className="text-2xl font-black text-purple-600">{activeSubsCount}</span>
            <span className="text-xs text-purple-700 font-medium block">Paid tiers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Platform Revenue</span>
            <span className="text-2xl font-black text-emerald-600">₹{totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-emerald-700 font-medium block">Gross subscription ARR</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Student Inquiries</span>
            <span className="text-2xl font-black text-rose-600">{inquiries.length}</span>
            <span className="text-xs text-rose-700 font-medium block">Total leads generated</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'approvals'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Academy Approvals ({pendingAcademies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('academies')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'academies'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Academies Master</span>
          </button>

          <button
            onClick={() => setActiveTab('raid')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'raid'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>RAID Audit Features ({raidLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'plans'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pricing Plans ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'features'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Master Features ({globalFeatures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'skills'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Music className="w-4 h-4" />
            <span>Master Skills ({skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>P&L & Download Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('static_content')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 ${activeTab === 'static_content'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Static Pages Editor</span>
          </button>
        </div>

        {activeTab === 'approvals' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Pending Academy Approvals Queue</h3>
              <p className="text-xs text-gray-500">Review newly registered music academies before public search listing.</p>
            </div>

            {pendingAcademies.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-base text-gray-800">All Approvals Clear!</p>
                <p className="text-xs">No pending music academies waiting for approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAcademies.map((acad) => (
                  <div key={acad.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          PENDING APPROVAL
                        </span>
                        <span className="text-xs text-gray-500">{acad.city} • {acad.area}</span>
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">{acad.academyName}</h4>
                      <p className="text-xs text-gray-600">Guru: {acad.teacherName} | Email: {acad.email} | Phone: {acad.phone}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateAcademyStatus(acad.id, 'Approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Academy</span>
                      </button>

                      <button
                        onClick={() => updateAcademyStatus(acad.id, 'Rejected')}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'academies' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">All Registered Music Academies</h3>
                <p className="text-xs text-gray-500">Manage status, approve, suspend, or delete academies.</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search name or guru..."
                  value={acadFilter.search}
                  onChange={(e) => setAcadFilter({ ...acadFilter, search: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3">Academy & Guru</th>
                    <th className="p-3">City / Area</th>
                    <th className="p-3">Skills</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3">Subscription</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAcademies.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-gray-900 block">{a.academyName}</span>
                        <span className="text-gray-500 text-[11px]">{a.teacherName}</span>
                      </td>
                      <td className="p-3">{a.city} • {a.area}</td>
                      <td className="p-3">{Array.isArray(a.skills) ? a.skills.join(', ') : ''}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-purple-700 block">{a.subscriptionPlanName || 'Free Listing'}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold block my-0.5">
                          Valid until: {a.subscriptionExpiry || a.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        </span>
                        <button
                          onClick={() => toggleAcademySubscription(a.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${a.subscriptionStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                          {a.subscriptionStatus} (Toggle)
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {a.status !== 'Approved' && (
                          <button
                            onClick={() => updateAcademyStatus(a.id, 'Approved')}
                            className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                          >
                            Approve
                          </button>
                        )}
                        {a.status === 'Approved' && (
                          <button
                            onClick={() => updateAcademyStatus(a.id, 'Suspended')}
                            className="bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'raid' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">RAID Audit Features (Risks, Assumptions, Issues, Decisions)</h3>
                <p className="text-xs text-gray-500">Log audit history, compliance flags, and risk indicators for each music institute.</p>
              </div>

              <button
                onClick={() => setIsRaidModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log RAID Audit Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {raidLogs.map((log) => (
                <div key={log.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${log.category === 'RISK' ? 'bg-rose-600' : log.category === 'ISSUE' ? 'bg-amber-600' : 'bg-blue-600'
                        }`}>
                        {log.category}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900">{log.title}</h4>
                      <span className="text-xs font-semibold text-rose-600">({log.academyName})</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {log.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700">{log.description}</p>
                  <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                    <span>Logged by: {log.loggedBy} on {new Date(log.createdAt).toLocaleDateString()}</span>
                    {log.status !== 'RESOLVED' && (
                      <button
                        onClick={() => updateRaidLogStatus(log.id, 'RESOLVED')}
                        className="text-emerald-600 hover:underline font-bold"
                      >
                        Mark as Resolved ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Subscription Plans Management</h3>
                <p className="text-xs text-gray-500">Configure listing tiers, dynamic pricing, and features for music academies.</p>
              </div>

              <button
                onClick={() => {
                  setEditingPlanId(null);
                  setPlanForm({ name: '', description: '', price: 999, durationMonths: 12, listingPriority: 'Normal', maxImages: 10, featuresStr: '', selectedFeatures: [], is_active: true });
                  setIsPlanModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Pricing Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(plans || []).map((pl) => {
                const isActiveInAcademies = (academies || []).some(a => String(a.subscriptionPlanId) === String(pl.id));
                const isPlanActive = pl.is_active !== undefined ? pl.is_active : (pl.isActive !== undefined ? pl.isActive : true);
                
                return (
                  <div key={pl.id} className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${isPlanActive ? 'bg-slate-50 border-slate-200' : 'bg-gray-100/70 border-gray-200 opacity-75'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-gray-900">{pl.name}</h4>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isPlanActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {isPlanActive ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{pl.description || ''}</p>
                      <div className="text-3xl font-black text-gray-900 py-2">
                        ₹{pl.price} <span className="text-xs font-semibold text-gray-500">/ {pl.durationMonths || 12} Months</span>
                      </div>

                      <ul className="space-y-1 text-xs text-gray-700 pt-2 border-t border-slate-200">
                        {(Array.isArray(pl.features) ? pl.features : []).map((feat, i) => (
                          <li key={i} className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                      {isActiveInAcademies && (
                        <div className="mt-2 text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Plan is active for users. Edit/Delete disabled.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isPlanActive}
                        onClick={() => handleTogglePlanActive(pl)}
                        title={isPlanActive ? 'Turn off plan' : 'Turn on plan'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isPlanActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isPlanActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleOpenEditPlan(pl)}
                        disabled={isActiveInAcademies}
                        className={`flex-1 bg-white text-gray-800 font-bold text-xs py-2 rounded-xl border border-gray-300 flex items-center justify-center space-x-1 ${isActiveInAcademies ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deletePlan(pl.id)}
                        disabled={isActiveInAcademies}
                        className={`p-2 rounded-xl border flex items-center justify-center ${isActiveInAcademies ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Master Features List</h3>
                <p className="text-xs text-gray-500">Manage platform features (e.g., Send Enquiry, Social Media visible) and control feature availability for subscription plans.</p>
              </div>

              <button
                onClick={handleOpenAddFeatureModal}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Master Feature</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(globalFeatures || []).map((feat) => {
                const featActive = feat.is_active !== undefined ? feat.is_active : (feat.isActive !== undefined ? feat.isActive : true);
                return (
                  <div
                    key={feat.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                      featActive ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80' : 'bg-gray-100/70 border-gray-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 border ${
                        featActive ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-rose-50 border-rose-200 text-rose-500'
                      }`}>
                        <Check className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{feat.name}</h4>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            featActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {featActive ? 'Active' : 'Off'}
                          </span>
                        </div>
                        {feat.description && <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{feat.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Single Sliding Switch Button for Super Admin */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={featActive}
                        onClick={() => handleToggleFeatureActive(feat)}
                        title={featActive ? 'Turn off feature (sets is_active to false)' : 'Turn on feature (sets is_active to true)'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          featActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            featActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleOpenEditFeatureModal(feat)}
                        title="Edit Feature"
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGlobalFeature(feat.id)}
                        title="Delete Feature"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Master Skills List</h3>
                <p className="text-xs text-gray-500">Manage available music instruments, singing categories & visual icons across the platform.</p>
              </div>

              <button
                onClick={handleOpenAddSkillModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Master Skill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((sk) => (
                <div key={sk.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                      {getSkillIcon(sk)}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{sk.name}</h4>
                      <span className="text-[10px] text-gray-500 font-semibold">{sk.category || 'General'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditSkillModal(sk)}
                      title="Edit Skill Icon & Name"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSkill(sk.id)}
                      title="Delete Skill"
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">P&L & Platform Analytics</h3>
                <p className="text-xs text-gray-500">Profit & loss breakdown per subscription tier, teacher data export & inquiry logs.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportAcademiesCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Academies CSV</span>
                </button>

                <button
                  onClick={handleExportInquiriesCSV}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Inquiries CSV</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Subscription P&L Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                      <th className="p-3">Plan Tier</th>
                      <th className="p-3">Monthly Price</th>
                      <th className="p-3">Active Academies</th>
                      <th className="p-3">Gross Revenue</th>
                      <th className="p-3">Platform Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(plans || []).map((pl) => {
                      const count = (academies || []).filter((a) => a.subscriptionPlanId === pl.id).length;
                      const rev = count * (pl.price || 0);
                      return (
                        <tr key={pl.id}>
                          <td className="p-3 font-bold text-gray-900">{pl.name}</td>
                          <td className="p-3 font-semibold text-emerald-700">₹{pl.price}</td>
                          <td className="p-3 font-bold text-purple-700">{count} Academies</td>
                          <td className="p-3 font-black text-gray-900">₹{rev.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-bold">100% Direct Margin</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'static_content' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Static Pages Content Editor</h3>
                <p className="text-xs text-gray-500">Edit the content of About Us, Contact Us, FAQs, Privacy Policy, and Terms & Conditions directly using a Rich Text Editor.</p>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={selectedStaticPage}
                  onChange={(e) => setSelectedStaticPage(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-pink-500"
                >
                  <option value="aboutUs">About Us</option>
                  <option value="contactUs">Contact Us</option>
                  <option value="helpSupport">Help & Support</option>
                  <option value="faqs">FAQs</option>
                  <option value="termsConditions">Terms & Conditions</option>
                  <option value="privacyPolicy">Privacy Policy</option>
                </select>

                <button
                  onClick={async () => {
                    try {
                      handleActionWithLoader(async () => {
                        const token = localStorage.getItem('music_guru_auth_token');
                        const res = await fetch('http://localhost:5001/api/static-pages', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify(staticPagesData)
                        });
                        if (res.ok) alert('Successfully updated static pages!');
                        else alert('Failed to update static pages.');
                      }, 'Saving Static Content...');
                    } catch (e) {
                      alert('Error saving data.');
                    }
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">Page Content Editor</label>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">Editing: {selectedStaticPage}</span>
              </div>
              
              <style>{`
                .quill-custom-container .ql-container {
                  height: 500px !important;
                  overflow-y: auto;
                  font-size: 14px;
                  font-family: inherit;
                }
                .quill-custom-container .ql-editor {
                  min-height: 100%;
                }
              `}</style>

              <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden quill-custom-container">
                <ReactQuill 
                  key={selectedStaticPage}
                  theme="snow"
                  value={staticPagesData[selectedStaticPage] || ''}
                  onChange={(content, delta, source) => {
                    if (source === 'user') {
                      handleStaticPageContentChange(content);
                    }
                  }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      [{ 'font': [] }],
                      [{ 'size': ['small', false, 'large', 'huge'] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link', 'image', 'video'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingSkillId ? 'Edit Master Skill' : 'Add New Master Skill'}
                </h3>
                <p className="text-xs text-gray-500">Choose custom icon, name, and category for this skill.</p>
              </div>
              <button onClick={() => setIsSkillModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSkillSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">1. Skill / Instrument Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ukulele, Sitar, Saxophone"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">2. Category</label>
                <select
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">3. Choose Skill Icon</label>

                <div className="flex items-center space-x-3 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-2xl shadow-sm shrink-0">
                    {skillForm.icon || '🎵'}
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-gray-600 block uppercase tracking-wider">Custom Icon / Emoji Input</span>
                    <input
                      type="text"
                      placeholder="Type or paste any emoji/symbol (e.g. 🪕)"
                      value={skillForm.icon}
                      onChange={(e) => setSkillForm({ ...skillForm, icon: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 mt-1 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-gray-500 block mb-2">Or click to choose from Icon Gallery:</span>
                <div className="grid grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-xl">
                  {PRESET_ICONS.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSkillForm({ ...skillForm, icon })}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${skillForm.icon === icon
                          ? 'bg-blue-600 text-white ring-2 ring-blue-500 scale-110 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-gray-800 border border-gray-200'
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs"
                >
                  {editingSkillId ? 'Update Skill' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPlanId ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
                </h3>
                <p className="text-xs text-gray-500">Configure plan details and select which features are included.</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900"
                  placeholder="e.g. Starter Plan, Premium Tier"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  placeholder="e.g. Best for growing music institutes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Select Included Features ({planForm.selectedFeatures?.length || 0} selected)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">Check the features from the Features table to include in this subscription plan:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {(features || []).length === 0 ? (
                    <p className="text-xs text-gray-400 col-span-2 text-center py-4">No features found in Features table.</p>
                  ) : (
                    (features || []).map((feat) => {
                      const isChecked = planForm.selectedFeatures?.includes(feat.name);
                      return (
                        <label
                          key={feat.id}
                          onClick={() => togglePlanFeature(feat.name)}
                          className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span className="truncate">{feat.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs"
                >
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFeatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFeatureId ? 'Edit Master Feature' : 'Add New Master Feature'}
                </h3>
                <p className="text-xs text-gray-500">Feature name and details for subscription packages.</p>
              </div>
              <button onClick={() => setIsFeatureModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeatureSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Feature Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Send Enquiry, Social Media visible, Verified Badge"
                  value={featureForm.name}
                  onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short detail of what this feature provides"
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">Feature Status (is_active)</span>
                    <span className="text-[11px] text-gray-500">When turned off, is_active will be set to false.</span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={featureForm.is_active}
                    onClick={() => setFeatureForm({ ...featureForm, is_active: !featureForm.is_active })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      featureForm.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        featureForm.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs"
                >
                  {editingFeatureId ? 'Update Feature' : 'Save Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRaidModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Log Institute RAID Audit Item</h3>
            <form onSubmit={handleRaidSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Music Academy</label>
                <select
                  value={raidForm.academyId}
                  onChange={(e) => setRaidForm({ ...raidForm, academyId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                >
                  {academies.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.academyName} ({ac.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Document Verification Required"
                  value={raidForm.title}
                  onChange={(e) => setRaidForm({ ...raidForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Audit Description</label>
                <textarea
                  rows={3}
                  required
                  value={raidForm.description}
                  onChange={(e) => setRaidForm({ ...raidForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRaidModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">
                  Save RAID Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GuruFooter />
    </div>
  );
};

export default SuperAdminDashboard;
