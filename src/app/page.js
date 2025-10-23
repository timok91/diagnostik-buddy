'use client';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-primary/10 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <img src="/logo.png" alt="Balanced Six Logo" className="w-60 h-60 object-contain" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Balanced Six
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Assistent für die B6 Kompakt Anwendung
          </p>

          {/* Description */}
          <div className="text-left mb-8 space-y-3 text-gray-700">
            <p>
              Dieser Assistent unterstützt Sie dabei, hochwertige Assessments durchzuführen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Systematische Anforderungsanalyse</li>
              <li>Differenzierte Interpretation von B6 Kompakt Ergebnissen</li>
              <li>Strukturierte Interview-Vorbereitung</li>
              <li>Export professioneller Dokumente</li>
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/session')}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-8 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-semibold group"
          >
            Neue Session starten
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Info */}
          <p className="mt-6 text-sm text-gray-500">
            Für jedes Assessment sollte eine separate Session verwendet werden
          </p>
        </div>
      </div>
    </div>
  );
}