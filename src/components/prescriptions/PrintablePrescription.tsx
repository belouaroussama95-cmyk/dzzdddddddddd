import React, { useState, useRef } from 'react';
import {
  Printer,
  Share2,
  Check,
  Sliders,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Upload,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import type { Prescription, ClinicSettings, DoctorProfile } from '../../types';
import { useToast } from '../../context/ToastContext';
import defaultTemplatePng from '../../assets/ordonnance-template.png';
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BODY_COLOR,
  STORAGE_KEY_ACCENT,
  STORAGE_KEY_BODY,
  type OrdonnanceColorTheme,
} from './ordonnanceTheme';
import { OrdonnanceColorControls } from './OrdonnanceColorControls';

interface PrintablePrescriptionProps {
  prescription: Prescription;
  clinicSettings?: ClinicSettings;
  doctorProfile?: DoctorProfile;
  onBack?: () => void;
  standalone?: boolean;
}

/**
 * Format dosage form cleanly: "Cp" instead of "(Comprimé • Oral)", "Gél", "Syr", etc.
 */
function formatDosageForm(dosageForm?: string, _route?: string): string {
  if (!dosageForm) return '';
  const df = dosageForm.toLowerCase().trim();
  if (df.includes('comprim') || df.includes('tablet') || df === 'cp') {
    return 'Cp';
  }
  if (df.includes('gélul') || df.includes('gelul') || df.includes('capsul')) {
    return 'Gél';
  }
  if (df.includes('sirop') || df.includes('syrup')) {
    return 'Syr';
  }
  if (df.includes('inject') || df.includes('ampoul')) {
    return 'Inj';
  }
  if (df.includes('sachet')) {
    return 'Sach';
  }
  if (df.includes('goutte')) {
    return 'Gttes';
  }
  if (df.includes('pommade') || df.includes('crème') || df.includes('creme')) {
    return 'Pde';
  }
  if (df.includes('suppo')) {
    return 'Suppo';
  }
  if (df.includes('collyre')) {
    return 'Coll';
  }
  if (df.includes('aérosol') || df.includes('aerosol') || df.includes('spray') || df.includes('inhal')) {
    return 'Spray';
  }
  if (df.includes('solution') || df.includes('sol buv')) {
    return 'Sol';
  }
  return dosageForm;
}

/**
 * Format quantity: "1 bt" instead of "1 boîte de 30 cp", "1 boîte", etc.
 */
function formatQuantity(qty?: string): string {
  if (!qty) return '1 bt';
  let q = qty.trim();

  // "1 boîte de 30 cp", "1 boîte (30 jours)", "1 boîte", etc. -> "$1 bt"
  q = q.replace(/(\d+)\s*(?:boîtes?|boites?)(?:\s+de\s+\d+\s*(?:cp|comprimés?|gélules?|sachets?|capsules?))?(?:\s*\([^)]*\))?/gi, '$1 bt');
  // Starts with boîte/boite without leading number -> "1 bt"
  q = q.replace(/^(?:boîte|boite)\b(?:\s+de\s+\d+\s*(?:cp|comprimés?|gélules?|sachets?))?/gi, '1 bt');
  // Replaces standalone boîtes/boites with bt
  q = q.replace(/\bboîtes?\b|\bboites?\b/gi, 'bt');
  // Replace underscores placeholder "_____ boîte(s)"
  q = q.replace(/_{2,}\s*(?:boîte\(s\)|boite\(s\)|boîtes?|boites?)/gi, '1 bt');
  return q;
}

/**
 * Format frequency: "1 / J" instead of "1 fois par jour le matin", "1 fois par jour", etc.
 */
function formatFrequency(frequency?: string): string {
  if (!frequency) return '';
  let f = frequency.trim();
  f = f.replace(/(\d+)\s*fois\s+par\s+jour(?:\s+(?:le\s+matin|le\s+soir|le\s+midi|au\s+coucher))?(?:\s*\([^)]*\))?/gi, '$1 / J');
  f = f.replace(/1\s*fois\s+par\s+jour\b/gi, '1 / J');
  f = f.replace(/2\s*fois\s+par\s+jour\b/gi, '2 / J');
  f = f.replace(/3\s*fois\s+par\s+jour\b/gi, '3 / J');
  f = f.replace(/4\s*fois\s+par\s+jour\b/gi, '4 / J');
  f = f.replace(/(\d+)\s*(?:x|\*)\s*\/\s*j(?:our)?/gi, '$1 / J');
  f = f.replace(/\bune\s+fois\s+par\s+jour\b/gi, '1 / J');
  return f;
}

/**
 * Format duration: strip "(renouvelable 3 mois)", "renouvelable ...", etc.
 */
function formatDuration(duration?: string): string {
  if (!duration) return '';
  let d = duration.trim();
  d = d.replace(/\s*\(?\s*renouvelable(?:\s+\d+\s*(?:mois|x|fois))?\s*\)?/gi, '');
  return d.trim();
}

