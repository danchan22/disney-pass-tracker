'use client';

import React from 'react';
import { PARK_EMOJIS } from '../../lib/constants';

const PARK_ICON_MAP: Record<string, { color: string; line: string }> = {
  'Magic Kingdom': {
    color: '/park-icons/icon-magic-kingdom-color.png',
    line: '/park-icons/icon-magic-kingdom-line.png',
  },
  'Epcot': {
    color: '/park-icons/icon-epcot-color.png',
    line: '/park-icons/icon-epcot-line.png',
  },
  'Hollywood Studios': {
    color: '/park-icons/icon-hollywood-color.png',
    line: '/park-icons/icon-hollywood-line.png',
  },
  'Animal Kingdom': {
    color: '/park-icons/icon-animal-kingdom-color.png',
    line: '/park-icons/icon-animal-kingdom-line.png',
  },
};

interface ParkIconProps {
  parkName: string;
  size?: number;
  variant?: 'color' | 'line';
  style?: React.CSSProperties;
}

export const ParkIcon: React.FC<ParkIconProps> = ({
  parkName,
  size = 18,
  variant = 'color',
  style,
}) => {
  const parkData = PARK_ICON_MAP[parkName];
  const src = parkData ? parkData[variant] : null;

  if (!src) {
    return <span style={{ fontSize: `${size}px`, ...style }}>{PARK_EMOJIS[parkName] || '🏰'}</span>;
  }

  return (
    <img
      src={src}
      alt={parkName}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};
