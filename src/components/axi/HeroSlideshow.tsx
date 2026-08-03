import { useSiteCMS } from '../../hooks/useSiteCMS';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import imgHeroTrader from '../../assets/images/regenerated_image_1784970375794.png';
import imgSpacex from '../../assets/images/spacex_ipo_hero_1784835887334.jpg';
import imgSpreads from '../../assets/images/axi_trading_spreads_1784835901617.jpg';
import imgAi from '../../assets/images/axi_ai_signals_1784835914680.jpg';
import imgCrypto from '../../assets/images/axi_crypto_spot_1784835927385.jpg';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axiTradingSpreads from '../../assets/images/axi_trading_spreads_1784835901617.jpg';
import axiCryptoSpot from '../../assets/images/axi_crypto_spot_1784835927385.jpg';
import spacexIpo from '../../assets/images/spacex_ipo_hero_1784835887334.jpg';
import axiAiSignals from '../../assets/images/axi_ai_signals_1784835914680.jpg';

const SLIDES = [
  {
    id: 'slide-0',
    title: 'Trade Your Edge',
    subtitle: 'Global Online CFD & Forex Broker. Experience high-speed execution and precision.',
    cta: 'OPEN A LIVE ACCOUNT',
    image: imgHeroTrader,
    theme: 'dark'
  },
  {
    id: 'slide-1',
    title: 'SpaceX has landed',
    subtitle: 'Trade SPCX after its historic trillion-dollar IPO',
    cta: 'Trade now',
    image: imgSpacex,
    theme: 'dark'
  },
  {
    id: 'slide-2',
    title: 'YOUR EDGE IN THE MARKETS',
    subtitle: 'SPREADS ON GOLD $0.16, BTC $15',
    cta: 'ACCESS TIGHT SPREADS',
    image: imgSpreads,
    theme: 'light' // The text is white in image, so maybe theme dark or light? The image has red bg and white text. Actually we'll use dark theme to keep text white. Wait, the image already has the text. We can keep it or overlay.
  },
  {
    id: 'slide-3',
    title: 'POWER UP YOUR TRADING STRATEGY WITH AI',
    subtitle: '',
    cta: 'LEARN MORE',
    image: imgAi,
    theme: 'dark'
  },
  {
    id: 'slide-4',
    title: 'Trade Crypto CFDs 24/7',
    subtitle: 'Experience the Axi edge with up to 200:1 leverage on top Crypto CFDs including Bitcoin & Ethereum.',
    cta: 'OPEN A LIVE ACCOUNT',
    image: imgCrypto,
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
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden group focus:outline-none"
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
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 flex items-center ${currentSlide.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}
        >
          {/* Background Image with optional overlay */}
          <div className="absolute inset-0 z-0">
            <motion.img 
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: "easeOut" }}
              src={currentSlide.image} 
              alt="" 
              className="w-full h-full object-cover object-center opacity-40 md:opacity-100"
              aria-hidden="true"
            />
            <div className={`absolute inset-0 md:w-1/2 ${currentSlide.theme === 'dark' ? 'bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent' : 'bg-gradient-to-r from-white via-white/80 to-transparent'}`} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6"
            >
              {currentSlide.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`text-lg md:text-xl font-medium mb-10 max-w-md ${currentSlide.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
            >
              {currentSlide.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <button 
                className="bg-brand-red hover:bg-brand-red-hover text-white text-sm md:text-base font-black uppercase tracking-wider px-8 py-4 rounded-lg transition-transform hover:scale-105"
                tabIndex={-1}
              >
                {currentSlide.cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10 z-20">
        <motion.div 
          className="h-full bg-brand-red origin-left"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-12 right-6 md:right-12 z-20 flex items-center gap-4">
        <button
          onClick={() => prevSlide(true)}
          className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur text-white transition opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none focus:ring-2 focus:ring-brand-red"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => nextSlide(true)}
          className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur text-white transition opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none focus:ring-2 focus:ring-brand-red"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Play/Pause & Dots */}
      <div className="absolute bottom-12 left-6 md:left-auto md:right-1/2 md:translate-x-1/2 z-20 flex items-center gap-6 bg-black/20 backdrop-blur px-6 py-3 rounded-full">
        
        
        <div className="flex gap-3" role="tablist" aria-label="Slides">
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
              className={`w-2.5 h-2.5 rounded-full transition-all outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black/20 ${currentIndex === index ? 'bg-brand-red scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
