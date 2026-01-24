'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Home, BookOpen, Filter, X } from 'lucide-react';
import { ArticleCard, SearchBar } from '@/components/training';

// Artikel werden clientseitig via API geladen
import { useEffect } from 'react';

export default function TrainingPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSlugs, setFilteredSlugs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Artikel laden
  useEffect(() => {
    fetch('/api/training')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setCategories(data.categories || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fehler beim Laden der Artikel:', err);
        setIsLoading(false);
      });
  }, []);

  // Gefilterte Artikel
  const displayedArticles = useMemo(() => {
    let filtered = articles;
    
    // Nach Kategorie filtern
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    // Nach Suche filtern
    if (filteredSlugs) {
      filtered = filtered.filter(a => filteredSlugs.includes(a.slug));
    }
    
    return filtered;
  }, [articles, selectedCategory, filteredSlugs]);

  const handleSearchFilter = (slugs) => {
    setFilteredSlugs(slugs);
    // Bei aktiver Suche Kategoriefilter entfernen
    if (slugs) {
      setSelectedCategory(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setFilteredSlugs(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iron-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-50">
      {/* Header */}
      <header className="bg-white border-b border-iron-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zur Startseite"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Training
              </h1>
              <p className="text-sm text-gray-500">
                Wissen für professionelle Eignungsdiagnostik
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Schulungsmaterial
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Wissenschaftlich fundiertes Wissen zu Beobachtungsfehlern, kognitiven Verzerrungen 
            und Best Practices in der Personalauswahl.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="flex justify-center">
            <SearchBar articles={articles} onFilter={handleSearchFilter} />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-500 mr-2 flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Kategorien:
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-iron-200 hover:border-primary-300'
              }`}
            >
              Alle
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 border border-iron-200 hover:border-primary-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Active Filter Indicator */}
          {(selectedCategory || filteredSlugs) && (
            <div className="flex justify-center">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
              >
                <X className="w-4 h-4" />
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {displayedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedArticles.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Artikel gefunden
            </h3>
            <p className="text-gray-500 mb-4">
              {filteredSlugs 
                ? 'Versuchen Sie einen anderen Suchbegriff.' 
                : 'In dieser Kategorie gibt es noch keine Artikel.'}
            </p>
            <button
              onClick={clearFilters}
              className="text-primary hover:underline"
            >
              Alle Artikel anzeigen
            </button>
          </div>
        )}

        {/* Stats */}
        {articles.length > 0 && (
          <div className="mt-12 text-center text-sm text-gray-500">
            {displayedArticles.length} von {articles.length} Artikel
            {selectedCategory && ` in "${selectedCategory}"`}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-iron-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-500">
            Balanced Six - Wissenschaftlich fundierte Eignungsdiagnostik mit B6 Kompakt
          </p>
        </div>
      </footer>
    </div>
  );
}