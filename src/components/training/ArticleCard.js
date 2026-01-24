'use client';
import Link from 'next/link';
import { Clock, ArrowRight, Tag } from 'lucide-react';

export default function ArticleCard({ article }) {
  return (
    <Link href={`/training/${article.slug}`}>
      <article className="group bg-white rounded-xl border-2 border-iron-200 overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all h-full flex flex-col">
        {/* Cover Image */}
        {article.coverImage ? (
          <div className="relative h-40 bg-gray-100 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-3 bg-gradient-to-r from-primary-600 to-secondary-400" />
        )}
        
        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              {article.category}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
            {article.description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-iron-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readingTime} Min. Lesezeit</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              <span>Lesen</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}