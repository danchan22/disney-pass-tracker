'use client';

import React from 'react';

interface MickeyIconProps {
  size?: number;
  active?: boolean;
  color?: string;
}

export const MickeyIcon: React.FC<MickeyIconProps> = ({
  size = 22,
  active = false,
  color = '#1A202C'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? color : 'none'}
      stroke={color}
      strokeWidth={active ? '0' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <circle cx="12" cy="14" r="6" />
      {/* Left Ear */}
      <circle cx="6" cy="6" r="4" />
      {/* Right Ear */}
      <circle cx="18" cy="6" r="4" />
    </svg>
  );
};
