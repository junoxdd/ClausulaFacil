import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, iconClassName, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("w-10 h-10 drop-shadow-sm group-hover:scale-105 transition-transform duration-300", iconClassName)}
      >
        {/* Document Body */}
        <path d="M35 15H70C72.7614 15 75 17.2386 75 20V80C75 82.7614 72.7614 85 70 85H20C17.2386 85 15 82.7614 15 80V35L35 15Z" fill="white" stroke="#334155" strokeWidth="4" strokeLinejoin="round"/>
        
        {/* Fold */}
        <path d="M15 35H30C32.7614 35 35 32.7614 35 30V15L15 35Z" fill="#334155" stroke="#334155" strokeWidth="4" strokeLinejoin="round"/>
        
        {/* Lines */}
        <line x1="45" y1="30" x2="65" y2="30" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
        <line x1="25" y1="45" x2="65" y2="45" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
        <line x1="25" y1="60" x2="50" y2="60" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
        <line x1="25" y1="75" x2="40" y2="75" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Magnifying Glass */}
        <circle cx="65" cy="65" r="18" fill="url(#glassGradient)" stroke="#334155" strokeWidth="4"/>
        <path d="M78 78L90 90" stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round"/>
        <path d="M56 56C60 52 66 53 70 57" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
        
        <defs>
          <linearGradient id="glassGradient" x1="47" y1="47" x2="83" y2="83" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <span className={cn("font-bold text-2xl tracking-tight flex items-center gap-1.5", textClassName)}>
          <span className="text-surface-700">Cláusula</span>
          <span className="text-brand-600">Fácil</span>
        </span>
      )}
    </div>
  );
}
