'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '@/types/database';

interface SearchBarProps {
  onSelect: (char: CharacterData) => void;
  onOpenExpandedView?: (title: string, data: CharacterData[]) => void;
  hanziOnly?: boolean;
}

export default function SearchBar({
  onSelect,
  onOpenExpandedView,
  hanziOnly = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CharacterData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scriptPreference } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // GLOBAL SHORTCUT LOGIC
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // SEARCH LOGIC
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 1) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const results = await invoke<CharacterData[]>('search_characters', {
          query,
          filterHanziOnly: hanziOnly,
          scriptPref: scriptPreference,
        });
        setSuggestions(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    // Debounce: Wait 200ms after user stops typing
    const timeout = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  // RESET INDEX WHEN SUGGESTIONS CHANGE
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // KEYBOARD NAVIGATION HANDLER
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') inputRef.current?.blur();
      if (e.key === 'Enter' && query.trim()) {
        const bestMatch =
          suggestions.find((s) => s.character === query.trim()) ||
          suggestions[0];
        if (bestMatch) handleSelection(bestMatch);
      }
      return;
    }

    const lastIndex = suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < lastIndex ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        // Case 1: User selected a specific suggestion via arrows
        handleSelection(suggestions[activeIndex]);
      } else if (activeIndex === suggestions.length && onOpenExpandedView) {
        // Case 2: User selected "View All" via arrows
        onOpenExpandedView(`Search Results: ${query}`, suggestions);
        setQuery('');
        setSuggestions([]);
        setShowDropdown(false);
      } else if (query.trim()) {
        // Case 3: User hit Enter directly in the input (activeIndex is -1)
        // Try to find exact match first, otherwise take the top suggestion
        const bestMatch =
          suggestions.find((s) => s.character === query.trim()) ||
          suggestions[0];
        if (bestMatch) {
          handleSelection(bestMatch);
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // 3. AUTO-SCROLL LOGIC
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeElement = dropdownRef.current.children[
        activeIndex
      ] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  const handleSelection = useCallback(
    (item: CharacterData) => {
      onSelect(item);
      setQuery('');
      setSuggestions([]);
      setShowDropdown(false);
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown} // Add this here!
          placeholder="Press '/' to search..."
          className="w-full bg-[#161f27] border border-cyan-500/20 pl-4 pr-12 py-2.5 rounded outline-none focus:border-cyan-500/50 text-cyan-100 transition-all"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `result-item-${activeIndex}` : undefined
          }
        />
        {/* 2. ACCESSIBLE ICON */}
        <div
          aria-hidden="true"
          className="absolute right-4 inset-y-0 flex items-center justify-center pointer-events-none transition-opacity group-focus-within:opacity-60 opacity-20"
        >
          <span className="text-base">🔍</span>
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul
          ref={dropdownRef}
          className="absolute z-[100] w-full mt-2 bg-[#0f1419] border border-cyan-500/30 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-h-80 overflow-y-auto"
        >
          {suggestions.map((item, index) => (
            <li
              key={item.character}
              id={`result-item-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`border-b border-cyan-500/5 last:border-none ${
                activeIndex === index ? 'bg-cyan-500/20' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelection(item)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelection(item)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-500/10 focus:bg-cyan-500/20 focus:outline-none cursor-pointer group transition-colors text-left"
                tabIndex={-1}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xl transition-transform ${activeIndex === index ? 'text-cyan-300 scale-110' : 'text-cyan-400'}`}
                  >
                    {item.character}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-cyan-100/60 font-mono italic leading-none">
                      {item.pinyin}
                    </span>
                    {item.hsk_level && (
                      <span className="text-[7px] mt-1 w-fit px-1 bg-cyan-500/10 text-cyan-500/40 border border-cyan-500/10 uppercase tracking-tighter">
                        HSK {item.hsk_level}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-cyan-500/30 uppercase tracking-tighter truncate max-w-[150px]">
                  {item.definition}
                </span>
              </button>
            </li>
          ))}

          {suggestions.length >= 25 && onOpenExpandedView && (
            <li
              id={`result-item-${suggestions.length}`}
              role="option"
              aria-selected={activeIndex === suggestions.length}
            >
              <button
                type="button"
                onClick={() => {
                  onOpenExpandedView(`Search Results: ${query}`, suggestions);
                  setQuery('');
                  setSuggestions([]);
                  setShowDropdown(false);
                }}
                className={`w-full p-4 text-center border-t border-cyan-500/20 transition-all cursor-pointer outline-none
                  ${
                    activeIndex === suggestions.length
                      ? 'bg-cyan-500/25 text-cyan-200 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15'
                  }`}
                tabIndex={-1}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-transform inline-block ${activeIndex === suggestions.length ? 'scale-105' : ''}`}
                >
                  + View All Results in Matrix
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
