import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper } from 'lucide-react';

const HEADLINES = [
  "Fed signals potential rate cuts as inflation cools",
  "Tech stocks rally on strong earnings reports from major players",
  "Oil prices stabilize amidst Middle East tensions",
  "Gold hits new all-time high as investors seek safe havens",
  "Crypto markets surge following new regulatory approvals",
  "European markets close higher despite economic data concerns",
  "Bank of Japan maintains ultra-loose monetary policy"
];

export default function NewsTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-slate-300 py-1.5 px-4 text-xs font-medium flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-1.5 text-brand-red shrink-0 font-bold uppercase tracking-widest text-[10px]">
        <Newspaper className="w-3.5 h-3.5" />
        Live News
      </div>
      <div className="h-4 w-px bg-slate-700 shrink-0"></div>
      <div className="flex-grow relative h-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 truncate"
          >
            {HEADLINES[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
