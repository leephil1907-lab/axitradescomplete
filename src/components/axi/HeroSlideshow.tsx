import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Pause, Play } from 'lucide-react';
import { useSiteCMS, DEFAULT_CMS } from '../../hooks/useSiteCMS';
import runner from '../../assets/axi-official/campaign-runner.jpg';
import portrait from '../../assets/axi-official/campaign-portrait.jpg';
import copy from '../../assets/axi-official/campaign-copy.jpg';
import clock from '../../assets/axi-official/campaign-clock.jpg';
import ai from '../../assets/axi-official/campaign-ai.jpg';

const interval = 6500;
const slides = [
  { key: 'intro', label: 'Trade your edge', title: 'Trade your edge.', description: 'Discover markets, platforms and tools on AxiTrades.', action: 'open-account', cta: 'Open Account', secondary: 'View all markets', destination: 'markets', image: portrait },
  { key: 'runner', label: 'Your edge in the markets', title: 'Tight spreads.\nReal prices.\nUnmatched\nexecution.', description: 'Trade Gold, Bitcoin and Ethereum. Explore our markets and compare pricing before you trade.', action: 'open-account', cta: 'Open Account', secondary: 'View all markets', destination: 'markets', image: runner },
  { key: 'copy', label: 'Axi Copy Trading', title: 'Automate.\nImitate. Copy trade.', description: 'Explore how copy trading works and follow strategies from other traders. Past performance does not predict future results.', action: 'copy', cta: 'Explore copy trading', secondary: 'Learn more', destination: 'platforms', image: copy },
  { key: 'clock', label: 'TradFi perpetuals', title: 'Introducing\nTradFi\nPerpetuals', description: 'Explore traditional markets and learn how perpetual futures work, with no expiry date.', action: 'open-account', cta: 'Open Account', secondary: 'Explore perps', destination: 'perpetuals', image: clock },
  { key: 'ai', label: 'Trading tools', title: 'AI tools built for\nhow you trade', description: 'Explore research and analysis tools for making more informed trading decisions.', action: 'tools', cta: 'Explore tools', secondary: 'View platforms', destination: 'platforms', image: ai },
];

export default function HeroSlideshow({ onAction }: { onAction: (actionId: string) => void }) {
  const { cmsContent } = useSiteCMS();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visibleTab, setVisibleTab] = useState(() => !document.hidden);
  const frame = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const inView = useInView(frame, { amount: 0.2 });
  const reduced = useReducedMotion();
  const playing = !reduced && !paused && !focused && inView && visibleTab;
  const slide = slides[index];
  const home = cmsContent.home;
  const customize = (key: 'heroTitle' | 'heroSubtitle' | 'ctaText', value: string) =>
    slide.key === 'runner' && home[key] && home[key] !== DEFAULT_CMS.home[key] ? home[key] : value;
  const move = (offset: number) => setIndex(i => (i + offset + slides.length) % slides.length);

  useEffect(() => {
    const sync = () => setVisibleTab(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % slides.length), interval);
    return () => window.clearTimeout(timer);
  }, [playing, index]);

  return (
    <section ref={frame} aria-label="Featured campaigns" aria-roledescription="carousel" className="reference-campaign" data-campaign={slide.key}
      onFocusCapture={e => setFocused(e.target.matches(':focus-visible'))} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
      onTouchStart={e => { const finger = e.touches[0]; if (e.touches.length === 1) touch.current = { x: finger.clientX, y: finger.clientY }; }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={e => { const start = touch.current; touch.current = null; const finger = e.changedTouches[0]; if (!start || !finger) return; const x = finger.clientX - start.x; const y = finger.clientY - start.y; if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) move(x < 0 ? 1 : -1); }}>
      <div className="campaign-layers" data-playing={playing} aria-hidden="true">
        {slides.map((item, i) => <motion.div className="campaign-scene" key={item.key} data-active={i === index}
          initial={false} animate={{ opacity: i === index ? 1 : 0 }} transition={{ duration: reduced ? 0 : .75 }}>
          <img src={item.image} alt="" data-art={item.key} fetchPriority={i === 0 ? 'high' : 'low'}
          /><span className="campaign-light" /></motion.div>)}
      </div>
      <div className="home-shell reference-campaign-shell">
        <div className="reference-campaign-copy" aria-live={playing ? 'off' : 'polite'}>
          {<motion.div key={slide.key}
            initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .5 }}>
            <p className="home-kicker">/// {slide.label}</p>
            <h1>{customize('heroTitle', slide.title)}</h1>
            <p className="reference-lede">{customize('heroSubtitle', slide.description || '')}</p>
          </motion.div>}
          {slide.action && <div className="reference-actions">
            <button type="button" onClick={() => onAction(slide.action)} className="home-button home-button-primary">{customize('ctaText', slide.cta)}</button>
            <button type="button" onClick={() => onAction(slide.destination)} className="home-button reference-outline">{slide.secondary}</button>
          </div>}
        </div>
        <div role="group" aria-label="Choose a featured campaign" className="reference-carousel-controls"
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } }}>
          {slides.map((item, i) => <button type="button" key={item.key} onClick={() => setIndex(i)} aria-label={`${i + 1}. ${item.label}`} aria-pressed={index === i}>0{i + 1}{index === i && playing && <motion.span aria-hidden="true" className="campaign-progress" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: interval / 1000, ease: 'linear' }} />}</button>)}
          {!reduced && <button type="button" aria-label={paused ? 'Resume campaign autoplay' : 'Pause campaign autoplay'} onClick={() => setPaused(p => !p)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
        </div>
      </div>
    </section>
  );
}
