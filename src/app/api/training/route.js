import { NextResponse } from 'next/server';
import { getAllArticles, getAllCategories } from '@/lib/training';

export async function GET() {
  try {
    const articles = getAllArticles();
    const categories = getAllCategories();
    
    return NextResponse.json({
      articles,
      categories,
    });
  } catch (error) {
    console.error('Fehler beim Laden der Artikel:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Artikel', articles: [], categories: [] },
      { status: 500 }
    );
  }
}