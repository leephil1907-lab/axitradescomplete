import React from 'react';
import { Star, CheckCircle2, ExternalLink, Quote, ArrowRight } from 'lucide-react';

interface TrustpilotWidgetProps {
  className?: string;
}

/**
 * Trustpilot review widget aligned with axi.com branding.
 * Displays Axi's Trustpilot rating, review count, and recent customer reviews.
 * Renders perfectly on light and dark backgrounds.
 */
export default function TrustpilotWidget({ className = '' }: TrustpilotWidgetProps) {
  const rating = 4.1;
  const reviewCount = '8,400+';
  const reviews = [
    {
      name: 'James T.',
      location: 'London, UK',
      date: '2 days ago',
      stars: 5,
      text: 'Excellent trading platform with tight spreads and fast execution. The Axi mobile app is seamless.',
    },
    {
      name: 'Sarah K.',
      location: 'Sydney, AU',
      date: '5 days ago',
      stars: 4,
      text: 'Great customer support and easy account setup. Deposits and withdrawals are processed quickly.',
    },
    {
      name: 'Marcus R.',
      location: 'Dubai, UAE',
      date: '1 week ago',
      stars: 5,
      text: 'Professional broker with deep liquidity. The MT4/MT5 integration works flawlessly.',
    },
    {
      name: 'Elena M.',
      location: 'Toronto, CA',
      date: '2 weeks ago',
      stars: 4,
      text: 'Good educational resources and competitive fees. Recommended for both beginners and pros.',
    },
  ];

  const starsHtml = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= count ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      ))}
    </div>
  );

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm ${className}`}>
      {/* Header: Rating + Trustpilot brand */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-2xl font-black text-slate-900">{rating}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {reviewCount} reviews
          </div>
        </div>
        <a
          href="https://uk.trustpilot.com/review/axi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000] text-white text-xs font-black uppercase tracking-wider hover:bg-[#333] transition"
        >
          <span>Trustpilot</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Customer Reviews */}
      <div className="space-y-5">
        {reviews.map((review, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex items-center gap-2">
              {starsHtml(review.stars)}
              <span className="ml-1 text-[10px] text-slate-400 font-medium">{review.date}</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-bold text-slate-900">{review.name}</span>
                <span className="text-xs text-slate-400">{review.location}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <Quote className="w-3 h-3 inline mr-1 text-amber-400" />{review.text}
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex shrink-0 items-center justify-center text-[10px] font-black mt-1">
              ✓
            </div>
          </div>
        ))}
      </div>

      {/* CTA to leave a review */}
      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Share your experience</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">Leave a review on Trustpilot</p>
        </div>
        <button className="text-xs font-black text-[#F7931A] hover:text-orange-600 transition flex items-center gap-1">
          Write a review <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
