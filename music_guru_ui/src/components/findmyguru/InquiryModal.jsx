import React, { useState, useEffect } from 'react';
import { useGuru } from '../../context/GuruContext';
import LoaderSpinner from './LoaderSpinner';
import { X, Send, CheckCircle2, User, Phone, Mail, Music, MapPin, Clock, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const InquiryModal = ({ isOpen, onClose, academy, preselectedSkill }) => {
  const { submitInquiry, skills, features, currentRole } = useGuru();

  const sendEnquiryFeature = (features || []).find(
    (f) => (f.name || '').toLowerCase().trim() === 'send enquiry' || f.id === 'feat-1'
  );
  const isEnquiryActive = sendEnquiryFeature
    ? (sendEnquiryFeature.is_active !== false && sendEnquiryFeature.isActive !== false)
    : true;

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const [formData, setFormData] = useState({
    studentName: '',
    mobile: '',
    email: '',
    skill: '',
    mode: 'Offline',
    preferredArea: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

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
    if (isOpen && academy) {
      setSubmitted(false);
      setLoading(false);
      setPhoneError('');
      setCaptchaError('');
      setCaptchaInput('');
      setCaptchaQuestion(generateMathCaptcha());
      setFormData({
        studentName: '',
        mobile: '',
        email: '',
        skill: preselectedSkill || (academy?.skills?.[0] || 'Guitar'),
        mode: academy?.teachingMode?.[0] || 'Offline',
        preferredArea: academy?.area || '',
        message: ''
      });
    }
  }, [isOpen, academy, preselectedSkill]);

  if (!isOpen || !academy || (!isEnquiryActive && !isSuperAdmin)) return null;

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: value }));
    if (value.length > 0 && value.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!captchaInput.trim()) {
      setCaptchaError('Captcha calculation answer is required.');
      return;
    }

    if (parseInt(captchaInput.trim(), 10) !== captchaQuestion.answer) {
      setCaptchaError('Invalid captcha. Please try again.');
      setCaptchaQuestion(generateMathCaptcha());
      setCaptchaInput('');
      return;
    }

    if (formData.mobile.length !== 10) {
      setPhoneError('Mobile number must contain exactly 10 digits.');
      return;
    }

    setLoading(true);
    setPhoneError('');

    const selectedSkillObj = skills?.find(
      (s) => s.name?.toLowerCase() === formData.skill?.toLowerCase() || s.id === formData.skill
    );

    setTimeout(() => {
      submitInquiry({
        academyId: academy.id,
        academyName: academy.academyName,
        skillId: selectedSkillObj?.id || formData.skill,
        ...formData
      });
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  const handleReset = () => {
    setSubmitted(false);
    setPhoneError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      {loading && <LoaderSpinner fullPage text="Sending Inquiry to Guru..." />}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 relative">
        <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
            Direct Academy Lead
          </span>
          <h2 className="text-2xl font-bold mt-2">Contact Music Guru</h2>
          <p className="text-rose-100 text-sm mt-1">
            {academy.academyName} ({academy.teacherName})
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Inquiry Sent Successfully!</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
              Your inquiry has been delivered directly to <span className="font-semibold text-gray-800">{academy.teacherName}</span>. They will call or WhatsApp you shortly.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-xs text-gray-600 space-y-1">
              <p><strong>Academy:</strong> {academy.academyName}</p>
              <p><strong>Skill Interested:</strong> {formData.skill}</p>
              <p><strong>Your Mobile:</strong> {formData.mobile}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-md mt-4"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Deshmukh"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border ${
                      phoneError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-300'
                    } rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none`}
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Preferred Skill / Class
                </label>
                <div className="relative">
                  <Music className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                  >
                    {academy.skills.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Class Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                >
                  {academy.teachingMode.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Your Message / Inquiry Details
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  placeholder="Ask about batch timings, fees, or course structure..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Simple Math Calculation Captcha */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Human Verification Captcha <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
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
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500`}
                />
              </div>

              {captchaError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 mt-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{captchaError}</span>
                </div>
              )}
            </div>

            {!isEnquiryActive && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Note: Send Enquiry feature is currently turned off by Super Admin (is_active: false). Submissions are temporarily disabled.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isEnquiryActive}
              className="w-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-700 hover:from-rose-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending Inquiry...' : (!isEnquiryActive ? 'Send Enquiry Turned Off by Admin' : 'Send Inquiry to Guru')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
