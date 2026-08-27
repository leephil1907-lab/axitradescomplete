import React from 'react';

/**
 * AxiHamburgerIcon
 * Replicates the axi.com navigation menu icon: three horizontal bars arranged
 * with decreasing lengths (top = longest, middle = medium, bottom = shortest)
 * so the group reads as a diagonal / "slanted" staircase. This matches the
 * signature Axi menu toggle rather than the standard equal-length hamburger.
 */
interface AxiHamburgerIconProps {
  className?: string;
  open?: boolean;
}

export default function AxiHamburgerIcon({ className = 'w-7 h-7', open = false }: AxiHamburgerIconProps) {
  // viewBox 0 0 24 24 — three rounded bars, progressively shorter top->bottom
  // Top bar:    x=2  width=20  (longest)
  // Middle bar: x=5  width=15  (medium)
  // Bottom bar: x=9  width=11  (shortest)
  // This creates the slanted / staggered Axi look.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Top bar - longest */}
      <rect
        x="2"
        y="4.5"
        width="20"
        height="2.2"
        rx="1.1"
        fill="currentColor"
        style={{
          transition: 'transform 225ms ease-out, opacity 150ms ease-out 75ms',
          transformOrigin: 'center',
          transform: open ? 'translateY(6.5px) rotate(45deg)' : 'translateY(0) rotate(0deg)',
        }}
      />
      {/* Middle bar - medium */}
      <rect
        x="5"
        y="10.9"
        width="15"
        height="2.2"
        rx="1.1"
        fill="currentColor"
        style={{
          transition: 'transform 225ms ease-out, opacity 150ms ease-out',
          transformOrigin: 'center',
          opacity: open ? 0 : 1,
          transform: open ? 'scaleX(0)' : 'scaleX(1)',
        }}
      />
      {/* Bottom bar - shortest */}
      <rect
        x="9"
        y="17.3"
        width="11"
        height="2.2"
        rx="1.1"
        fill="currentColor"
        style={{
          transition: 'transform 225ms ease-out',
          transformOrigin: 'center',
          transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'translateY(0) rotate(0deg)',
        }}
      />
    </svg>
  );
}
