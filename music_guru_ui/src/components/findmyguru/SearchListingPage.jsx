import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import { getSkillIcon } from '../../utils/skillIcons';
import GuruNavbar from './GuruNavbar';
import { ZipImage } from '../../utils/zipImageUtils';
import GuruFooter from './GuruFooter';
import InquiryModal from './InquiryModal';
import LoaderSpinner from './LoaderSpinner';
import {
  Star,
  Filter,
  SlidersHorizontal,
  X,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Music
} from 'lucide-react';

const SearchListingPage = () => {
  const { academies, cities, skills, searchFilters, setSearchFilters, features, currentRole } = useGuru();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  const sendEnquiryFeature = (features || []).find(
    (f) => (f.name || '').toLowerCase().trim() === 'send enquiry' || f.id === 'feat-1'
  );
  const isEnquiryActive = sendEnquiryFeature
    ? (sendEnquiryFeature.is_active !== false && sendEnquiryFeature.isActive !== false)
    : true;
  const showSendEnquiryButton = isEnquiryActive || currentRole === 'SUPER_ADMIN';

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedAcademyForInquiry, setSelectedAcademyForInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchParams, params.city]);

  useEffect(() => {
    const hasParams = searchParams.toString().length > 0 || !!params.city;
    if (!hasParams) return;

    const urlSkill = searchParams.get('skill');
    const urlCity = searchParams.get('city') || params.city;
    const urlArea = searchParams.get('area');
    const urlQuery = searchParams.get('query') || searchParams.get('q');
    const urlMode = searchParams.get('teachingMode') || searchParams.get('mode');

    let changed = false;
    const nextFilters = { ...searchFilters };

    if (searchParams.has('skill')) {
      const targetSkill = urlSkill || '';
      if (nextFilters.skill !== targetSkill) {
        nextFilters.skill = targetSkill;
        changed = true;
      }
    }

    if (searchParams.has('city') || params.city) {
      const cityVal = urlCity || 'All';
      const matchCity = cities.find((c) => c.name.toLowerCase() === cityVal.toLowerCase());
      const normalizedCity = matchCity ? matchCity.name : cityVal;
      if (nextFilters.city !== normalizedCity) {
        nextFilters.city = normalizedCity;
        nextFilters.area = '';
        changed = true;
      }
      if (!searchParams.has('skill') && nextFilters.skill) {
        nextFilters.skill = '';
        changed = true;
      }
    }

    if (searchParams.has('area')) {
      const targetArea = urlArea || '';
      if (nextFilters.area !== targetArea) {
        nextFilters.area = targetArea;
        changed = true;
      }
    }

    if (searchParams.has('query') || searchParams.has('q')) {
      const targetQ = urlQuery || '';
      if (nextFilters.query !== targetQ) {
        nextFilters.query = targetQ;
        changed = true;
      }
    }

    if (searchParams.has('teachingMode') || searchParams.has('mode')) {
      const targetMode = urlMode || '';
      if (nextFilters.teachingMode !== targetMode) {
        nextFilters.teachingMode = targetMode;
        changed = true;
      }
    }

    if (changed) {
      setSearchFilters(nextFilters);
    }
  }, [searchParams, params, cities, setSearchFilters]);

  useEffect(() => {
    if (searchFilters.query && searchFilters.query.trim() !== '') {
      const q = searchFilters.query.toLowerCase().trim();

      // Check area match first
      let matchedArea = null;
      let matchedCityName = null;

      cities.forEach((c) => {
        if (Array.isArray(c.areas)) {
          const a = c.areas.find((ar) => ar.toLowerCase() === q);
          if (a) {
            matchedArea = a;
            matchedCityName = c.name;
          }
        }
      });

      if (!matchedArea) {
        const acadArea = academies.find((a) => a.area && a.area.toLowerCase() === q);
        if (acadArea) {
          matchedArea = acadArea.area;
          matchedCityName = acadArea.city;
        }
      }

      if (matchedArea) {
        setSearchFilters((prev) => ({
          ...prev,
          city: matchedCityName || prev.city,
          area: matchedArea,
          query: ''
        }));
        return;
      }

      // Check city match
      const matchCity = cities.find((c) => c.name.toLowerCase() === q);
      if (matchCity && searchFilters.city !== matchCity.name) {
        setSearchFilters((prev) => ({
          ...prev,
          city: matchCity.name,
          area: '',
          query: ''
        }));
      }
    }
  }, [searchFilters.query, cities, academies, setSearchFilters]);

  const activeCityObj = (Array.isArray(cities) && cities.length > 0)
    ? (cities.find((c) => c.name === searchFilters.city) || cities[0])
    : null;

  const availableAreas = (activeCityObj && Array.isArray(activeCityObj.areas))
    ? activeCityObj.areas
    : [];

  const filteredAcademies = academies.filter((acad) => {
    if (acad.status !== 'Approved') return false;

    if (searchFilters.query && searchFilters.query.trim() !== '') {
      const q = searchFilters.query.toLowerCase().trim();
      const matchName = acad.academyName.toLowerCase().includes(q);
      const matchTeacher = acad.teacherName.toLowerCase().includes(q);
      const matchCity = acad.city.toLowerCase().includes(q);
      const matchArea = acad.area.toLowerCase().includes(q);
      const matchSkill = acad.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchTeacher && !matchCity && !matchArea && !matchSkill) {
        return false;
      }
    }

    if (
      searchFilters.city &&
      searchFilters.city !== 'All' &&
      searchFilters.city !== 'All Cities' &&
      searchFilters.city.toLowerCase() !== 'all' &&
      acad.city.toLowerCase() !== searchFilters.city.toLowerCase()
    ) {
      // Only filter by city if query didn't explicitly match a different city
      if (!searchFilters.query || !acad.city.toLowerCase().includes(searchFilters.query.toLowerCase())) {
        return false;
      }
    }

    if (searchFilters.area && acad.area.toLowerCase() !== searchFilters.area.toLowerCase()) {
      return false;
    }

    if (searchFilters.skill) {
      const matchSkill = acad.skills.some(
        (s) => s.toLowerCase() === searchFilters.skill.toLowerCase()
      );
      if (!matchSkill) return false;
    }

    if (searchFilters.teachingMode) {
      const matchMode = acad.teachingMode.some(
        (m) => m.toLowerCase().includes(searchFilters.teachingMode.toLowerCase())
      );
      if (!matchMode) return false;
    }

    if (searchFilters.rating > 0 && acad.rating < searchFilters.rating) {
      return false;
    }

    return true;
  });

  const sortedAcademies = [...filteredAcademies].sort((a, b) => {
    if (searchFilters.sortBy === 'rating') return b.rating - a.rating;
    if (searchFilters.sortBy === 'experience') return b.experienceYears - a.experienceYears;

    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.rating - a.rating;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      {isLoading && <LoaderSpinner fullPage text="Finding Verified Music Gurus..." />}

      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-rose-950 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Music Classes Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Music Classes in {searchFilters.city}
              {searchFilters.area ? ` (${searchFilters.area})` : ''}
              {searchFilters.skill ? ` for ${searchFilters.skill}` : ''}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Showing {sortedAcademies.length} verified music academies and tutors
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort By:</span>
            <select
              value={searchFilters.sortBy}
              onChange={(e) => setSearchFilters({ ...searchFilters, sortBy: e.target.value })}
              className="bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="featured">Featured & Top Rated</option>
              <option value="rating">Highest Rated (★ 5.0)</option>
              <option value="experience">Most Experienced</option>
            </select>

            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-rose-600" />
                Filter Results
              </h3>
              <button
                onClick={() => {
                  setSearchFilters({
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
                  setSearchParams({});
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City
              </label>
              <select
                value={searchFilters.city}
                onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value, area: '', query: '' })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="All">All Cities (All)</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Area / Locality
              </label>
              <select
                value={searchFilters.area}
                onChange={(e) => setSearchFilters({ ...searchFilters, area: e.target.value, query: '' })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Areas {searchFilters.city && searchFilters.city !== 'All' ? `in ${searchFilters.city}` : ''}</option>
                {availableAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Music Instrument / Skill
              </label>
              <select
                value={searchFilters.skill}
                onChange={(e) => setSearchFilters({ ...searchFilters, skill: e.target.value, query: '' })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Music Skills</option>
                {skills.map((sk) => (
                  <option key={sk.id} value={sk.name}>
                    {getSkillIcon(sk)} {sk.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Teaching Mode
              </label>
              <div className="space-y-1.5 text-xs text-gray-700">
                {['', 'Offline', 'Online', 'Home Tuition'].map((mode) => (
                  <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teachingMode"
                      checked={searchFilters.teachingMode === mode}
                      onChange={() => setSearchFilters({ ...searchFilters, teachingMode: mode, query: '' })}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{mode === '' ? 'Any Mode' : mode}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="md:col-span-8 lg:col-span-9 space-y-6">
          {sortedAcademies.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Music Academies Found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {searchFilters.query
                  ? `No academies matched "${searchFilters.query}". Try selecting a city/skill from the filters or reset filters.`
                  : 'No music schools matched your search criteria.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearchFilters({
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
                    setSearchParams({});
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            sortedAcademies.map((acad) => (
              <div
                key={acad.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-xl flex flex-col lg:flex-row ${
                  acad.featured ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
                }`}
              >
                <div className="lg:w-72 relative bg-slate-900 shrink-0 h-56 lg:h-auto overflow-hidden">
                  <ZipImage
                    src={acad.flyerImage || acad.coverImage}
                    alt={acad.academyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {acad.featured && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      FEATURED
                    </span>
                  )}

                  <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold px-2 py-0.5 rounded flex items-center">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    {acad.rating} ({acad.reviewCount})
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                          {acad.primarySkill} Academy
                        </span>
                        <h2
                          onClick={() => navigate(`/academy/${acad.slug}`)}
                          className="text-xl font-bold text-gray-900 hover:text-rose-600 cursor-pointer transition-colors"
                        >
                          {acad.academyName}
                        </h2>
                        <p className="text-xs text-gray-600 font-medium">
                          Tutor / Guru: <span className="text-gray-900 font-semibold">{acad.teacherName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Pricing</span>
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {acad.pricingInfo}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 py-3 border-y border-gray-100 text-xs text-gray-600">
                      <div>
                        <span className="block text-gray-400 font-medium">Experience</span>
                        <span className="font-bold text-gray-800">{acad.experienceYears}+ Years</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Duration</span>
                        <span className="font-bold text-gray-800">{acad.courseDuration}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Class Mode</span>
                        <span className="font-bold text-rose-700">{Array.isArray(acad.teachingMode) ? acad.teachingMode.join(', ') : 'Offline, Online'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Location</span>
                        <span className="font-bold text-gray-800 truncate">
                          {acad.address || [acad.area, acad.city].filter(Boolean).join(', ') || 'Bangalore, India'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 font-semibold mr-1">Skills Taught:</span>
                      {(Array.isArray(acad.skills) ? acad.skills : []).map((sk) => (
                        <span
                          key={sk}
                          className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {acad.about}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-emerald-700 font-medium flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      Verified Profile & Direct Phone Access
                    </span>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => navigate(`/academy/${acad.slug}`)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all text-center"
                      >
                        View Profile
                      </button>

                      {showSendEnquiryButton && (
                        <button
                          onClick={() => setSelectedAcademyForInquiry(acad)}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Send Inquiry</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-base">Filter Music Academies</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City
              </label>
              <select
                value={searchFilters.city}
                onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value, area: '' })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
              >
                <option value="All">All Cities (All)</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl shadow-md text-sm"
            >
              Apply Filters ({sortedAcademies.length} Results)
            </button>
          </div>
        </div>
      )}

      <InquiryModal
        isOpen={!!selectedAcademyForInquiry}
        onClose={() => setSelectedAcademyForInquiry(null)}
        academy={selectedAcademyForInquiry}
      />

      <GuruFooter />
    </div>
  );
};

export default SearchListingPage;
