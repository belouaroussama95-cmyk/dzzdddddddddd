import React, { useState, useRef } from 'react';
import {
  Calculator,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Search,
  BookOpen,
  HeartPulse,
  Activity
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface MedicalScoresPageProps {
  onNavigate?: (page: string) => void;
}

const MEDICALCUL_BASE_URL = 'https://medicalcul.pages-perso.free.fr/_indexspe.html';

const SPECIALTIES = [
  { id: 'all', label: 'Tous les calculateurs', anchor: '' },
  { id: 'Cardiologie', label: 'Cardiologie', anchor: '#Cardiologie' },
  { id: 'Néphrologie', label: 'Néphrologie', anchor: '#Néphrologie' },
  { id: 'Neurologie', label: 'Neurologie', anchor: '#Neurologie' },
  { id: 'Médecine_dUrgence', label: "Médecine d'Urgence", anchor: '#Médecine_dUrgence' },
  { id: 'Réanimation', label: 'Réanimation', anchor: '#Réanimation' },
  { id: 'Pneumologie', label: 'Pneumologie', anchor: '#Pneumologie' },
  { id: 'Pédiatrie', label: 'Pédiatrie', anchor: '#Pédiatrie' },
  { id: 'Hématologie', label: 'Hématologie', anchor: '#Hématologie' },
  { id: 'Hépato-Gastroentérologie', label: 'Gastro-entérologie', anchor: '#Hépato-Gastroentérologie' },
  { id: 'Gynécologie_Obstétrique', label: 'Gynéco-Obstétrique', anchor: '#Gynécologie_Obstétrique' },
  { id: 'Gériatrie', label: 'Gériatrie', anchor: '#Gériatrie' },
  { id: 'Infectiologie', label: 'Infectiologie', anchor: '#Infectiologie' },
  { id: 'Oncologie', label: 'Oncologie', anchor: '#Oncologie' },
  { id: 'Toxicologie', label: 'Toxicologie', anchor: '#Toxicologie' },
  { id: 'Endocrinologie', label: 'Nutrition / Métabolisme', anchor: '#Nutrition' },
  { id: 'Rhumatologie', label: 'Rhumatologie', anchor: '#Rhumatologie' },
  { id: 'Anesthésie', label: 'Anesthésie', anchor: '#Anesthésie' },
];

export function MedicalScoresPage({ onNavigate }: MedicalScoresPageProps) {
  const { showToast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState(MEDICALCUL_BASE_URL);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSpecialtyClick = (specialty: typeof SPECIALTIES[0]) => {
    setSelectedSpecialty(specialty.id);
    const newUrl = specialty.anchor
      ? `${MEDICALCUL_BASE_URL}${specialty.anchor}`
      : MEDICALCUL_BASE_URL;
    setCurrentUrl(newUrl);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = newUrl;
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
    showToast('Actualisation de Medicalcul...', 'info');
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    showToast('Lien copié dans le presse-papier', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 sm:p-6 max-w-7xl mx-auto space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto max-w-none' : ''}`}>
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-teal-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Scores Médicaux & Calculateurs
              </h1>
              <p className="text-xs sm:text-sm text-teal-200/80">
                Medicalcul — Index par Spécialités (Calculateurs et scores cliniques en ligne)
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            title="Recharger la page"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            title="Copier le lien"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copier l'URL</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Réduire' : 'Plein écran'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ouvrir dans un nouvel onglet</span>
          </button>
        </div>
      </div>

      {/* Specialties Quick Navigation Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Accès Rapide par Spécialité
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {SPECIALTIES.map((spec) => {
            const isActive = selectedSpecialty === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => handleSpecialtyClick(spec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                {spec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Browser-like Toolbar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="font-semibold text-slate-700 hidden sm:inline">Medicalcul en direct :</span>
            </div>
            <div className="flex-1 max-w-xl bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-mono text-[11px] truncate flex items-center justify-between">
              <span className="truncate">{currentUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span className="hidden md:flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Intégration directe
            </span>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Accès direct</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Iframe Viewport */}
        <div className="relative w-full bg-slate-100" style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '780px' }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Chargement de Medicalcul...</p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Medicalcul - Index par Spécialités"
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Footer info & Direct Fallback */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Source officielle : <strong className="text-slate-700">Medicalcul (medicalcul.pages-perso.free.fr)</strong> — Calculateurs médicaux et scores diagnostiques validés.
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenExternal}
            className="text-teal-700 hover:text-teal-800 font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Ouvrir dans une fenêtre dédiée</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
