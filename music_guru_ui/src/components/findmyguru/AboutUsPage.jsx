import React, { useEffect, useState } from 'react';
import { Music, Star, Users, MapPin, Sparkles, BookOpen, Heart, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import { useGuru } from '../../context/GuruContext';

const AboutUsPage = () => {
  const { staticPagesData } = useGuru();
  const [contentMap, setContentMap] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (staticPagesData && staticPagesData.aboutUs) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(staticPagesData.aboutUs, 'text/html');
      
      const clean = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/&nbsp;/g, ' ');
      };

      // Filter out empty tags (like <p></p> or <p><br></p>) that WYSIWYG editors often inject
      const pTags = Array.from(doc.querySelectorAll('p')).filter(p => clean(p.innerHTML).trim().replace(/<br\s*\/?>/g, '') !== '');
      const h2Tags = Array.from(doc.querySelectorAll('h2')).filter(h => clean(h.innerHTML).trim() !== '');
      const h3Tags = Array.from(doc.querySelectorAll('h3')).filter(h => clean(h.innerHTML).trim() !== '');
      const liTags = Array.from(doc.querySelectorAll('li')); // lists usually don't have empty items
      
      setContentMap({
        introP: clean(pTags[0]?.innerHTML) || 'At <strong>FindMyMusicGurukul</strong>, we believe that music is more than just a skill — it is a passion, an expression, and a journey of lifelong learning.',
        empowerH2: clean(h2Tags[0]?.innerHTML) || 'Empowering Aspiring Musicians',
        empowerP: clean(pTags[1]?.innerHTML) || 'Our mission is to make music education accessible to everyone...',
        missionH3: clean(h3Tags[0]?.innerHTML) || 'Our Mission',
        missionP: clean(pTags[2]?.innerHTML) || 'To simplify the process of finding the right music teacher...',
        visionH3: clean(h3Tags[1]?.innerHTML) || 'Our Vision',
        visionP: clean(pTags[3]?.innerHTML) || 'We envision a world where anyone with a passion for music...',
        offerTitle: clean(h3Tags[2]?.innerHTML) || 'What We Offer',
        offer1Text: clean(liTags[0]?.innerHTML) || 'Explore teachers based on your preferred instrument...',
        offer2Text: clean(liTags[1]?.innerHTML) || 'Discover tutors who align perfectly...',
        offer3Text: clean(liTags[2]?.innerHTML) || 'Find exciting opportunities for both online and offline...',
        offer4Text: clean(liTags[3]?.innerHTML) || 'Explore extensive vocal training...',
        offer5Text: clean(liTags[4]?.innerHTML) || 'We don\'t just help students! We help music teachers...',
        whyChooseH2: clean(h2Tags[1]?.innerHTML) || 'Why Choose FindMyMusicGurukul?',
        whyChooseP: clean(pTags[4]?.innerHTML) || 'We focus on making the music-learning experience simple...',
        beginH3: clean(h3Tags[3]?.innerHTML) || 'Begin Your Musical Journey Today!',
        beginP1: clean(pTags[5]?.innerHTML) || 'Every great musician starts somewhere...',
        beginP2: clean(pTags[6]?.innerHTML) || '<strong>"Find your rhythm. Learn with passion. Grow with music."</strong>'
      });
    }
  }, [staticPagesData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      
      <main className="flex-grow w-full pt-16">
        {/* Hero Section */}
        <div className="bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500 via-rose-500 to-transparent"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20 mb-6 transform -rotate-6">
              <Music className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Discover Your Musical Journey
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.introP || 'At <strong className="text-white">FindMyMusicGurukul</strong>, we believe that music is more than just a skill — it is a passion, an expression, and a journey of lifelong learning.' }}></p>
          </div>
        </div>

        {/* Introduction */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4" dangerouslySetInnerHTML={{ __html: contentMap.empowerH2 || 'Empowering Aspiring Musicians' }}></h2>
            <p className="text-base text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.empowerP || 'Our mission is to make music education accessible to everyone by connecting aspiring learners with experienced music teachers who inspire, guide, and nurture their talent. Whether you are a beginner taking your first steps or an experienced learner looking to refine your skills, we help you discover the right tutor to match your goals.' }}></p>
          </div>
        </div>

        {/* Mission & Vision Grid */}
        <div className="bg-white border-y border-slate-100 py-12 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 lg:p-10 rounded-3xl border border-indigo-100 relative group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Heart className="w-10 h-10 text-indigo-600 mb-4 relative z-10" />
                <h3 className="text-2xl font-black text-indigo-950 mb-3 relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.missionH3 || 'Our Mission' }}></h3>
                <p className="text-indigo-900/80 leading-relaxed text-sm sm:text-base relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.missionP || 'To simplify the process of finding the right music teacher and create opportunities for students and tutors to connect, learn, and grow together. We aim to make quality music education more accessible through a convenient, reliable, and user-friendly platform.' }}></p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 lg:p-10 rounded-3xl border border-emerald-100 relative group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Sparkles className="w-10 h-10 text-emerald-600 mb-4 relative z-10" />
                <h3 className="text-2xl font-black text-emerald-950 mb-3 relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.visionH3 || 'Our Vision' }}></h3>
                <p className="text-emerald-900/80 leading-relaxed text-sm sm:text-base relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.visionP || 'We envision a world where anyone with a passion for music can find the right guidance to develop their talent. By bringing students and educators together, we aspire to build a vibrant community that celebrates creativity and musical excellence.' }}></p>
              </div>
            </div>
          </div>
        </div>

        {/* What We Offer (Cards) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-3" dangerouslySetInnerHTML={{ __html: contentMap.offerTitle || 'What We Offer' }}></h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 hover:border-rose-200">
              <Users className="w-10 h-10 text-rose-500 mb-4 p-2 bg-rose-50 rounded-xl" />
              <h4 className="text-lg font-bold text-slate-800 mb-2">Find Music Tutors</h4>
              <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.offer1Text?.replace(/<strong[^>]*>.*?<\/strong>/i, '') || 'Explore teachers based on your preferred instrument, music style, location, and unique learning requirements.' }}></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 hover:border-amber-200">
              <Star className="w-10 h-10 text-amber-500 mb-4 p-2 bg-amber-50 rounded-xl" />
              <h4 className="text-lg font-bold text-slate-800 mb-2">Personalized Learning</h4>
              <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.offer2Text?.replace(/<strong[^>]*>.*?<\/strong>/i, '') || 'Discover tutors who align perfectly with your current skill level, interests, and ambitious musical goals.' }}></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 hover:border-indigo-200">
              <MapPin className="w-10 h-10 text-indigo-500 mb-4 p-2 bg-indigo-50 rounded-xl" />
              <h4 className="text-lg font-bold text-slate-800 mb-2">Flexible Options</h4>
              <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.offer3Text?.replace(/<strong[^>]*>.*?<\/strong>/i, '') || 'Find exciting opportunities for both online and offline music classes, seamlessly matching your schedule.' }}></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 hover:border-emerald-200">
              <BookOpen className="w-10 h-10 text-emerald-500 mb-4 p-2 bg-emerald-50 rounded-xl" />
              <h4 className="text-lg font-bold text-slate-800 mb-2">Diverse Categories</h4>
              <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.offer4Text?.replace(/<strong[^>]*>.*?<\/strong>/i, '') || 'Explore extensive vocal training, traditional classical music, diverse instrumental lessons, and other disciplines.' }}></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 hover:border-purple-200 lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="shrink-0">
                <GraduationCap className="w-12 h-12 text-purple-500 p-2.5 bg-purple-50 rounded-xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Unprecedented Opportunities for Tutors</h4>
                <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.offer5Text?.replace(/<strong[^>]*>.*?<\/strong>/i, '') || 'We don\'t just help students! We help music teachers elegantly showcase their expertise, connect directly with eager students, and exponentially expand their teaching reach across the country.' }}></p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us & CTA */}
        <div className="bg-slate-900 py-16 relative overflow-hidden">
          <div className="absolute -left-20 top-0 w-[300px] h-[300px] bg-rose-500 rounded-full blur-[100px] opacity-10"></div>
          <div className="absolute right-0 bottom-0 w-[300px] h-[300px] bg-amber-500 rounded-full blur-[100px] opacity-10"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4" dangerouslySetInnerHTML={{ __html: contentMap.whyChooseH2 || 'Why Choose FindMyMusicGurukul?' }}></h2>
            <p className="text-base text-slate-300 leading-relaxed mb-12 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: contentMap.whyChooseP || 'We focus on making the music-learning experience simple, convenient, and highly accessible. Our platform is meticulously designed to help learners explore suitable tutors, make informed choices, and smoothly take the next step in their musical journey.' }}></p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-10 text-center max-w-3xl mx-auto shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400 rounded-full blur-[80px] opacity-20"></div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-4 relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.beginH3 || 'Begin Your Musical Journey Today!' }}></h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-xl mx-auto relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.beginP1 || 'Every great musician starts somewhere. Whether you want to learn a new instrument, improve your singing, or share your musical knowledge with others, we are here to help.' }}></p>
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 font-bold text-lg md:text-xl mb-8 font-serif italic relative z-10" dangerouslySetInnerHTML={{ __html: contentMap.beginP2 || '"Find your rhythm. Learn with passion. Grow with music."' }}></div>
              <Link to="/search" className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-base px-8 py-3.5 rounded-full shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all hover:-translate-y-1 relative z-10">
                <span>Find Your Guru Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default AboutUsPage;
