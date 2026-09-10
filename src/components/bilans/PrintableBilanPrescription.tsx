import React, { useEffect, useState, useRef } from 'react';
import {
  Printer,
  Share2,
  Check,
  Clock,
  AlertTriangle,
  Sliders,
  RotateCcw,
  Sparkles,
  TestTube2,
  Layers,
  FileText,
  Upload,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import type { BilanPrescription, ClinicSettings, DoctorProfile } from '../../types';
import { useToast } from '../../context/ToastContext';
import defaultTemplatePng from '../../assets/ordonnance-template.png';
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BODY_COLOR,
  STORAGE_KEY_ACCENT,
  STORAGE_KEY_BODY,
  type OrdonnanceColorTheme,
} from '../prescriptions/ordonnanceTheme';
import { OrdonnanceColorControls } from '../prescriptions/OrdonnanceColorControls';

interface PrintableBilanPrescriptionProps {
  bilan: BilanPrescription;
  clinicSettings?: ClinicSettings;
  doctorProfile?: DoctorProfile;
  onBack?: () => void;
  autoPrint?: boolean;
}

export function PrintableBilanPrescription({
  bilan,
  clinicSettings,
  doctorProfile,
  onBack,
  autoPrint = false
}: PrintableBilanPrescriptionProps) {
  const [copied, setCopied] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Print Mode: 'full' (background PNG template + overlaid text) or 'text-only' (only overlay text on pre-printed paper)
  const [printMode, setPrintMode] = useState<'full' | 'text-only'>('full');
  // Fine vertical calibration offset (in millimeters)
  const [verticalOffsetMm, setVerticalOffsetMm] = useState<number>(0);

  // Text color customization state (Title/Accents vs Body/Medications)
  const [accentColor, setAccentColor] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY_ACCENT) ||
      clinicSettings?.accentColor ||
      DEFAULT_ACCENT_COLOR
    );
  });

  const [bodyTextColor, setBodyTextColor] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY_BODY) ||
      DEFAULT_BODY_COLOR
    );
  });

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem(STORAGE_KEY_ACCENT, color);
  };

  const handleBodyTextColorChange = (color: string) => {
    setBodyTextColor(color);
    localStorage.setItem(STORAGE_KEY_BODY, color);
  };

  const handleApplyTheme = (theme: OrdonnanceColorTheme) => {
    setAccentColor(theme.accentColor);
    setBodyTextColor(theme.bodyTextColor);
    localStorage.setItem(STORAGE_KEY_ACCENT, theme.accentColor);
    localStorage.setItem(STORAGE_KEY_BODY, theme.bodyTextColor);
    showToast('success', 'Thème de couleur appliqué', `Modèle "${theme.name}" sélectionné.`);
  };

  const handleApplyMonochrome = (color: string) => {
    setAccentColor(color);
    setBodyTextColor(color);
    localStorage.setItem(STORAGE_KEY_ACCENT, color);
    localStorage.setItem(STORAGE_KEY_BODY, color);
    showToast('success', 'Couleur monochrome appliquée', `Tout le texte du bilan est désormais unifié en ${color}.`);
  };

  const handleResetColors = () => {
    setAccentColor(DEFAULT_ACCENT_COLOR);
    setBodyTextColor(DEFAULT_BODY_COLOR);
    localStorage.removeItem(STORAGE_KEY_ACCENT);
    localStorage.removeItem(STORAGE_KEY_BODY);
    showToast('info', 'Couleurs réinitialisées', 'Les couleurs d’impression par défaut ont été rétablies.');
  };

  // PNG template state: defaults to official template PNG, supports doctor's custom PNG upload
  const [templatePngUrl, setTemplatePngUrl] = useState<string>(() => {
    return localStorage.getItem('ordocare_custom_ordonnance_png') || defaultTemplatePng;
  });

  // Customizer state for instant live changes matching the official prescription model
  const [customDoctorName, setCustomDoctorName] = useState(
    doctorProfile?.name || bilan.doctorName || 'Dr. Oussama Belouar'
  );
  const [customSpecialty, setCustomSpecialty] = useState(
    doctorProfile?.specialty || bilan.doctorSpecialty || 'Médecine Générale & Thérapeutique'
  );
  const [customTagline, setCustomTagline] = useState(
    clinicSettings?.tagline || 'Cabinet Médical & Soins Spécialisés'
  );
  const [customClinicPhone, setCustomClinicPhone] = useState(
    clinicSettings?.phone || bilan.clinicPhone || '+213 21 00 11 22'
  );
  const [customClinicEmail, setCustomClinicEmail] = useState(
    clinicSettings?.email || (bilan as any).clinicEmail || 'contact@cabinet-belouar.dz'
  );
  const [customClinicWebsite, setCustomClinicWebsite] = useState(
    clinicSettings?.website || 'www.cabinet-belouar.dz'
  );
  const [customClinicAddress, setCustomClinicAddress] = useState(
    clinicSettings?.address || bilan.clinicAddress || '12 Boulevard des Frères Bouadou, Alger'
  );
  const [customPatientAddress, setCustomPatientAddress] = useState(
    'Alger, Algérie'
  );
  const [customPatientInsurance, setCustomPatientInsurance] = useState(
    'CNAS / CASNOS (Assuré)'
  );
  const [customIndication, setCustomIndication] = useState(
    bilan.clinicalIndication || 'Bilan biologique et exploration clinique'
  );

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        showToast('success', 'Lien copié', 'Lien de la demande d’analyses copié dans le presse-papier.');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      showToast('info', 'Demande d’analyses', bilan.prescriptionNumber);
    }
  };

  const handleCustomPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      showToast('warning', 'Format requis', 'Veuillez sélectionner une image au format PNG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setTemplatePngUrl(result);
        localStorage.setItem('ordocare_custom_ordonnance_png', result);
        showToast('success', 'Modèle PNG appliqué', 'Votre modèle d’ordonnance PNG a été appliqué avec succès.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPng = () => {
    setTemplatePngUrl(defaultTemplatePng);
    localStorage.removeItem('ordocare_custom_ordonnance_png');
    showToast('info', 'Modèle officiel rétabli', 'Le modèle d’ordonnance officiel PNG a été réinitialisé.');
  };

  const isCustomPng = templatePngUrl !== defaultTemplatePng && templatePngUrl !== '/ordonnance-template.png';

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar (Hidden during browser print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ← Retour
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Demande de Bilan & Analyses Biologiques (PNG)</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                    {bilan.prescriptionNumber}
                  </span>
                </h2>
                {printMode === 'full' ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-emerald-600" />
                    Modèle PNG affiché
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-700" />
                    Texte Seul (PNG masqué)
                  </span>
                )}
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-600" />
                  Texte superposé
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1">
                  <Printer className="w-3 h-3 text-indigo-600" />
                  Format A5 (148 × 210 mm)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {printMode === 'full'
                  ? "Le modèle d’ordonnance PNG original est préservé sans altération avec les analyses superposées."
                  : "Mode Texte Seul actif : Le modèle PNG d'arrière-plan est complètement masqué. Seules les analyses seront imprimées sur votre papier officiel."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Print Mode Selector: Full Model vs Overlay Text Only (for pre-printed paper) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  printMode === 'full'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Imprime le modèle PNG complet avec le texte des analyses superposé"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modèle Complet (PNG + Texte)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('text-only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  printMode === 'text-only'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Masque le modèle PNG à l'impression pour imprimer le texte seul sur vos feuilles pré-imprimées"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Texte Seul (Papier pré-imprimé)</span>
              </button>
            </div>

            {/* Quick Text Color Trigger */}
            <button
              type="button"
              onClick={() => setShowCustomizer(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Personnaliser les couleurs d'impression (titres, médecin, analyses)"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Couleur du texte</span>
              <div className="flex items-center -space-x-1 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: accentColor }}
                  title={`Titres : ${accentColor}`}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: bodyTextColor }}
                  title={`Corps : ${bodyTextColor}`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showCustomizer ? 'Masquer options' : 'Options & Calibrage'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Partager'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>

        {/* Live Customizer & Calibration Drawer */}
        {showCustomizer && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4 text-xs">
            {/* Color Controls (Titles/Accents & Body/Analyses) */}
            <OrdonnanceColorControls
              accentColor={accentColor}
              bodyTextColor={bodyTextColor}
              onChangeAccentColor={handleAccentColorChange}
              onChangeBodyTextColor={handleBodyTextColorChange}
              onApplyTheme={handleApplyTheme}
              onApplyMonochrome={handleApplyMonochrome}
              onResetDefaults={handleResetColors}
            />

            {/* PNG Model Selector */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">
                    Source du Modèle d'Ordonnance PNG :
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isCustomPng ? 'Modèle PNG personnalisé chargé' : 'Modèle PNG officiel par défaut (tel quel, sans altération)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleCustomPngUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Charger un autre PNG...</span>
                </button>
                {isCustomPng && (
                  <button
                    type="button"
                    onClick={handleResetPng}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rétablir PNG officiel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fine Calibration Offset for Physical Paper Printing */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-800 block">
                  Calibrage d'alignement de l'overlay (Décalage Vertical) : {verticalOffsetMm > 0 ? `+${verticalOffsetMm}` : verticalOffsetMm} mm
                </span>
                <span className="text-[11px] text-slate-500">
                  Ajustez avec précision la position du texte si votre imprimante ou papier pré-imprimé a des marges physiques spécifiques.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-25"
                  max="25"
                  step="1"
                  value={verticalOffsetMm}
                  onChange={e => setVerticalOffsetMm(Number(e.target.value))}
                  className="w-40 accent-sky-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setVerticalOffsetMm(0)}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium cursor-pointer"
                >
                  0 mm (Défaut)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Médecin</label>
                <input
                  type="text"
                  value={customDoctorName}
                  onChange={e => setCustomDoctorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualification / Titre</label>
                <input
                  type="text"
                  value={customSpecialty}
                  onChange={e => setCustomSpecialty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Établissement / Titre</label>
                <input
                  type="text"
                  value={customTagline}
                  onChange={e => setCustomTagline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Indication Clinique</label>
                <input
                  type="text"
                  value={customIndication}
                  onChange={e => setCustomIndication(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone de Contact</label>
                <input
                  type="text"
                  value={customClinicPhone}
                  onChange={e => setCustomClinicPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="text"
                  value={customClinicEmail}
                  onChange={e => setCustomClinicEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Web</label>
                <input
                  type="text"
                  value={customClinicWebsite}
                  onChange={e => setCustomClinicWebsite(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse du Cabinet</label>
                <input
                  type="text"
                  value={customClinicAddress}
                  onChange={e => setCustomClinicAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setCustomDoctorName(doctorProfile?.name || 'Dr. Oussama Belouar');
                    setCustomSpecialty(doctorProfile?.specialty || 'Médecine Générale & Thérapeutique');
                    setCustomTagline(clinicSettings?.tagline || 'Cabinet Médical & Soins Spécialisés');
                    setCustomClinicPhone(clinicSettings?.phone || '+213 21 00 11 22');
                    setCustomClinicEmail(clinicSettings?.email || 'contact@cabinet-belouar.dz');
                    setCustomClinicWebsite(clinicSettings?.website || 'www.cabinet-belouar.dz');
                    setCustomClinicAddress(clinicSettings?.address || '12 Boulevard des Frères Bouadou, Alger');
                    setCustomPatientAddress('Alger, Algérie');
                    setCustomPatientInsurance('CNAS / CASNOS (Assuré)');
                    setCustomIndication(bilan.clinicalIndication || 'Bilan biologique et exploration clinique');
                    setVerticalOffsetMm(0);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rétablir paramètres</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Sheet Container */}
      <div className="printable-prescription-wrapper flex justify-center overflow-x-auto p-2 sm:p-4 bg-slate-200/50 rounded-2xl">
        {/* ========================================================================= */}
        {/* MODÈLE UNIQUE D'ORDONNANCE BILAN : MODÈLE PNG + TEXTE CLINIQUE (A5)        */}
        {/* ========================================================================= */}
        <div
          ref={printRef}
          id="printable-a5-sheet"
          className={`printable-sheet bg-white text-slate-900 w-full max-w-[640px] aspect-[148/210] min-h-[900px] shadow-xl rounded-xl border border-slate-200 relative overflow-hidden flex flex-col justify-between ${
            printMode === 'text-only' ? 'print-text-only' : ''
          }`}
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: bodyTextColor,
            // @ts-ignore
            '--rx-accent-color': accentColor,
            '--rx-text-color': bodyTextColor,
          }}
        >
          {/* ======================================================================= */}
          {/* COUCHE 1 : LE MODÈLE D'ORDONNANCE EN PNG BRUT                           */}
          {/* Masqué totalement en mode "Texte Seul" pour papier pré-imprimé         */}
          {/* ======================================================================= */}
          {printMode !== 'text-only' && (
            <div className="ordonnance-model-layer absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
              <img
                src={templatePngUrl}
                alt="Modèle d'Ordonnance Officiel PNG"
                className="w-full h-full object-fill block"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* ======================================================================= */}
          {/* COUCHE 2 : LE CALQUE DE TEXTE CLINIQUE SUPERPOSÉ (Text Overlay Layer)   */}
          {/* S'ajuste avec une précision absolue sur les zones du modèle PNG         */}
          {/* ======================================================================= */}
          <div
            className="ordonnance-text-overlay relative z-10 w-full h-full flex flex-col justify-between px-8 sm:px-12 pointer-events-auto"
            style={{
              transform: verticalOffsetMm !== 0 ? `translateY(${verticalOffsetMm * 3.78}px)` : undefined,
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* 2.1 EN-TÊTE PRATICIEN : En haut à droite */}
            <div className="h-[145px] sm:h-[155px] flex items-start justify-end pt-5 sm:pt-6 shrink-0">
              <div className="text-right max-w-[65%]">
                <h2
                  style={{ color: accentColor }}
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                >
                  {customDoctorName}
                </h2>
                <p
                  style={{ color: accentColor, opacity: 0.9 }}
                  className="text-xs sm:text-sm font-semibold tracking-wide mt-0.5"
                >
                  {customSpecialty}
                </p>
                <p
                  style={{ color: accentColor, opacity: 0.75 }}
                  className="text-[11px] sm:text-xs font-medium mt-0.5"
                >
                  {customTagline}
                </p>
              </div>
            </div>

            {/* 2.2 INFORMATIONS PATIENT : À droite du Caducée présent dans le PNG */}
            <div className="pt-2 pb-2 shrink-0">
              <div className="flex items-center gap-6 sm:gap-8">
                {/* Espace réservé pour le Caducée bleu à gauche */}
                <div className="w-20 sm:w-28 shrink-0" />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:text-sm ordonnance-patient-grid">
                  {/* Colonne Gauche */}
                  <div className="space-y-1.5">
                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Patient :
                      </span>
                      <span style={{ color: bodyTextColor }} className="font-extrabold text-sm sm:text-base leading-tight">
                        {bilan.patientName}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Âge / Sexe :
                      </span>
                      <span style={{ color: bodyTextColor }} className="font-semibold">
                        {bilan.patientAge ? `${bilan.patientAge} ans` : 'N/R'}{' '}
                        {bilan.patientSex ? `• ${bilan.patientSex === 'Male' ? 'Homme' : bilan.patientSex === 'Female' ? 'Femme' : bilan.patientSex}` : ''}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Adresse :
                      </span>
                      <span style={{ color: bodyTextColor, opacity: 0.9 }} className="font-medium truncate">
                        {customPatientAddress}
                      </span>
                    </p>
                  </div>

                  {/* Colonne Droite */}
                  <div className="space-y-1.5">
                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Date :
                      </span>
                      <span style={{ color: bodyTextColor }} className="font-bold">
                        {bilan.date}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Réf. Bilan :
                      </span>
                      <span style={{ color: accentColor }} className="font-mono font-bold text-xs">
                        {bilan.prescriptionNumber}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Indication :
                      </span>
                      <span style={{ color: bodyTextColor, opacity: 0.9 }} className="font-medium truncate">
                        {customIndication}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.3 CORPS DU BILAN : Analyses Biologiques & Instructions Laboratoire */}
            <div className="py-4 flex-1 flex flex-col justify-between">
              <div>
                <div
                  style={{ borderColor: accentColor }}
                  className="flex items-center justify-between border-b pb-2 mb-3"
                >
                  <div className="flex items-center gap-2">
                    <TestTube2 className="w-5 h-5" style={{ color: accentColor }} />
                    <h3
                      style={{ color: accentColor }}
                      className="text-sm sm:text-base font-black tracking-wide uppercase"
                    >
                      Demande d'Analyses Biologiques & Médicales
                    </h3>
                  </div>
                  <span style={{ color: bodyTextColor, opacity: 0.7 }} className="text-[11px] font-semibold italic">
                    Laboratoire d'analyses médicales
                  </span>
                </div>

                {/* Flags Jeûne & Urgence */}
                {(bilan.fastingRequired || bilan.urgent) && (
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    {bilan.fastingRequired && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>À JEUN STRICT RECOMMANDÉ (10 À 12 HEURES)</span>
                      </div>
                    )}
                    {bilan.urgent && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>URGENT — TRANSMISSION RAPIDE DES RÉSULTATS</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Liste des analyses requises */}
                <div className="space-y-3.5 pl-2 sm:pl-3">
                  {bilan.items.map((item, index) => (
                    <div
                      key={index}
                      style={{ borderColor: accentColor, borderBottomColor: `${accentColor}25` }}
                      className="flex items-center justify-between gap-4 py-1 border-b"
                    >
                      <div className="flex items-baseline gap-3">
                        <span style={{ color: accentColor }} className="font-bold text-sm shrink-0">
                          {index + 1}.
                        </span>
                        <span style={{ color: bodyTextColor }} className="font-bold text-sm sm:text-base tracking-tight">
                          {item.toUpperCase()}
                        </span>
                      </div>
                      <div
                        style={{ borderColor: accentColor }}
                        className="w-4 h-4 rounded border-2 shrink-0 opacity-70"
                      />
                    </div>
                  ))}
                </div>

                {/* Directives laboratoires */}
                {bilan.additionalNotes && (
                  <div
                    style={{ borderColor: accentColor, borderLeftWidth: '3px' }}
                    className="mt-7 p-3 rounded-xl border bg-slate-50/80 text-xs"
                  >
                    <p
                      style={{ color: accentColor }}
                      className="font-bold uppercase tracking-wider text-[10px] mb-1"
                    >
                      Instructions particulières pour le laboratoire :
                    </p>
                    <p style={{ color: bodyTextColor }} className="leading-relaxed font-medium">
                      {bilan.additionalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* 2.4 BAS DE PAGE : Espace dégagé réservé au cachet physique et à la signature manuscrite du médecin */}
              <div className="flex items-end justify-between px-2 mb-4 shrink-0 min-h-[100px]">
                {/* Zone gauche dégagée */}
                <div className="max-w-xs" />

                {/* Zone droite : Entièrement vierge pour l'apposition du cachet et signature physiques */}
                <div className="w-56 sm:w-64 h-24 sm:h-28" />
              </div>
            </div>

            {/* 2.5 PIED DE PAGE : Coordonnées du Cabinet */}
            {(() => {
              const footerColor = printMode === 'text-only' ? bodyTextColor : '#ffffff';
              return (
                <div
                  style={{ color: footerColor }}
                  className="h-10 flex items-center justify-between pb-3 pt-1 text-[10px] sm:text-xs font-medium shrink-0"
                >
                  <div className="pl-4 truncate max-w-[24%]">
                    <span className="truncate">{customClinicPhone}</span>
                  </div>

                  <div className="pl-2 truncate max-w-[24%]">
                    <span className="truncate">{customClinicEmail}</span>
                  </div>

                  <div className="pl-2 truncate max-w-[24%]">
                    <span className="truncate">{customClinicWebsite}</span>
                  </div>

                  <div className="pr-4 truncate max-w-[28%] text-right">
                    <span className="truncate">{customClinicAddress}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
