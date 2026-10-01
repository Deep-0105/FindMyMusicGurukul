import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import { getSkillIcon } from '../../utils/skillIcons';
import GuruNavbar from './GuruNavbar';
import { ZipImage } from '../../utils/zipImageUtils';
import GuruFooter from './GuruFooter';
import InquiryModal from './InquiryModal';
import MinimalRegistrationModal from './MinimalRegistrationModal';
import {
  Search,
  MapPin,
  Music,
  Star,
  Sparkles,
  ArrowRight,
  Building2,
  PhoneCall
} from 'lucide-react';

const GuruHomePage = () => {
  const { cities, skills, academies, homeStats, setSearchFilters, currentRole, isGlobalFeatureActive } = useGuru();
  const navigate = useNavigate();

  const isEnquiryActive = isGlobalFeatureActive('Send Inquiry');
  const showSendEnquiryButton = isEnquiryActive || currentRole === 'SUPER_ADMIN';

  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchRef = useRef(null);

  const [selectedAcademyForInquiry, setSelectedAcademyForInquiry] = useState(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  const activeCityObj = cities.find((c) => c.name === selectedCity) || cities[0];

  // Close auto-suggestions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute search suggestions
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchingSkills = skills
      .filter((s) => s.name.toLowerCase().includes(q))
      .map((s) => ({ type: 'Skill / Subject', text: s.name, icon: getSkillIcon(s) }));

    const matchingCities = cities
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((c) => ({ type: 'City', text: c.name, icon: '📍' }));

    const matchingAreas = [];
    cities.forEach((c) => {
      if (Array.isArray(c.areas)) {
        c.areas.forEach((aName) => {
          if (aName.toLowerCase().includes(q) && !matchingAreas.some((ma) => ma.text === aName)) {
            matchingAreas.push({ type: 'Area / Locality', text: aName, cityName: c.name, icon: '📍' });
          }
        });
      }
    });

    const matchingAcademies = academies
      .filter((a) => a.status === 'Approved' && (a.academyName.toLowerCase().includes(q) || a.teacherName.toLowerCase().includes(q)))
      .map((a) => ({ type: 'Tutor / Academy', text: `${a.academyName} (${a.teacherName})`, icon: '🏫', slug: a.slug }));

    return [...matchingSkills, ...matchingCities, ...matchingAreas, ...matchingAcademies].slice(0, 7);
  };

  const suggestions = getSuggestions();

  const handleCityChange = (e) => {
    const cName = e.target.value;
    setSelectedCity(cName);
    setSelectedArea('');
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    const trimmed = (searchQuery || '').trim();
    let targetCity = selectedCity;
    let targetArea = selectedArea;
    let targetSkill = selectedSkill;
    let finalQuery = trimmed;

    if (trimmed) {
      const lower = trimmed.toLowerCase();
      const words = lower.split(/\s+/);

      // Check if query matches an area/locality
      let areaFound = null;
      let cityForArea = null;

      for (const c of cities) {
        if (Array.isArray(c.areas)) {
          const matchingArea = c.areas.find((aName) => aName.toLowerCase() === lower || words.includes(aName.toLowerCase()));
          if (matchingArea) {
            areaFound = matchingArea;
            cityForArea = c.name;
            break;
          }
        }
      }

      if (!areaFound) {
        const acadWithArea = academies.find((a) => a.area && (a.area.toLowerCase() === lower || words.includes(a.area.toLowerCase())));
        if (acadWithArea) {
          areaFound = acadWithArea.area;
          cityForArea = acadWithArea.city;
        }
      }

      if (areaFound) {
        targetCity = cityForArea || targetCity;
        targetArea = areaFound;
        if (lower === areaFound.toLowerCase()) {
          finalQuery = '';
        } else {
          finalQuery = words.filter((w) => w !== areaFound.toLowerCase()).join(' ');
        }
      } else {
        // Check if user typed a city name in search box (e.g. "pune", "mumbai", "delhi", "bangalore")
        const matchedCity = cities.find(
          (c) => c.name.toLowerCase() === lower || words.includes(c.name.toLowerCase())
        );

        if (matchedCity) {
          targetCity = matchedCity.name;
          targetArea = '';
          if (lower === matchedCity.name.toLowerCase()) {
            finalQuery = '';
          } else {
            finalQuery = words.filter((w) => w !== matchedCity.name.toLowerCase()).join(' ');
          }
        }
      }

      // Check if user typed a skill name (e.g. "guitar", "vocal", "piano")
      const matchedSkill = skills.find(
        (s) => s.name.toLowerCase() === lower || (finalQuery && finalQuery.toLowerCase() === s.name.toLowerCase())
      );

      if (matchedSkill) {
        targetSkill = matchedSkill.name;
        if (lower === matchedSkill.name.toLowerCase() || (finalQuery && finalQuery.toLowerCase() === matchedSkill.name.toLowerCase())) {
          finalQuery = '';
        }
      }
    }

    setSearchFilters({
      query: finalQuery,
      city: targetCity,
      area: targetArea,
      skill: targetSkill,
      teachingMode: '',
      batchType: '',
      language: '',
      rating: 0,
      priceMax: 10000,
      sortBy: 'featured'
    });
    setIsSuggestionsOpen(false);
    navigate('/search');
  };

  const handleSuggestionClick = (item) => {
    if (item.type === 'Tutor / Academy' && item.slug) {
      navigate(`/academy/${item.slug}`);
      return;
    }

    if (item.type === 'Skill / Subject') {
      setSelectedSkill(item.text);
      setSearchQuery('');
      setSearchFilters((prev) => ({ ...prev, query: '', skill: item.text, city: selectedCity, area: selectedArea }));
    } else if (item.type === 'City') {
      setSelectedCity(item.text);
      setSelectedArea('');
      setSearchQuery('');
      setSearchFilters((prev) => ({ ...prev, query: '', city: item.text, area: '' }));
    } else if (item.type === 'Area / Locality') {
      setSelectedCity(item.cityName || selectedCity);
      setSelectedArea(item.text);
      setSearchQuery('');
      setSearchFilters((prev) => ({ ...prev, query: '', city: item.cityName || prev.city, area: item.text }));
    } else {
      setSearchQuery(item.text);
      setSearchFilters((prev) => ({ ...prev, query: item.text, city: selectedCity, area: selectedArea }));
    }

    setIsSuggestionsOpen(false);
    navigate('/search');
  };

  const handleShortcutClick = (skillName) => {
    setSelectedSkill(skillName);
    setSearchFilters((prev) => ({
      ...prev,
      query: '',
      city: selectedCity,
      skill: skillName
    }));
    navigate('/search');
  };

  const approvedAcademies = academies.filter((a) => a.status === 'Approved');

  const certifiedGurusCount = homeStats?.certifiedGurusCount || approvedAcademies.length || 0;
  const instrumentsCount = homeStats?.instrumentsCount || skills.length || 0;
  const avgRating = homeStats?.avgRating || 4.9;

  const cityNamesList = cities.map((c) => c.name).join(', ') || 'Pune, Mumbai, Delhi, Bangalore';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-rose-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Discover Top Certified Music Tutors & Academies</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white max-w-4xl mx-auto drop-shadow-md">
            Find the Right <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-300 bg-clip-text text-transparent">Music Guru</span> Near You
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Search top-rated music schools, classical gurus & private tutors for {skills.slice(0, 6).map((s) => s.name).join(', ')} & more.
          </p>

          {/* Search Bar with Auto-Complete Suggestions */}
          <div className="mt-10 max-w-3xl mx-auto relative" ref={searchRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 pl-4 sm:pl-6 rounded-2xl shadow-2xl flex items-center justify-between text-gray-800 border border-white/20 backdrop-blur-md transition-all focus-within:ring-4 focus-within:ring-rose-500/30"
            >
              <div className="flex-1 flex items-center space-x-3 pr-2">
                <Search className="w-5 h-5 text-rose-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  placeholder="Search tutors by subject, skill, city, or academy..."
                  className="w-full bg-transparent text-gray-900 text-sm sm:text-base font-semibold placeholder-gray-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center space-x-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Live Auto-Suggestions Dropdown */}
            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left z-50">
                <div className="p-2 border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4">
                  Search Suggestions
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left px-5 py-3 hover:bg-rose-50 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">{item.text}</span>
                    </div>
                    <span className="text-[11px] font-medium text-rose-600 bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Skill Shortcuts */}
          <div className="mt-8 max-w-4xl mx-auto text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block mb-3">
              Popular Skills
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {skills.slice(0, 11).map((sk) => (
                <button
                  key={sk.id}
                  onClick={() => handleShortcutClick(sk.name)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/10 hover:border-rose-400 transition-all flex items-center space-x-1.5 backdrop-blur-sm shadow-sm"
                >
                  <span>{getSkillIcon(sk)}</span>
                  <span>{sk.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Trust Stats Ribbon */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-2">
            <span className="text-3xl font-black text-rose-600 block">{certifiedGurusCount}+</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Certified Gurus</span>
          </div>
          <div className="p-2">
            <span className="text-3xl font-black text-purple-600 block">{instrumentsCount}+</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Music Instruments</span>
          </div>
          <div className="p-2">
            <span className="text-3xl font-black text-emerald-600 block">{avgRating} ★</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Average Tutor Rating</span>
          </div>
        </div>
      </section>

      {/* Featured Music Academies */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              Verified Tutors
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Top Featured Music Academies</h2>
            <p className="text-gray-600 text-sm mt-1">Explore top rated music teachers in {cityNamesList}.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 md:mt-0 inline-flex items-center text-rose-600 hover:text-rose-700 font-semibold text-sm group"
          >
            <span>View All Academies</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {approvedAcademies.slice(0, 3).map((acad) => (
            <div
              key={acad.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-800">
                <ZipImage
                  src={acad.coverImage}
                  alt={acad.academyName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center">
                  <Star className="w-3 h-3 fill-slate-950 mr-1" />
                  {acad.rating} ({acad.reviewCount || 10} reviews)
                </span>
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
                  {acad.city} • {acad.area}
                </span>

                <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-3">
                  <ZipImage
                    src={acad.profileImage}
                    alt={acad.teacherName}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-lg shrink-0"
                  />
                  <div className="text-white">
                    <h3 className="font-bold text-base line-clamp-1 leading-tight">{acad.academyName}</h3>
                    <p className="text-xs text-rose-300 font-medium">Guru: {acad.teacherName}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {acad.skills?.map((sk) => (
                      <span key={sk} className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-rose-100">
                        {sk}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {acad.about}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block font-semibold text-gray-900">Experience:</span>
                    <span>{acad.experienceYears}+ Years Teaching</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-900">Mode:</span>
                    <span>{Array.isArray(acad.teachingMode) ? acad.teachingMode.join(', ') : 'Offline, Online'}</span>
                  </div>
                </div>

                <div className={`pt-2 grid ${showSendEnquiryButton ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <button
                    onClick={() => navigate(`/academy/${acad.slug}`)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs py-2.5 rounded-xl transition-all text-center"
                  >
                    View Profile
                  </button>
                  {showSendEnquiryButton && (
                    <button
                      onClick={() => setSelectedAcademyForInquiry(acad)}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2.5 rounded-xl transition-all text-center shadow-sm flex items-center justify-center space-x-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Send Inquiry</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Academy Listing CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              For Music Tutors & School Owners
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Are You a Music Guru or Running an Academy?
            </h2>
            <p className="text-rose-100 text-base leading-relaxed">
              List your classes in 5 minutes with our minimal setup. Start receiving high-intent student leads in {cityNamesList} today.
            </p>
          </div>

          <div className="mt-8 md:mt-0 shrink-0">
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-base px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center space-x-2"
            >
              <Building2 className="w-5 h-5 text-rose-600" />
              <span>List Your Music Academy Now</span>
            </button>
          </div>
        </div>
      </section>

      <InquiryModal
        isOpen={!!selectedAcademyForInquiry}
        onClose={() => setSelectedAcademyForInquiry(null)}
        academy={selectedAcademyForInquiry}
      />

      <MinimalRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />

      <GuruFooter />
    </div>
  );
};

export default GuruHomePage;
