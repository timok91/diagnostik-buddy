'use client';

import dynamic from 'next/dynamic';

const DiagnostikBuddy = dynamic(() => import('./DiagnostikBuddy'), {
  ssr: false
});

export default function Home() {
  return <DiagnostikBuddy />;
}