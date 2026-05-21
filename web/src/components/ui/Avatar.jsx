'use client';

/**
 * Avatar Component
 * User profile image with fallback
 */

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <img
      src={src || '/images/placeholder-avatar.png'}
      alt={alt}
      className={`rounded-full object-cover ${sizes[size]} ${className}`}
    />
  );
}
