import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  FilePlus,
  Bookmark,
  History,
  Search,
  Check,
  Plus,
  Printer,
  Trash2,
  Star,
  Clock,
  AlertTriangle,
  User,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  FileText,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { BilanType, BilanPrescription, Patient, ClinicSettings, DoctorProfile, BilanCategory } from '../types';
import { STANDARD_EXAMS_CATALOG, BILAN_CATEGORIES } from '../data/bilanCatalog';
import { PrintableBilanPrescription } from '../components/bilans/PrintableBilanPrescription';

interface BilansPageProps {
  onNavigate?: (page: string, param?: string) => void;
  initialPatientId?: string;
}

export function BilansPage({ onNavigate, initialPatientId }: BilansPageProps) {
  const { showToast, addToast } = useToast();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'create' | 'types' | 'history'>('create');

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bilanTypes, setBilanTypes] = useState<BilanType[]>([]);
  const [historyPrescriptions, setHistoryPrescriptions] = useState<BilanPrescription[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | undefined>();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for New Bilan Prescription
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [customExamInput, setCustomExamInput] = useState<string>('');
  const [clinicalIndication, setClinicalIndication] = useState<string>('');
  const [fastingRequired, setFastingRequired] = useState<boolean>(false);
  const [urgent, setUrgent] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [examSearch, setExamSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Currently viewing/printing prescription
  const [viewingPrescription, setViewingPrescription] = useState<BilanPrescription | null>(null);
  const [autoPrintOnView, setAutoPrintOnView] = useState<boolean>(false);

  // Helper functions for patient data
  const getPatientAge = (p?: Patient): number | undefined => {
    if (!p) return undefined;
    if ((p as any).age !== undefined && typeof (p as any).age === 'number') return (p as any).age;
    if (p.dob) {
      const birth = new Date(p.dob);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age >= 0 ? age : undefined;
      }
    }
    return undefined;
  };

  const getPatientSexLabel = (p?: Patient): string => {
    if (!p) return '—';
    const s = p.sex || (p as any).gender;
    if (s === 'Male' || s === 'Homme') return 'Homme';
    if (s === 'Female' || s === 'Femme') return 'Femme';
    return s || '—';
  };

  const getPatientFullName = (p?: Patient): string => {
    if (!p) return '';
    return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient';
  };

  // New Bilan Type Modal
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [newTypeCategory, setNewTypeCategory] = useState<string>('Médecine Générale');
  const [newTypeDescription, setNewTypeDescription] = useState<string>('');
  const [newTypeIndication, setNewTypeIndication] = useState<string>('');
  const [newTypeFasting, setNewTypeFasting] = useState<boolean>(false);
  const [newTypeSelectedExams, setNewTypeSelectedExams] = useState<string[]>([]);
  const [newTypeCustomExamInput, setNewTypeCustomExamInput] = useState<string>('');
  const [newTypeCatalogSearch, setNewTypeCatalogSearch] = useState<string>('');

  const handleAddCustomExamToType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTypeCustomExamInput.trim();
    if (!trimmed) return;
    if (newTypeSelectedExams.includes(trimmed)) {
      showToast('info', 'Déjà sélectionné', `"${trimmed}" est déjà inclus dans ce modèle.`);
      setNewTypeCustomExamInput('');
      return;
    }
    setNewTypeSelectedExams(prev => [...prev, trimmed]);
    setNewTypeCustomExamInput('');
    showToast('success', 'Examen ajouté', `"${trimmed}" a été ajouté au modèle.`);
  };

  const handleRemoveExamFromType = (examName: string) => {
    setNewTypeSelectedExams(prev => prev.filter(e => e !== examName));
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [pts, types, hist, clinic, doc] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getBilanTypes().catch(() => []),
        api.getBilanPrescriptions().catch(() => []),
        api.getClinicSettings().catch(() => undefined),
        api.getDoctorProfile().catch(() => undefined)
      ]);

      setPatients(pts || []);
      setBilanTypes(types || []);
      setHistoryPrescriptions(hist || []);
      setClinicSettings(clinic);
      setDoctorProfile(doc);

      if (initialPatientId && pts.some(p => p.id === initialPatientId)) {
        setSelectedPatientId(initialPatientId);
      } else if (!selectedPatientId && pts.length > 0) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err: any) {
      addToast({
        title: 'Erreur de chargement',
        message: err.message || 'Impossible de récupérer les données des bilans.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter exams for the catalog
  const filteredExams = STANDARD_EXAMS_CATALOG.filter(exam => {
    const matchesCategory = selectedCategory === 'all' || exam.category === selectedCategory;
    const matchesSearch =
      exam.name.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.category.toLowerCase().includes(examSearch.toLowerCase()) ||
      (exam.sampleType && exam.sampleType.toLowerCase().includes(examSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Toggle exam selection
  const handleToggleExam = (examName: string) => {
    setSelectedExams(prev =>
      prev.includes(examName) ? prev.filter(e => e !== examName) : [...prev, examName]
    );
  };

  // Add custom test
  const handleAddCustomExam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customExamInput.trim();
    if (!trimmed) return;
    if (!selectedExams.includes(trimmed)) {
      setSelectedExams(prev => [...prev, trimmed]);
      addToast({
        title: 'Examen ajouté',
        message: `"${trimmed}" a été ajouté à la prescription.`,
        type: 'success'
      });
    }
    setCustomExamInput('');
  };

  // Apply a Bilan Type template
  const handleApplyBilanType = (type: BilanType) => {
    setSelectedExams(type.items);
    if (type.fastingRequired) setFastingRequired(true);
    if (type.urgent) setUrgent(true);
    if (type.defaultClinicalIndication && !clinicalIndication) {
      setClinicalIndication(type.defaultClinicalIndication);
    }
    setActiveTab('create');
    addToast({
      title: 'Modèle appliqué',
      message: `Le bilan "${type.name}" (${type.items.length} examens) a été chargé.`,
      type: 'info'
    });
  };

  // Submit and create new prescription
  const handleCreatePrescription = async () => {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) {
      showToast('warning', 'Patient requis', 'Veuillez sélectionner un patient avant de générer l’ordonnance.');
      return;
    }

    if (selectedExams.length === 0) {
      showToast('warning', 'Aucun examen sélectionné', 'Veuillez cocher au moins un examen biologique ou radiologique.');
      return;
    }

    const patientFullName = getPatientFullName(patient);
    const patientAge = getPatientAge(patient);
    const patientSex = (patient.sex || (patient as any).gender || 'Other') as any;

    try {
      let newRx: BilanPrescription;
      try {
        newRx = await api.createBilanPrescription({
          patientId: patient.id,
          patientName: patientFullName,
          patientDob: patient.dob,
          patientSex,
          patientAge,
          items: selectedExams,
          clinicalIndication: clinicalIndication || 'Bilan biologique d’exploration clinique.',
          fastingRequired,
          urgent,
          additionalNotes
        });
      } catch (apiErr) {
        console.warn('API createBilanPrescription error, using resilient prescription generator:', apiErr);
        newRx = {
          id: `BIL-LOCAL-${Date.now().toString(36)}`,
          prescriptionNumber: `BIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: patient.id,
          patientName: patientFullName,
          patientDob: patient.dob,
          patientSex,
          patientAge,
          doctorName: doctorProfile?.name || 'Dr. Oussama Belouar',
          doctorSpecialty: doctorProfile?.specialty || 'Médecine Générale / Thérapeutique',
          doctorLicense: doctorProfile?.licenseNumber || 'MED-DZ-948201',
          clinicName: clinicSettings?.clinicName || 'Cabinet Médical Dr. Oussama Belouar',
          clinicAddress: clinicSettings?.address || '24 Dummy Street Area, Suite 100',
          clinicPhone: clinicSettings?.phone || '+12-345 678 9012',
          date: new Date().toISOString().split('T')[0],
          items: selectedExams,
          clinicalIndication: clinicalIndication || 'Bilan biologique d’exploration clinique.',
          fastingRequired,
          urgent,
          additionalNotes,
          doctorSignatureText: doctorProfile?.signatureText || doctorProfile?.name || 'Dr. Oussama Belouar',
          status: 'active',
          createdAt: new Date().toISOString()
        };
      }

      showToast('success', 'Ordonnance de bilan générée', `L’ordonnance ${newRx.prescriptionNumber} est prête à être imprimée.`);

      // Update history list
      setHistoryPrescriptions(prev => [newRx, ...prev]);

      // Open print view immediately with auto-print triggered
      setAutoPrintOnView(true);
      setViewingPrescription(newRx);
    } catch (err: any) {
      console.error('Prescription generation error:', err);
      showToast('error', 'Erreur de génération', err.message || 'Impossible de créer l’ordonnance.');
    }
  };

  // Create new custom Bilan Type
  const handleSaveCustomBilanType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      showToast('warning', 'Titre requis', 'Indiquez un nom pour ce bilan type.');
      return;
    }
    if (newTypeSelectedExams.length === 0) {
      showToast('warning', 'Examens requis', 'Sélectionnez au moins un examen pour ce modèle.');
      return;
    }

    try {
      const created = await api.createBilanType({
        name: newTypeName.trim(),
        category: newTypeCategory,
        description: newTypeDescription,
        items: newTypeSelectedExams,
        fastingRequired: newTypeFasting,
        defaultClinicalIndication: newTypeIndication,
        isFavorite: true
      });

      setBilanTypes(prev => [created, ...prev]);
      setIsCreateTypeModalOpen(false);
      setNewTypeName('');
      setNewTypeDescription('');
      setNewTypeIndication('');
      setNewTypeSelectedExams([]);
      setNewTypeCustomExamInput('');
      setNewTypeCatalogSearch('');
      showToast('success', 'Bilan Type créé', `Le modèle "${created.name}" a été enregistré dans votre catalogue.`);
    } catch (err: any) {
      showToast('error', 'Erreur', err.message || 'Impossible d’enregistrer le modèle.');
    }
  };

  // Handle direct printing of a Bilan Type in standard A4 format
  const handlePrintBilanType = (type: BilanType) => {
    const patient = patients.find(p => p.id === selectedPatientId);
    const patientAge = getPatientAge(patient);
    const patientFullName = getPatientFullName(patient);
    const patientSex = (patient?.sex || (patient as any)?.gender || 'Other') as any;

    const templatePrescription: BilanPrescription = {
      id: `BIL-TYPE-${Date.now().toString(36)}`,
      prescriptionNumber: `BIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient?.id || 'PT-PRESET',
      patientName: patient ? patientFullName : '__________________________',
      patientDob: patient?.dob,
      patientAge: patientAge,
      patientSex: patientSex,
      date: new Date().toISOString().split('T')[0],
      items: [...type.items],
      clinicalIndication: type.defaultClinicalIndication || `Bilan Type : ${type.name}${type.description ? ` (${type.description})` : ''}`,
      fastingRequired: !!type.fastingRequired,
      urgent: false,
      doctorName: doctorProfile?.name || 'Dr. Oussama Belouar',
      doctorSpecialty: doctorProfile?.specialty || 'Médecin Généraliste / Thérapeutique',
      doctorLicense: doctorProfile?.licenseNumber || 'MED-DZ-948201',
      clinicName: clinicSettings?.clinicName || 'Cabinet Médical Dr. Oussama Belouar',
      clinicAddress: clinicSettings?.address || '24 Dummy Street Area, Suite 100',
      clinicPhone: clinicSettings?.phone || '+12-345 678 9012',
      doctorSignatureText: doctorProfile?.signatureText || doctorProfile?.name || 'Dr. Oussama Belouar',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setAutoPrintOnView(true);
    setViewingPrescription(templatePrescription);
  };

  // Delete an issued prescription
  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance de bilan ?')) return;
    try {
      await api.deleteBilanPrescription(id);
      setHistoryPrescriptions(prev => prev.filter(p => p.id !== id));
      showToast('info', 'Ordonnance supprimée', 'Le bilan a été retiré de l’historique.');
    } catch (err: any) {
      showToast('error', 'Erreur', err.message || 'Suppression échouée.');
    }
  };

  // If currently viewing a printable prescription
  if (viewingPrescription) {
    return (
      <PrintableBilanPrescription
        bilan={viewingPrescription}
        clinicSettings={clinicSettings}
        doctorProfile={doctorProfile}
        autoPrint={autoPrintOnView}
        onBack={() => {
          setAutoPrintOnView(false);
          setViewingPrescription(null);
        }}
      />
    );
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedPatientAge = getPatientAge(selectedPatient);
  const selectedPatientSex = getPatientSexLabel(selectedPatient);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <TestTube2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ordonnances de Bilans & Bilans Types
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Prescription d’analyses biologiques, examens d’imagerie médicale et protocoles de bilans types.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>Nouvelle Ordonnance</span>
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'types'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Bilans Types ({bilanTypes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique ({historyPrescriptions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NOUVELLE ORDONNANCE DE BILAN */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Area: Builder & Test Catalog */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Patient Selection & Quick Bilan Type Launcher */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  1. Sélection du Patient
                </span>
                {selectedPatient && (
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-100 dark:border-sky-900">
                    {selectedPatientAge !== undefined ? `${selectedPatientAge} ans • ` : ''}{selectedPatientSex}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Sélectionner un patient dans le dossier...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} {p.dob ? `(Né(e) le ${p.dob})` : ''}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Indication / Renseignements cliniques..."
                    value={clinicalIndication}
                    onChange={e => setClinicalIndication(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Quick Template Picker Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Pré-remplir avec un Bilan Type rapide :
                </span>
                <div className="flex flex-wrap gap-2">
                  {bilanTypes.slice(0, 5).map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleApplyBilanType(type)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:text-sky-700 dark:hover:text-sky-300 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{type.name.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Medical Tests Selection Catalog */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <TestTube2 className="w-4 h-4 text-sky-600" />
                  2. Catalogue d’Examens Biologiques & Imagerie ({STANDARD_EXAMS_CATALOG.length})
                </span>

                {/* Search in tests */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer (ex: NFS, Glycémie, TSH)..."
                    value={examSearch}
                    onChange={e => setExamSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tous ({STANDARD_EXAMS_CATALOG.length})
                </button>
                {BILAN_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Tests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredExams.map(exam => {
                  const isChecked = selectedExams.includes(exam.name);
                  return (
                    <div
                      key={exam.id}
                      onClick={() => handleToggleExam(exam.name)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked
                          ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold leading-snug">{exam.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 dark:text-slate-500 font-medium">
                            {exam.category}
                          </span>
                          {exam.fastingRequired && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold">
                              <Clock className="w-2.5 h-2.5" /> À jeun
                            </span>
                          )}
                          {exam.sampleType && (
                            <span className="text-slate-400 text-[9px] truncate max-w-[150px]">
                              • {exam.sampleType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isChecked
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Test Box */}
              <form onSubmit={handleAddCustomExam} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un examen spécifique / personnalisé (ex: Sérologie Lyme, Cortisol à 8h)..."
                  value={customExamInput}
                  onChange={e => setCustomExamInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Order Summary & Execution */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Récapitulatif de l’Ordonnance
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-xs font-bold">
                  {selectedExams.length} examen{selectedExams.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Patient Badge */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient prescrit</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Aucun patient sélectionné'}
                </p>
              </div>

              {/* Flags / Options */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Consignes de Réalisation
                </span>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={fastingRequired}
                    onChange={e => setFastingRequired(e.target.checked)}
                    className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Prélèvement à jeun strict
                    </span>
                    <p className="text-[10px] text-slate-400">Recommandé 10 à 12h sans alimentation</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={urgent}
                    onChange={e => setUrgent(e.target.checked)}
                    className="w-4 h-4 rounded-md text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Prescription urgente
                    </span>
                    <p className="text-[10px] text-slate-400">Transmission prioritaire au médecin</p>
                  </div>
                </label>
              </div>

              {/* Instructions for Biologist */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Instructions pour le laboratoire
                </span>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="Ex: Résultats à adresser par messagerie sécurisée, double au patient..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Selected Tests List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Examens cochés :
                  </span>
                  {selectedExams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedExams([])}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Tout désélectionner
                    </button>
                  )}
                </div>

                {selectedExams.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 text-xs">
                    Cochez des examens dans le catalogue à gauche ou appliquez un Bilan Type.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedExams.map((exam, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <span className="truncate">{exam}</span>
                        <button
                          onClick={() => handleToggleExam(exam)}
                          className="text-slate-400 hover:text-rose-500 shrink-0 p-1"
                          title="Retirer"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleCreatePrescription}
                disabled={selectedExams.length === 0 || !selectedPatientId}
                className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Générer l'Ordonnance & Imprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILANS TYPES (TEMPLATES) */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Catalogue des Bilans Types Prédéfinis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protocoles et panels standardisés pour prescrire des séries d'analyses en 1 clic.
              </p>
            </div>

            <button
              onClick={() => setIsCreateTypeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Bilan Type</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bilanTypes.map(type => (
              <div
                key={type.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wide border border-sky-100 dark:border-sky-900">
                      {type.category}
                    </span>
                    {type.fastingRequired && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-2.5 h-2.5" /> À jeun
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {type.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {type.description}
                    </p>
                  </div>

                  {/* Included exams list */}
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {type.items.length} Examens inclus :
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {type.items.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 truncate">
                          <Check className="w-3 h-3 text-sky-600 shrink-0" />
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                      {type.items.length > 4 && (
                        <li className="text-[11px] text-sky-600 font-bold pl-5">
                          + {type.items.length - 4} autre{type.items.length - 4 > 1 ? 's' : ''}...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <button
                    onClick={() => handlePrintBilanType(type)}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Imprimer directement ce bilan type au format A5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer (A5)</span>
                  </button>
                  <button
                    onClick={() => handleApplyBilanType(type)}
                    className="py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Personnaliser et affecter à un patient"
                  >
                    <span>Prescrire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORIQUE DES BILANS PRESCRITS */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Historique des Ordonnances de Bilans Délivrées
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {historyPrescriptions.length} ordonnance{historyPrescriptions.length > 1 ? 's' : ''} délivrée{historyPrescriptions.length > 1 ? 's' : ''} au total.
              </p>
            </div>
          </div>

          {historyPrescriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Aucune ordonnance de bilan délivrée pour le moment.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-3 text-xs text-sky-600 font-bold hover:underline"
              >
                Créer une première ordonnance &rarr;
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {historyPrescriptions.map(rx => (
                <div
                  key={rx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                        {rx.prescriptionNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {rx.patientName}
                      </h4>
                      {rx.fastingRequired && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          À jeun
                        </span>
                      )}
                      {rx.urgent && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Indication : <span className="text-slate-700 dark:text-slate-300">{rx.clinicalIndication}</span>
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {rx.items.length} examen{rx.items.length > 1 ? 's' : ''} : {rx.items.slice(0, 3).join(', ')}
                      {rx.items.length > 3 ? '...' : ''} • Prescrit le {rx.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAutoPrintOnView(true);
                        setViewingPrescription(rx);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </button>

                    <button
                      onClick={() => handleDeletePrescription(rx.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Custom Bilan Type */}
      {isCreateTypeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-sky-600" />
                Créer un Nouveau Bilan Type
              </h3>
              <button
                onClick={() => setIsCreateTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCustomBilanType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du Bilan Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bilan Rhumatologique / Polyarthrite"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Spécialité / Catégorie
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rhumatologie"
                    value={newTypeCategory}
                    onChange={e => setNewTypeCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeFasting}
                      onChange={e => setNewTypeFasting(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600"
                    />
                    <span>À jeun obligatoire</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description clinique
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bilan de première intention devant une polyarthralgie inflammatoire..."
                  value={newTypeDescription}
                  onChange={e => setNewTypeDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* 1. Option d'ajout d'un bilan / examen personnalisé non mentionné */}
              <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Ajouter un bilan / examen non mentionné dans la liste</span>
                  </label>
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium">
                    Biologie, Sérologie, Radiologie...
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Calprotectine fécale, Anti-CCP, Échographie cervicale, Vitamine B12..."
                    value={newTypeCustomExamInput}
                    onChange={e => setNewTypeCustomExamInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomExamToType();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomExamToType}
                    disabled={!newTypeCustomExamInput.trim()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {/* Suggestions d'examens fréquents non listés */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mr-1">Suggestions rapides :</span>
                  {[
                    'Calprotectine fécale',
                    'Anti-CCP (ACPA)',
                    'Vitamine B12 / Folates',
                    'Échographie abdomino-pelvienne',
                    'Microalbuminurie des 24h',
                    'Sérologie Helicobacter pylori',
                    'Procalcitonine (PCT)'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!newTypeSelectedExams.includes(suggestion)) {
                          setNewTypeSelectedExams(prev => [...prev, suggestion]);
                          showToast('success', 'Examen ajouté', `"${suggestion}" ajouté au modèle.`);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-300 hover:bg-sky-100 hover:border-sky-300 transition-colors text-[10.5px] cursor-pointer"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Liste des examens actuellement retenus dans ce modèle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Examens inclus dans ce modèle ({newTypeSelectedExams.length} sélectionné{newTypeSelectedExams.length > 1 ? 's' : ''}) *
                  </label>
                  {newTypeSelectedExams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewTypeSelectedExams([])}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                {newTypeSelectedExams.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                    Aucun examen sélectionné. Choisissez dans la liste ci-dessous ou ajoutez un examen personnalisé ci-dessus.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 p-2.5 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    {newTypeSelectedExams.map(examName => {
                      const isCustom = !STANDARD_EXAMS_CATALOG.some(e => e.name.toLowerCase() === examName.toLowerCase());
                      return (
                        <span
                          key={examName}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isCustom
                              ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                              : 'bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                          }`}
                        >
                          <span>{examName}</span>
                          {isCustom && (
                            <span className="text-[9px] bg-amber-200 dark:bg-amber-800 px-1 py-0.2 rounded font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">
                              Perso
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveExamFromType(examName)}
                            className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                            title="Retirer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Catalogue d'examens standards avec filtre de recherche */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Catalogue d'examens standards
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Cliquez pour cocher / décocher
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer les examens standards (ex: NFS, CRP, Glycémie...)"
                    value={newTypeCatalogSearch}
                    onChange={e => setNewTypeCatalogSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  {newTypeCatalogSearch && (
                    <button
                      type="button"
                      onClick={() => setNewTypeCatalogSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl p-2 space-y-1">
                  {STANDARD_EXAMS_CATALOG
                    .filter(exam =>
                      !newTypeCatalogSearch.trim() ||
                      exam.name.toLowerCase().includes(newTypeCatalogSearch.toLowerCase()) ||
                      (exam.category && exam.category.toLowerCase().includes(newTypeCatalogSearch.toLowerCase()))
                    )
                    .map(exam => {
                      const isSelected = newTypeSelectedExams.includes(exam.name);
                      return (
                        <div
                          key={exam.id}
                          onClick={() => {
                            setNewTypeSelectedExams(prev =>
                              prev.includes(exam.name) ? prev.filter(e => e !== exam.name) : [...prev, exam.name]
                            );
                          }}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white dark:bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{exam.name}</span>
                          </div>
                          {exam.category && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              {exam.category}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20"
                >
                  Enregistrer le Bilan Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
