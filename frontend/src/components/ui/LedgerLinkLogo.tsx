import React from 'react';

interface LedgerLinkLogoProps {
  size?: number;
  withText?: boolean;
  color?: string;
  className?: string;
}

/**
 * LedgerLinkLogo
 * Props:
 *  - size: number (height in px). Default 40.
 *  - withText: boolean (show LedgerLink wordmark). Default true.
 *  - color: string (primary color hex). Default '#2a8fe6'
 *  - className: additional CSS classes
 */
export default function LedgerLinkLogo({ 
  size = 48, 
  withText = true, 
  color = '#2a8fe6', 
  className = '' 
}: LedgerLinkLogoProps) {
  const scale = size / 48; // base scale
  const textSize = Math.round(16 * scale);
  
  return (
    <div 
      className={`ledgerlink-logo ${className}`} 
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 240 240" 
        xmlns="http://www.w3.org/2000/svg" 
        aria-hidden="true" 
        focusable="false"
      >
        <defs>
          <linearGradient id="llGrad" x1="0" x2="1">
            <stop offset="0" stopColor={color}/>
            <stop offset="1" stopColor="#1464a6"/>
          </linearGradient>
        </defs>
        <g transform="translate(120,120)">
          <circle cx="0" cy="0" r="22" fill="url(#llGrad)"/>
          <g transform="rotate(30)">
            <line x1="14" y1="-12" x2="72" y2="-48" stroke="#0f1724" strokeOpacity="0.06" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="72" cy="-48" r="12" fill={color}/>
          </g>
          <g transform="rotate(-30)">
            <line x1="14" y1="12" x2="72" y2="48" stroke="#0f1724" strokeOpacity="0.06" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="72" cy="48" r="12" fill={color}/>
          </g>
          <g transform="rotate(180)">
            <line x1="14" y1="0" x2="72" y2="0" stroke="#0f1724" strokeOpacity="0.06" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="72" cy="0" r="10" fill={color}/>
          </g>
        </g>
      </svg>
      {withText && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
          <span style={{ 
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial", 
            fontWeight: 700, 
            fontSize: `${textSize}px`, 
            color: '#0f1724' 
          }}>
            Ledger
          </span>
          <span style={{ 
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial", 
            fontWeight: 700, 
            fontSize: `${textSize}px`, 
            color 
          }}>
            Link
          </span>
        </div>
      )}
    </div>
  );
}