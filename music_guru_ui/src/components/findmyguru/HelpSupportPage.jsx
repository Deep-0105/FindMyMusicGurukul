import React, { useState, useEffect } from 'react';
import { Phone, Mail, Clock, Plus, Minus, MessageSquare, Search, LifeBuoy } from 'lucide-react';
import GuruNavbar from './GuruNavbar';
import GuruFooter from './GuruFooter';
import { useGuru } from '../../context/GuruContext';

const defaultStudentFaqs = [
  {
    icon: "🚀",
    question: "What is FindMyGuru, and does it cost anything for me as a student?",
    answer: "FindMyGuru is a platform that connects students with music tutors. It is completely free for students to search and contact tutors."
  },
  {
    icon: "⭐",
    question: "How can I tell if a teacher is actually good?",
    answer: "You can check their ratings, read reviews from other students, and review their qualifications and demo videos on their profile."
  },
  {
    icon: "🤯",
    question: "Whoa, there are so many courses! I'm feeling a bit lost. Where do I start?",
    answer: "Start by selecting your preferred instrument or vocal style, then use the location and online/offline filters to narrow down the choices."
  },
  {
    icon: "👉",
    question: "What happens after I click \"Contact Teacher\"?",
    answer: "The teacher will receive your message and contact details, and they will reach out to you directly to discuss your requirements."
  }
];

const defaultTutorFaqs = [
  {
    icon: "📝",
    question: "How do I register as a tutor?",
    answer: "Simply click on the Register button and select 'Tutor' as your account type. Fill out your profile with accurate details."
  },
  {
    icon: "💰",
    question: "How much does it cost to join?",
    answer: "We offer both free and premium subscription plans for tutors to list their profiles and get inquiries."
  }
];

const FaqItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mb-4 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-white shadow-lg shadow-indigo-100/50 border-indigo-100' : 'bg-transparent border-transparent hover:bg-white/60'} border`}>
      <button 
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4 pr-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${isOpen ? 'bg-indigo-50 scale-110' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
            {item.icon}
          </div>
          <span className={`font-bold text-lg transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'}`}>
            {item.question}
          </span>
        </div>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-5 px-5' : 'max-h-0 opacity-0 px-5'}`}>
        <div className="pl-16 pr-4 text-slate-600 leading-relaxed font-medium">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

const HelpSupportPage = () => {
  const [activeTab, setActiveTab] = useState('student');
  const { staticPagesData } = useGuru();
  const [dynStudentFaqs, setDynStudentFaqs] = useState(defaultStudentFaqs);
  const [dynTutorFaqs, setDynTutorFaqs] = useState(defaultTutorFaqs);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (staticPagesData && staticPagesData.faqs) {
      const html = staticPagesData.faqs.replace(/&nbsp;/g, ' ');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const parsedStudentFaqs = [];
      const parsedTutorFaqs = [];
      
      let currentSection = null;
      let currentQ = null;
      
      const elements = Array.from(doc.body.children);
      elements.forEach(el => {
        if (el.tagName === 'H3') {
          if (el.textContent.includes('Student')) currentSection = 'student';
          else if (el.textContent.includes('Tutor')) currentSection = 'tutor';
        } else if (el.tagName === 'P' && currentSection) {
          const pText = el.textContent;
          if (pText.includes('Q:') && pText.includes('A:')) {
            const qPart = pText.substring(pText.indexOf('Q:') + 2, pText.indexOf('A:')).trim();
            const aPart = pText.substring(pText.indexOf('A:') + 2).trim();
            const faqObj = { icon: currentSection === 'student' ? '🚀' : '📝', question: qPart, answer: aPart };
            if (currentSection === 'student') parsedStudentFaqs.push(faqObj);
            else parsedTutorFaqs.push(faqObj);
          } else if (pText.includes('Q:')) {
            currentQ = pText.replace('Q:', '').trim();
          } else if (pText.includes('A:') && currentQ) {
            const aPart = pText.replace('A:', '').trim();
            const faqObj = { icon: currentSection === 'student' ? '⭐' : '💰', question: currentQ, answer: aPart };
            if (currentSection === 'student') parsedStudentFaqs.push(faqObj);
            else parsedTutorFaqs.push(faqObj);
            currentQ = null;
          }
        }
      });
      
      if (parsedStudentFaqs.length > 0) setDynStudentFaqs(parsedStudentFaqs);
      if (parsedTutorFaqs.length > 0) setDynTutorFaqs(parsedTutorFaqs);
    }
  }, [staticPagesData]);

  const faqsToDisplay = activeTab === 'student' ? dynStudentFaqs : dynTutorFaqs;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <GuruNavbar />
      
      <main className="flex-grow w-full pt-16">
        
        {/* Dynamic Hero Section */}
        <div className="bg-slate-900 relative overflow-hidden pb-40">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-500 via-indigo-600 to-transparent"></div>
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[150px] opacity-40"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white font-medium text-sm mb-8">
                <LifeBuoy className="w-4 h-4 text-fuchsia-300" />
                <span>24/7 Support Center</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                How can we help you today?
              </h1>
            </div>
          </div>
        </div>

        {/* Floating Contact Cards Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Phone Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-emerald-500 transition-colors duration-300">
                <Phone className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">Call Us</h3>
              <p className="text-slate-500 font-medium mb-6 relative z-10">Speak directly to our support team for immediate assistance.</p>
              <div className="inline-block bg-slate-50 px-4 py-2 rounded-lg font-bold text-emerald-600 text-lg relative z-10 border border-slate-100 group-hover:border-emerald-200 transition-colors">
                +91 76800 97094
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-green-500 transition-colors duration-300">
                <MessageSquare className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">WhatsApp</h3>
              <p className="text-slate-500 font-medium mb-6 relative z-10">Prefer texting? Drop us a message and we'll reply instantly.</p>
              <div className="inline-block bg-slate-50 px-4 py-2 rounded-lg font-bold text-green-600 text-lg relative z-10 border border-slate-100 group-hover:border-green-200 transition-colors">
                +91 76800 97094
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-blue-500 transition-colors duration-300">
                <Mail className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">Email</h3>
              <p className="text-slate-500 font-medium mb-6 relative z-10">Send us a detailed query and we'll get back within 24 hours.</p>
              <div className="inline-block bg-slate-50 px-4 py-2 rounded-lg font-bold text-blue-600 text-lg relative z-10 border border-slate-100 group-hover:border-blue-200 transition-colors">
                support@findmyguru.com
              </div>
            </div>

          </div>
        </div>

        {/* Operating Hours Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 border border-amber-200 flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-amber-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-amber-900">Support Operating Hours</h4>
                <p className="text-amber-700 font-medium">Monday to Saturday, 9:00 AM - 9:00 PM (IST)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Split FAQ Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Sidebar Sticky Navigation */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-32">
                <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                  Frequently<br/>Asked Questions
                </h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Browse through our most common questions to find quick answers. Select a category below.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => setActiveTab('student')}
                    className={`flex items-center justify-between px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
                      activeTab === 'student' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🧑‍🎓</span>
                      <span>I am a Student</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('tutor')}
                    className={`flex items-center justify-between px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
                      activeTab === 'tutor' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">👨‍🏫</span>
                      <span>I am a Tutor</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            <div className="lg:col-span-8">
              <div className="bg-slate-50/50 rounded-[2rem] p-2 md:p-6 border border-slate-100">
                {faqsToDisplay.map((faq, idx) => (
                  <FaqItem key={idx} item={faq} />
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      <GuruFooter />
    </div>
  );
};

export default HelpSupportPage;
