'use client';
import { CheckCircle2 } from 'lucide-react';

export default function KeyTakeaway({ title = "Das Wichtigste in Kürze", children }) {
  return (
    <div className="my-8 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border-2 border-primary-200 overflow-hidden">
      <div className="px-5 py-3 bg-primary-100/50 border-b border-primary-200">
        <h4 className="font-semibold text-primary-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {title}
        </h4>
      </div>
      <div className="px-5 py-4">
        <div className="text-primary-800 prose-sm prose-ul:my-2 prose-li:my-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}