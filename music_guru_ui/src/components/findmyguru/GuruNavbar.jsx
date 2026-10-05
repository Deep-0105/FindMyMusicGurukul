import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import MinimalRegistrationModal from './MinimalRegistrationModal';
import {
  Music,
  Search,
  MapPin,
  ShieldCheck,
  UserCheck,
  Building2,
  Menu,
  X,
  PlusCircle,
  Sparkles
} from 'lucide-react';

const GuruNavbar = () => {
  const { currentRole, setCurrentRole, currentUser, logoutUser, cities, searchFilters, setSearchFilters, academies, activeAcademyId } = useGuru();
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = (currentUser?.email || '').toLowerCase();
  const matchedUserAcademy = academies.find(
    (a) => (a.email && userEmail && a.email.toLowerCase() === userEmail) || a.id === activeAcademyId
  );
  const activeAcademy = matchedUserAcademy || academies.find((a) => a.id === activeAcademyId) || academies[0];

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || (currentUser?.role || '').toLowerCase() === 'superadmin';

  const isClassAdminUser =
    !isSuperAdmin &&
    (currentRole === 'CLASS_ADMIN' ||
      Boolean(
        currentUser &&
          ((currentUser.role || '').toLowerCase() === 'admin' ||
            (currentUser.role || '').toLowerCase() === 'class_admin' ||
            (matchedUserAcademy && !isSuperAdmin))
      ));

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSearchFilters((prev) => ({ ...prev, city, area: '' }));
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <>
      {/* Top Demo Persona Switcher Banner */}
      {/* <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-800 shadow-inner z-50">
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            FindMyMusicGurukul Platform
          </span>
          <span className="hidden md:inline text-slate-400">| Switch Persona for Live Testing:</span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <button
            onClick={() => {
              setCurrentRole('PUBLIC_USER');
              navigate('/search');
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center ${
              currentRole === 'PUBLIC_USER'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            🎓 Public Student (Premium VIP Pass)
          </button>

          <button
            onClick={() => {
              setCurrentRole('CLASS_ADMIN');
              navigate('/class-admin');
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center ${
              currentRole === 'CLASS_ADMIN'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 mr-1" />
            🏫 Class Admin ({activeAcademy?.academyName?.substring(0, 14)}...)
          </button>

          <button
            onClick={() => {
              setCurrentRole('SUPER_ADMIN');
              navigate('/super-admin');
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center ${
              currentRole === 'SUPER_ADMIN'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            👑 Super Admin
          </button>
        </div>
      </div> */}

      {/* Main Brand Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & City Selector */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xl font-black bg-gradient-to-r from-gray-900 via-rose-900 to-purple-900 bg-clip-text text-transparent">
                    FindMy<span className="text-rose-600">MusicGurukul</span>
                  </span>
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-rose-500 -mt-1">
                    Music Academies
                  </span>
                </div>
              </Link>

              {/* City Selection Dropdown */}
              {/* <div className="hidden lg:flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                <MapPin className="w-4 h-4 text-rose-500" />
                <select
                  value={searchFilters.city}
                  onChange={handleCityChange}
                  className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}, {c.state}
                    </option>
                  ))}
                </select>
              </div> */}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-rose-600 ${
                  location.pathname === '/' ? 'text-rose-600 font-semibold' : 'text-gray-600'
                }`}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`text-sm font-medium transition-colors hover:text-rose-600 flex items-center ${
                  location.pathname.startsWith('/search') ? 'text-rose-600 font-semibold' : 'text-gray-600'
                }`}
              >
                <Search className="w-4 h-4 mr-1 text-gray-400" />
                Find Music Classes
              </Link>

              {isClassAdminUser && (
                <Link
                  to="/class-admin"
                  onClick={() => setCurrentRole('CLASS_ADMIN')}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-md border flex items-center space-x-1.5 ${
                    (!activeAcademy || activeAcademy.status === 'Approved')
                      ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 hover:text-amber-800 bg-amber-50 border-amber-300'
                  }`}
                >
                  <span>My Academy Dashboard</span>
                  {activeAcademy && activeAcademy.status !== 'Approved' && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded shadow-xs">
                      {activeAcademy.status}
                    </span>
                  )}
                </Link>
              )}

              {currentRole === 'SUPER_ADMIN' && (
                <Link
                  to="/super-admin"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200"
                >
                  Super Admin Panel
                </Link>
              )}
            </nav>

            {/* Right Action Buttons: Sign In / Register / List Academy / User Profile */}
            <div className="hidden md:flex items-center space-x-3">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200">
                    👤 {currentUser.fullName || currentUser.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-gray-700 hover:text-rose-600 px-3 py-2 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  {/* <Link
                    to="/register"
                    className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors"
                  >
                    Register
                  </Link> */}
                </>
              )}
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center active:scale-95"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                List Your Academy
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <select
                value={searchFilters.city}
                onChange={handleCityChange}
                className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none w-full"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}, {c.state}
                  </option>
                ))}
              </select>
            </div>

            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Home
            </Link>

            <Link
              to="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Find Music Classes
            </Link>

            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-rose-600 font-semibold bg-rose-50"
            >
              Register Account
            </Link>

            {isClassAdminUser && (
              <Link
                to="/class-admin"
                onClick={() => {
                  setCurrentRole('CLASS_ADMIN');
                  setIsMobileMenuOpen(false);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 bg-emerald-50"
              >
                Class Admin Portal
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                to="/super-admin"
                onClick={() => {
                  setCurrentRole('SUPER_ADMIN');
                  setIsMobileMenuOpen(false);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 bg-purple-50"
              >
                Super Admin Console
              </Link>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsRegModalOpen(true);
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-medium py-2.5 rounded-xl shadow-md text-center"
            >
              List Your Music Academy
            </button>
          </div>
        )}
      </header>

      {/* Minimal Registration Modal */}
      <MinimalRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />
    </>
  );
};

export default GuruNavbar;
