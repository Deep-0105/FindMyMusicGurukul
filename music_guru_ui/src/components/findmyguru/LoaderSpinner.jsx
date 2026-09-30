import React, { useState, useEffect } from 'react';
import { Loader2, Music, Drum, Guitar, Mic, Headphones, Disc, Radio, Volume2 } from 'lucide-react';

const INSTRUMENT_ICONS = [Music, Drum, Guitar, Mic, Headphones, Disc, Radio, Volume2];

const LoaderSpinner = ({ text = 'Loading...', fullPage = false, size = 'md' }) => {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * INSTRUMENT_ICONS.length);
        } while (nextIndex === prevIndex && INSTRUMENT_ICONS.length > 1);
        return nextIndex;
      });
    }, 600); // changes every 0.6 sec

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = INSTRUMENT_ICONS[iconIndex] || Music;

  const sizeMap = {
    sm: { box: 'w-10 h-10', spinner: 'w-10 h-10', icon: 'w-4 h-4' },
    md: { box: 'w-16 h-16', spinner: 'w-16 h-16', icon: 'w-7 h-7' },
    lg: { box: 'w-24 h-24', spinner: 'w-24 h-24', icon: 'w-10 h-10' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 select-none">
      <div className={`relative flex items-center justify-center ${currentSize.box}`}>
        {/* Outer background ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-rose-500/20`} />
        {/* Primary spinning ring */}
        <Loader2
          className={`${currentSize.spinner} text-rose-500 animate-spin absolute inset-0`}
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        {/* Center changing instrument icon */}
        <ActiveIcon
          className={`${currentSize.icon} text-amber-400 absolute transition-all duration-200 transform scale-110 drop-shadow-md`}
        />
      </div>
      {text && (
        <p className={`text-xs font-extrabold tracking-wider uppercase text-center font-sans ${fullPage ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoaderSpinner;


