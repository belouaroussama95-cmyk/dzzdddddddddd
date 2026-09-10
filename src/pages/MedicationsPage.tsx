import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Star,
  Edit2,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  BookOpen,
  ExternalLink,
  Calculator,
  FileSpreadsheet,
  FileText,
  Check,
  Building2,
  Hash,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import type { Medication } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MedicationDosageCalculator } from '../components/medications/MedicationDosageCalculator';

interface MedicationsPageProps {
  openNewModal?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'Toutes les Spécialités' },
  { id: 'Cardio', label: 'Cardiovasculaire' },
  { id: 'Infect', label: 'Antibiotiques / Anti-infectieux' },
  { id: 'Diab', label: 'Diabétologie & Métabolisme' },
  { id: 'AINS', label: 'Anti-inflammatoires (AINS)' },
  { id: 'Analg', label: 'Analgésiques / Douleur' },
  { id: 'Gastro', label: 'Gastro-entérologie' },
  { id: 'Pneumo', label: 'Pneumologie' },
  { id: 'Neuro', label: 'Neurologie' },
  { id: 'Psych', label: 'Psychiatrie' },
  { id: 'Allerg', label: 'Antiallergiques' },
  { id: 'Hémat', label: 'Hématologie' },
  { id: 'Derma', label: 'Dermatologie' },
  { id: 'Uro', label: 'Urologie / Néphrologie' },
  { id: 'Onco', label: 'Oncologie / Immunologie' },
  { id: 'Ophtalm', label: 'Ophtalmologie / ORL' },
  { id: 'Gynéco', label: 'Gynécologie' },
  { id: 'Rhumato', label: 'Rhumatologie' },
  { id: 'Emergency', label: 'Urgences' }
];

