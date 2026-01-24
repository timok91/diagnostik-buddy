'use client';
import { Info, AlertTriangle, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';

const variants = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-accent-50',
    borderColor: 'border-accent-200',
    iconColor: 'text-amber-700',
    titleColor: 'text-amber-900',
  },
  definition: {
    icon: BookOpen,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-900',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
  },
};

export default function Callout({ type = 'info', title, children }) {
  const variant = variants[type] || variants.info;
  const Icon = variant.icon;
  
  return (
    <div className={`my-6 rounded-xl border-2 ${variant.borderColor} ${variant.bgColor} overflow-hidden`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${variant.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-semibold ${variant.titleColor} mb-1`}>
                {title}
              </h4>
            )}
            <div className="text-gray-700 prose-sm prose-p:my-1 prose-p:leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}