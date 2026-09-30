import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import ROUTES from '../../route/routes';
import LoaderSpinner from './LoaderSpinner';
import {
  Music,
  Lock,
  Mail,
  User,
  Phone,
  UserCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const RegisterPage = () => {
  const { registerUser } = useGuru();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const generateMathCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return { num1, num2, answer: num1 + num2 };
  };

  const [captchaQuestion, setCaptchaQuestion] = useState(generateMathCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    setCaptchaQuestion(generateMathCaptcha());
    setCaptchaInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!captchaInput.trim()) {
      setErrorMsg('Captcha answer is required. Please solve the math calculation.');
      return;
    }

    if (parseInt(captchaInput.trim(), 10) !== captchaQuestion.answer) {
      setErrorMsg('Invalid captcha. Please try again.');
      setCaptchaQuestion(generateMathCaptcha());
      setCaptchaInput('');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    setLoading(true);

    const result = await registerUser({
      fullName,
      email,
      phone,
      username: username || email.split('@')[0],
      password,
      role
    });

    setLoading(false);

    if (result.success) {
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (role === 'admin') navigate(ROUTES.CLASS_ADMIN);
        else navigate(ROUTES.HOME);
      }, 1200);
    } else {
      setErrorMsg(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      {loading && <LoaderSpinner fullPage text="Creating Your Account..." />}

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
          {/* Header Brand */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/20 mb-4">
              <Music className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Join <span className="text-rose-600">FindMyMusicGurukul</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Create your account to connect with verified gurus or list your music academy
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                role === 'student'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className={`w-6 h-6 mb-2 ${role === 'student' ? 'text-rose-600' : 'text-gray-400'}`} />
              <div>
                <span className="block font-bold text-sm">Student</span>
                <span className="text-[11px] text-gray-500 block leading-tight">I want to learn music</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                role === 'admin'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className={`w-6 h-6 mb-2 ${role === 'admin' ? 'text-emerald-600' : 'text-gray-400'}`} />
              <div>
                <span className="block font-bold text-sm">Music Teacher</span>
                <span className="text-[11px] text-gray-500 block leading-tight">I teach & run an academy</span>
              </div>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Phone / Mobile
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Password *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Confirm Password *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 mt-0.5"
                />
                <span className="text-xs text-gray-600 leading-normal">
                  I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} className="text-rose-600 font-semibold underline">Terms of Service</a> and <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-rose-600 font-semibold underline">Privacy Policy</a>.
                </span>
              </label>
            </div>

            {/* Simple Math Calculation Captcha */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Human Verification Captcha <span className="text-rose-600">*</span>
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
                    setErrorMsg('');
                  }}
                  className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Login Redirect */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Already have a MusicGurukul account?{' '}
              <Link to={ROUTES.LOGIN} className="font-bold text-rose-600 hover:text-rose-700 underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default RegisterPage;
