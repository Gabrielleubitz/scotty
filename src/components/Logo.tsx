import React from 'react';

interface LogoProps {
  size?: number;
  showBadge?: boolean;
  badgeCount?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 32, 
  showBadge = false, 
  badgeCount = 1,
  className = '' 
}) => {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hexagon with gradient */}
        <defs>
          <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="1" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Hexagon path */}
        <path
          d="M50 10 L85 25 L85 75 L50 90 L15 75 L15 25 Z"
          stroke="url(#hexagonGradient)"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Circles inside */}
        <circle cx="35" cy="35" r="4" fill="url(#hexagonGradient)" opacity="0.8" />
        <circle cx="50" cy="30" r="3" fill="url(#hexagonGradient)" opacity="0.7" />
        <circle cx="65" cy="35" r="4" fill="url(#hexagonGradient)" opacity="0.8" />
        <circle cx="40" cy="50" r="3" fill="url(#hexagonGradient)" opacity="0.6" />
        <circle cx="60" cy="50" r="3" fill="url(#hexagonGradient)" opacity="0.6" />
        <circle cx="50" cy="60" r="4" fill="url(#hexagonGradient)" opacity="0.8" />
        <circle cx="35" cy="65" r="3" fill="url(#hexagonGradient)" opacity="0.7" />
        <circle cx="65" cy="65" r="3" fill="url(#hexagonGradient)" opacity="0.7" />
      </svg>
      
      {/* Red badge with number */}
      {showBadge && (
        <div
          className="absolute -top-1 -right-1 bg-status-error rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ width: size * 0.4, height: size * 0.4, fontSize: size * 0.25 }}
        >
          {badgeCount}
        </div>
      )}
    </div>
  );
};

