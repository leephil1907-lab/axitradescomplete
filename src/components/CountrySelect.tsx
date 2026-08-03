import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CountrySelect({ value, onChange, className = '' }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(country => 
    country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm font-extrabold ${value ? 'text-slate-800' : 'text-slate-400'}`}>
          {value || 'Select Country'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search country..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-brand-red font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto overscroll-contain">
              {filteredCountries.length > 0 ? (
                filteredCountries.map(country => (
                  <div
                    key={country}
                    className={`px-4 py-2.5 text-sm font-semibold cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                      value === country ? 'text-brand-red bg-red-50/30' : 'text-slate-700'
                    }`}
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {country}
                    {value === country && <Check className="w-4 h-4 text-brand-red" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center font-medium">
                  No countries found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
