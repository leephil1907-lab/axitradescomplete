import { useSiteCMS } from '../../hooks/useSiteCMS';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import imgAxiSelect from '../../assets/images/axi_select_hero_1786473577102.jpg';
import imgSpreads from '../../assets/images/axi_spreads_hero_1786473589536.jpg';
import imgMarketsApp from '../../assets/images/axi_markets_app_hero_1786473599610.jpg';
import imgSpotCrypto from '../../assets/images/axi_spot_crypto_hero_1786474416366.jpg';
import imgAiStrategy from '../../assets/images/axi_ai_strategy_hero_1786474430607.jpg';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 'slide-0',
    title: 'Trade with Axi funds up to $1 million USD',
    subtitle: 'Axi has launched a capital allocation program. No registration fees. No monthly fees. 100% FREE',
    cta: 'JOIN NOW',
    image: imgAxiSelect,
    theme: 'dark'
  },
  {
    id: 'slide-1',
    title: 'YOUR EDGE IN THE MARKETS',
    subtitle: 'SPREADS ON GOLD $0.16, SPREADS ON OIL $0.03, SPREADS ON BTC $15',
    cta: 'ACCESS TIGHT SPREADS',
    image: imgSpreads,
    theme: 'dark'
  },
  {
    id: 'slide-2',
    title: '650+ markets. One app.',
    subtitle: 'Trade 650+ assets across forex, crypto, commodities, share CFDs, ETFs and global indices without switching apps.',
    cta: 'DOWNLOAD NOW',
    image: imgMarketsApp,
    theme: 'dark'
  },
  {
    id: 'slide-3',
    title: 'SPOT IT. BUY IT. OWN IT.',
    subtitle: 'Experience instant crypto spot buying with zero commission and deep liquidity across top trading pairs.',
    cta: 'BUY CRYPTO NOW',
    image: imgSpotCrypto,
    theme: 'dark'
  },
  {
    id: 'slide-4',
    title: 'POWER UP YOUR TRADING STRATEGY WITH AI',
    subtitle: 'Automated signals, signal analytics, and intelligent copy trading built into your dashboard.',
    cta: 'LEARN MORE',
    image: imgAiStrategy,
    theme: 'dark'
  }
];

const AUTOPLAY_INTERVAL = 6000;

export default function HeroSlideshow() {
  const { cmsContent } = useSiteCMS();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeSlides = [...SLIDES];
  if (cmsContent) {
    activeSlides[0] = {
      ...activeSlides[0],
      title: cmsContent.home.heroTitle,
      subtitle: cmsContent.home.heroSubtitle,
      cta: cmsContent.home.ctaText
    };
  }

    const [userInteracted, setUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualChange, setIsManualChange] = useState(false);
  
  const focusRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentSlide = activeSlides[currentIndex];

  const updateMetaTags = useCallback((slide: typeof activeSlides[0]) => {
    // Basic meta tags update
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', slide.image);
    else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      meta.content = slide.image;
      document.head.appendChild(meta);
    }

    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage) twImage.setAttribute('content', slide.image);
    else {
      const meta = document.createElement('meta');
      meta.name = 'twitter:image';
      meta.content = slide.image;
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    updateMetaTags(currentSlide);
  }, [currentIndex, currentSlide, updateMetaTags]);

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
    // When the slide changes, if focus was inside the container but on an element that unmounted (like the CTA),
    // focus will be reset to the body. We should redirect it to the active dot or container.
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
      // Focus was lost (likely due to unmount). Return focus to the active dot.
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
    
    // Only auto play if not paused, and not hovering (unless the user explicitly played)
    const shouldPlay = !isHovered || userInteracted;

    if (shouldPlay) {
      interval = setInterval(() => nextSlide(false), AUTOPLAY_INTERVAL);
      
      const step = 100 / (AUTOPLAY_INTERVAL / 100);
      progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + step, 100));
      }, 100);
    }

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [nextSlide, isHovered, userInteracted]);

  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide(true);
    } else if (e.key === 'ArrowRight') {
      nextSlide(true);
    }
  };

  // Touch swipe support
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
      className="relative w-full h-[580px] sm:h-[640px] md:h-[700px] overflow-hidden group focus:outline-none bg-slate-950"
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
          {/* Background Hero Image with refined focal alignment */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img 
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: "easeOut" }}
              src={currentSlide.image} 
              alt={currentSlide.title} 
              className="w-full h-full object-cover object-center md:object-right"
              aria-hidden="true"
            />
            {/* Smooth gradient overlay ensuring high text readability while showcasing trading visuals */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/30 md:bg-gradient-to-r md:from-slate-950 md:via-slate-950/85 md:to-transparent" />
          </div>

          {/* Foreground Text & Action - Perfectly aligned with max-w-7xl px-4 sm:px-6 lg:px-8 grid */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex items-center">
            <div className="flex flex-col max-w-xl md:max-w-2xl text-left py-12 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-4 self-start"
              >
                <span className="bg-[#E3000F] text-white text-[10px] sm:text-xs font-black tracking-widest uppercase px-3 py-1 rounded-sm shadow-sm">
                  AXI EDGE
                </span>
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase hidden sm:inline">
                  Award-Winning Global Broker
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5 text-white"
              >
                {currentSlide.title}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-base sm:text-lg md:text-xl font-medium mb-8 leading-relaxed max-w-xl text-slate-200"
              >
                {currentSlide.subtitle}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center gap-4 flex-wrap"
              >
                <button 
                  className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 text-xs sm:text-sm font-black uppercase tracking-widest px-8 py-4 rounded-sm transition-all shadow-xl hover:scale-105 cursor-pointer active:scale-95"
                >
                  {currentSlide.cta}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar along the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20">
        <motion.div 
          className="h-full bg-[#FFD250] origin-left"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-4 sm:bottom-8 md:bottom-16 right-4 sm:right-6 md:right-12 z-20 flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => prevSlide(true)}
          className="p-2 sm:p-3 rounded-full bg-slate-900/70 hover:bg-slate-900/90 border border-slate-700/60 backdrop-blur-sm text-white transition hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-[#E3000F] cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => nextSlide(true)}
          className="p-2 sm:p-3 rounded-full bg-slate-900/70 hover:bg-slate-900/90 border border-slate-700/60 backdrop-blur-sm text-white transition hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-[#E3000F] cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-4 sm:bottom-8 md:bottom-16 left-4 sm:left-6 md:left-12 z-20 flex items-center gap-2 sm:gap-3 bg-slate-900/70 border border-slate-700/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
        <div className="flex gap-2 sm:gap-2.5" role="tablist" aria-label="Slides">
          {activeSlides.map((slide, index) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => {
                goToSlide(index, true);
                setUserInteracted(true);
              }}
              className={`h-2 sm:h-2.5 rounded-full transition-all outline-none cursor-pointer ${
                currentIndex === index ? 'w-6 sm:w-8 bg-[#FFD250]' : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
