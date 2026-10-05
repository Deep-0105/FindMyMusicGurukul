import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
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
  },
  {
    icon: "🤷",
    question: "What if I contact a teacher and then realize it's not a good match?",
    answer: "You are under no obligation to continue. You can simply let them know and browse our platform for other suitable teachers."
  },
  {
    icon: "💸",
    question: "What if I make a payment to a teacher and they don't teach me? Will FindMyGuru take responsibility?",
    answer: "We strongly advise taking a demo class before making bulk payments. Since payments are made directly to the tutor, FindMyGuru cannot process refunds, but we can take strict action against fraudulent profiles."
  },
  {
    icon: "🙌",
    question: "FindMyGuru helped me find an awesome teacher for free! How can I give back to the platform?",
    answer: "We are thrilled! You can give back by leaving a review for your teacher on their profile and recommending our platform to your friends."
  },
  {
    icon: "❓",
    question: "I have a question that's not answered here. What should I do?",
    answer: "You can reach out to us using the Contact Us form or email us directly at support@findmyguru.com."
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

const ModernFaqItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-l-4 transition-all duration-300 bg-white shadow-sm border border-slate-100 mb-4 rounded-r-2xl rounded-l-md overflow-hidden ${
      isOpen ? 'border-l-cyan-500 shadow-md shadow-cyan-100' : 'border-l-transparent hover:border-l-slate-300'
    }`}>
      <button 
        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4 pr-4">
          <span className="text-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
          <span className={`font-bold text-lg transition-colors ${isOpen ? 'text-cyan-700' : 'text-slate-700 group-hover:text-cyan-600'}`}>
            {item.question}
          </span>
        </div>
        <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-500' : 'text-slate-400 group-hover:text-cyan-400'}`}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-slate-50 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 md:p-6 pt-2 text-slate-600 leading-relaxed font-medium">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

const StudentFaqsPage = () => {
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
            const faqObj = { icon: currentSection === 'student' ? '💡' : '👨‍🏫', question: qPart, answer: aPart };
            if (currentSection === 'student') parsedStudentFaqs.push(faqObj);
            else parsedTutorFaqs.push(faqObj);
          } else if (pText.includes('Q:')) {
            currentQ = pText.replace('Q:', '').trim();
          } else if (pText.includes('A:') && currentQ) {
            const aPart = pText.replace('A:', '').trim();
            const faqObj = { icon: currentSection === 'student' ? '💡' : '👨‍🏫', question: currentQ, answer: aPart };
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
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-sans">
      <GuruNavbar />
      
      <main className="flex-grow w-full pt-16">
        
        {/* Sleek Hero Section */}
        <div className="bg-slate-900 relative overflow-hidden pb-32">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500 via-blue-700 to-transparent"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 mb-8 rotate-3">
              <MessageCircleQuestion className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Got Questions?
            </h1>
            <p className="text-lg text-cyan-100 max-w-2xl font-medium">
              Find answers to common questions about accounts, payments, finding a tutor, and more.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-24">
          
          {/* Segmented Control */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1.5 rounded-full flex items-center w-[400px] max-w-full shadow-xl shadow-slate-200/50 border border-slate-100">
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 flex justify-center items-center py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ${
                  activeTab === 'student' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="mr-2">🧑‍🎓</span> For Students
              </button>
              <button
                onClick={() => setActiveTab('tutor')}
                className={`flex-1 flex justify-center items-center py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ${
                  activeTab === 'tutor' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="mr-2">👨‍🏫</span> For Tutors
              </button>
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqsToDisplay.map((faq, idx) => (
              <ModernFaqItem key={idx} item={faq} />
            ))}
          </div>

        </div>
      </main>

      <GuruFooter />
    </div>
  );
};

export default StudentFaqsPage;
