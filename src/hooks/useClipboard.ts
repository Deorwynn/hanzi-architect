import { useState } from 'react';

export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
      return true;
    } catch (err) {
      console.error('Failed to copy!', err);
      return false;
    }
  };

  return { copied, copy };
};
