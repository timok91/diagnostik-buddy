'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-primary-900 mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-primary-800 mt-4 mb-2 pb-1 border-b border-iron-200 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-primary-800 mt-3 mb-1 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-primary-800 mt-2 mb-1 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-primary-800 mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc ml-4 text-sm space-y-1 mb-2 text-primary-800">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-4 text-sm space-y-1 mb-2 text-primary-800">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-primary-800">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-primary-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-primary-800">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-secondary bg-secondary-50 pl-3 pr-3 py-1 my-2 rounded-r-lg italic text-primary-800">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code className="bg-primary-50 text-primary-800 px-1.5 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm divide-y divide-iron-200 border border-iron-200 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-iron-50">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-iron-200 bg-white">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-iron-50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-primary-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-primary-800">{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-iron-200" />,
};

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
