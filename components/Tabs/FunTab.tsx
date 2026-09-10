'use client';

import React from 'react';
import { PhotoGridRecord, RainbowSubTab } from '../../lib/types';
import { RainbowFunSubTab } from './Fun/RainbowFunSubTab';
import { TriviaFunSubTab } from './Fun/TriviaFunSubTab';

interface FunTabProps {
  funSubTab: 'rainbow' | 'trivia';
  rainbowSubTab: RainbowSubTab;
  photoGrids: PhotoGridRecord[];
  photoLoading: boolean;
  fetchPhotoGrids: () => Promise<void>;
}

export const FunTab: React.FC<FunTabProps> = ({
  funSubTab,
  rainbowSubTab,
  photoGrids,
  photoLoading,
  fetchPhotoGrids,
}) => {
  return (
    <div>
      {funSubTab === 'rainbow' && (
        <RainbowFunSubTab
          rainbowSubTab={rainbowSubTab}
          photoGrids={photoGrids}
          photoLoading={photoLoading}
          fetchPhotoGrids={fetchPhotoGrids}
        />
      )}

      {funSubTab === 'trivia' && <TriviaFunSubTab />}
    </div>
  );
};
