import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Search,
  Check,
  Star,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Eye,
  Edit3,
  Calendar,
  User,
  ArrowRight,
  Printer,
  ShieldCheck,
  RotateCcw,
  Zap,
  Save,
  BookOpen,
  X,
  UserPlus
} from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, Medication, PrescriptionItem, Prescription, ClinicSettings, DoctorProfile, OrdonnanceType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { PrintablePrescription } from './PrintablePrescription';

interface PrescriptionBuilderProps {
  initialPatientId?: string;
  onPrescriptionCreated: (newRx: Prescription) => void;
  onCancel: () => void;
}

const FREQUENCY_PRESETS = [
  '1 / J',
  '2 / J',
  '3 / J',
  '4 / J',
  '1 / J (Matin)',
  '2 / J (Matin et Soir)',
  '3 / J (Matin, Midi et Soir)',
  'Toutes les 6 heures',
  'Toutes les 8 heures',
  'Toutes les 12 heures',
  'Au coucher',
  'Si besoin (en cas de douleur / fièvre)'
];

const ROUTE_PRESETS = [
  'Voie orale',
  'IV (Intraveineuse)',
  'IM (Intramusculaire)',
  'SC (Sous-cutanée)',
  'Voie cutanée / Cutané',
  'Inhalation',
  'Voie nasale',
  'Ophtalmique',
  'Auriculaire',
  'Rectale',
  'Vaginale',
  'Autre'
];

const DURATION_PRESETS = [
  '3 jours',
  '5 jours',
  '7 jours',
  '10 jours',
  '14 jours',
  '1 mois',
  '2 mois',
  '3 mois'
];

