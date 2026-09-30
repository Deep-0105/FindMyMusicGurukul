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
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const LoginPage = () => {
  const { loginUser, setCurrentRole } = useGuru();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    const result = await loginUser({
      identifier,
      password
    });

    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Welcome back, ${result.user.fullName || 'User'}! Redirecting...`);
      setTimeout(() => {
        const uRole = (result.user.role || '').toLowerCase();
        if (uRole === 'admin' || uRole === 'class_admin' || result.matchedAcademy) {
          navigate(ROUTES.CLASS_ADMIN);
        } else if (uRole === 'superadmin') {
          navigate(ROUTES.SUPER_ADMIN);
        } else {
          navigate(ROUTES.HOME);
        }
      }, 800);
    } else {
      setErrorMsg(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      {loading && <LoaderSpinner fullPage text="Signing In..." />}

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
          {/* Header Brand */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/20 mb-4">
              <Music className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back to <span className="text-rose-600">MusicGurukul</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to access your student profile, academy dashboard, or admin panel
            </p>
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

          {/* Form Fields */}
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Email or Username
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul.s@example.com or admin"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                />
                <span className="text-xs font-medium text-gray-600">Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Register Redirect */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Don't have a MusicGurukul account?{' '}
              <Link to={ROUTES.REGISTER} className="font-bold text-rose-600 hover:text-rose-700 underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default LoginPage;
