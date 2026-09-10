import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  FileCheck2,
  Search,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Pill,
  Clock,
  Calendar,
  Phone,
  Check,
  RefreshCw,
  FileText,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Patient, Medication, PrescriptionItem, OrdonnanceType } from '../../types';

interface QuickPatientPrescriptionSystemProps {
  onSuccess: (prescriptionId: string) => void;
  onRefreshStats?: () => void;
}

const COMMON_ALLERGIES_CHIPS = [
  'Aucune (NKDA)',
  'Pénicilline / Bêta-lactamines',
  'Aspirine & AINS',
  'Sulfamides',
  'Codéine / Opioïdes',
  'Iode / Produits de contraste'
];

const QUICK_TEMPLATES = [
  {
    name: 'Angine Aiguë Bactérienne',
    category: 'Infectiologie',
    items: [
      {
        medicationName: 'Amoxicilline',
        strength: '1000 mg',
        dosageForm: 'Comprimé dispersible',
        dose: '1 g',
        frequency: '2 fois par jour',
        duration: '6 jours',
        instructions: ''
      },
      {
        medicationName: 'Paracétamol',
        strength: '1000 mg',
        dosageForm: 'Comprimé',
        dose: '1 g',
        frequency: '3 fois par jour si douleur/fièvre (max 4g/j)',
        duration: '5 jours',
        instructions: ''
      }
    ],
    instructions: ''
  },
  {
    name: 'Rhinopharyngite Fébriliforme',
    category: 'Médecine Générale',
    items: [
      {
        medicationName: 'Paracétamol',
        strength: '1000 mg',
        dosageForm: 'Comprimé',
        dose: '1 g',
        frequency: '1 comprimé toutes les 6 à 8 heures si besoin',
        duration: '5 jours',
        instructions: ''
      },
      {
        medicationName: 'Sérum Physiologique / Spray Nasal',
        strength: '0.9%',
        dosageForm: 'Spray nasal',
        dose: '1 à 2 pulvérisations',
        frequency: '3 à 4 fois par jour',
        duration: '7 jours',
        instructions: ''
      }
    ],
    instructions: ''
  },
  {
    name: 'HTA Débutante / Contrôle Tensionnel',
    category: 'Cardiologie',
    items: [
      {
        medicationName: 'Ramipril',
        strength: '5 mg',
        dosageForm: 'Comprimé',
        dose: '5 mg',
        frequency: '1 / J',
        duration: '30 jours',
        instructions: ''
      }
    ],
    instructions: ''
  },
  {
    name: 'Gastro-entérite Aiguë Non invasive',
    category: 'Gastro-entérologie',
    items: [
      {
        medicationName: 'Racécadotril',
        strength: '100 mg',
        dosageForm: 'Gélule',
        dose: '1 gélule',
        frequency: '3 fois par jour au début des repas',
        duration: '3 jours',
        instructions: ''
      },
      {
        medicationName: 'Paracétamol',
        strength: '1000 mg',
        dosageForm: 'Comprimé',
        dose: '1 g',
        frequency: 'Si crampes/fièvre (max 3g/j)',
        duration: '3 jours',
        instructions: ''
      }
    ],
    instructions: ''
  },
  {
    name: 'Lombalgie Aiguë Commune',
    category: 'Rhumatologie',
    items: [
      {
        medicationName: 'Paracétamol',
        strength: '1000 mg',
        dosageForm: 'Comprimé',
        dose: '1 g',
        frequency: '3 fois par jour',
        duration: '7 jours',
        instructions: ''
      },
      {
        medicationName: 'Ibuprofène',
        strength: '400 mg',
        dosageForm: 'Comprimé pelliculé',
        dose: '400 mg',
        frequency: '1 comprimé au milieu des repas (max 3/j)',
        duration: '5 jours',
        instructions: ''
      }
    ],
    instructions: ''
  }
];

