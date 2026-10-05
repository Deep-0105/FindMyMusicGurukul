import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import { useGuru } from '../../context/GuruContext';

const ContactUsPage = () => {
  const [isHuman, setIsHuman] = useState(false);
  const { staticPagesData } = useGuru();
  const [contentMap, setContentMap] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (staticPagesData && staticPagesData.contactUs) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(staticPagesData.contactUs, 'text/html');
      
      const clean = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'");
      };

      const pTags = Array.from(doc.querySelectorAll('p')).filter(p => clean(p.innerHTML).trim().replace(/<br\s*\/?>/g, '') !== '');
      const h1Tags = Array.from(doc.querySelectorAll('h1')).filter(h => clean(h.innerHTML).trim() !== '');

      const extractValue = (html) => {
        if (!html) return '';
        // Remove the <strong>Label:</strong> part to just get the value
        return html.replace(/<strong[^>]*>.*?<\/strong>:?\s*/i, '').trim();
      };

      setContentMap({
        title: clean(h1Tags[0]?.innerHTML) || 'Get in Touch',
        subtitle: clean(pTags[0]?.innerHTML) || "We'd love to hear from you! Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.",
        phone: extractValue(clean(pTags[1]?.innerHTML)) || '+917680097094',
        email: extractValue(clean(pTags[2]?.innerHTML)) || 'support@findmyguru.com',
        hours: extractValue(clean(pTags[3]?.innerHTML)) || 'Monday - Saturday, 9:00 AM - 9:00 PM (IST)'
      });
    }
  }, [staticPagesData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GuruNavbar />
      
      <main className="flex-grow w-full pt-16">
        {/* Header Section */}
        <div className="bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4" dangerouslySetInnerHTML={{ __html: contentMap.title || 'Get in Touch' }}></h1>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: contentMap.subtitle || "We'd love to hear from you! Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions." }}></p>
          </div>
        </div>

        {/* Contact Form & Info Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16 relative z-20">
          <div className="flex flex-col space-y-8">
            
            {/* Contact Information Details */}
            <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 sm:p-10 text-slate-800 relative z-10">
              <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Contact Number</h3>
                  <div className="w-16 h-[3px] bg-slate-800 mb-4"></div>
                  <a href={`tel:${contentMap.phone || '+917680097094'}`} className="text-lg font-bold text-[#0B4A85] hover:underline mb-2 block" dangerouslySetInnerHTML={{ __html: contentMap.phone || '+917680097094' }}></a>
                  <p className="text-sm text-slate-500 font-medium">
                    Assistance hours: <span dangerouslySetInnerHTML={{ __html: contentMap.hours || 'Monday - Sunday By 24/7 Hours' }}></span>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Email Address</h3>
                  <div className="w-16 h-[3px] bg-slate-800 mb-4"></div>
                  <a href={`mailto:${contentMap.email || 'support@findmyguru.com'}`} className="text-lg font-bold text-[#0B4A85] hover:underline mb-2 block" dangerouslySetInnerHTML={{ __html: contentMap.email || 'support@findmyguru.com' }}></a>
                  <p className="text-sm text-slate-500 font-medium">
                    Assistance hours: <span dangerouslySetInnerHTML={{ __html: contentMap.hours || 'Monday - Sunday By 24/7 Hours' }}></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-100 relative z-10">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Send us a Message</h2>
              
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <textarea 
                    rows="6" 
                    placeholder="Enter Your Message" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium resize-none"
                  ></textarea>
                </div>

                {/* Mock reCAPTCHA */}
                <div className="flex items-center">
                  <div className="flex items-center justify-between w-72 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setIsHuman(!isHuman)}>
                      <button 
                        type="button"
                        className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all ${
                          isHuman ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        {isHuman && <Check className="w-5 h-5" strokeWidth={3} />}
                      </button>
                      <span className="text-sm font-bold text-slate-700">I'm not a robot</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ShieldCheck className="w-8 h-8 text-[#4285F4] mb-1" strokeWidth={1.5} />
                      <span className="text-[9px] text-slate-500 font-medium tracking-wide">reCAPTCHA</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="inline-flex items-center space-x-2 bg-[#0B4A85] hover:bg-[#083866] text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-[#0B4A85]/30 transition-all hover:-translate-y-0.5"
                  >
                    <span>Send Message</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default ContactUsPage;
