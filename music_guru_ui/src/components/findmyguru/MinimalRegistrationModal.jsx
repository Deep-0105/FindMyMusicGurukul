import React, { useState, useEffect } from 'react';
import { useGuru } from '../../context/GuruContext';
import { getSkillIcon } from '../../utils/skillIcons';
import { useNavigate } from 'react-router-dom';
import LoaderSpinner from './LoaderSpinner';
import { X, Sparkles, Building2, User, UserCheck, Phone, Mail, MapPin, Music, Lock, CheckCircle2, AlertCircle, Plus, RefreshCw } from 'lucide-react';

const MinimalRegistrationModal = ({ isOpen, onClose }) => {
  const { skills, registerAcademy, setCurrentRole } = useGuru();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    academyName: '',
    teacherName: '',
    username: '',
    mobile: '',
    email: '',
    city: '',
    area: '',
    skills: [],
    password: ''
  });

  const [customSkillInput, setCustomSkillInput] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [createdAcademy, setCreatedAcademy] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateMathCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return { num1, num2, answer: num1 + num2 };
  };

  const [captchaQuestion, setCaptchaQuestion] = useState(generateMathCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const refreshCaptcha = () => {
    setCaptchaQuestion(generateMathCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setCreatedAcademy(null);
      setLoading(false);
      setPhoneError('');
      setCustomSkillInput('');
      setCaptchaError('');
      setCaptchaInput('');
      setCaptchaQuestion(generateMathCaptcha());
      setFormData({
        academyName: '',
        teacherName: '',
        username: '',
        mobile: '',
        email: '',
        city: '',
        area: '',
        skills: [],
        password: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: value }));
    if (value.length > 0 && value.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const toggleSkill = (skillName) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skillName);
      if (exists) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skillName) };
      } else {
        return { ...prev, skills: [...prev.skills, skillName] };
      }
    });
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed) {
      if (!formData.skills.includes(trimmed)) {
        setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      }
      setCustomSkillInput('');
    }
  };

  const removeSkill = (skillName) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillName)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!captchaInput.trim()) {
      setCaptchaError('Captcha answer is required. Please solve the math calculation.');
      return;
    }

    if (parseInt(captchaInput.trim(), 10) !== captchaQuestion.answer) {
      setCaptchaError('Invalid captcha. Please try again.');
      setCaptchaQuestion(generateMathCaptcha());
      setCaptchaInput('');
      return;
    }

    if (!formData.academyName.trim()) {
      alert('Please enter your Academy / School Name.');
      return;
    }

    if (!formData.teacherName.trim()) {
      alert('Please enter Lead Tutor / Guru Name.');
      return;
    }

    if (!formData.username.trim()) {
      alert('Please enter an Admin Username.');
      return;
    }

    if (formData.mobile.length !== 10) {
      setPhoneError('Mobile number must contain exactly 10 digits.');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter your Email Address.');
      return;
    }

    if (!formData.city.trim()) {
      alert('Please enter your city name.');
      return;
    }

    if (!formData.area.trim()) {
      alert('Please enter your area / locality.');
      return;
    }

    if (!formData.skills || formData.skills.length === 0) {
      alert('Please select or enter at least 1 music skill/class you teach.');
      return;
    }

    if (!formData.password.trim()) {
      alert('Please set an Account Password.');
      return;
    }

    setLoading(true);
    try {
      const academy = await registerAcademy(formData);
      setCreatedAcademy(academy);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting registration:', err);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToAdmin = () => {
    setCurrentRole('CLASS_ADMIN');
    setSubmitted(false);
    onClose();
    navigate('/class-admin');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      {loading && <LoaderSpinner fullPage text="Registering Music Academy..." />}
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 relative">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
              Low Friction Signup
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-2">List Your Music Academy</h2>
          <p className="text-teal-100 text-sm mt-1">
            Get discovered by hundreds of local music students in under 3 minutes.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Registration Complete!</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              <span className="font-semibold text-gray-900">{createdAcademy?.academyName}</span> has been submitted for verification. Your initial listing is ready!
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center text-amber-900">
                ⏳ Profile Status: Pending Approval
              </p>
              <p>Super Admin will review and activate your listing shortly. You can preview and customize your academy profile in the Class Admin dashboard.</p>
            </div>

            <button
              onClick={handleGoToAdmin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
            >
              Open Class Admin Dashboard →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  1. Academy / School Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="reg_academy_name"
                    autoComplete="off"
                    placeholder="e.g. Swaralaya Music School"
                    value={formData.academyName}
                    onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  2. Lead Tutor / Guru Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="reg_teacher_name"
                    autoComplete="off"
                    placeholder="e.g. Pt. Vidyadhar Joshi"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  3. Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="reg_username_field"
                    autoComplete="off"
                    placeholder="e.g. vidyadhar_guru"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  4. Account Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    name="new_academy_password_field"
                    autoComplete="new-password"
                    placeholder="Set a password for login"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  5. Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    name="reg_mobile_num"
                    autoComplete="off"
                    placeholder="10-digit phone number"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border ${
                      phoneError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-300'
                    } rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  6. Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    name="reg_email_addr"
                    autoComplete="off"
                    placeholder="academy@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  7. City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="reg_city_name"
                    autoComplete="off"
                    placeholder="e.g. Pune, Mumbai, Bangalore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  8. Area / Locality <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="reg_area_name"
                    autoComplete="off"
                    placeholder="e.g. Wakad, Kothrud, HSR Layout"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>9. What Music Classes Do You Teach? <span className="text-rose-500">*</span></span>
                <span className="text-gray-400 text-[11px] lowercase font-normal">(Select or add custom class)</span>
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl max-h-36 overflow-y-auto">
                  {skills.map((sk) => {
                    const isSelected = formData.skills.includes(sk.name);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        <span>{getSkillIcon(sk)}</span>
                        <span>{sk.name}</span>
                      </button>
                    );
                  })}

                  {formData.skills
                    .filter((sName) => !skills.some((sk) => sk.name === sName))
                    .map((customName) => (
                      <span
                        key={customName}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white border border-emerald-600 shadow-sm flex items-center space-x-1"
                      >
                        <span>🎵 {customName}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(customName)}
                          className="ml-1 hover:text-rose-200 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="custom_skill_entry_no_autofill"
                    autoComplete="off"
                    placeholder="Type unlisted class name (e.g. Tabla, Ukulele, Flute)"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Class</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simple Math Calculation Captcha */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Human Verification Captcha <span className="text-emerald-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>New Problem</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white border border-gray-300 px-3.5 py-2 rounded-xl text-sm font-black text-slate-800 shadow-inner tracking-wider select-none font-mono">
                  {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                </div>
                <input
                  type="number"
                  placeholder="Enter answer"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError('');
                  }}
                  className={`flex-1 px-3.5 py-2 bg-white border ${
                    captchaError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-300'
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              {captchaError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 mt-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{captchaError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              <Music className="w-4 h-4" />
              <span>{loading ? 'Submitting Registration...' : 'Register Academy & Submit for Approval'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MinimalRegistrationModal;
