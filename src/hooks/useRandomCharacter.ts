import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useRandomCharacter = (
  onSuccess: (char: string) => void,
  scriptPref: string,
) => {
  const [isShuffling, setIsShuffling] = useState(false);

  const triggerShuffle = async () => {
    if (isShuffling) return;

    setIsShuffling(true);
    try {
      const randomData = await invoke<any>('get_random_character', {
        scriptPref: scriptPref,
      });

      if (randomData?.character) {
        onSuccess(randomData.character);
      }
    } catch (err) {
      console.error('System Shuffle Failure:', err);
    } finally {
      setTimeout(() => setIsShuffling(false), 300);
    }
  };

  return { triggerShuffle, isShuffling };
};
