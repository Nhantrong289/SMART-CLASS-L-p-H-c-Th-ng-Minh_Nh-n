import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { getInitialsAvatar } from '../../utils/avatar';

export { getInitialsAvatar };

export interface UserAvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  role?: 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  imgClassName?: string;
  showCameraBadge?: boolean;
  onClick?: () => void;
  title?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'Người dùng',
  name = 'Người dùng',
  role = 'TEACHER',
  size = 'md',
  className = '',
  imgClassName = '',
  showCameraBadge = false,
  onClick,
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeDimensions: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
    '2xl': 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const fontSizes: Record<string, string> = {
    xs: 'text-[9px]',
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
  };

  const badgeDimensions: Record<string, string> = {
    xs: 'w-2.5 h-2.5 text-[6px]',
    sm: 'w-3.5 h-3.5 text-[8px]',
    md: 'w-4 h-4 text-[9px]',
    lg: 'w-5 h-5 text-[10px]',
    xl: 'w-6 h-6 text-xs',
    '2xl': 'w-7 h-7 text-sm',
  };

  // Clean name and extract initials
  const displayName = (name || alt || 'Người dùng').trim();
  const words = displayName.split(/\s+/).filter(Boolean);
  let initials = 'SC';
  if (words.length >= 2) {
    initials = (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  // Role-specific vivid cyberpunk gradient
  const upperRole = (role || 'TEACHER').toUpperCase();
  let gradientClasses = 'from-cyan-500 to-blue-600 border-cyan-400/50 shadow-cyan-500/20';
  if (upperRole === 'STUDENT') {
    gradientClasses = 'from-violet-500 to-indigo-600 border-violet-400/50 shadow-violet-500/20';
  } else if (upperRole === 'PARENT') {
    gradientClasses = 'from-pink-500 to-purple-600 border-pink-400/50 shadow-pink-500/20';
  } else if (upperRole === 'ADMIN') {
    gradientClasses = 'from-blue-600 to-slate-700 border-blue-400/50 shadow-blue-500/20';
  }

  // Resilient check: never attempt to load broken external domains or empty values
  const isInvalidUrl =
    !src ||
    src.trim().length === 0 ||
    src.includes('dicebear.com') ||
    src.includes('pravatar.cc') ||
    src === 'undefined' ||
    src === 'null';

  const shouldUseFallback = hasError || isInvalidUrl;

  return (
    <div
      onClick={onClick}
      title={title || displayName}
      className={`relative inline-block shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {shouldUseFallback ? (
        <div
          className={`${sizeDimensions[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md select-none border bg-gradient-to-br ${gradientClasses} ${imgClassName}`}
        >
          <span className={`${fontSizes[size]} tracking-tight drop-shadow-sm`}>{initials}</span>
        </div>
      ) : (
        <img
          src={src}
          alt=""
          onError={() => setHasError(true)}
          className={`${sizeDimensions[size]} rounded-full object-cover border border-cyan-500/40 bg-slate-800 shadow-md ${imgClassName}`}
        />
      )}

      {showCameraBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${badgeDimensions[size]} bg-cyan-600 hover:bg-cyan-500 rounded-full border-2 border-[#080b1f] flex items-center justify-center text-white shadow-md transition-colors`}
        >
          <Camera className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
};