export function PrintablePrescription({
  prescription,
  clinicSettings,
  doctorProfile,
  onBack,
  standalone = false
}: PrintablePrescriptionProps) {
  const [copied, setCopied] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Print Mode: 'full' (background PNG model + overlaid text) or 'text-only' (only overlay text on pre-printed paper)
  const [printMode, setPrintMode] = useState<'full' | 'text-only'>('full');
  // Fine vertical calibration offset (in millimeters) for pre-printed physical paper alignment
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
    showToast('success', 'Couleur monochrome appliquée', `Tout le texte de l'ordonnance est désormais unifié en ${color}.`);
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
    doctorProfile?.name || prescription.doctorName || 'Dr. Oussama Belouar'
  );
  const [customSpecialty, setCustomSpecialty] = useState(
    doctorProfile?.specialty || prescription.doctorSpecialty || 'Médecine Générale & Thérapeutique'
  );
  const [customTagline, setCustomTagline] = useState(
    clinicSettings?.tagline || 'Cabinet Médical & Soins Spécialisés'
  );
  const [customClinicPhone, setCustomClinicPhone] = useState(
    clinicSettings?.phone || prescription.clinicPhone || '+213 21 00 11 22'
  );
  const [customClinicEmail, setCustomClinicEmail] = useState(
    clinicSettings?.email || prescription.clinicEmail || 'contact@cabinet-belouar.dz'
  );
  const [customClinicWebsite, setCustomClinicWebsite] = useState(
    clinicSettings?.website || 'www.cabinet-belouar.dz'
  );
  const [customClinicAddress, setCustomClinicAddress] = useState(
    clinicSettings?.address || prescription.clinicAddress || '12 Boulevard des Frères Bouadou, Alger'
  );
  const [customPatientAddress, setCustomPatientAddress] = useState(
    prescription.patientAddress || 'Alger, Algérie'
  );
  const [customPatientInsurance, setCustomPatientInsurance] = useState(
    prescription.patientInsurance || 'CNAS / CASNOS (Assuré)'
  );
  const [customPatientDiagnosis, setCustomPatientDiagnosis] = useState(
    prescription.patientDiagnosis || 'Consultation Thérapeutique'
  );

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const verificationUrl =
    prescription.qrVerificationData || `https://ordocare.health/verify/${prescription.prescriptionNumber}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        showToast('success', 'Lien copié', 'Lien de vérification de l’ordonnance copié dans le presse-papier.');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      showToast('info', 'Lien de vérification', verificationUrl);
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
                  <span>Modèle d'Ordonnance Officiel (PNG)</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                    {prescription.prescriptionNumber}
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
                  ? "Le modèle d’ordonnance PNG original est préservé sans modification graphique avec le texte clinique superposé."
                  : "Mode Texte Seul actif : Le modèle PNG d'arrière-plan est complètement masqué. Seul le texte clinique sera imprimé sur votre papier officiel."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Print Mode Selector: Full PNG Model vs Overlay Text Only (for pre-printed physical paper) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  printMode === 'full'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Imprime le modèle PNG complet avec le texte clinique superposé"
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
                title="Masque le modèle PNG à l'impression pour imprimer uniquement le texte sur vos feuilles à en-tête"
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
              title="Personnaliser les couleurs d'impression (titres, médecin, médicaments)"
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

        {/* Live Customizer, PNG Model Selector & Calibration Drawer */}
        {showCustomizer && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4 text-xs">
            {/* Color Controls (Titles/Accents & Body/Medications) */}
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
                    {isCustomPng ? 'Modèle PNG personnalisé chargé depuis votre appareil' : 'Modèle PNG officiel par défaut (tel quel, sans altération)'}
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
                  Permet d'ajuster millimétriquement la position du texte si votre imprimante ou papier physique pré-imprimé a un décalage.
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

            {/* Editable Doctor & Clinic Overlay Details */}
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
                    setCustomPatientAddress(prescription.patientAddress || 'Alger, Algérie');
                    setCustomPatientInsurance(prescription.patientInsurance || 'CNAS / CASNOS (Assuré)');
                    setCustomPatientDiagnosis(prescription.patientDiagnosis || 'Consultation Thérapeutique');
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
        {/* MODÈLE UNIQUE D'ORDONNANCE : MODÈLE PNG + TEXTE CLINIQUE SUPERPOSÉ (A5)   */}
        {/* Le modèle PNG est affiché tel quel sans modification. Le texte est dessus */}
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
          {/* S'ajuste avec élégance et précision sur les zones du modèle PNG         */}
          {/* ======================================================================= */}
          <div
            className="ordonnance-text-overlay relative z-10 w-full h-full flex flex-col justify-between px-8 sm:px-12 pointer-events-auto"
            style={{
              transform: verticalOffsetMm !== 0 ? `translateY(${verticalOffsetMm * 3.78}px)` : undefined,
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* 2.1 EN-TÊTE PRATICIEN : En haut à droite (Top-Right, à côté de la vague) */}
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
                {/* Espace réservé pour ne pas masquer le Caducée bleu du modèle PNG à gauche */}
                <div className="w-20 sm:w-28 shrink-0" />

                {/* Données du patient superposées avec typographie médicale nette */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:text-sm ordonnance-patient-grid">
                  {/* Colonne Gauche */}
                  <div className="space-y-1.5">
                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Patient :
                      </span>
                      <span style={{ color: bodyTextColor }} className="font-extrabold text-sm sm:text-base leading-tight">
                        {prescription.patientName}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Âge / Sexe :
                      </span>
                      <span style={{ color: bodyTextColor }} className="font-semibold">
                        {prescription.patientAge ? `${prescription.patientAge} ans` : 'N/R'}{' '}
                        {prescription.patientSex ? `• ${prescription.patientSex}` : ''}{' '}
                        {prescription.patientWeight ? `• ${prescription.patientWeight}` : ''}
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
                        {prescription.date}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        N° Ordonnance :
                      </span>
                      <span style={{ color: accentColor }} className="font-mono font-bold text-xs">
                        {prescription.prescriptionNumber}
                      </span>
                    </p>

                    <p className="flex items-baseline gap-2">
                      <span style={{ color: accentColor }} className="font-bold shrink-0 text-xs sm:text-sm">
                        Couverture :
                      </span>
                      <span style={{ color: bodyTextColor, opacity: 0.9 }} className="font-medium">
                        {customPatientInsurance}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.3 CORPS DE L'ORDONNANCE : Médicaments, Posologies et Consignes */}
            {/* Superposé au-dessus du filigrane central du PNG */}
            <div className="py-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Espace d'alignement tenant compte du symbole Rx présent sur le modèle PNG */}
                <div className="h-6 sm:h-8 mb-3" />

                {/* Liste des Médicaments Prescrits */}
                <div className="space-y-4 pl-2 sm:pl-3">
                  {prescription.items.map((item, index) => {
                    const formShort = formatDosageForm(item.dosageForm, item.route);
                    const qtyShort = formatQuantity(item.quantity);
                    const freqShort = formatFrequency(item.frequency);
                    const durShort = formatDuration(item.duration);

                    return (
                      <div key={item.id || index} className="space-y-1">
                        {/* Ligne Médicament + Forme (ex: Cp) + Trait de liaison + Qté (ex: 1 bt) */}
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span style={{ color: bodyTextColor }} className="font-bold text-base sm:text-lg shrink-0">
                            {index + 1}. {item.medicationName.toUpperCase()}
                          </span>
                          {item.strength && (
                            <span style={{ color: accentColor }} className="font-bold text-sm sm:text-base shrink-0">
                              {item.strength}
                            </span>
                          )}
                          {formShort && (
                            <span style={{ color: bodyTextColor, opacity: 0.8 }} className="text-xs sm:text-sm font-semibold shrink-0">
                              {formShort}
                            </span>
                          )}

                          {/* Trait de liaison reliant le médicament à la quantité (comme indiqué sur le modèle) */}
                          <div
                            style={{ borderColor: accentColor, opacity: 0.35 }}
                            className="flex-1 border-b min-w-[20px] self-center"
                          />

                          {qtyShort && (
                            <span
                              style={{ color: bodyTextColor }}
                              className="text-xs sm:text-sm font-bold shrink-0 whitespace-nowrap bg-white pl-1"
                            >
                              Qté : {qtyShort}
                            </span>
                          )}
                        </div>

                        {/* Posologie */}
                        <div className="pl-5 text-xs sm:text-sm font-medium">
                          <p className="flex items-center gap-2 flex-wrap">
                            <span style={{ color: accentColor }} className="font-bold">Posologie :</span>
                            <span style={{ color: bodyTextColor }} className="font-semibold">
                              {item.dose} {item.dose && freqShort ? '• ' : ''}{freqShort}
                            </span>
                            {durShort && (
                              <span style={{ color: bodyTextColor, opacity: 0.75 }} className="font-normal">
                                pendant {durShort}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2.4 BAS DE PAGE : Espace dégagé réservé au cachet physique et à la signature manuscrite du médecin */}
              <div className="flex items-end justify-between px-2 mb-4 shrink-0 min-h-[100px]">
                {/* Zone gauche dégagée */}
                <div className="max-w-xs" />

                {/* Zone droite : Entièrement vierge pour l'apposition du cachet et signature physiques */}
                <div className="w-56 sm:w-64 h-24 sm:h-28" />
              </div>
            </div>

            {/* 2.5 PIED DE PAGE : Coordonnées du Cabinet superposées sur la vague inférieure */}
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