export function MedicationsPage({ openNewModal }: MedicationsPageProps = {}) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'official' | 'clinical' | 'favorites'>('all');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<'catalog' | 'calculator'>('catalog');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (openNewModal) {
      setModalMode('create');
      setShowModal(true);
    }
  }, [openNewModal]);

  const [formData, setFormData] = useState<Partial<Medication>>({
    genericName: '',
    brandName: '',
    activeIngredient: '',
    category: 'Antibiotics',
    dosageForm: 'Comprimé',
    strength: '500 mg',
    route: 'Voie orale',
    standardDose: '500 mg',
    defaultFrequency: '1 fois par jour',
    defaultDuration: '7 jours',
    instructions: 'À prendre pendant ou après les repas avec un grand verre d\'eau.',
    contraindications: [],
    sideEffects: [],
    pregnancyCategory: 'B',
    isFavorite: false
  });

  const loadMedications = async () => {
    try {
      const data = await api.getMedications({
        search: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory
      });
      setMedications(data);
      if (data.length > 0 && !selectedMedication) {
        setSelectedMedication(data[0]);
      }
    } catch (err) {
      console.error('Failed loading medications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedications();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedMedications = medications.filter(med => {
    if (originFilter === 'official') {
      return med.origin === 'Nomenclature Officielle 2025' || !!med.code;
    }
    if (originFilter === 'clinical') {
      return med.origin !== 'Nomenclature Officielle 2025' && !med.code;
    }
    if (originFilter === 'favorites') {
      return !!med.isFavorite;
    }
    return true;
  });

  const officialCount = medications.filter(m => m.origin === 'Nomenclature Officielle 2025' || !!m.code).length;
  const clinicalCount = medications.filter(m => m.origin !== 'Nomenclature Officielle 2025' && !m.code).length;
  const favoritesCount = medications.filter(m => !!m.isFavorite).length;

  const handleToggleFavorite = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleMedicationFavorite(id, !current);
      setMedications(prev => prev.map(m => (m.id === id ? { ...m, isFavorite: !current } : m)));
      showToast('info', !current ? 'Ajouté aux favoris' : 'Retiré des favoris', 'Priorité dans le formulaire mise à jour.');
    } catch (err: any) {
      showToast('error', 'Échec de mise à jour', err.message);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      genericName: '',
      brandName: '',
      activeIngredient: '',
      category: 'Antibiotics',
      dosageForm: 'Comprimé',
      strength: '500 mg',
      route: 'Voie orale',
      standardDose: '500 mg',
      defaultFrequency: '1 fois par jour',
      defaultDuration: '7 jours',
      instructions: 'À prendre pendant ou après les repas avec un grand verre d\'eau.',
      contraindications: [],
      sideEffects: [],
      pregnancyCategory: 'B',
      isFavorite: false
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med: Medication, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setFormData(med);
    setShowModal(true);
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.genericName?.trim() || !formData.strength?.trim()) {
      showToast('warning', 'Validation', 'Le nom générique (DCI) et le dosage sont obligatoires.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await api.createMedication(formData);
        showToast('success', 'Médicament Ajouté', `${created.genericName} a été ajouté au formulaire.`);
      } else if (formData.id) {
        const updated = await api.updateMedication(formData.id, formData);
        showToast('success', 'Médicament Modifié', `Les données de ${updated.genericName} ont été enregistrées.`);
      }
      setShowModal(false);
      loadMedications();
    } catch (err: any) {
      showToast('error', 'Échec de l\'enregistrement', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-sections Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            id="tab-btn-medications-catalog"
            onClick={() => setActiveSubSection('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubSection === 'catalog'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Catalogue Médicaments</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200/60">
              {medications.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-btn-calculator-doses"
            onClick={() => setActiveSubSection('calculator')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubSection === 'calculator'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className={`w-4 h-4 ${activeSubSection === 'calculator' ? 'text-teal-200' : 'text-teal-600'}`} />
            <span>Calculatrice de Doses</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubSection === 'calculator' ? 'bg-teal-800 text-teal-100' : 'bg-teal-50 text-teal-700 border border-teal-200/60'
            }`}>
              mg/kg & mL
            </span>
          </button>
        </div>

        {/* Bouton direct vers le site VIDAL Médicaments */}
        <div className="flex items-center gap-2">
          <a
            href="https://www.vidal.fr/medicaments.html"
            target="_blank"
            rel="noopener noreferrer"
            id="btn-vidal-external-link"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Consulter le site VIDAL Médicaments officiel (vidal.fr) dans un nouvel onglet"
          >
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>VIDAL Médicaments (vidal.fr)</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-600 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Calculator Sub-section */}
      {activeSubSection === 'calculator' && (
        <MedicationDosageCalculator />
      )}

      {/* Formulary Catalog Sub-section */}
      {activeSubSection === 'catalog' && (
        <>
          {/* Top Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-2xs">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                    <span>Nomenclature & Formulaire Pharmaceutique</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200/80">
                      {medications.length} Médicaments
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreate}
                  id="btn-add-formulary-medication"
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Médicament</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-Filters: Origin & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            {/* Origin segmented bar & Search input */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Origin filter buttons */}
              <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOriginFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    originFilter === 'all'
                      ? 'bg-white text-teal-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tous ({medications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOriginFilter('official')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    originFilter === 'official'
                      ? 'bg-white text-teal-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                  <span>Nomenclature Officielle ({officialCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOriginFilter('clinical')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    originFilter === 'clinical'
                      ? 'bg-white text-teal-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Formulaire Clinique ({clinicalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOriginFilter('favorites')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    originFilter === 'favorites'
                      ? 'bg-white text-amber-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Favoris ({favoritesCount})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par DCI, marque (ex: ARTIZ), code, dosage..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 font-medium text-slate-800"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Specialty Categories Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-teal-700 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Split: Medication List (Left) and Clinical Monograph / Details (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Drug list */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{displayedMedications.length} médicaments affichés</span>
                <span>Cliquez sur un médicament pour inspecter la monographie</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Chargement du catalogue des médicaments...</div>
              ) : displayedMedications.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Aucun médicament trouvé</p>
                  <p className="text-xs text-slate-400 mt-1">Essayez un autre mot-clé ou filtre de catégorie / origine.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
                  {displayedMedications.map(med => {
                    const isSelected = selectedMedication?.id === med.id;
                    const isOfficial = med.origin === 'Nomenclature Officielle 2025' || !!med.code;

                    return (
                      <div
                        key={med.id}
                        onClick={() => setSelectedMedication(med)}
                        className={`p-4 hover:bg-teal-50/50 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected ? 'bg-teal-50/80 border-l-4 border-teal-600' : ''
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {med.brandName && (
                              <span className="font-extrabold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80">
                                {med.brandName}
                              </span>
                            )}
                            <span className="font-bold text-sm text-slate-900">{med.genericName}</span>
                            <span className="text-xs font-semibold text-teal-700">{med.strength}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {med.dosageForm} • {med.route}
                            </span>
                            {med.packaging && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-mono font-medium">
                                {med.packaging}
                              </span>
                            )}
                            {isOfficial && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60 font-bold uppercase tracking-wider">
                                Nomenclature 2025
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            {med.code && (
                              <span className="font-mono text-[11px] text-slate-400">
                                Code: <strong className="text-slate-600">{med.code}</strong>
                              </span>
                            )}
                            {med.registrationNumber && (
                              <span className="font-mono text-[11px] text-slate-400">
                                N° Enreg: <strong className="text-slate-600">{med.registrationNumber}</strong>
                              </span>
                            )}
                            <span>
                              Spécialité : <strong className="text-slate-700">{med.category}</strong>
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            Posologie type : {med.standardDose} • {med.defaultFrequency} • {med.defaultDuration}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleToggleFavorite(med.id, !!med.isFavorite, e)}
                            title={med.isFavorite ? 'Retirer des favoris' : 'Marquer comme médicament fréquent'}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                med.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={e => handleOpenEdit(med, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Modifier les données du médicament"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Selected Medication Clinical Monograph */}
            <div className="space-y-4">
              {selectedMedication ? (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 sticky top-20">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 px-2 py-0.5 rounded bg-teal-50 border border-teal-100">
                        {selectedMedication.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Grossesse : {selectedMedication.pregnancyCategory || 'Non précisé'}
                      </span>
                    </div>

                    {selectedMedication.brandName && (
                      <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-teal-700 block">Nom Commercial</span>
                          <span className="text-base font-black text-teal-900">{selectedMedication.brandName}</span>
                        </div>
                        <span className="text-xs font-bold text-teal-700 px-2 py-0.5 rounded bg-white shadow-2xs">
                          {selectedMedication.dosageForm}
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-black text-slate-900 mt-2">
                      {selectedMedication.genericName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Dénomination Commune Internationale (DCI)</p>
                  </div>

                  {/* Official Registry Box if available */}
                  {(selectedMedication.code || selectedMedication.registrationNumber || selectedMedication.packaging) && (
                    <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/70 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sky-900 font-bold text-[11px] mb-1">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
                        <span>Enregistrement Officiel (Nomenclature 2025)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {selectedMedication.code && (
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Code Produit</span>
                            <span className="font-mono font-bold text-slate-800">{selectedMedication.code}</span>
                          </div>
                        )}
                        {selectedMedication.registrationNumber && (
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">N° Enregistrement</span>
                            <span className="font-mono font-bold text-slate-800">{selectedMedication.registrationNumber}</span>
                          </div>
                        )}
                        {selectedMedication.packaging && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px] font-bold">Conditionnement</span>
                            <span className="font-semibold text-slate-800">{selectedMedication.packaging}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formulation specs */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Dosage</span>
                        <span className="font-semibold text-slate-800">{selectedMedication.strength}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Forme Galénique</span>
                        <span className="font-semibold text-slate-800">{selectedMedication.dosageForm}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Voie</span>
                        <span className="font-semibold text-slate-800">{selectedMedication.route}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Dose Standard</span>
                        <span className="font-semibold text-slate-800">{selectedMedication.standardDose}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Fréquence & Durée par défaut</span>
                      <span className="font-medium text-slate-800">
                        {selectedMedication.defaultFrequency} pendant {selectedMedication.defaultDuration}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Instructions */}
                  {selectedMedication.instructions && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Conseils & Prise</span>
                      <p className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-100 text-slate-800 font-medium leading-relaxed">
                        {selectedMedication.instructions}
                      </p>
                    </div>
                  )}

                  {/* Contraindications */}
                  {selectedMedication.contraindications && selectedMedication.contraindications.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-600 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Contre-indications
                      </span>
                      <ul className="list-disc pl-4 text-rose-900 space-y-0.5 font-medium text-[11px]">
                        {selectedMedication.contraindications.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Side Effects */}
                  {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Effets Indésirables
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {selectedMedication.sideEffects.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Calculator Quick Action */}
                  <button
                    type="button"
                    onClick={() => setActiveSubSection('calculator')}
                    className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Calculator className="w-4 h-4 text-teal-600" />
                    <span>Ouvrir la Calculatrice Posologique</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Sélectionnez un médicament à gauche pour consulter ses données pharmacologiques et posologies.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">
              {modalMode === 'create' ? 'Ajouter un Médicament au Formulaire' : 'Modifier le Médicament'}
            </h3>

            <form onSubmit={handleSaveMedication} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom Générique (DCI) *</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName || ''}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="ex. Amoxicilline"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom Commercial / Marque</label>
                  <input
                    type="text"
                    value={formData.brandName || ''}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="ex. Clamoxyl"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={formData.category || 'Antibiotics'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage / Titrage *</label>
                  <input
                    type="text"
                    required
                    value={formData.strength || ''}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="ex. 500 mg, 1 g"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forme Galénique</label>
                  <select
                    value={formData.dosageForm || 'Comprimé'}
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {[
                      'Comprimé',
                      'Gélule',
                      'Sirop / Suspension buvable',
                      'Injectable',
                      'Crème / Pommade',
                      'Inhalateur / Aérosol',
                      'Gouttes',
                      'Collyre',
                      'Suppositoire',
                      'Patch transdermique'
                    ].map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voie d'administration</label>
                  <select
                    value={formData.route || 'Voie orale'}
                    onChange={e => setFormData({ ...formData, route: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {['Voie orale', 'IV (Intraveineuse)', 'IM (Intramusculaire)', 'SC (Sous-cutanée)', 'Voie cutanée', 'Inhalation', 'Voie nasale', 'Ophtalmique'].map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Posologie Standard</label>
                  <input
                    type="text"
                    value={formData.standardDose || ''}
                    onChange={e => setFormData({ ...formData, standardDose: e.target.value })}
                    placeholder="ex. 1 comprimé"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fréquence par défaut</label>
                  <input
                    type="text"
                    value={formData.defaultFrequency || ''}
                    onChange={e => setFormData({ ...formData, defaultFrequency: e.target.value })}
                    placeholder="ex. 3 fois par jour"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions de prise & conseils</label>
                <input
                  type="text"
                  value={formData.instructions || ''}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="ex. Prendre au cours du repas avec un verre d'eau."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="favorite-checkbox"
                  checked={!!formData.isFavorite}
                  onChange={e => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="favorite-checkbox" className="font-semibold text-slate-700 cursor-pointer">
                  Définir comme favori / Médicament fréquent dans l'éditeur d'ordonnances
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Enregistrer le Médicament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
