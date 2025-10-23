'use client';
import { Settings } from 'lucide-react';
import { SessionProvider, useSession } from '@/context/SessionContext';
import Stepper from '@/components/Stepper';
import { useState } from 'react';

function SessionLayoutContent({ children }) {
  const { sessionData, updateSession } = useSession();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-primary/10">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Balanced Six Logo" className="w-30 h-30 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Balanced Six</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.question || 'Assistent für die B6 Kompakt Anwendung'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <h3 className="text-primary font-semibold mb-4">Einstellungen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anthropic API-Key
                </label>
                <input
                  type="password"
                  value={sessionData.apiKey}
                  onChange={(e) => updateSession({ apiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Holen Sie sich einen API-Key auf <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Stepper />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}

export default function SessionLayout({ children }) {
  return (
    <SessionProvider>
      <SessionLayoutContent>{children}</SessionLayoutContent>
    </SessionProvider>
  );
}