'use client';

import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#EDF2F7',
        padding: '3px',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '16px',
      }}
    >
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '9px',
              background: isSelected ? '#FFFFFF' : 'transparent',
              color: isSelected ? '#004487' : '#718096',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
