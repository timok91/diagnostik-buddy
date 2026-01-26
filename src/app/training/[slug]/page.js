import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getArticleBySlug, getAllSlugs, getAdjacentArticles } from '@/lib/training';
import { ArticleLayout } from '@/components/training';
import { Callout, Video, KeyTakeaway } from '@/components/training';


// MDX Components
const mdxComponents = {
  Callout,
  Video,
  KeyTakeaway,
  // Standard HTML-Elemente mit Custom Styling
  h1: (props) => <h1 className="text-3xl font-bold mt-8 mb-4 text-primary-900" {...props} />,
  h2: (props) => <h2 className="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-iron-200 text-primary-800" {...props} />,
  h3: (props) => <h3 className="text-xl font-semibold mt-8 mb-3 text-primary-800" {...props} />,
  p: (props) => <p className="my-4 leading-relaxed text-primary-800" {...props} />,
  ul: (props) => <ul className="my-4 ml-6 list-disc space-y-2 text-primary-800" {...props} />,
  ol: (props) => <ol className="my-4 ml-6 list-decimal space-y-2 text-primary-800" {...props} />,
  li: (props) => <li className="leading-relaxed text-primary-800" {...props} />,
  strong: (props) => <strong className="font-semibold text-primary-900" {...props} />,
  em: (props) => <em className="italic text-primary-800" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-6 pl-4 border-l-4 border-secondary bg-secondary-50 py-2 pr-4 rounded-r-lg italic text-primary-800" {...props} />
  ),
  a: (props) => (
    <a className="text-primary hover:underline font-medium" target={props.href?.startsWith('http') ? '_blank' : undefined} {...props} />
  ),
  code: (props) => {
    // Inline code vs code block
    if (props.className) {
      // Code block (has language class)
      return <code {...props} />;
    }
    return <code className="text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />;
  },
  pre: (props) => (
    <pre className="my-6 p-4 bg-gray-900 text-gray-100 rounded-xl overflow-x-auto text-sm" {...props} />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-iron-200 border border-iron-200 rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-iron-50" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-iron-200 bg-white" {...props} />,
  tr: (props) => <tr className="hover:bg-iron-50 transition-colors" {...props} />,
  th: (props) => <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900" {...props} />,
  td: (props) => <td className="px-4 py-3 text-sm text-primary-800" {...props} />,
  hr: () => <hr className="my-8 border-iron-200" />,
  img: (props) => (
    <figure className="my-6">
      <img className="rounded-xl shadow-lg w-full" {...props} />
      {props.alt && <figcaption className="mt-2 text-sm text-center text-primary-500">{props.alt}</figcaption>}
    </figure>
  ),
};

// Static Params für Build-Zeit Generation
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

// Metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  
  if (!article) {
    return { title: 'Artikel nicht gefunden' };
  }
  
  return {
    title: `${article.title} | Training | Balanced Six`,
    description: article.description,
  };
}

// Page Component
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  
  if (!article) {
    notFound();
  }
  
  const { prev, next } = getAdjacentArticles(slug);
  
  return (
    <ArticleLayout article={article} prevArticle={prev} nextArticle={next}>
      <MDXRemote 
        source={article.content} 
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </ArticleLayout>
  );
}