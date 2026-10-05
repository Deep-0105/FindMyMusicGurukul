import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import { useGuru } from '../../context/GuruContext';

const PrivacyPolicyPage = () => {
  const { staticPagesData } = useGuru();
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (staticPagesData && staticPagesData.privacyPolicy) {
      let html = staticPagesData.privacyPolicy.replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'");
      
      let counter = 1;
      html = html.replace(/<h2[^>]*>(.*?)<\/h2>/g, (match, title) => {
        const cleanTitle = title.replace(/<[^>]*>?/gm, '');
        return `
          <div class="flex items-center space-x-4 mt-12 mb-6 group">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              ${counter++}
            </div>
            <h2 class="text-2xl font-black text-slate-800 m-0 p-0">${cleanTitle}</h2>
          </div>
        `;
      });
      
      html = html.replace(/<h1[^>]*>.*?<\/h1>/g, '');
      
      // Apply Tailwind classes to raw HTML tags
      html = html.replace(/<p[^>]*>/ig, '<p class="text-slate-600 leading-relaxed mb-4 text-base">');
      html = html.replace(/<ul[^>]*>/ig, '<ul class="space-y-3 list-none pl-0 mb-8 mt-4">');
      html = html.replace(/<li[^>]*>(.*?)<\/li>/ig, `<li class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
        <span class="text-slate-600">$1</span>
      </li>`);
      html = html.replace(/<h3[^>]*>/ig, '<h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">');
      html = html.replace(/<strong[^>]*>/ig, '<strong class="font-bold text-slate-800">');
      
      setContentHtml(html);
    }
  }, [staticPagesData]);

  const SectionHeading = ({ number, title }) => (
    <div className="flex items-center space-x-4 mt-12 mb-6 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
        {number}
      </div>
      <h2 className="text-2xl font-black text-slate-800">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      
      <main className="flex-grow w-full pt-16">
        {/* Hero Section */}
        <div className="bg-slate-900 relative overflow-hidden pb-32">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-teal-500 to-transparent"></div>
          <div className="absolute -left-40 top-0 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[128px] opacity-20"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-6 mx-auto transform -rotate-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We respect your privacy and are committed to handling your personal information responsibly and securely.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-12 md:p-16">
            
            <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-li:marker:text-emerald-500">
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-10 flex items-start space-x-4">
                <ShieldAlert className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-900 font-medium m-0">
                  Last Updated: October 2026. This Privacy Policy applies to students, tutors, visitors, and other users of our Platform.
                </p>
              </div>

              <div dangerouslySetInnerHTML={{ __html: contentHtml }}></div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mt-6">
                <ul className="list-none space-y-4 pl-0 m-0">
                  <li className="flex flex-col sm:flex-row sm:items-center m-0">
                    <span className="font-bold text-slate-800 w-44 shrink-0">Business Name:</span>
                    <span className="text-slate-600">FindMyMusicGurukul</span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-center m-0">
                    <span className="font-bold text-slate-800 w-44 shrink-0">Privacy Contact Email:</span>
                    <span className="text-emerald-600 font-medium">To be published before launch</span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-start m-0">
                    <span className="font-bold text-slate-800 w-44 shrink-0">Business Address:</span>
                    <span className="text-slate-600 leading-relaxed">To be published where required</span>
                  </li>
                </ul>
              </div>
              <p className="italic text-sm text-slate-400 mt-4 text-center">We will review privacy requests and complaints and respond in accordance with applicable legal requirements.</p>

            </div>
          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default PrivacyPolicyPage;
