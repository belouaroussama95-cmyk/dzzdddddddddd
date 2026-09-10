import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Pill,
  Scale,
  Clock,
  Droplets,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
  Activity,
  User,
  HeartPulse,
  Flame
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PresetDrug {
  id: string;
  name: string;
  category: string;
  defaultDosePerKgDay: number;
  dosesPerDay: number;
  concentrationMgPerMl?: number;
  maxDosePerDayMg?: number;
  defaultDurationDays: number;
  unit: string;
  indication: string;
  alert?: string;
}

const COMMON_PRESETS: PresetDrug[] = [
  {
    id: 'paracetamol-ped',
    name: 'Paracétamol Enfant (Sirop / Solution)',
    category: 'Antalgique / Antipyrétique',
    defaultDosePerKgDay: 60,
    dosesPerDay: 4,
    concentrationMgPerMl: 24, // ex: Doliprane 2.4% = 24mg/mL ou pipette dose/kg
    maxDosePerDayMg: 3000,
    defaultDurationDays: 3,
    unit: 'mg/kg/jour',
    indication: 'Douleur & Fièvre (15 mg/kg/prise toutes les 6h)',
    alert: 'Ne jamais dépasser 60 mg/kg/jour (max 80 mg/kg/j en hospitalier) ou 3g/jour.'
  },
  {
    id: 'amox-ped',
    name: 'Amoxicilline Enfant (Suspension 250mg/5mL)',
    category: 'Antibiotique',
    defaultDosePerKgDay: 80,
    dosesPerDay: 3,
    concentrationMgPerMl: 50, // 250mg / 5mL = 50mg/mL
    maxDosePerDayMg: 3000,
    defaultDurationDays: 6,
    unit: 'mg/kg/jour',
    indication: 'Otite Moyenne Aiguë, Angine streptococcique, Pneumopathie',
    alert: 'Respecter l’intervalle de 8h entre chaque prise pour une efficacité optimale.'
  },
  {
    id: 'augmentin-ped',
    name: 'Augmentin Enfant (Amox/Ac. Clav 100mg/12.5mg/mL)',
    category: 'Antibiotique',
    defaultDosePerKgDay: 80,
    dosesPerDay: 3,
    concentrationMgPerMl: 100, // 100mg Amox/mL
    maxDosePerDayMg: 3000,
    defaultDurationDays: 7,
    unit: 'mg/kg/jour',
    indication: 'Infections ORL sévères ou récidivantes',
    alert: 'Dose exprimée en amoxicilline. À administrer en début de repas.'
  },
  {
    id: 'ibuprofen-ped',
    name: 'Ibuprofène Enfant (Suspension 100mg/5mL)',
    category: 'AINS / Antipyrétique',
    defaultDosePerKgDay: 30,
    dosesPerDay: 3,
    concentrationMgPerMl: 20, // 100mg / 5mL = 20mg/mL
    maxDosePerDayMg: 1200,
    defaultDurationDays: 3,
    unit: 'mg/kg/jour',
    indication: 'Fièvre rebelle ou inflammation (10 mg/kg/prise toutes les 8h)',
    alert: 'Contre-indiqué en cas de varicelle, déshydratation, ou infection bactérienne cutanée/pulmonaire.'
  },
  {
    id: 'azithromycin-ped',
    name: 'Azithromycine (Suspension 40mg/mL)',
    category: 'Antibiotique Macrolide',
    defaultDosePerKgDay: 20,
    dosesPerDay: 1,
    concentrationMgPerMl: 40,
    maxDosePerDayMg: 500,
    defaultDurationDays: 3,
    unit: 'mg/kg/jour',
    indication: 'Angine chez l’allergique aux pénicillines (traitement de 3 jours)',
    alert: 'Prise unique quotidienne, de préférence à distance des repas.'
  },
  {
    id: 'prednisolone-ped',
    name: 'Prednisolone / Solupred (Comprimés ou Sol. Buvable)',
    category: 'Corticoïde oral',
    defaultDosePerKgDay: 1.5,
    dosesPerDay: 1,
    concentrationMgPerMl: 1,
    maxDosePerDayMg: 60,
    defaultDurationDays: 5,
    unit: 'mg/kg/jour',
    indication: 'Crise d’asthme, laryngite sous-glottique, bronchite obstructive',
    alert: 'Prise unique le matin pour respecter le pic de cortisol.'
  }
];

