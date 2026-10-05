import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Heart, MapPin, Shield } from 'lucide-react';
import { useGuru } from '../../context/GuruContext';
import { getSkillIcon } from '../../utils/skillIcons';

const GuruFooter = () => {
  const { skills, cities } = useGuru();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-10 pb-12 border-b border-slate-800">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Music className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                FindMy<span className="text-rose-500">MusicGurukul</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              India’s premier music guru & music academy discovery platform. Connecting passionate students directly with certified tutors, classical gurus, and modern music schools.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-slate-400 text-xs">
              <span className="flex items-center"><Shield className="w-4 h-4 mr-1 text-emerald-400" /> Verified Tutors</span>
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-rose-400" /> Multi-City Directory</span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-l-2 border-rose-500 pl-2">
              Popular Instruments
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {skills.slice(0, 8).map((sk) => (
                <li key={sk.id}>
                  <Link
                    to={`/search?skill=${encodeURIComponent(sk.name)}`}
                    onClick={scrollToTop}
                    className="hover:text-rose-400 transition-colors"
                  >
                    {getSkillIcon(sk)} {sk.name} Classes
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-l-2 border-amber-500 pl-2">
              Top Cities
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {cities.map((city) => (
                <li key={city.id}>
                  <Link
                    to={`/search?city=${encodeURIComponent(city.name)}`}
                    onClick={scrollToTop}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Music Classes in {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" onClick={scrollToTop} className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" onClick={scrollToTop} className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-l-2 border-cyan-500 pl-2">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/support" onClick={scrollToTop} className="hover:text-cyan-400 transition-colors">Help & Support</Link></li>
              <li><Link to="/faqs" onClick={scrollToTop} className="hover:text-cyan-400 transition-colors">FAQs for Students</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Legal & Policies
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/terms-conditions" onClick={scrollToTop} className="hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" onClick={scrollToTop} className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} FindMyMusicGurukul Platform. All rights reserved.</p>
          <p className="flex items-center">
            Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 mx-1 fill-rose-500" /> for Music Teachers & Students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default GuruFooter;
