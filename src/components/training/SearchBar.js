'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';

export default function SearchBar({ articles, onFilter }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Fuse.js Instanz
  const fuse = useMemo(() => {
    return new Fuse(articles, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'category', weight: 0.15 },
        { name: 'tags', weight: 0.1 },
        { name: 'excerpt', weight: 0.05 },
      ],
      threshold: 0.4,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [articles]);

  // Suche ausführen
  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchResults = fuse.search(query).slice(0, 6);
      setResults(searchResults);
      setIsOpen(true);
      
      // Gefilterte Artikel an Parent weitergeben
      if (onFilter) {
        const filteredSlugs = searchResults.map(r => r.item.slug);
        onFilter(filteredSlugs.length > 0 ? filteredSlugs : null);
      }
    } else {
      setResults([]);
      setIsOpen(false);
      if (onFilter) onFilter(null);
    }
  }, [query, fuse, onFilter]);

  // Click outside schließt Dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onFilter) onFilter(null);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Artikel durchsuchen... (⌘K)"
          className="w-full pl-12 pr-12 py-3 bg-white border-2 border-iron-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-iron-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {results.length} Ergebnis{results.length !== 1 ? 'se' : ''}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.map(({ item, matches }) => (
              <Link
                key={item.slug}
                href={`/training/${item.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-primary-50 transition-colors border-t border-iron-100"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {item.description}
                  </p>
                  <span className="inline-block mt-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-iron-200 shadow-xl z-50 p-6 text-center">
          <p className="text-gray-500">Keine Artikel gefunden für "{query}"</p>
        </div>
      )}
    </div>
  );
}