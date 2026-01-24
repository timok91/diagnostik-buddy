import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/training');

/**
 * Alle Artikel-Metadaten laden (für Übersichtsseite)
 */
export function getAllArticles() {
  // Prüfen ob Verzeichnis existiert
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.mdx'));
  
  const articles = files.map(filename => {
    const slug = filename.replace('.mdx', '');
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    // Lesezeit berechnen (ca. 200 Wörter pro Minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      category: data.category || 'Allgemein',
      order: data.order || 999,
      readingTime: data.readingTime || readingTime,
      publishedAt: data.publishedAt || null,
      coverImage: data.coverImage || null,
      tags: data.tags || [],
      // Für die Suche: Ersten 500 Zeichen des Contents
      excerpt: content.replace(/[#*`\[\]<>]/g, '').substring(0, 500),
    };
  });
  
  // Nach Order sortieren, dann nach Titel
  return articles.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, 'de');
  });
}

/**
 * Einzelnen Artikel laden (für Detailseite)
 */
export function getArticleBySlug(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  
  // Lesezeit berechnen
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    category: data.category || 'Allgemein',
    order: data.order || 999,
    readingTime: data.readingTime || readingTime,
    publishedAt: data.publishedAt || null,
    coverImage: data.coverImage || null,
    tags: data.tags || [],
    content, // Raw MDX content
  };
}

/**
 * Alle Slugs für Static Generation
 */
export function getAllSlugs() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }
  
  return fs.readdirSync(CONTENT_DIR)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', ''));
}

/**
 * Alle Kategorien extrahieren
 */
export function getAllCategories() {
  const articles = getAllArticles();
  const categories = [...new Set(articles.map(a => a.category))];
  return categories.sort((a, b) => a.localeCompare(b, 'de'));
}

/**
 * Artikel nach Kategorie filtern
 */
export function getArticlesByCategory(category) {
  const articles = getAllArticles();
  return articles.filter(a => a.category === category);
}

/**
 * Nächsten und vorherigen Artikel finden (für Navigation)
 */
export function getAdjacentArticles(currentSlug) {
  const articles = getAllArticles();
  const currentIndex = articles.findIndex(a => a.slug === currentSlug);
  
  return {
    prev: currentIndex > 0 ? articles[currentIndex - 1] : null,
    next: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null,
  };
}

/**
 * Suchindex für Fuse.js erstellen
 */
export function getSearchIndex() {
  const articles = getAllArticles();
  return articles.map(article => ({
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: article.category,
    tags: article.tags.join(' '),
    excerpt: article.excerpt,
  }));
}