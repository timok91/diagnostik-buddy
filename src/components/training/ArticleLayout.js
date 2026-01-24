'use client';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Tag, Calendar, Home, BookOpen } from 'lucide-react';

export default function ArticleLayout({ article, prevArticle, nextArticle, children }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-iron-50">
      {/* Header */}
      <header className="bg-white border-b border-iron-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zur Startseite"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <Link
                href="/training"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Training</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative h-64 md:h-80 bg-gray-900">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Article Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Meta Info */}
        <div className="mb-8">
          {/* Category */}
          <Link
            href={`/training?category=${encodeURIComponent(article.category)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors mb-4"
          >
            <Tag className="w-3.5 h-3.5" />
            {article.category}
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Description */}
          {article.description && (
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-iron-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{article.readingTime} Min. Lesezeit</span>
            </div>
            {article.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* MDX Content */}
        <article className="prose prose-lg prose-gray max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-iron-200
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-ul:my-4 prose-ol:my-4
          prose-li:text-gray-700 prose-li:my-1
          prose-blockquote:border-l-primary prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
          prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-img:rounded-xl prose-img:shadow-lg
        ">
          {children}
        </article>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-iron-200">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Schlagwörter</h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-12 pt-8 border-t border-iron-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous */}
            {prevArticle ? (
              <Link
                href={`/training/${prevArticle.slug}`}
                className="group p-4 bg-white rounded-xl border-2 border-iron-200 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Vorheriger Artikel</span>
                </div>
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                  {prevArticle.title}
                </p>
              </Link>
            ) : (
              <div />
            )}

            {/* Next */}
            {nextArticle && (
              <Link
                href={`/training/${nextArticle.slug}`}
                className="group p-4 bg-white rounded-xl border-2 border-iron-200 hover:border-primary-300 hover:shadow-md transition-all text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-2">
                  <span>Nächster Artikel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                  {nextArticle.title}
                </p>
              </Link>
            )}
          </div>
        </nav>

        {/* Back to Overview */}
        <div className="mt-8 text-center">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>
        </div>
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