import { useSiteCMS } from '../../hooks/useSiteCMS';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import imgSpreads from '../../assets/images/axi_spreads_hero_1786473589536.jpg';
import imgMarketsApp from '../../assets/images/axi_markets_app_hero_1786473599610.jpg';
import imgAxiSelect from '../../assets/images/axi_select_hero_1786473577102.jpg';
import imgSpotCrypto from '../../assets/images/axi_spot_crypto_hero_1786474416366.jpg';
import imgAiStrategy from '../../assets/images/axi_ai_strategy_hero_1786474430607.jpg';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 'slide-0',
    title: 'YOUR EDGE IN THE MARKETS',
    subtitle: 'Tight spreads. Real prices. Unmatched execution.',
    cta: 'OPEN ACCOUNT',
    action: 'open-account',
    image: imgSpreads,
    theme: 'dark',
    badge: 'Spreads from 0.0 pips',
    stat: 'Gold $0.16 · BTC $12 · ETH $1.25'
  },
  {
    id: 'slide-1',
    title: '650+ MARKETS. ONE APP.',
    subtitle: 'Forex, crypto, commodities, share CFDs and global indices — all in one account.',
    cta: 'VIEW ALL MARKETS',
    action: 'markets',
    image: imgMarketsApp,
    theme: 'dark',
    badge: '29ms execution',
    stat: '20+ liquidity providers · 100+ countries'
  },
  {
    id: 'slide-2',
    title: 'TRADE WITH AXI FUNDS UP TO $1M',
    subtitle: 'Axi Select capital allocation. No registration fees. No monthly fees. 100% FREE.',
    cta: 'JOIN NOW',
    action: 'axi-select',
    image: imgAxiSelect,
    theme: 'dark',
    badge: 'Axi Select Program',
    stat: 'Up to $1,000,000 funded capital'
  },
  {
    id: 'slide-3',
    title: 'SPOT IT. BUY IT. OWN IT.',
    subtitle: 'Instant crypto spot trading with zero commission and deep liquidity across top pairs.',
    cta: 'BUY CRYPTO NOW',
    action: 'markets',
    image: imgSpotCrypto,
    theme: 'dark',
    badge: 'Spot Crypto',
    stat: '24/7 market access · Secure custody'
  },
  {
    id: 'slide-4',
    title: 'POWER UP YOUR TRADING STRATEGY WITH AI',
    subtitle: 'Automated signals, signal analytics, and intelligent copy trading built into your dashboard.',
    cta: 'LEARN MORE',
    action: 'platforms',
    image: imgAiStrategy,
    theme: 'dark',
    badge: 'Ask Axi AI Assistant',
    stat: 'Live data · Positions · Trade execution'
  }
];

const AUTOPLAY_INTERVAL = 6000;

interface HeroSlideshowProps {
  /** Callback fired when a slide's CTA button is clicked. Receives the slide action id. */
  onAction?: (actionId: string) => void;
}

