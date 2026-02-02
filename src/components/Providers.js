'use client';
import { ToastProvider } from './Toast';

export function Providers({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
