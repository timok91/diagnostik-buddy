'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';

export default function SessionPage() {
  const router = useRouter();
  const { sessionData } = useSession();

  useEffect(() => {
    router.push(`/session/${sessionData.currentStep}`);
  }, [sessionData.currentStep, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  );
}