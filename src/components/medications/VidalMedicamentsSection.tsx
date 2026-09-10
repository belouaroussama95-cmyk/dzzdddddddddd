import React from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';

const VIDAL_URL = 'https://www.vidal.fr/medicaments.html';

export function VidalMedicamentsSection() {
  const handleOpenVidal = () => {
    window.open(VIDAL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center max-w-3xl mx-auto space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
        <BookOpen className="w-8 h-8" />
      </div>

      {/* Titles */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Base Médicale Officielle France</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          VIDAL Médicaments
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Consultez la base de référence VIDAL pour accéder aux monographies complètes,
          substances actives (DCI), posologies, contre-indications et interactions médicamenteuses.
        </p>
      </div>

      {/* Direct Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleOpenVidal}
          className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <span>Accéder au site VIDAL Médicaments</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Target URL Reference */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span>Lien direct :</span>
        <a
          href={VIDAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-700 hover:text-teal-800 font-mono font-medium hover:underline"
        >
          {VIDAL_URL}
        </a>
      </div>
    </div>
  );
}