export function PrescriptionBuilder({
  initialPatientId,
  onPrescriptionCreated,
  onCancel
}: PrescriptionBuilderProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | undefined>();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | undefined>();

  // Medication Autocomplete State
  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMeds, setFilteredMeds] = useState<Medication[]>([]);
  const [autocompleteHighlight, setAutocompleteHighlight] = useState<number>(0);

  // View state: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'live-preview'>('editor');
  const [quickMode, setQuickMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ordonnance Types (Templates) Modal State
  const [templatesList, setTemplatesList] = useState<OrdonnanceType[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateCat, setSelectedTemplateCat] = useState('Toutes');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Médecine Générale');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Quick Add Patient Modal State
  const [isQuickPatientModalOpen, setIsQuickPatientModalOpen] = useState(false);
  const [quickPatientData, setQuickPatientData] = useState({
    firstName: '',
    lastName: '',
    dob: '1990-01-01',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    diagnosis: '',
    allergies: 'Aucune allergie connue'
  });
  const [savingQuickPatient, setSavingQuickPatient] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleQuickCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPatientData.firstName.trim() || !quickPatientData.lastName.trim()) {
      showToast('error', 'Nom requis', 'Veuillez saisir le prénom et le nom du patient.');
      return;
    }

    try {
      setSavingQuickPatient(true);
      const newPt = await api.createPatient({
        firstName: quickPatientData.firstName.trim(),
        lastName: quickPatientData.lastName.trim(),
        dob: quickPatientData.dob || '1990-01-01',
        sex: quickPatientData.sex,
        phone: quickPatientData.phone.trim() || 'Non renseigné',
        email: '',
        address: '',
        diagnosis: quickPatientData.diagnosis.trim() || 'Consultation générale',
        allergies: [quickPatientData.allergies.trim() || 'Aucune allergie connue'],
        medicalNotes: `Enregistré directement dans l'éditeur d'ordonnance le ${new Date().toLocaleDateString('fr-FR')}.`,
        status: 'active'
      });

      setPatients(prev => [newPt, ...prev]);
      setSelectedPatient(newPt);
      setSelectedPatientId(newPt.id);
      setIsQuickPatientModalOpen(false);
      showToast('success', 'Patient Enregistré', `Le patient ${newPt.firstName} ${newPt.lastName} est créé et sélectionné pour l'ordonnance.`);
    } catch (err: any) {
      showToast('error', 'Erreur d’enregistrement', err.message || 'Impossible de créer le patient.');
    } finally {
      setSavingQuickPatient(false);
    }
  };

  // Load Patients, Medications, and Templates
  useEffect(() => {
    async function loadData() {
      try {
        const [pts, meds, clinic, doctor, tpls] = await Promise.all([
          api.getPatients({ status: 'active' }),
          api.getMedications(),
          api.getClinicSettings().catch(() => undefined),
          api.getDoctorProfile().catch(() => undefined),
          api.getOrdonnanceTypes().catch(() => [])
        ]);
        setPatients(pts);
        setMedicationsList(meds);
        if (clinic) setClinicSettings(clinic);
        if (doctor) setDoctorProfile(doctor);
        if (tpls) setTemplatesList(tpls);

        // Check if a template was passed via sessionStorage or parameter
        const sessionTpl = sessionStorage.getItem('ordocare_selected_template');
        if (sessionTpl) {
          try {
            const parsed = JSON.parse(sessionTpl);
            sessionStorage.removeItem('ordocare_selected_template');
            applyTemplateItems(parsed);
          } catch (e) {
            console.error('Failed reading session template', e);
          }
        } else if (initialPatientId && initialPatientId.startsWith('template:')) {
          const tplId = initialPatientId.replace('template:', '');
          const found = tpls.find((t: OrdonnanceType) => t.id === tplId);
          if (found) {
            applyTemplateItems(found);
          }
        } else if (initialPatientId) {
          const pt = pts.find(p => p.id === initialPatientId);
          if (pt) {
            setSelectedPatient(pt);
            setSelectedPatientId(pt.id);
          }
        }
      } catch (err) {
        console.error('Failed loading initial prescription builder data', err);
      }
    }
    loadData();
  }, [initialPatientId]);

  const applyTemplateItems = (tpl: OrdonnanceType) => {
    if (tpl.items && tpl.items.length > 0) {
      const converted: PrescriptionItem[] = tpl.items.map((item, idx) => ({
        id: `tpl-item-${Date.now()}-${idx}`,
        medicationName: item.medicationName,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dose: item.dose,
        route: item.route,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity || '1 bt',
        instructions: ''
      }));
      setItems(converted);
    }
    setAdditionalInstructions('');
    showToast('success', 'Ordonnance Type Appliquée', `Modèle "${tpl.name}" inséré (${tpl.items.length} médicaments).`);
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      showToast('error', 'Nom requis', 'Veuillez saisir un nom pour l’ordonnance type.');
      return;
    }
    if (items.length === 0 || items.some(i => !i.medicationName.trim())) {
      showToast('error', 'Médicaments requis', 'L’ordonnance doit contenir au moins un médicament avec un nom valide.');
      return;
    }

    try {
      setSavingTemplate(true);
      const created = await api.createOrdonnanceType({
        name: newTemplateName.trim(),
        category: newTemplateCategory.trim() || 'Médecine Générale',
        diagnosis: selectedPatient?.diagnosis || 'Consultation standard',
        description: `Créé depuis le Prescription Builder pour ${items.length} médicament(s).`,
        items: items.map(i => ({
          medicationName: i.medicationName,
          strength: i.strength,
          dosageForm: i.dosageForm,
          dose: i.dose,
          route: i.route,
          frequency: i.frequency,
          duration: i.duration,
          quantity: i.quantity,
          instructions: i.instructions
        })),
        additionalInstructions,
        isFavorite: false
      });

      setTemplatesList(prev => [created, ...prev]);
      setIsSaveTemplateModalOpen(false);
      setNewTemplateName('');
      showToast('success', 'Modèle enregistré', `L'ordonnance type "${created.name}" a été ajoutée à votre bibliothèque.`);
    } catch (err: any) {
      showToast('error', 'Erreur', err.message || 'Impossible d’enregistrer le modèle.');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Sync selected patient
  useEffect(() => {
    if (selectedPatientId) {
      const pt = patients.find(p => p.id === selectedPatientId) || null;
      setSelectedPatient(pt);
    } else {
      setSelectedPatient(null);
    }
  }, [selectedPatientId, patients]);

  // Filter autocomplete results - show ALL medications (not only favorites)
  useEffect(() => {
    if (!searchQuery.trim()) {
      // When prescribing, display all available medications in the formulary
      const allSorted = [...medicationsList].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (a.brandName || a.genericName).localeCompare(b.brandName || b.genericName, 'fr', { sensitivity: 'base' });
      });
      setFilteredMeds(allSorted);
      setAutocompleteHighlight(0);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matches = medicationsList.filter(m =>
      m.genericName.toLowerCase().includes(q) ||
      (m.brandName && m.brandName.toLowerCase().includes(q)) ||
      (m.activeIngredient && m.activeIngredient.toLowerCase().includes(q)) ||
      (m.strength && m.strength.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.dosageForm && m.dosageForm.toLowerCase().includes(q)) ||
      (m.packaging && m.packaging.toLowerCase().includes(q)) ||
      (m.code && m.code.toLowerCase().includes(q)) ||
      (m.registrationNumber && m.registrationNumber.toLowerCase().includes(q))
    );
    setFilteredMeds(matches);
    setAutocompleteHighlight(0);
  }, [searchQuery, medicationsList]);

  // Add Empty Medication Item
  const handleAddMedication = () => {
    const newItem: PrescriptionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicationName: '',
      strength: '',
      dosageForm: 'Comprimé',
      dose: '1 cp',
      route: 'Voie orale',
      frequency: '1 / J',
      duration: '7 jours',
      quantity: '1 bt',
      instructions: 'Prendre avec un verre d\'eau au cours du repas.'
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setActiveSearchIndex(newItems.length - 1);
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Select Medication from Autocomplete
  const handleSelectMedication = (index: number, med: Medication) => {
    const updated = [...items];
    const medDisplayName = med.brandName ? `${med.brandName} (${med.genericName})` : med.genericName;
    updated[index] = {
      ...updated[index],
      medicationId: med.id,
      medicationName: medDisplayName,
      activeIngredient: med.activeIngredient,
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
    setActiveSearchIndex(null);
    setSearchQuery('');
    showToast('success', 'Médicament Ajouté', `${medDisplayName} (${med.strength}) ajouté à l'ordonnance.`);
  };

  // Update Item field
  const handleUpdateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (activeSearchIndex === index) {
      setActiveSearchIndex(null);
    }
  };

  // Duplicate item
  const handleDuplicateItem = (index: number) => {
    const itemToClone = items[index];
    const cloned: PrescriptionItem = {
      ...itemToClone,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    const updated = [...items];
    updated.splice(index + 1, 0, cloned);
    setItems(updated);
    showToast('info', 'Médicament Dupliqué', `Copie créée pour ${itemToClone.medicationName || 'le médicament'}.`);
  };

  // Move item up/down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setItems(updated);
  };

  // Keyboard navigation for autocomplete list
  const handleSearchKeyDown = (e: React.KeyboardEvent, itemIndex: number) => {
    if (filteredMeds.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteHighlight(prev => (prev + 1) % filteredMeds.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteHighlight(prev => (prev - 1 + filteredMeds.length) % filteredMeds.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMeds[autocompleteHighlight]) {
        handleSelectMedication(itemIndex, filteredMeds[autocompleteHighlight]);
      }
    } else if (e.key === 'Escape') {
      setActiveSearchIndex(null);
    }
  };

  // Helper for mock live prescription
  const getMockPrescriptionForPreview = (): Prescription => {
    const age = selectedPatient ? new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear() : 30;
    return {
      id: 'PREVIEW-TEMP',
      prescriptionNumber: 'RX-PREVIEW',
      patientId: selectedPatient?.id || 'PT-PENDING',
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Select a Patient',
      patientDob: selectedPatient?.dob || '1990-01-01',
      patientAge: age,
      patientSex: selectedPatient?.sex || 'Male',
      patientInsurance: selectedPatient?.insurance ? `${selectedPatient.insurance.provider}` : 'Standard Clinical',
      patientDiagnosis: selectedPatient?.diagnosis || 'Clinical Consultation',
      doctorName: doctorProfile?.name || 'Dr. Elena Vance, MD',
      doctorSpecialty: doctorProfile?.specialty || 'Internal Medicine',
      doctorLicense: doctorProfile?.licenseNumber || 'MED-MA-8849201',
      clinicName: clinicSettings?.clinicName || 'OrdoCare Medical Practice',
      clinicAddress: clinicSettings?.address || '450 Medical Heights Blvd, Boston MA',
      clinicPhone: clinicSettings?.phone || '+1 (617) 555-0192',
      clinicEmail: clinicSettings?.email || 'clinic@ordocare.health',
      date,
      status: 'active',
      items: items.length > 0 ? items : [
        {
          id: 'placeholder',
          medicationName: 'Amoxicillin',
          strength: '500 mg',
          dosageForm: 'Capsule',
          dose: '500 mg (1 capsule)',
          route: 'Oral',
          frequency: 'Three times daily',
          duration: '7 days',
          quantity: '21 capsules',
          instructions: 'Take with water after meals.'
        }
      ],
      additionalInstructions,
      doctorSignatureText: doctorProfile?.name || 'Dr. Elena Vance, MD',
      doctorSignatureDate: date,
      qrVerificationData: 'https://ordocare.health/verify/RX-PREVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Submit Prescription
  const handleSavePrescription = async () => {
    if (!selectedPatientId) {
      showToast('error', 'Patient Manquant', 'Veuillez sélectionner un patient avant d’enregistrer l’ordonnance.');
      return;
    }

    if (items.length === 0) {
      showToast('error', 'Ordonnance Vide', 'Veuillez ajouter au moins un médicament à l’ordonnance.');
      return;
    }

    // Check that items have names
    const invalidItems = items.some(i => !i.medicationName.trim());
    if (invalidItems) {
      showToast('warning', 'Médicament Incomplet', 'Veuillez renseigner le nom de tous les médicaments prescrits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRx = await api.createPrescription({
        patientId: selectedPatientId,
        date,
        items,
        additionalInstructions
      });

      showToast('success', 'Ordonnance Validée', `L'ordonnance ${newRx.prescriptionNumber} a été émise et archivée.`);
      onPrescriptionCreated(newRx);
    } catch (err: any) {
      showToast('error', 'Erreur d’Émission', err.message || 'Impossible de valider l’ordonnance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-sky-700" />
              <span>Créateur d'Ordonnance</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
              Prescription Rapide
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Régime thérapeutique, recherche automatique VIDAL et génération du document d'ordonnance A5.
          </p>
        </div>

        {/* View mode toggle & Quick mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickMode(!quickMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              quickMode
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${quickMode ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Mode Rapide</span>
          </button>

          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Édition</span>
            </button>
            <button
              onClick={() => setActiveTab('live-preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'live-preview'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu A5</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'live-preview' ? (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Retour à l'Édition
            </button>
            <button
              onClick={handleSavePrescription}
              disabled={isSubmitting || !selectedPatientId || items.length === 0}
              className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Validation...' : 'Valider & Émettre l\'Ordonnance'}</span>
            </button>
          </div>
          <PrintablePrescription
            prescription={getMockPrescriptionForPreview()}
            clinicSettings={clinicSettings}
            doctorProfile={doctorProfile}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width on desktop): Patient selection & Medication Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Patient */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Sélectionner le Dossier Patient
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium bg-slate-50 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nom ou Identifiant du Patient
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickPatientModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Enregistrer Nouveau Patient</span>
                    </button>
                  </div>
                  <select
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-sky-600 font-medium text-slate-800"
                  >
                    <option value="">-- Choisir un Patient --</option>
                    {patients.map(pt => (
                      <option key={pt.id} value={pt.id}>
                        {pt.firstName} {pt.lastName} ({pt.id}) • Né(e) : {pt.dob} • {pt.diagnosis}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Summary Card */}
              {selectedPatient ? (
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/70 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200/50">
                    <span className="font-bold text-sky-950 text-sm">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                    <span className="font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-sky-100">
                      ID: {selectedPatient.id}
                    </span>
                    <span className="text-slate-600">
                      Sexe : <strong className="text-slate-800">{selectedPatient.sex === 'Male' ? 'Homme' : selectedPatient.sex === 'Female' ? 'Femme' : 'Autre'}</strong>
                    </span>
                    <span className="text-slate-600">
                      Né(e) le : <strong className="text-slate-800">{selectedPatient.dob}</strong>
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Allergies Thérapeutiques</span>
                      <span className="font-semibold text-rose-700">
                        {selectedPatient.allergies.join(', ') || 'Aucune allergie connue'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Diagnostic Principal / Motif</span>
                      <span className="font-medium text-slate-900">{selectedPatient.diagnosis}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-400">
                  Sélectionnez un patient ci-dessus pour consulter ses antécédents, allergies et rédiger son ordonnance.
                </div>
              )}
            </div>

            {/* Step 2: Prescribed Medications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Lignes Thérapeutiques & Médicaments ({items.length})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Template Picker Button */}
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-sky-600 text-sky-600" />
                    <span>⚡ Ordonnance Type</span>
                  </button>

                  {/* Save As Template Button */}
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sauvegarder Modèle</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un Médicament</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                  <Search className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Aucun médicament ajouté pour le moment</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Cliquez sur &quot;Ajouter un Médicament&quot; ou utilisez une &quot;Ordonnance Type&quot; pour rechercher et intégrer des prescriptions avec posologie pré-remplie.
                  </p>
                  <button
                    onClick={handleAddMedication}
                    className="mt-4 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter le Premier Médicament</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition-all shadow-2xs relative space-y-3"
                    >
                      {/* Top item controls */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.medicationName || 'Nouvelle Ligne de Médicament'}
                          </span>
                          {item.strength && (
                            <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                              {item.strength}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            title="Monter"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === items.length - 1}
                            title="Descendre"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateItem(index)}
                            title="Dupliquer"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            title="Supprimer"
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Medication Search Input / Autocomplete Box */}
                      <div className="relative">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nom du Médicament (Rechercher dans la base)
                        </label>
                        <div className="relative">
                          <input
                            ref={activeSearchIndex === index ? searchInputRef : undefined}
                            type="text"
                            value={activeSearchIndex === index ? searchQuery : item.medicationName}
                            onFocus={() => {
                              setActiveSearchIndex(index);
                              setSearchQuery(item.medicationName);
                            }}
                            onChange={e => {
                              setSearchQuery(e.target.value);
                              handleUpdateItem(index, 'medicationName', e.target.value);
                            }}
                            onKeyDown={e => handleSearchKeyDown(e, index)}
                            placeholder="Ex : Amoxicilline, Paracétamol, Metformine, Kardegic..."
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-sky-600 font-semibold text-slate-900 pl-9"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        </div>

                        {/* Autocomplete Dropdown List */}
                        {activeSearchIndex === index && filteredMeds.length > 0 && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-72 overflow-y-auto">
                            <div className="sticky top-0 z-10 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50/95 backdrop-blur-2xs border-b border-slate-100 flex items-center justify-between">
                              <span>Catalogue Médicaments ({filteredMeds.length} disponibles)</span>
                              <span>↑↓ pour naviguer • Entrée pour valider</span>
                            </div>
                            {filteredMeds.map((med, medIdx) => (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() => handleSelectMedication(index, med)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                                  autocompleteHighlight === medIdx
                                    ? 'bg-sky-50 text-sky-900 font-semibold'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {med.brandName && (
                                      <span className="font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70 text-[11px]">
                                        {med.brandName}
                                      </span>
                                    )}
                                    <span className="font-bold text-slate-900">{med.genericName}</span>
                                    <span className="text-slate-600 font-medium">({med.strength})</span>
                                    {med.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {med.dosageForm} • {med.route} • {med.packaging ? `Cond: ${med.packaging} • ` : ''}{med.category}
                                  </span>
                                </div>
                                <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-medium">
                                  Sélectionner
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dosage, Route, Frequency Presets Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Dosage / Posologie unitaire
                          </label>
                          <input
                            type="text"
                            value={item.dose}
                            onChange={e => handleUpdateItem(index, 'dose', e.target.value)}
                            placeholder="Ex : 500 mg, 1 comprimé"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Fréquence / Rythme de prise
                          </label>
                          <select
                            value={item.frequency}
                            onChange={e => handleUpdateItem(index, 'frequency', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          >
                            {FREQUENCY_PRESETS.map(freq => (
                              <option key={freq} value={freq}>
                                {freq}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Voie d'administration
                          </label>
                          <select
                            value={item.route}
                            onChange={e => handleUpdateItem(index, 'route', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          >
                            {ROUTE_PRESETS.map(r => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Duration & Quantity & Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Durée du traitement
                          </label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={e => handleUpdateItem(index, 'duration', e.target.value)}
                            placeholder="Ex : 7 jours, 1 mois, 3 mois"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Quantité à délivrer
                          </label>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(index, 'quantity', e.target.value)}
                            placeholder="Ex : 1 boîte, 2 flacons, QSP 30 jours"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Moment de prise
                          </label>
                          <input
                            type="text"
                            value={item.timing || ''}
                            onChange={e => handleUpdateItem(index, 'timing', e.target.value)}
                            placeholder="Ex : Le matin au cours du repas"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Consignes de prise / Recommandations au patient
                        </label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={e => handleUpdateItem(index, 'instructions', e.target.value)}
                          placeholder="Ex : Prendre avec un grand verre d'eau. Terminer impérativement la durée complète."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Additional Clinical Directives */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recommandations Générales & Précautions Cliniques
                </h2>
              </div>
              <textarea
                rows={3}
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                placeholder="Règles hygiéno-diététiques, surveillance biologique, interactions à éviter, conduite à tenir en cas d'effets secondaires..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-sky-600 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Right Column (1/3 width on desktop): Live Summary & Prescribing Actions */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Récapitulatif de l'Ordonnance</span>
                <span className="text-xs font-normal text-slate-500">{items.length} médicament(s)</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient :</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Aucun sélectionné'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Date :</span>
                  <span className="font-medium text-slate-800">{date}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Médecin :</span>
                  <span className="font-medium text-slate-800">{doctorProfile?.name || 'Dr. Oussama Belouar'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Cabinet :</span>
                  <span className="font-medium text-slate-800 truncate max-w-[150px]">
                    {clinicSettings?.clinicName || 'Cabinet Médical OrdoCare'}
                  </span>
                </div>
              </div>

              {/* Medication quick items pill list */}
              {items.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Médicaments inclus :</span>
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <span className="font-medium text-slate-800 truncate max-w-[140px]">
                        {it.medicationName || 'Sans nom'}
                      </span>
                      <span className="text-slate-500 text-[11px] shrink-0">{it.dose}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  onClick={handleSavePrescription}
                  disabled={isSubmitting || !selectedPatientId || items.length === 0}
                  className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Validation...' : 'Valider & Émettre l\'Ordonnance'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('live-preview')}
                  disabled={items.length === 0}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-sky-700" />
                  <span>Aperçu Document A5</span>
                </button>

                <button
                  onClick={onCancel}
                  className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              {/* Security notice */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5 leading-tight">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Toutes les ordonnances sont horodatées, sécurisées avec code de vérification et intégrées au dossier patient.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Load Ordonnance Type */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-sky-600 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Insérer une Ordonnance Type
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choisissez un modèle préconfiguré pour remplir instantanément cette ordonnance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Rechercher un protocole ou médicament..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['Toutes', 'Favorites', 'Infectiologie', 'Gastro-entérologie', 'Rhumatologie', 'Cardiologie', 'Pneumologie'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTemplateCat(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedTemplateCat === cat
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {templatesList
                .filter(tpl => {
                  const matchesCat =
                    selectedTemplateCat === 'Toutes'
                      ? true
                      : selectedTemplateCat === 'Favorites'
                      ? tpl.isFavorite
                      : tpl.category.toLowerCase().includes(selectedTemplateCat.toLowerCase());

                  const q = templateSearch.toLowerCase().trim();
                  const matchesSearch =
                    !q ||
                    tpl.name.toLowerCase().includes(q) ||
                    tpl.diagnosis.toLowerCase().includes(q) ||
                    tpl.items.some(i => i.medicationName.toLowerCase().includes(q));

                  return matchesCat && matchesSearch;
                })
                .map(tpl => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{tpl.name}</span>
                        {tpl.isFavorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {tpl.category}
                        </span>
                      </div>
                      {tpl.diagnosis && (
                        <p className="text-[11px] text-slate-500 font-medium">{tpl.diagnosis}</p>
                      )}
                      <p className="text-[11px] text-sky-800 font-semibold">
                        {tpl.items.map(i => `${i.medicationName} ${i.strength || ''}`).join(' • ')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        applyTemplateItems(tpl);
                        setIsTemplateModalOpen(false);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <span>Appliquer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}

              {templatesList.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucune ordonnance type enregistrée. Vous pouvez en créer depuis la section &quot;Ordonnances Types&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Save as Ordonnance Type */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Save className="w-4 h-4 text-sky-600" />
                <span>Enregistrer comme Ordonnance Type</span>
              </h3>
              <button
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du Modèle / Pathologie <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Lombalgie Aiguë, Angine Adulte..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie / Spécialité
                </label>
                <input
                  type="text"
                  value={newTemplateCategory}
                  onChange={e => setNewTemplateCategory(e.target.value)}
                  placeholder="Ex: Infectiologie, Rhumatologie, ORL..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/60 text-xs text-sky-900">
                Ce modèle contiendra les <strong>{items.length} médicament(s)</strong> actuellement saisis avec leurs posologies et consignes.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {savingTemplate ? 'Enregistrement...' : 'Enregistrer le Modèle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enregistrement Rapide d'un Nouveau Patient */}
      {isQuickPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Enregistrer un Nouveau Patient
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sera immédiatement créé et sélectionné pour cette ordonnance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickPatientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreatePatient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickPatientData.firstName}
                    onChange={e => setQuickPatientData({ ...quickPatientData, firstName: e.target.value })}
                    placeholder="Ex: Jean"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nom de Famille <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickPatientData.lastName}
                    onChange={e => setQuickPatientData({ ...quickPatientData, lastName: e.target.value })}
                    placeholder="Ex: Dupont"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date de Naissance
                  </label>
                  <input
                    type="date"
                    value={quickPatientData.dob}
                    onChange={e => setQuickPatientData({ ...quickPatientData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sexe
                  </label>
                  <select
                    value={quickPatientData.sex}
                    onChange={e => setQuickPatientData({ ...quickPatientData, sex: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="Male">Homme</option>
                    <option value="Female">Femme</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={quickPatientData.phone}
                  onChange={e => setQuickPatientData({ ...quickPatientData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnostic Initial / Motif de Consultation
                </label>
                <input
                  type="text"
                  value={quickPatientData.diagnosis}
                  onChange={e => setQuickPatientData({ ...quickPatientData, diagnosis: e.target.value })}
                  placeholder="Ex: Rhinopharyngite, Lombalgie commune..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Allergies Thérapeutiques
                </label>
                <input
                  type="text"
                  value={quickPatientData.allergies}
                  onChange={e => setQuickPatientData({ ...quickPatientData, allergies: e.target.value })}
                  placeholder="Ex: Pénicilline, AINS, ou Aucune allergie connue"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickPatientModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingQuickPatient}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {savingQuickPatient ? 'Création en cours...' : 'Enregistrer & Sélectionner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