export function QuickPatientPrescriptionSystem({
  onSuccess,
  onRefreshStats
}: QuickPatientPrescriptionSystemProps) {
  const { showToast } = useToast();

  // Mode: 'new-patient' (direct registration) or 'existing-patient'
  const [patientMode, setPatientMode] = useState<'new-patient' | 'existing-patient'>('new-patient');

  // New Patient Form Data
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dob: '1988-05-14',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    diagnosis: '',
    allergies: 'Aucune (NKDA)',
    address: ''
  });

  // Existing Patient Selector State
  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<Patient | null>(null);

  // Prescription Items State
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      id: `item-${Date.now()}-1`,
      medicationName: '',
      strength: '',
      dosageForm: 'Comprimé',
      dose: '1 comprimé',
      route: 'Orale',
      frequency: '1 / J',
      duration: '7 jours',
      quantity: '1 bt',
      instructions: 'Prendre avec un verre d’eau.'
    }
  ]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Medications Formulary
  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing patients and formulary medications
  useEffect(() => {
    async function loadResources() {
      try {
        const [pts, meds] = await Promise.all([
          api.getPatients({ status: 'active' }),
          api.getMedications()
        ]);
        setExistingPatients(pts);
        setMedicationsList(meds);
      } catch (err) {
        console.error('Failed loading resources in QuickPatientPrescriptionSystem', err);
      }
    }
    loadResources();
  }, []);

  // Filtered existing patients for selection
  const filteredExistingPatients = existingPatients.filter(p => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase().trim();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.diagnosis.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }).slice(0, 5);

  // Filtered medications for active row
  const filteredMeds = medicationsList.filter(m => {
    if (!activeSearchQuery.trim()) return true;
    const q = activeSearchQuery.toLowerCase().trim();
    return (
      m.genericName.toLowerCase().includes(q) ||
      m.brandName.toLowerCase().includes(q) ||
      m.activeIngredient.toLowerCase().includes(q) ||
      m.strength.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  // Quick template applicator
  const applyQuickTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    const convertedItems: PrescriptionItem[] = tpl.items.map((item, idx) => ({
      id: `tpl-${Date.now()}-${idx}`,
      medicationName: item.medicationName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      dose: item.dose,
      route: 'Orale',
      frequency: item.frequency || '1 / J',
      duration: item.duration,
      quantity: '1 bt',
      instructions: ''
    }));

    setItems(convertedItems);
    setAdditionalInstructions('');
    if (patientMode === 'new-patient' && !patientData.diagnosis) {
      setPatientData(prev => ({ ...prev, diagnosis: tpl.name }));
    }
    showToast('info', 'Modèle Appliqué', `Prescription rapide chargée : ${tpl.name} (${convertedItems.length} médicaments).`);
  };

  // Add Medication Row
  const handleAddMedication = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        medicationName: '',
        strength: '',
        dosageForm: 'Comprimé',
        dose: '1 comprimé',
        route: 'Orale',
        frequency: '1 / J',
        duration: '7 jours',
        quantity: '1 bt',
        instructions: ''
      }
    ]);
  };

  // Remove Medication Row
  const handleRemoveMedication = (index: number) => {
    if (items.length <= 1) {
      showToast('warning', 'Prescription minimale', 'L’ordonnance doit comporter au moins un médicament.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Select Medication from Autocomplete
  const handleSelectMed = (index: number, med: Medication) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      medicationId: med.id,
      medicationName: med.genericName,
      strength: med.strength,
      dosageForm: med.dosageForm,
      route: med.route,
      frequency: med.defaultFrequency || '1 / J',
      dose: med.standardDose || med.strength,
      duration: med.defaultDuration || '7 jours',
      quantity: '1 bt',
      instructions: ''
    };
    setItems(updated);
    setActiveItemSearchIndex(null);
    setActiveSearchQuery('');
  };

  // Reset entire form
  const handleReset = () => {
    setPatientData({
      firstName: '',
      lastName: '',
      dob: '1988-05-14',
      sex: 'Male',
      phone: '',
      diagnosis: '',
      allergies: 'Aucune (NKDA)',
      address: ''
    });
    setSelectedExistingPatient(null);
    setPatientSearch('');
    setItems([
      {
        id: `item-${Date.now()}-1`,
        medicationName: '',
        strength: '',
        dosageForm: 'Comprimé',
        dose: '1 comprimé',
        route: 'Orale',
        frequency: '1 / J',
        duration: '7 jours',
        quantity: '1 bt',
        instructions: 'Prendre avec un verre d’eau.'
      }
    ]);
  };

  // ATOMIC REGISTRATION & PRESCRIPTION
  const handleRegisterAndPrescribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Patient
    let patientIdToUse = '';
    let patientNameToUse = '';

    if (patientMode === 'new-patient') {
      if (!patientData.firstName.trim() || !patientData.lastName.trim()) {
        showToast('error', 'Informations Patient Incomplètes', 'Veuillez saisir le prénom et le nom du patient.');
        return;
      }
    } else {
      if (!selectedExistingPatient) {
        showToast('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient dans la liste.');
        return;
      }
      patientIdToUse = selectedExistingPatient.id;
      patientNameToUse = `${selectedExistingPatient.firstName} ${selectedExistingPatient.lastName}`;
    }

    // 2. Validate Items
    const validItems = items.filter(i => i.medicationName.trim().length > 0);
    if (validItems.length === 0) {
      showToast('error', 'Médicament Requis', 'Veuillez renseigner au moins un médicament à prescrire.');
      return;
    }

    try {
      setIsSubmitting(true);

      // STEP A: If new patient, register him in the system database
      if (patientMode === 'new-patient') {
        const createdPatient = await api.createPatient({
          firstName: patientData.firstName.trim(),
          lastName: patientData.lastName.trim(),
          dob: patientData.dob || '1990-01-01',
          sex: patientData.sex,
          phone: patientData.phone.trim() || 'Non renseigné',
          email: '',
          address: patientData.address.trim() || 'Cabinet Médical',
          diagnosis: patientData.diagnosis.trim() || 'Consultation en cabinet',
          allergies: [patientData.allergies.trim() || 'Aucune allergie connue'],
          medicalNotes: `Enregistrement direct en consultation le ${new Date().toLocaleDateString('fr-FR')}.`,
          status: 'active'
        });

        patientIdToUse = createdPatient.id;
        patientNameToUse = `${createdPatient.firstName} ${createdPatient.lastName}`;
        setExistingPatients(prev => [createdPatient, ...prev]);
      }

      // STEP B: Create and save the prescription linked to the patient
      const createdPrescription = await api.createPrescription({
        patientId: patientIdToUse,
        date: new Date().toISOString().split('T')[0],
        items: validItems,
        additionalInstructions: additionalInstructions.trim()
      });

      // STEP C: Notify and navigate
      showToast(
        'success',
        'Enregistrement Réussi !',
        `Le patient ${patientNameToUse} et son ordonnance sont automatiquement sauvegardés dans le système.`
      );

      if (onRefreshStats) {
        onRefreshStats();
      }

      // Open printable prescription directly
      onSuccess(createdPrescription.id);
    } catch (err: any) {
      console.error('Failed to register patient and issue prescription', err);
      showToast('error', 'Erreur d’enregistrement', err.message || 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Enregistrement Patient & Ordonnance Directe
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-teal-400/20 text-teal-200 border border-teal-400/30">
                Automatique & Instantané
              </span>
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              Dès qu'un patient se présente : saisissez ses coordonnées et délivrez son ordonnance. Tout s'enregistre automatiquement dans la base de données.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleRegisterAndPrescribe} className="p-6 space-y-6">
        {/* ============================================================ */}
        {/* SECTION 1: CHOIX DU PATIENT (NOUVEAU OU EXISTANT)            */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Identification du Patient
              </h4>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPatientMode('new-patient')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  patientMode === 'new-patient'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                <span>+ Nouveau Patient (Enregistrer)</span>
              </button>

              <button
                type="button"
                onClick={() => setPatientMode('existing-patient')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  patientMode === 'existing-patient'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Patient Déjà Enregistré</span>
              </button>
            </div>
          </div>

          {/* Form: New Patient */}
          {patientMode === 'new-patient' && (
            <div className="bg-teal-50/40 rounded-2xl p-4 sm:p-5 border border-teal-100 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Ce nouveau dossier sera automatiquement enregistré et recevra un identifiant unique (ex: PT-xxxxx).</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom du Patient *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientData.firstName}
                    onChange={e => setPatientData({ ...patientData, firstName: e.target.value })}
                    placeholder="Ex: Jean"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom de Famille *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientData.lastName}
                    onChange={e => setPatientData({ ...patientData, lastName: e.target.value })}
                    placeholder="Ex: Dupont"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date de Naissance *
                  </label>
                  <input
                    type="date"
                    required
                    value={patientData.dob}
                    onChange={e => setPatientData({ ...patientData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexe Biologique
                  </label>
                  <select
                    value={patientData.sex}
                    onChange={e => setPatientData({ ...patientData, sex: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  >
                    <option value="Male">Homme</option>
                    <option value="Female">Femme</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={patientData.phone}
                      onChange={e => setPatientData({ ...patientData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motif de Consultation / Diagnostic Initial *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientData.diagnosis}
                    onChange={e => setPatientData({ ...patientData, diagnosis: e.target.value })}
                    placeholder="Ex: Angine érythémateuse fébrile, HTA grade 1, Bronchite aiguë, etc."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Allergies Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Allergies Connues ou Intolérances Thérapeutiques
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {COMMON_ALLERGIES_CHIPS.map(chip => {
                    const isSelected = patientData.allergies === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setPatientData({ ...patientData, allergies: chip })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                  <input
                    type="text"
                    value={patientData.allergies}
                    onChange={e => setPatientData({ ...patientData, allergies: e.target.value })}
                    placeholder="Ou saisir une autre allergie..."
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 min-w-[200px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Existing Patient Search */}
          {patientMode === 'existing-patient' && (
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Rechercher par prénom, nom, téléphone ou ID patient..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                />
              </div>

              {selectedExistingPatient ? (
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      {selectedExistingPatient.firstName.charAt(0)}
                      {selectedExistingPatient.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-xs">
                          {selectedExistingPatient.firstName} {selectedExistingPatient.lastName}
                        </h5>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-teal-200 text-slate-600">
                          {selectedExistingPatient.id}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Né(e) le {selectedExistingPatient.dob} ({selectedExistingPatient.sex})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Diagnostic: <strong>{selectedExistingPatient.diagnosis}</strong> • Allergies:{' '}
                        <span className="text-rose-700 font-semibold">
                          {selectedExistingPatient.allergies.join(', ') || 'NKDA'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExistingPatient(null)}
                    className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredExistingPatients.map(pt => (
                    <div
                      key={pt.id}
                      onClick={() => setSelectedExistingPatient(pt)}
                      className="p-2.5 bg-white hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {pt.firstName.charAt(0)}
                          {pt.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {pt.firstName} {pt.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {pt.id} • {pt.diagnosis}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-600 hover:text-teal-800">
                        Sélectionner →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: COMPOSITION DE L'ORDONNANCE                       */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Contenu de l'Ordonnance ({items.length} Médicament{items.length > 1 ? 's' : ''})
              </h4>
            </div>

            {/* Quick Templates Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-teal-600" />
                Modèles 1-Clic:
              </span>
              {QUICK_TEMPLATES.map(tpl => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyQuickTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-900 transition-colors border border-slate-200 cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all space-y-2.5 relative"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.medicationName || 'Nouveau Médicament'}
                    </span>
                    {item.strength && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                        {item.strength}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Supprimer ce médicament"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* Medication Search/Autocomplete */}
                  <div className="relative lg:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Nom Médicament (DCI / Marque) *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.medicationName}
                      onChange={e => {
                        const val = e.target.value;
                        const updated = [...items];
                        updated[index].medicationName = val;
                        setItems(updated);
                        setActiveItemSearchIndex(index);
                        setActiveSearchQuery(val);
                      }}
                      onFocus={() => {
                        setActiveItemSearchIndex(index);
                        setActiveSearchQuery(item.medicationName);
                      }}
                      onBlur={() => {
                        // Delay closing to allow click on dropdown items
                        setTimeout(() => {
                          setActiveItemSearchIndex(null);
                        }, 150);
                      }}
                      placeholder="Ex: Amoxicilline, Paracétamol, Ramipril..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                    />

                    {/* Autocomplete Dropdown */}
                    {activeItemSearchIndex === index && filteredMeds.length > 0 && (
                      <div 
                        className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100"
                        onMouseDown={e => e.preventDefault()} // Prevent blur from firing when clicking dropdown
                      >
                        {filteredMeds.map(m => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMed(index, m)}
                            className="p-2 hover:bg-teal-50 text-xs cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{m.genericName}</p>
                              <p className="text-[10px] text-slate-500">
                                {m.brandName} • {m.strength} • {m.category}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                              Choisir
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dosage Form / Strength */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Dosage & Forme
                    </label>
                    <input
                      type="text"
                      value={item.strength}
                      onChange={e => {
                        const updated = [...items];
                        updated[index].strength = e.target.value;
                        setItems(updated);
                      }}
                      placeholder="Ex: 1000 mg comprimé"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                    />
                  </div>

                  {/* Posology / Frequency */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Posologie (Fréquence)
                    </label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={e => {
                        const updated = [...items];
                        updated[index].frequency = e.target.value;
                        setItems(updated);
                      }}
                      placeholder="Ex: 1 comp. 3x/jour"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Durée
                    </label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={e => {
                        const updated = [...items];
                        updated[index].duration = e.target.value;
                        setItems(updated);
                      }}
                      placeholder="Ex: 6 jours, 1 mois"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Instructions per drug */}
                <div>
                  <input
                    type="text"
                    value={item.instructions}
                    onChange={e => {
                      const updated = [...items];
                      updated[index].instructions = e.target.value;
                      setItems(updated);
                    }}
                    placeholder="Instructions spécifiques (ex: pendant les repas, à jeun le matin, espacer de 6h...)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 focus:outline-hidden focus:border-teal-500 shadow-2xs"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddMedication}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/50 hover:bg-teal-50 text-teal-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter un Médicament Supplémentaire</span>
            </button>
          </div>

          {/* General instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructions & Conseils Généraux au Patient
            </label>
            <textarea
              rows={2}
              value={additionalInstructions}
              onChange={e => setAdditionalInstructions(e.target.value)}
              placeholder="Conseils hygiéno-diététiques, surveillance, conduite à tenir..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: BOUTON D'ENREGISTREMENT ET SOUMISSION ATOMIQUE    */}
        {/* ============================================================ */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/60 p-4 rounded-2xl">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Sauvegarde automatique :</strong> Le dossier patient et l'ordonnance seront enregistrés en une seule action et immédiatement prêts à être imprimés.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4 text-teal-200" />
                <span>Enregistrer le Patient & Délivrer l'Ordonnance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
