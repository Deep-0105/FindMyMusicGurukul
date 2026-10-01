import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGuru } from '../../context/GuruContext';
import { guruService } from '../../services/guruService';
import GuruNavbar from './GuruNavbar';
import { ZipImage } from '../../utils/zipImageUtils';
import GuruFooter from './GuruFooter';
import InquiryModal from './InquiryModal';
import LoaderSpinner from './LoaderSpinner';
import {
  Star,
  MapPin,
  Phone,
  Award,
  Globe,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  Send,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Share2,
  AlertTriangle
} from 'lucide-react';

const GuruProfilePage = () => {
  const { slug } = useParams();
  const { academies, reviews, addReview, currentRole, checkSocialMediaAccess, checkSendInquiryAccess, checkGoogleMapAccess, isGlobalFeatureActive } = useGuru();

  const isEnquiryActive = isGlobalFeatureActive('Send Inquiry');
  const showSendEnquiryButton = isEnquiryActive || currentRole === 'SUPER_ADMIN';

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [liveAcademy, setLiveAcademy] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    let isMounted = true;
    setIsPageLoading(true);
    if (slug) {
      guruService.fetchAcademyBySlug(slug).then((res) => {
        if (isMounted && res) {
          setLiveAcademy(res);
        }
      }).catch(() => {})
        .finally(() => {
          if (isMounted) setIsPageLoading(false);
        });
    } else {
      setIsPageLoading(false);
    }
    return () => { isMounted = false; };
  }, [slug]);

  const fallbackAcademy =
    academies.find((a) => a.slug === slug || a.id === slug) ||
    academies.find((a) => a.status === 'Approved') ||
    academies[0] || {};

  const academy = liveAcademy || fallbackAcademy;

  const hasSocialAccess = checkSocialMediaAccess ? checkSocialMediaAccess(academy) : (academy.hasSocialMedia !== false);
  const hasInquiryAccess = checkSendInquiryAccess ? checkSendInquiryAccess(academy) : true;
  const hasGoogleMapAccess = checkGoogleMapAccess ? checkGoogleMapAccess(academy) : (academy.hasGoogleMap !== false);

  const getSocialLinks = (acad) => {
    if (!acad) return {};
    const links = acad.socialLinks || {};
    return {
      website: acad.socialWebsite || links.website || (typeof acad.website === 'string' ? acad.website : ''),
      instagram: acad.socialInstagram || links.instagram || (typeof acad.instagram === 'string' ? acad.instagram : ''),
      youtube: acad.socialYoutube || links.youtube || (typeof acad.youtube === 'string' ? acad.youtube : ''),
      facebook: acad.socialFacebook || links.facebook || (typeof acad.facebook === 'string' ? acad.facebook : ''),
      linkedin: acad.socialLinkedin || links.linkedin || (typeof acad.linkedin === 'string' ? acad.linkedin : ''),
      whatsapp: acad.whatsapp || links.whatsapp || (typeof acad.whatsappLink === 'string' ? acad.whatsappLink : '')
    };
  };

  const social = getSocialLinks(academy);
  const hasSocialLinks = Boolean(social.website || social.instagram || social.youtube || social.facebook || social.linkedin);

  const teachingModes = Array.isArray(academy?.teachingMode) ? academy.teachingMode : ['Offline', 'Online'];
  const languages = Array.isArray(academy?.languages) ? academy.languages : ['English', 'Hindi'];
  const batchTypes = Array.isArray(academy?.batchType) ? academy.batchType : ['1-on-1 Individual', 'Group Batches'];
  const skillsList = Array.isArray(academy?.skills) ? academy.skills : [];
  const certificates = Array.isArray(academy?.certificates) ? academy.certificates : [];

  const pincodeDisplay = academy.pincode || academy.pinCode || '';
  const locationDisplay =
    (academy.address ? `${academy.address}${pincodeDisplay ? ` - ${pincodeDisplay}` : ''}` : '') ||
    [academy.area, academy.city, pincodeDisplay ? `PIN: ${pincodeDisplay}` : ''].filter(Boolean).join(', ') ||
    academy.location ||
    'Bangalore, India';

  const academyReviews = reviews.filter((r) => r.academyId === academy.id && r.status === 'Approved');

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) {
      alert('Please enter your name and review comment.');
      return;
    }
    addReview({
      academyId: academy.id,
      ...newReview
    });
    setNewReview({ userName: '', rating: 5, comment: '' });
    setIsReviewModalOpen(false);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <GuruNavbar />
        <LoaderSpinner fullPage text="Loading Academy Profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />

      {academy.status !== 'Approved' && (
        <div className={`px-4 py-3 text-xs font-bold flex flex-wrap items-center justify-center space-x-2 text-center shadow-inner z-30 ${
          academy.status === 'Pending'
            ? 'bg-amber-500 text-slate-950 border-b border-amber-600'
            : academy.status === 'Rejected'
            ? 'bg-rose-600 text-white border-b border-rose-700'
            : 'bg-slate-800 text-slate-100 border-b border-slate-700'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            ⚠️ PREVIEW MODE: Profile status is currently <strong>[{academy.status || 'Pending'}]</strong>. This music academy profile is not yet live in public student search results.
          </span>
        </div>
      )}

      <div className="relative h-64 sm:h-80 lg:h-96 bg-slate-900 overflow-hidden">
        <ZipImage
          src={academy.coverImage || 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'}
          alt={academy.academyName || 'Academy'}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <span className="bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-400/30 flex items-center shadow-lg">
            <Star className="w-4 h-4 fill-amber-400 mr-1" />
            {academy.rating || 4.9} ({academy.reviewCount || 0} reviews)
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <ZipImage
                src={academy.profileImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                alt={academy.teacherName || 'Guru'}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white object-cover shadow-2xl shrink-0 -mt-16 sm:-mt-20 bg-slate-200"
              />

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
                    {academy.primarySkill || skillsList[0] || 'Music'} Specialist
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Verified Guru
                  </span>
                </div>

                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{academy.academyName}</h1>
                <p className="text-sm font-semibold text-rose-600">Lead Guru: {academy.teacherName}</p>

                <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start">
                  <MapPin className="w-4 h-4 text-rose-500 mr-1 shrink-0" />
                  <span>{locationDisplay}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-center">
              <div>
                <span className="text-gray-400 font-semibold uppercase tracking-wider block text-[10px]">Experience</span>
                <span className="text-base font-bold text-gray-900">{academy.experienceYears || 0}+ Years</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase tracking-wider block text-[10px]">Teaching Modes</span>
                <span className="text-sm font-bold text-rose-600">{teachingModes.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase tracking-wider block text-[10px]">Languages</span>
                <span className="text-sm font-bold text-gray-800">{languages.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase tracking-wider block text-[10px]">Batch Types</span>
                <span className="text-sm font-bold text-gray-800">{batchTypes.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-rose-600 pl-3">About the Guru & Academy</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{academy.about}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-purple-600 pl-3">Music Classes & Skills Taught</h2>
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((sk) => (
                <span
                  key={sk}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-2 rounded-xl border border-purple-200 transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>{sk}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-amber-500 pl-3">
              Certifications & Qualifications
            </h2>
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert, idx) => (
                  <div key={idx} className="flex items-start space-x-3 bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
                    <Award className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{cert.title}</h4>
                      <p className="text-xs text-amber-800 font-medium">Issued / Awarded in {cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Certified by experience and active concert performances.</p>
            )}
          </div>

          {/* Google Map Location */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-rose-600 pl-3">Google Map Location</h2>
              {hasGoogleMapAccess && (
                <a
                  href={academy.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center"
                >
                  <span>Open Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
            </div>

            <p className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
              <span><strong>Address:</strong> {academy.address || [academy.area, academy.city].filter(Boolean).join(', ')}</span>
              {pincodeDisplay && (
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[11px]">
                  PIN: {pincodeDisplay}
                </span>
              )}
            </p>

            {!hasGoogleMapAccess ? (
              <div className="w-full h-56 bg-slate-100 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Google Map Pin Locked</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Interactive Google Map pin is disabled on {academy.subscriptionPlanName || 'Free Plan'}. Upgrade to <strong>Google Map Location Plan</strong> (₹999/yr) to showcase your exact live map directions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-slate-200 rounded-2xl overflow-hidden relative border border-gray-300 shadow-inner flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1000&q=80"
                  alt="Map Background"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-slate-900/40" />

                <div className="absolute bg-white p-4 rounded-2xl shadow-2xl border border-gray-200 text-center max-w-xs space-y-2">
                  <MapPin className="w-8 h-8 text-rose-600 mx-auto animate-bounce" />
                  <h4 className="font-bold text-gray-900 text-sm">{academy.academyName}</h4>
                  <p className="text-[11px] text-gray-600 line-clamp-2">{locationDisplay}</p>
                  <a
                    href={academy.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow"
                  >
                    View Live Map Pin
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-amber-500 pl-3">Student Reviews & Ratings</h2>
                <p className="text-xs text-gray-500 mt-1">Authentic testimonials from verified students</p>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition-all"
              >
                + Leave a Review
              </button>
            </div>

            <div className="space-y-4">
              {academyReviews.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-4">No reviews submitted yet. Be the first to leave a review!</p>
              ) : (
                academyReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{rev.userName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">"{rev.comment}"</p>
                    <span className="text-[10px] text-gray-400 block">{rev.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-6 sticky top-24">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl text-center space-y-1 shadow-md">
              <span className="text-xs uppercase tracking-widest text-emerald-200 font-semibold block">Informational Pricing</span>
              <span className="text-2xl font-black">{academy.pricingInfo}</span>
              <p className="text-[11px] text-emerald-100">No payment required now. Send inquiry to discuss fees directly.</p>
            </div>

            {showSendEnquiryButton && (
              hasInquiryAccess ? (
                <button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="w-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-700 hover:from-rose-700 hover:to-indigo-800 text-white font-extrabold text-base py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  <Send className="w-5 h-5" />
                  <span>Send Inquiry to Guru</span>
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center space-y-2 shadow-sm">
                  <div className="flex items-center justify-center space-x-1.5 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Send Inquiry Disabled (Free / Basic Plan)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Direct student inquiries are not enabled on this academy's <strong>{academy.subscriptionPlanName || 'Free Plan'}</strong>. Upgrade to <strong>Send Inquiry Plan</strong> to receive direct student leads.
                  </p>
                </div>
              )
            )}

            {hasSocialAccess ? (
              (hasSocialLinks || social.whatsapp) && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Social Media & Online Profiles</span>
                  </h4>
                  {social.whatsapp && (
                    <a
                      href={social.whatsapp.startsWith('http') ? social.whatsapp : `https://wa.me/${social.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 bg-emerald-50 hover:bg-emerald-100 p-3 rounded-xl border border-emerald-200 text-emerald-900 transition-colors shadow-sm mb-2"
                    >
                      <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block">WhatsApp Chat</span>
                        <span className="font-bold text-xs">Message {academy.teacherName}</span>
                      </div>
                    </a>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {social.instagram && (
                      <a
                        href={social.instagram.startsWith('http') ? social.instagram : `https://${social.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <Instagram className="w-4 h-4 mr-1.5 shrink-0" />
                        <span>Instagram</span>
                      </a>
                    )}

                    {social.youtube && (
                      <a
                        href={social.youtube.startsWith('http') ? social.youtube : `https://${social.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <Youtube className="w-4 h-4 mr-1.5 shrink-0" />
                        <span>YouTube</span>
                      </a>
                    )}

                    {social.facebook && (
                      <a
                        href={social.facebook.startsWith('http') ? social.facebook : `https://${social.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <Facebook className="w-4 h-4 mr-1.5 shrink-0" />
                        <span>Facebook</span>
                      </a>
                    )}

                    {social.website && (
                      <a
                        href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <Globe className="w-4 h-4 mr-1.5 shrink-0" />
                        <span>Website</span>
                      </a>
                    )}

                    {social.linkedin && (
                      <a
                        href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <Linkedin className="w-4 h-4 mr-1.5 shrink-0" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="pt-4 border-t border-gray-100">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1.5">
                  <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-bold text-xs">
                    <Share2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Social Media Links Locked</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Social links & WhatsApp chat are locked on <strong>{academy.subscriptionPlanName || 'Free Plan'}</strong>. Upgrade to <strong>Social Media Plan</strong> or <strong>Social Media & Google Map Plan</strong> to unlock.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        academy={academy}
      />

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Leave a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={newReview.userName}
                  onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                >
                  <option value={5}>5 ★★★★★ (Excellent)</option>
                  <option value={4}>4 ★★★★☆ (Very Good)</option>
                  <option value={3}>3 ★★★☆☆ (Good)</option>
                  <option value={2}>2 ★★☆☆☆ (Average)</option>
                  <option value={1}>1 ★☆☆☆☆ (Poor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Review Comment</label>
                <textarea
                  rows={3}
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Submit Review
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

export default GuruProfilePage;
