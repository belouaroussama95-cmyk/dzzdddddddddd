import React from 'react';
import { Palette, RotateCcw, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import {
  ORDONNANCE_COLOR_THEMES,
  POPULAR_ACCENT_SWATCHES,
  POPULAR_BODY_SWATCHES,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BODY_COLOR,
  type OrdonnanceColorTheme,
} from './ordonnanceTheme';

interface OrdonnanceColorControlsProps {
  accentColor: string;
  bodyTextColor: string;
  onChangeAccentColor: (color: string) => void;
  onChangeBodyTextColor: (color: string) => void;
  onApplyTheme: (theme: OrdonnanceColorTheme) => void;
  onApplyMonochrome: (color: string) => void;
  onResetDefaults: () => void;
  compact?: boolean;
}

export const OrdonnanceColorControls: React.FC<OrdonnanceColorControlsProps> = ({
  accentColor,
  bodyTextColor,
  onChangeAccentColor,
  onChangeBodyTextColor,
  onApplyTheme,
  onApplyMonochrome,
  onResetDefaults,
  compact = false,
}) => {
  const isDefault = accentColor.toLowerCase() === DEFAULT_ACCENT_COLOR.toLowerCase() &&
    bodyTextColor.toLowerCase() === DEFAULT_BODY_COLOR.toLowerCase();

  const isMonochrome = accentColor.toLowerCase() === bodyTextColor.toLowerCase();

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span>Couleurs d'Impression de l'Ordonnance</span>
              {isMonochrome && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  Monochrome
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">
              Personnalisez la couleur des titres, du nom du médecin, des médicaments et des posologies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onApplyMonochrome(accentColor)}
            title="Applique la couleur des titres à l'ensemble des textes"
            className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              isMonochrome
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Texte 100% Monochrome</span>
          </button>

          {!isDefault && (
            <button
              type="button"
              onClick={onResetDefaults}
              title="Rétablir les couleurs officielles par défaut"
              className="px-2.5 py-1 text-[11px] rounded-lg font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Themes */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
          Thèmes Prédéfinis (1 Clic)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ORDONNANCE_COLOR_THEMES.map((theme) => {
            const isThemeActive =
              accentColor.toLowerCase() === theme.accentColor.toLowerCase() &&
              bodyTextColor.toLowerCase() === theme.bodyTextColor.toLowerCase();

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onApplyTheme(theme)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isThemeActive
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-2 ring-sky-400/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Swatch accent */}
                    <span
                      className="w-4 h-4 rounded-full shadow-2xs border border-white/80 shrink-0"
                      style={{ backgroundColor: theme.accentColor }}
                      title={`Titres: ${theme.accentColor}`}
                    />
                    {/* Swatch body */}
                    <span
                      className="w-4 h-4 rounded-full shadow-2xs border border-white/80 shrink-0 -ml-2"
                      style={{ backgroundColor: theme.bodyTextColor }}
                      title={`Corps: ${theme.bodyTextColor}`}
                    />
                  </div>
                  {isThemeActive && (
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-xs leading-tight">{theme.name}</div>
                  {!compact && (
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{theme.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Fine-Tuning Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        {/* Accent Color: Doctor Name, Labels, Strength */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Titres & Accents
              </span>
              <span className="text-[10px] text-slate-500">
                Nom praticien, libellés (Patient, Posologie), dosages
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onChangeAccentColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Choisir une couleur personnalisée"
              />
              <span className="font-mono text-[11px] font-bold text-slate-700 select-all">
                {accentColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Swatches */}
          <div className="flex flex-wrap items-center gap-1.5">
            {POPULAR_ACCENT_SWATCHES.map((swatch) => {
              const isSelected = accentColor.toLowerCase() === swatch.color.toLowerCase();
              return (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => onChangeAccentColor(swatch.color)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-800 bg-white text-slate-900 shadow-2xs ring-1 ring-slate-800'
                      : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                  }`}
                  title={swatch.label}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <span>{swatch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Text Color: Medication Names, Posology, Patient Values */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Médicaments & Données Cliniques
              </span>
              <span className="text-[10px] text-slate-500">
                Noms des molécules, posologies, nom du patient, date
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <input
                type="color"
                value={bodyTextColor}
                onChange={(e) => onChangeBodyTextColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Choisir une couleur personnalisée"
              />
              <span className="font-mono text-[11px] font-bold text-slate-700 select-all">
                {bodyTextColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Swatches */}
          <div className="flex flex-wrap items-center gap-1.5">
            {POPULAR_BODY_SWATCHES.map((swatch) => {
              const isSelected = bodyTextColor.toLowerCase() === swatch.color.toLowerCase();
              return (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => onChangeBodyTextColor(swatch.color)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-800 bg-white text-slate-900 shadow-2xs ring-1 ring-slate-800'
                      : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                  }`}
                  title={swatch.label}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <span>{swatch.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Sample Preview Strip */}
      <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aperçu en direct :</span>
          <span style={{ color: accentColor }} className="font-extrabold text-sm">
            Dr. Praticien
          </span>
          <span className="text-slate-300">•</span>
          <span style={{ color: accentColor }} className="font-bold text-xs">
            Posologie :
          </span>
          <span style={{ color: bodyTextColor }} className="font-semibold text-xs">
            1. AMOXICILLINE 1g • 2 / Jour
          </span>
        </div>
        <span className="text-[10px] text-slate-400 italic">
          Couleurs enregistrées et appliquées directement à l'impression
        </span>
      </div>
    </div>
  );
};