export function MedicationDosageCalculator() {
  const { showToast } = useToast();

  // Mode tabs: 'weight' (Pediatric / mg/kg) | 'bsa' (Surface corporelle) | 'iv_infusion' (Débit perfusion) | 'renal' (Clairance rénale)
  const [activeMode, setActiveMode] = useState<'weight' | 'bsa' | 'iv_infusion' | 'renal'>('weight');

  // 1. Weight-based dosage state
  const [patientWeight, setPatientWeight] = useState<number>(14);
  const [drugName, setDrugName] = useState<string>('Amoxicilline Enfant');
  const [dosePerKgDay, setDosePerKgDay] = useState<number>(80);
  const [dosesPerDay, setDosesPerDay] = useState<number>(3);
  const [concentrationMg, setConcentrationMg] = useState<number>(250);
  const [concentrationMl, setConcentrationMl] = useState<number>(5);
  const [hasLiquidForm, setHasLiquidForm] = useState<boolean>(true);
  const [maxDoseLimit, setMaxDoseLimit] = useState<number>(3000);
  const [treatmentDurationDays, setTreatmentDurationDays] = useState<number>(6);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('amox-ped');

  // 2. BSA (Body Surface Area) state
  const [bsaWeight, setBsaWeight] = useState<number>(70);
  const [bsaHeight, setBsaHeight] = useState<number>(175);
  const [bsaDosePerM2, setBsaDosePerM2] = useState<number>(500);

  // 3. IV Infusion state
  const [ivVolumeMl, setIvVolumeMl] = useState<number>(1000);
  const [ivDurationHours, setIvDurationHours] = useState<number>(12);
  const [ivDropFactor, setIvDropFactor] = useState<number>(20); // 20 standard, 60 micro, 15 sang

  // 4. Renal Clearance state (Cockcroft-Gault)
  const [renalAge, setRenalAge] = useState<number>(68);
  const [renalWeight, setRenalWeight] = useState<number>(72);
  const [renalGender, setRenalGender] = useState<'male' | 'female'>('male');
  const [renalCreatinine, setRenalCreatinine] = useState<number>(115); // in µmol/L

  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Apply a preset
  const handleApplyPreset = (preset: PresetDrug) => {
    setSelectedPresetId(preset.id);
    setDrugName(preset.name);
    setDosePerKgDay(preset.defaultDosePerKgDay);
    setDosesPerDay(preset.dosesPerDay);
    setTreatmentDurationDays(preset.defaultDurationDays);
    if (preset.maxDosePerDayMg) {
      setMaxDoseLimit(preset.maxDosePerDayMg);
    }
    if (preset.concentrationMgPerMl) {
      setHasLiquidForm(true);
      setConcentrationMg(preset.concentrationMgPerMl * 5);
      setConcentrationMl(5);
    }
    showToast('info', 'Preset appliqué', `${preset.name} chargé (${preset.defaultDosePerKgDay} mg/kg/j).`);
  };

  // Calculations for Weight-based dose
  const weightCalculations = useMemo(() => {
    const rawTotalDailyDoseMg = patientWeight * dosePerKgDay;
    const isExceedingMax = maxDoseLimit > 0 && rawTotalDailyDoseMg > maxDoseLimit;
    const effectiveTotalDailyDoseMg = isExceedingMax ? maxDoseLimit : rawTotalDailyDoseMg;

    const validDosesPerDay = Math.max(1, dosesPerDay);
    const dosePerIntakeMg = effectiveTotalDailyDoseMg / validDosesPerDay;

    let mlPerIntake = 0;
    let mlPerDay = 0;
    let totalTreatmentMl = 0;

    if (hasLiquidForm && concentrationMl > 0 && concentrationMg > 0) {
      const mgPerMl = concentrationMg / concentrationMl;
      mlPerIntake = dosePerIntakeMg / mgPerMl;
      mlPerDay = mlPerIntake * validDosesPerDay;
      totalTreatmentMl = mlPerDay * treatmentDurationDays;
    }

    const intervalHours = Math.round(24 / validDosesPerDay);

    return {
      rawTotalDailyDoseMg,
      effectiveTotalDailyDoseMg,
      isExceedingMax,
      dosePerIntakeMg,
      mlPerIntake,
      mlPerDay,
      totalTreatmentMl,
      intervalHours
    };
  }, [patientWeight, dosePerKgDay, dosesPerDay, maxDoseLimit, hasLiquidForm, concentrationMg, concentrationMl, treatmentDurationDays]);

  // BSA Calculation (Mosteller: sqrt(H * W / 3600))
  const bsaCalculations = useMemo(() => {
    if (bsaHeight <= 0 || bsaWeight <= 0) return { bsa: 0, totalDoseMg: 0 };
    const bsaValue = Math.sqrt((bsaHeight * bsaWeight) / 3600);
    const totalDoseMg = bsaValue * bsaDosePerM2;
    return {
      bsa: parseFloat(bsaValue.toFixed(2)),
      totalDoseMg: Math.round(totalDoseMg)
    };
  }, [bsaWeight, bsaHeight, bsaDosePerM2]);

  // IV Infusion calculations
  const ivCalculations = useMemo(() => {
    if (ivDurationHours <= 0 || ivVolumeMl <= 0) return { mlPerHour: 0, dropsPerMinute: 0 };
    const mlPerHour = ivVolumeMl / ivDurationHours;
    const totalMinutes = ivDurationHours * 60;
    const dropsPerMinute = (ivVolumeMl * ivDropFactor) / totalMinutes;
    return {
      mlPerHour: Math.round(mlPerHour * 10) / 10,
      dropsPerMinute: Math.round(dropsPerMinute)
    };
  }, [ivVolumeMl, ivDurationHours, ivDropFactor]);

  // Renal Clearance (Cockcroft-Gault)
  // CrCl (mL/min) = [(140 - Age) * Weight(kg) * (k)] / (Creatinine in µmol/L)
  // k = 1.23 for males, 1.04 for females
  const renalCalculations = useMemo(() => {
    if (renalCreatinine <= 0 || renalAge <= 0 || renalWeight <= 0) {
      return { crcl: 0, stage: 'Non calculable', color: 'text-slate-500', alert: '' };
    }
    const k = renalGender === 'male' ? 1.23 : 1.04;
    const crcl = ((140 - renalAge) * renalWeight * k) / renalCreatinine;
    const rounded = Math.round(crcl);

    let stage = '';
    let color = '';
    let alert = '';

    if (rounded >= 90) {
      stage = 'Fonction rénale normale (Stade 1)';
      color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      alert = 'Aucune adaptation posologique rénale requise pour la plupart des médicaments.';
    } else if (rounded >= 60) {
      stage = 'Insuffisance rénale légère (Stade 2)';
      color = 'text-sky-700 bg-sky-50 border-sky-200';
      alert = 'Surveiller les molécules à marge thérapeutique étroite ou néphrotoxiques.';
    } else if (rounded >= 30) {
      stage = 'Insuffisance rénale modérée (Stade 3)';
      color = 'text-amber-800 bg-amber-50 border-amber-300';
      alert = 'Adaptation posologique fortement recommandée : réduire la dose ou espacer les prises.';
    } else if (rounded >= 15) {
      stage = 'Insuffisance rénale sévère (Stade 4)';
      color = 'text-orange-800 bg-orange-50 border-orange-300';
      alert = 'Adaptation impérative de tous les médicaments éliminés par voie rénale.';
    } else {
      stage = 'Insuffisance rénale terminale (Stade 5)';
      color = 'text-rose-800 bg-rose-50 border-rose-300';
      alert = 'Risque majeur d’accumulation toxique. Consulter néphrologue / ajustement dialyse.';
    }

    return {
      crcl: rounded,
      stage,
      color,
      alert
    };
  }, [renalAge, renalWeight, renalGender, renalCreatinine]);

  // Generate Prescription Text for copying
  const generatedPrescriptionText = useMemo(() => {
    if (activeMode === 'weight') {
      const parts = [];
      parts.push(`${drugName} :`);
      if (hasLiquidForm && weightCalculations.mlPerIntake > 0) {
        parts.push(
          `${weightCalculations.mlPerIntake.toFixed(1)} mL (${Math.round(weightCalculations.dosePerIntakeMg)} mg) par prise`
        );
      } else {
        parts.push(`${Math.round(weightCalculations.dosePerIntakeMg)} mg par prise`);
      }
      parts.push(
        `${dosesPerDay} fois par jour (toutes les ${weightCalculations.intervalHours}h) pendant ${treatmentDurationDays} jours.`
      );
      parts.push(
        `[Poids: ${patientWeight} kg, calculé à ${dosePerKgDay} mg/kg/j - Dose totale: ${Math.round(weightCalculations.effectiveTotalDailyDoseMg)} mg/jour]`
      );
      return parts.join(' ');
    } else if (activeMode === 'bsa') {
      return `Dose calculée selon Surface Corporelle (${bsaCalculations.bsa} m²) : ${bsaCalculations.totalDoseMg} mg (base de ${bsaDosePerM2} mg/m²).`;
    } else if (activeMode === 'iv_infusion') {
      return `Perfusion IV : ${ivVolumeMl} mL sur ${ivDurationHours}h à un débit de ${ivCalculations.mlPerHour} mL/h (${ivCalculations.dropsPerMinute} gouttes/min).`;
    } else {
      return `Clairance de la créatinine estimée (Cockcroft-Gault) : ${renalCalculations.crcl} mL/min (${renalCalculations.stage}).`;
    }
  }, [
    activeMode,
    drugName,
    hasLiquidForm,
    weightCalculations,
    dosesPerDay,
    treatmentDurationDays,
    patientWeight,
    dosePerKgDay,
    bsaCalculations,
    bsaDosePerM2,
    ivVolumeMl,
    ivDurationHours,
    ivCalculations,
    renalCalculations
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrescriptionText);
    setCopiedText(true);
    showToast('success', 'Posologie copiée', 'La formule posologique a été copiée dans le presse-papier.');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const currentPreset = COMMON_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 rounded-3xl p-6 text-white shadow-lg border border-teal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center text-teal-200 shadow-inner">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Calculatrice Posologique Médicale
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-[11px] font-bold">
                Pédiatrie & Adulte
              </span>
            </div>
            <p className="text-xs sm:text-sm text-teal-200/80 mt-0.5">
              Calcul précis des doses par kg de poids, formes liquides (mL), surface corporelle, perfusions et clairance rénale.
            </p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-teal-950/60 rounded-2xl border border-teal-800/60 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setActiveMode('weight')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'weight'
                ? 'bg-white text-teal-950 shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>Poids (mg/kg & mL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('bsa')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'bsa'
                ? 'bg-white text-teal-950 shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Surface Corporelle (BSA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('iv_infusion')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'iv_infusion'
                ? 'bg-white text-teal-950 shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>Perfusion IV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('renal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'renal'
                ? 'bg-white text-teal-950 shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>Clairance Rénale</span>
          </button>
        </div>
      </div>

      {/* MODE 1: WEIGHT BASED / PEDIATRIC DOSAGE */}
      {activeMode === 'weight' && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Préréglages Fréquents (Pédiatrie & Médecine Générale) :</span>
              </span>
              <span className="text-[11px] text-slate-400">Cliquez pour pré-remplir</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {COMMON_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500/20'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{preset.name}</span>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                        {preset.defaultDosePerKgDay} mg/kg/j
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {preset.indication}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculator Inputs & Result Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Paramètres du Patient & Médicament</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Formule : Poids × Posologie</span>
              </div>

              {/* Patient Weight Slider and input */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-teal-600" />
                    <span>Poids Corporel du Patient</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="150"
                      value={patientWeight}
                      onChange={e => setPatientWeight(Math.max(0.5, parseFloat(e.target.value) || 0))}
                      className="w-20 px-2.5 py-1 text-right font-mono font-bold text-sm bg-white border border-teal-300 rounded-lg text-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-600">kg</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="2"
                  max="80"
                  step="0.5"
                  value={patientWeight}
                  onChange={e => setPatientWeight(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
                  <span>Nouveau-né (3 kg)</span>
                  <span>Nourrisson (10 kg)</span>
                  <span>Enfant (20 kg)</span>
                  <span>Ado (45 kg)</span>
                  <span>Adulte (70 kg)</span>
                </div>
              </div>

              {/* Drug Name & Target Dose/kg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Médicament / Spécialité
                  </label>
                  <input
                    type="text"
                    value={drugName}
                    onChange={e => setDrugName(e.target.value)}
                    placeholder="Nom du médicament"
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Posologie recommandée</span>
                    <span className="text-[10px] text-teal-700 font-bold">mg / kg / jour</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={dosePerKgDay}
                    onChange={e => setDosePerKgDay(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Doses per day & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de prises / jour
                  </label>
                  <select
                    value={dosesPerDay}
                    onChange={e => setDosesPerDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                  >
                    <option value={1}>1 prise / 24h (toutes les 24h)</option>
                    <option value={2}>2 prises / 24h (toutes les 12h)</option>
                    <option value={3}>3 prises / 24h (toutes les 8h)</option>
                    <option value={4}>4 prises / 24h (toutes les 6h)</option>
                    <option value={6}>6 prises / 24h (toutes les 4h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Durée du traitement
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={treatmentDurationDays}
                      onChange={e => setTreatmentDurationDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">jours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plafond dose max / 24h
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={maxDoseLimit}
                      onChange={e => setMaxDoseLimit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">mg</span>
                  </div>
                </div>
              </div>

              {/* Liquid / Suspension Configuration */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasLiquidForm}
                      onChange={e => setHasLiquidForm(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-teal-950">
                      Forme liquide / Suspension buvable pédiatrique (Conversion mg ➔ mL)
                    </span>
                  </label>
                </div>

                {hasLiquidForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                        Concentration : Quantité de principe actif (mg)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={concentrationMg}
                        onChange={e => setConcentrationMg(parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-teal-200 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                        Pour un volume de (mL)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={concentrationMl}
                        onChange={e => setConcentrationMl(parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-teal-200 rounded-xl text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2 text-[11px] text-teal-800 font-medium">
                      Concentration résultante : <strong>{(concentrationMg / (concentrationMl || 1)).toFixed(1)} mg / mL</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Alert / Warnings */}
              {currentPreset?.alert && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{currentPreset.alert}</span>
                </div>
              )}
            </div>

            {/* Results Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Primary Output Card */}
              <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-teal-700/60 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-teal-700/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                    Posologie Calculée
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-700/80 text-teal-100">
                    {patientWeight} kg
                  </span>
                </div>

                {/* Main numbers */}
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
                    <span className="text-xs text-teal-200 block mb-1">Dose unitaire par prise :</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                        {Math.round(weightCalculations.dosePerIntakeMg)}
                      </span>
                      <span className="text-lg font-bold text-teal-200">mg / prise</span>
                    </div>

                    {hasLiquidForm && weightCalculations.mlPerIntake > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-teal-200">Volume équivalent :</span>
                        <span className="text-lg font-bold font-mono text-emerald-300">
                          {weightCalculations.mlPerIntake.toFixed(1)} mL
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Frequency & Total daily */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <span className="text-teal-300 block text-[11px]">Fréquence :</span>
                      <strong className="text-white text-sm">
                        {dosesPerDay} fois / 24h
                      </strong>
                      <span className="text-[10px] text-teal-200 block mt-0.5">
                        Toutes les {weightCalculations.intervalHours} heures
                      </span>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <span className="text-teal-300 block text-[11px]">Dose totale / 24h :</span>
                      <strong className="text-white text-sm font-mono">
                        {Math.round(weightCalculations.effectiveTotalDailyDoseMg)} mg / jour
                      </strong>
                      {weightCalculations.isExceedingMax && (
                        <span className="text-[10px] text-amber-300 block mt-0.5 font-bold">
                          (Plafonné à {maxDoseLimit} mg)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total treatment volume */}
                  {hasLiquidForm && weightCalculations.totalTreatmentMl > 0 && (
                    <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/30 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-200 font-semibold">Volume total ({treatmentDurationDays} jours) :</span>
                        <span className="font-mono font-bold text-emerald-300 text-sm">
                          {Math.round(weightCalculations.totalTreatmentMl)} mL
                        </span>
                      </div>
                      <span className="text-[10.5px] text-emerald-300/80 block mt-0.5">
                        Prévoir environ {Math.ceil(weightCalculations.totalTreatmentMl / 60)} à {Math.ceil(weightCalculations.totalTreatmentMl / 100)} flacon(s) selon conditionnement.
                      </span>
                    </div>
                  )}
                </div>

                {/* Exceeding max alert */}
                {weightCalculations.isExceedingMax && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                    <span>La dose calculée dépassait le plafond sécuritaire et a été ramenée à {maxDoseLimit} mg/jour.</span>
                  </div>
                )}
              </div>

              {/* Copyable Prescription Formula */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Libellé Prêt pour l'Ordonnance :
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed">
                  {generatedPrescriptionText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: BSA (Body Surface Area) */}
      {activeMode === 'bsa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Formule de Mosteller (Surface Corporelle en m²)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                BSA = √[ Taille (cm) × Poids (kg) / 3600 ]. Utilisé pour les chimiothérapies et molécules à index étroit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Taille du patient (cm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={bsaHeight}
                  onChange={e => setBsaHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poids du patient (kg)
                </label>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={bsaWeight}
                  onChange={e => setBsaWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Dose prescrite par m² de surface</span>
                <span className="text-[10px] text-teal-700 font-bold">mg / m²</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="10"
                value={bsaDosePerM2}
                onChange={e => setBsaDosePerM2(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white rounded-3xl p-6 shadow-md border border-amber-800/40 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Résultat Surface Corporelle
            </span>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xs text-amber-200 block mb-1">Surface Corporelle (BSA) :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                  {bsaCalculations.bsa}
                </span>
                <span className="text-lg font-bold text-amber-200">m²</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xs text-amber-200 block mb-1">Dose totale calculée :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-300 font-mono">
                  {bsaCalculations.totalDoseMg}
                </span>
                <span className="text-sm font-bold text-amber-200">mg</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier le résultat</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: IV INFUSION RATE */}
      {activeMode === 'iv_infusion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Calculateur de Vitesse & Débit de Perfusion IV</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion en mL/heure et gouttes/minute selon le perfuseur utilisé.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volume total à perfuser (mL)
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={ivVolumeMl}
                  onChange={e => setIvVolumeMl(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durée de la perfusion (heures)
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.5"
                  value={ivDurationHours}
                  onChange={e => setIvDurationHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calibre du Perfuseur (Facteur de goutte)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 20, label: 'Standard (20 gttes/mL)', desc: 'Solutés habituels' },
                  { value: 60, label: 'Micro-gouttes (60 gttes/mL)', desc: 'Pédiatrie' },
                  { value: 15, label: 'Transfusion (15 gttes/mL)', desc: 'Produits sanguins' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setIvDropFactor(item.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      ivDropFactor === item.value
                        ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <strong className="block text-xs">{item.label}</strong>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-sky-950 via-slate-900 to-sky-900 text-white rounded-3xl p-6 shadow-md border border-sky-800/40 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Débits de Perfusion Recommandés
            </span>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xs text-sky-200 block mb-1">Débit par gravité :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                  {ivCalculations.dropsPerMinute}
                </span>
                <span className="text-lg font-bold text-sky-200">gouttes / min</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xs text-sky-200 block mb-1">Vitesse sur pousse-seringue / pompe :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-300 font-mono">
                  {ivCalculations.mlPerHour}
                </span>
                <span className="text-sm font-bold text-sky-200">mL / heure</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier les paramètres de perfusion</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: RENAL CLEARANCE (COCKCROFT-GAULT) */}
      {activeMode === 'renal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Formule de Cockcroft-Gault (Clairance Rénale)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimation de la clairance de la créatinine (mL/min) pour ajuster les posologies chez l’insuffisant rénal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sexe du patient
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRenalGender('male')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      renalGender === 'male'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Homme (k = 1.23)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenalGender('female')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      renalGender === 'female'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Femme (k = 1.04)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Âge du patient (années)
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={renalAge}
                  onChange={e => setRenalAge(parseInt(e.target.value) || 18)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poids du patient (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={renalWeight}
                  onChange={e => setRenalWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Créatininémie</span>
                  <span className="text-[10px] text-rose-700 font-bold">µmol / L</span>
                </label>
                <input
                  type="number"
                  min="20"
                  max="1200"
                  value={renalCreatinine}
                  onChange={e => setRenalCreatinine(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-rose-900/40 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Évaluation Fonction Rénale
            </span>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xs text-rose-200 block mb-1">Clairance Estimée (CrCl) :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                  {renalCalculations.crcl}
                </span>
                <span className="text-lg font-bold text-rose-200">mL / min</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${renalCalculations.color} text-xs font-bold`}>
              {renalCalculations.stage}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              {renalCalculations.alert}
            </p>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier le compte-rendu rénal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
