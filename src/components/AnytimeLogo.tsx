'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function AnytimeLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Outer subtle glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-pink-500/20 blur-sm" />
        
        {/* Core emblem */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10"
        >
          <rect width="32" height="32" rx="8" fill="#12131a" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="16" cy="16" r="9" stroke="url(#logo_grad)" strokeWidth="1.8" strokeDasharray="3 2" />
          <circle cx="16" cy="16" r="5" stroke="#ffffff" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="2.2" fill="url(#logo_grad)" />
          <circle cx="21" cy="11" r="1.4" fill="#38bdf8" />
          <defs>
            <linearGradient id="logo_grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#818cf8" />
              <stop offset="1" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline gap-1">
          <span className={`font-semibold tracking-tight text-white ${textSizes[size]}`}>
            anytime<span className="font-light text-neutral-400">view</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}
