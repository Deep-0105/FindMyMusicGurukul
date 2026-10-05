import React, { useEffect, useState } from 'react';
import { Scale, CheckCircle2, ShieldAlert } from 'lucide-react';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import { useGuru } from '../../context/GuruContext';

const TermsConditionsPage = () => {
  const { staticPagesData } = useGuru();
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (staticPagesData && staticPagesData.termsConditions) {
      let html = staticPagesData.termsConditions.replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'");
      
      // Keep only h2 and p and ul/li. If the WYSIWYG puts h1 for the title, we ignore it or replace it.
      // But the best is to replace <h2> with the custom SectionHeading html.
      let counter = 1;
      html = html.replace(/<h2[^>]*>(.*?)<\/h2>/g, (match, title) => {
        // Strip any inner tags from title just in case
        const cleanTitle = title.replace(/<[^>]*>?/gm, '');
        // We use string replacement to inject the exact HTML structure of SectionHeading
        return `
          <div class="flex items-center space-x-4 mt-12 mb-6 group">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              ${counter++}
            </div>
            <h2 class="text-2xl font-black text-slate-800 m-0 p-0">${cleanTitle}</h2>
          </div>
        `;
      });
      
      // Remove any <h1> tags since we have a fixed hero title
      html = html.replace(/<h1[^>]*>.*?<\/h1>/g, '');
      
      // Apply Tailwind classes to raw HTML tags
      html = html.replace(/<p[^>]*>/ig, '<p class="text-slate-600 leading-relaxed mb-4 text-base">');
      html = html.replace(/<ul[^>]*>/ig, '<ul class="space-y-3 list-none pl-0 mb-8 mt-4">');
      html = html.replace(/<li[^>]*>(.*?)<\/li>/ig, `<li class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
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
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-indigo-500 to-transparent"></div>
          <div className="absolute -left-40 top-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[128px] opacity-20"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6 mx-auto transform -rotate-3">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Terms & Conditions
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Please read these terms carefully before using our platform. They outline the rules, regulations, and guidelines for a safe musical journey.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-12 md:p-16">
            
            <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-li:marker:text-indigo-400">
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-10 flex items-start space-x-4">
                <ShieldAlert className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-900 font-medium m-0">
                  Last Updated: October 2026. By continuing to use FindMyMusicGurukul, you acknowledge that you have read, understood, and agreed to the entirety of these terms.
                </p>
              </div>

              <div dangerouslySetInnerHTML={{ __html: contentHtml }}></div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mt-6">
                <ul className="list-none space-y-4 pl-0 m-0">
                  <li className="flex flex-col sm:flex-row sm:items-center m-0">
                    <span className="font-bold text-slate-800 w-32 shrink-0">Business Name:</span>
                    <span className="text-slate-600">FindMyMusicGurukul</span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-center m-0">
                    <span className="font-bold text-slate-800 w-32 shrink-0">Support Email:</span>
                    <span className="text-indigo-600 font-medium">To be published before launch</span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-start m-0">
                    <span className="font-bold text-slate-800 w-32 shrink-0">Business Address:</span>
                    <span className="text-slate-600 leading-relaxed">To be published where required</span>
                  </li>
                </ul>
              </div>
              <p className="italic text-sm text-slate-400 mt-4 text-center">We will update this section when our official support contact details are available.</p>
              
            </div>
          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default TermsConditionsPage;
