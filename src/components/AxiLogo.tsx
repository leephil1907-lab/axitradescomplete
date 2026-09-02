import React from 'react';

interface AxiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'red' | 'dark' | 'adaptive';
  'aria-label'?: string;
}

export default function AxiLogo({
  className = '',
  size = 'md',
  variant = 'adaptive',
  'aria-label': ariaLabel = 'Axi'
}: AxiLogoProps) {
  const sizeClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14'
  };

  const colorMap = {
    white: '#FFFFFF',
    red: '#E3000F',
    dark: '#0F172A',
    adaptive: 'currentColor'
  };

  return (
    <svg
      className={`w-auto shrink-0 select-none ${sizeClasses[size]} ${className}`}
      viewBox="0 0 110 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      <text
        x="0"
        y="29"
        fill={colorMap[variant]}
        fontSize="36"
        fontWeight="900"
        fontFamily="'Clash Display', 'General Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-1.5"
      >
        axi
      </text>
    </svg>
  );
}