export default function HeroSlideshow({ onAction }: HeroSlideshowProps) {
  const { cmsContent } = useSiteCMS();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeSlides = [...SLIDES];
  // Respect CMS CTA customization for slide 0 if the admin has customized it.
  if (cmsContent && cmsContent.home.ctaText) {
    activeSlides[0] = {
      ...activeSlides[0],
      cta: cmsContent.home.ctaText
    };
  }

  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualChange, setIsManualChange] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentSlide = activeSlides[currentIndex];

  const goToSlide = (index: number, manual: boolean = false) => {
    setCurrentIndex(index);
    setProgress(0);
    if (manual) {
      setIsManualChange(true);
      setTimeout(() => setIsManualChange(false), 1000);
    }
  };

  const nextSlide = useCallback((manual: boolean = false) => {
    goToSlide((currentIndex + 1) % activeSlides.length, manual);
  }, [currentIndex]);

  const prevSlide = useCallback((manual: boolean = false) => {
    goToSlide((currentIndex - 1 + activeSlides.length) % activeSlides.length, manual);
  }, [currentIndex]);

  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        previousFocusRef.current = e.target as HTMLElement;
      }
    };
    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, []);

  useEffect(() => {
    if (document.activeElement === document.body && previousFocusRef.current) {
      const dots = containerRef.current?.querySelectorAll('[role="tab"]');
      if (dots && dots[currentIndex]) {
        (dots[currentIndex] as HTMLElement).focus();
      }
      previousFocusRef.current = null;
    }
  }, [currentIndex]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;

    const shouldPlay = !isHovered;

    if (shouldPlay) {
      interval = setInterval(() => nextSlide(false), AUTOPLAY_INTERVAL);
      const step = 100 / (AUTOPLAY_INTERVAL / 100);
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + step, 100));
      }, 100);
    }

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [nextSlide, isHovered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide(true);
    } else if (e.key === 'ArrowRight') {
      nextSlide(true);
    }
  };

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide(true);
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide(true);
    }
  };

  return (
    <section
      className="relative w-full h-[560px] sm:h-[620px] md:h-[700px] overflow-hidden group focus:outline-none bg-slate-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Axi Features Slideshow"
      ref={containerRef}
    >
      <div
        aria-live={isManualChange ? 'polite' : 'off'}
        aria-atomic="true"
        className="sr-only"
      >
        {`Showing slide ${currentIndex + 1} of ${SLIDES.length}: ${currentSlide.title}`}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 flex items-center bg-slate-950 text-white"
        >
          {/* Background hero image with refined focal alignment */ }
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              transition={{ duration: 7, ease: 'easeOut' }}
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-left"
              aria-hidden="true"
            />
            {/* Gradient overlay for text readability while showcasing visuals */ }
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/10 md:bg-gradient-to-r md:from-slate-950/85 md:via-slate-950/30 md:to-transparent" />
          </div>

          {/* Foreground content — badge, title, subtitle, stat strip, CTA */ }
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex items-end">
            <div className="flex flex-col text-left pb-20 md:pb-28">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#F5CE47]/30 bg-[#F5CE47]/10 text-[#F5CE47] text-[9px] font-black uppercase tracking-wider">
                  {currentSlide.badge}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-2"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                  {currentSlide.title}
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="text-slate-300 text-xs sm:text-sm font-semibold mb-6 max-w-md leading-relaxed"
              >
                {currentSlide.subtitle}
              </motion.div>

              {/* Live stat strip aligned to axi.com hero messaging */ }
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-4 text-[10px] sm:text-xs font-black text-white/90 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentSlide.stat}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="mt-5 flex flex-col sm:flex-row gap-3"
              >
                <button
                  type="button"
                  onClick={() => onAction?.(currentSlide.action)}
                  aria-label={currentSlide.cta}
                  className="pointer-events-auto w-full sm:w-auto bg-[#F5CE47] hover:bg-[#FFC518] text-slate-950 text-xs sm:text-sm font-black uppercase tracking-widest px-8 py-4 rounded-sm transition-all shadow-xl hover:scale-105 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5CE47]/60"
                >
                  {currentSlide.cta}
                </button>
                <button
                  onClick={() => onAction?.('markets')}
                  className="w-full sm:w-auto bg-transparent border border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm font-black uppercase tracking-widest px-8 py-4 rounded-sm transition-all hover:scale-105 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                >
                  View All Markets
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar along the bottom */ }
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20">
        <motion.div className="h-full bg-[#F5CE47] origin-left" style={{ width: `${progress}%` }} />
      </div>

      {/* Navigation arrows */ }
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() => prevSlide(true)}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 backdrop-blur-sm text-white transition hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-[#E3000F] cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => nextSlide(true)}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 backdrop-blur-sm text-white transition hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-[#E3000F] cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Slide indicator dots */ }
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <div className="flex gap-2" role="tablist" aria-label="Slides">
          {activeSlides.map((slide, index) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => {
                goToSlide(index, true);
              }}
              className={`h-2 rounded-full transition-all outline-none cursor-pointer ${
                currentIndex === index ? 'w-6 bg-[#F5CE47]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
