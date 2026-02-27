'use client';
import { useEffect, useCallback, useRef } from 'react';

export const useSpeech = () => {
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;

      const loadVoices = () => {
        if (synth.current) {
          const v = synth.current.getVoices();
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, pinyin?: string) => {
    if (!synth.current) return;

    synth.current.cancel();

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();

      // Search for a Chinese-capable voice
      const zhVoice =
        voices.find((v) => v.name.includes('Yaoyao')) ||
        voices.find((v) => v.lang === 'zh-CN') ||
        voices.find((v) => v.lang.startsWith('zh'));

      // Priority: 1. Native Character 2. Pinyin with Chinese Voice 3. Pinyin Fallback
      let textToSpeak = text;
      let targetLang = 'zh-CN';

      // If no Chinese voice, use pinyin without tones and fallback to English
      if (!zhVoice) {
        textToSpeak = pinyin ? pinyin.replace(/[0-9]/g, '') : text;
        targetLang = 'en-US';
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      if (zhVoice) {
        utterance.voice = zhVoice;
        utterance.lang = zhVoice.lang;
      } else {
        utterance.lang = targetLang;
      }

      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, []);

  return { speak };
};
