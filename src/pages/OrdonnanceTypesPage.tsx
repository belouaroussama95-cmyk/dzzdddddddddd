import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Printer,
  Trash2,
  Edit3,
  Copy,
  Check,
  Zap,
  Stethoscope,
  Pill,
  AlertCircle,
  Tag,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { OrdonnanceType, OrdonnanceTypeItem, Medication, Prescription, ClinicSettings, DoctorProfile } from '../types';
import { useToast } from '../context/ToastContext';
import { PrintablePrescription } from '../components/prescriptions/PrintablePrescription';

interface OrdonnanceTypesPageProps {
  onNavigate: (page: string, param?: string) => void;
}

const CATEGORIES = [
  'Toutes',
  'Favorites',
  'Infectiologie / ORL',
  'Gastro-entérologie',
  'Rhumatologie',
  'Cardiologie',
  'Pneumologie',
  'Urologie',
  'Dermatologie',
  'Médecine Générale'
];

export function OrdonnanceTypesPage({ onNavigate }: OrdonnanceTypesPageProps) {
  const [templates, setTemplates] = useState<OrdonnanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OrdonnanceType | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OrdonnanceType | null>(null);
  
  // Available formulary medications for quick suggestions
  const [availableMeds, setAvailableMeds] = useState<Medication[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | undefined>();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | undefined>();
  
  const { showToast } = useToast();

  // Load templates and supporting data
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const [tpls, meds, clinic, doctor] = await Promise.all([
        api.getOrdonnanceTypes(),
        api.getMedications().catch(() => []),
        api.getClinicSettings().catch(() => undefined),
        api.getDoctorProfile().catch(() => undefined)
      ]);
      setTemplates(tpls);
      setAvailableMeds(meds);
      if (clinic) setClinicSettings(clinic);
      if (doctor) setDoctorProfile(doctor);
    } catch (err) {
      console.error('Failed to load ordonnances types', err);
      showToast('error', 'Erreur de chargement', 'Impossible de charger les ordonnances types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(tpl => {
    const matchesCategory =
      selectedCategory === 'Toutes'
        ? true
        : selectedCategory === 'Favorites'
        ? tpl.isFavorite
        : tpl.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tpl.name.toLowerCase().includes(q) ||
      tpl.diagnosis.toLowerCase().includes(q) ||
      (tpl.description && tpl.description.toLowerCase().includes(q)) ||
      tpl.items.some(
        i =>
          i.medicationName.toLowerCase().includes(q) ||
          i.instructions.toLowerCase().includes(q)
      );

    return matchesCategory && matchesSearch;
  });

  // Toggle favorite
  const handleToggleFavorite = async (template: OrdonnanceType, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.updateOrdonnanceType(template.id, {
        isFavorite: !template.isFavorite
      });
      setTemplates(prev => prev.map(t => (t.id === template.id ? updated : t)));
      showToast(
        'success',
        template.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
        `"${template.name}" ${template.isFavorite ? 'retiré de vos' : 'ajouté à vos'} favoris.`
      );
    } catch (err) {
      showToast('error', 'Erreur', 'Impossible de mettre à jour le statut favori.');
    }
  };

  // Delete template
  const handleDelete = async (template: OrdonnanceType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Confirmez-vous la suppression du modèle "${template.name}" ?`)) {
      return;
    }
    try {
      await api.deleteOrdonnanceType(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      showToast('success', 'Modèle supprimé', `L'ordonnance type "${template.name}" a été supprimée.`);
    } catch (err) {
      showToast('error', 'Erreur', 'Impossible de supprimer le modèle.');
    }
  };

  // Duplicate template
  const handleDuplicate = async (template: OrdonnanceType, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = await api.createOrdonnanceType({
        name: `${template.name} (Copie)`,
        category: template.category,
        diagnosis: template.diagnosis,
        description: template.description,
        items: [...template.items],
        additionalInstructions: template.additionalInstructions,
        isFavorite: false
      });
      setTemplates(prev => [duplicated, ...prev]);
      showToast('success', 'Modèle dupliqué', `Copie créée : "${duplicated.name}".`);
    } catch (err) {
      showToast('error', 'Erreur', 'Impossible de dupliquer le modèle.');
    }
  };

  // Use template to prescribe
  const handleUseTemplate = (template: OrdonnanceType) => {
    // Pass template via localStorage / navigation state
    sessionStorage.setItem('ordocare_selected_template', JSON.stringify(template));
    onNavigate('new-prescription', `template:${template.id}`);
    showToast('info', 'Modèle chargé', `Modèle "${template.name}" prêt pour prescription.`);
  };

  // Build a dummy/preview prescription for printable preview
  const buildPreviewPrescription = (template: OrdonnanceType): Prescription => {
    return {
      id: `PREV-${template.id}`,
      prescriptionNumber: `RX-MOD-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: 'PT-EXEMPLE',
      patientName: 'Nom & Prénom du Patient',
      patientDob: '1980-01-01',
      patientAge: 45,
      patientSex: 'Masculin',
      patientDiagnosis: template.diagnosis || 'Diagnostic de consultation',
      patientInsurance: 'Assurance Maladie / CNAS',
      doctorName: doctorProfile?.name || 'Dr. Oussama Belouar',
      doctorSpecialty: doctorProfile?.specialty || 'Médecine Générale & Thérapeutique',
      doctorLicense: doctorProfile?.licenseNumber || 'MED-DZ-948201',
      clinicName: clinicSettings?.clinicName || 'Cabinet Médical Dr. Oussama Belouar',
      clinicAddress: clinicSettings?.address || '24 Dummy Street Area, Suite 100',
      clinicPhone: clinicSettings?.phone || '+12-345 678 9012',
      clinicEmail: clinicSettings?.email || 'oussama.belouar.mr@gmail.com',
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      items: template.items.map((item, idx) => ({
        id: `prev-item-${idx}`,
        medicationName: item.medicationName,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dose: item.dose,
        route: item.route,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity || '1 bt',
        instructions: item.instructions
      })),
      additionalInstructions: template.additionalInstructions || '',
      doctorSignatureText: doctorProfile?.name || 'Dr. Oussama Belouar',
      doctorSignatureDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Ordonnances Types</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                  {templates.length} protocoles
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Bibliothèque de modèles cliniques préconfigurés par pathologie. Prescrivez ou imprimez en un clic.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const blankPrescription: Prescription = {
                id: 'BLANK-RX',
                prescriptionNumber: `ORD-${new Date().getFullYear()}-VIERGE`,
                patientId: 'PT-0000',
                patientName: '________________________________',
                patientDob: '1990-01-01',
                patientAge: 0,
                patientSex: 'Masculin',
                patientDiagnosis: '________________________________',
                doctorName: doctorProfile?.name || 'Dr. Oussama Belouar',
                doctorSpecialty: doctorProfile?.specialty || 'Médecine Générale',
                doctorLicense: doctorProfile?.licenseNumber || 'MED-DZ-948201',
                clinicName: clinicSettings?.clinicName || 'Cabinet Médical Dr. Oussama Belouar',
                clinicAddress: clinicSettings?.address || '24 Dummy Street Area, Medical District',
                clinicPhone: clinicSettings?.phone || '+12-345 678 9012',
                clinicEmail: clinicSettings?.email || 'oussama.belouar.mr@gmail.com',
                date: new Date().toISOString().split('T')[0],
                status: 'active',
                items: [
                  {
                    id: 'blank-1',
                    medicationName: '1. ________________________________________',
                    strength: '___________',
                    dosageForm: 'Comprimé / Gélule',
                    dose: 'Posologie : _____________________________________',
                    route: 'Oral',
                    frequency: 'Selon avis médical',
                    duration: '_____ jours',
                    quantity: '_____ boîte(s)',
                    instructions: ''
                  }
                ],
                additionalInstructions: '',
                doctorSignatureText: doctorProfile?.name || 'Dr. Oussama Belouar',
                doctorSignatureDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setPreviewTemplate({
                id: 'blank-tpl',
                name: 'Modèle d’Ordonnance Vierge (Dr. Oussama Belouar)',
                category: 'Modèle d’impression',
                diagnosis: 'Consultation générale',
                items: [],
                createdAt: new Date().toISOString()
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer Modèle Vierge</span>
          </button>

          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-98 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Créer une Ordonnance Type</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ordonnance type par pathologie, médicament ou consigne..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories scrollable pill tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat === 'Favorites' ? '⭐ Favoris' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Chargement des ordonnances types...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucune ordonnance type trouvée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre mot-clé ou réinitialisez les filtres.`
              : 'Commencez par ajouter votre premier modèle d’ordonnance type pour vos consultations récurrentes.'}
          </p>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une ordonnance type</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                {/* Header: Category & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-100 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-sky-600" />
                    <span>{template.category}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => handleToggleFavorite(template, e)}
                      title={template.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        template.isFavorite
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>

                    <button
                      onClick={e => handleDuplicate(template, e)}
                      title="Dupliquer le modèle"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditingTemplate(template);
                        setIsModalOpen(true);
                      }}
                      title="Modifier le modèle"
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={e => handleDelete(template, e)}
                      title="Supprimer"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Template Title & Diagnosis */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-sky-700 transition-colors">
                    {template.name}
                  </h3>
                  {template.diagnosis && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{template.diagnosis}</span>
                    </p>
                  )}
                </div>

                {/* Description if available */}
                {template.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    {template.description}
                  </p>
                )}

                {/* Medications List Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Médicaments ({template.items.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {template.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{item.medicationName}</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              {item.strength}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5 ml-5 truncate">
                            {item.frequency} • {item.duration}
                          </p>
                        </div>
                      </div>
                    ))}

                    {template.items.length > 3 && (
                      <p className="text-[11px] text-slate-500 font-medium text-center pt-1">
                        + {template.items.length - 3} autre(s) médicament(s)...
                      </p>
                    )}
                  </div>
                </div>

                {/* Directives / Advice */}
                {template.additionalInstructions && (
                  <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{template.additionalInstructions}</span>
                  </div>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 border border-transparent rounded-xl transition-all shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Aperçu & Imprimer</span>
                </button>

                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Prescrire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Ordonnance Type */}
      {isModalOpen && (
        <OrdonnanceTypeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          availableMeds={availableMeds}
          onSave={saved => {
            if (editingTemplate) {
              setTemplates(prev => prev.map(t => (t.id === saved.id ? saved : t)));
              showToast('success', 'Modèle mis à jour', `L'ordonnance type "${saved.name}" a été modifiée.`);
            } else {
              setTemplates(prev => [saved, ...prev]);
              showToast('success', 'Modèle créé', `L'ordonnance type "${saved.name}" a été enregistrée avec succès.`);
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Modal: Print Preview with the requested Caduceus model */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Aperçu & Impression — {previewTemplate.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modèle officiel Caducée au nom du Dr. Oussama Belouar conforme à votre maquette.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
              <PrintablePrescription
                prescription={buildPreviewPrescription(previewTemplate)}
                clinicSettings={clinicSettings}
                doctorProfile={doctorProfile}
                standalone={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MODAL TO CREATE / EDIT ORDONNANCE TYPE
// ==========================================

interface OrdonnanceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: OrdonnanceType | null;
  availableMeds: Medication[];
  onSave: (saved: OrdonnanceType) => void;
}

function OrdonnanceTypeModal({
  isOpen,
  onClose,
  template,
  availableMeds,
  onSave
}: OrdonnanceTypeModalProps) {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'Médecine Générale');
  const [diagnosis, setDiagnosis] = useState(template?.diagnosis || '');
  const [description, setDescription] = useState(template?.description || '');
  const [additionalInstructions, setAdditionalInstructions] = useState(
    template?.additionalInstructions || ''
  );
  const [isFavorite, setIsFavorite] = useState(template?.isFavorite || false);

  const [items, setItems] = useState<OrdonnanceTypeItem[]>(
    template?.items || [
      {
        medicationName: '',
        strength: '',
        dosageForm: 'Comprimé',
        dose: '1 comprimé',
        route: 'Oral',
        frequency: '1 / J',
        duration: '5 jours',
        quantity: '1 bt',
        instructions: 'Prendre au milieu des repas avec un grand verre d’eau.'
      }
    ]
  );

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        medicationName: '',
        strength: '',
        dosageForm: 'Comprimé',
        dose: '1 prise',
        route: 'Oral',
        frequency: '1 / J',
        duration: '5 jours',
        quantity: '1 bt',
        instructions: 'Prendre selon la posologie.'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast('info', 'Attention', 'Une ordonnance type doit contenir au moins un médicament.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof OrdonnanceTypeItem, value: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectMedication = (index: number, med: Medication) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        medicationName: med.genericName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        dose: med.standardDose || med.strength,
        route: med.route,
        frequency: med.defaultFrequency,
        duration: med.defaultDuration,
        instructions: med.instructions
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Champ requis', 'Le nom du modèle est obligatoire.');
      return;
    }
    if (items.some(i => !i.medicationName.trim())) {
      showToast('error', 'Médicament requis', 'Veuillez renseigner le nom de chaque médicament.');
      return;
    }

    try {
      setSaving(true);
      if (template) {
        const updated = await api.updateOrdonnanceType(template.id, {
          name,
          category,
          diagnosis,
          description,
          items,
          additionalInstructions,
          isFavorite
        });
        onSave(updated);
      } else {
        const created = await api.createOrdonnanceType({
          name,
          category,
          diagnosis,
          description,
          items,
          additionalInstructions,
          isFavorite
        });
        onSave(created);
      }
    } catch (err) {
      console.error('Error saving ordonnance type', err);
      showToast('error', 'Erreur d’enregistrement', 'Impossible d’enregistrer le modèle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>{template ? 'Modifier l’Ordonnance Type' : 'Créer une Nouvelle Ordonnance Type'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurez le titre, les médicaments prescrits et les conseils associés.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              1. Informations Générales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de l’Ordonnance Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Angine Bactérienne Aiguë, Gastro-Entérite..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie / Spécialité</label>
                <input
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex: Infectiologie, ORL, Cardiologie..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <datalist id="categories-list">
                  {CATEGORIES.filter(c => c !== 'Toutes' && c !== 'Favorites').map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic prérempli</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Ex: Pharyngite érythématopultacée..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={e => setIsFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Ajouter aux modèles favoris</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Indications</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Traitement de première intention de l'adulte immunocompétent..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Médicaments Prescrits ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>

                    {/* Quick formulary pick button if available */}
                    {availableMeds.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto mr-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Formulaire :</span>
                        <select
                          className="text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 max-w-[180px]"
                          onChange={e => {
                            const found = availableMeds.find(m => m.id === e.target.value);
                            if (found) handleSelectMedication(idx, found);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Choisir un médicament...
                          </option>
                          {availableMeds.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.genericName} ({m.strength})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Nom du Médicament (DCI ou Spécialité) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.medicationName}
                        onChange={e => handleUpdateItem(idx, 'medicationName', e.target.value)}
                        placeholder="Ex: Amoxicilline, Paracétamol, Spasfon..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dosage / Force</label>
                      <input
                        type="text"
                        value={item.strength}
                        onChange={e => handleUpdateItem(idx, 'strength', e.target.value)}
                        placeholder="Ex: 1 g, 500 mg, 0.1%..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Forme</label>
                      <input
                        type="text"
                        value={item.dosageForm}
                        onChange={e => handleUpdateItem(idx, 'dosageForm', e.target.value)}
                        placeholder="Comprimé, Sirop..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Posologie / Prise</label>
                      <input
                        type="text"
                        value={item.dose}
                        onChange={e => handleUpdateItem(idx, 'dose', e.target.value)}
                        placeholder="Ex: 1 comprimé"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Fréquence</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={e => handleUpdateItem(idx, 'frequency', e.target.value)}
                        placeholder="Ex: 2 fois par jour"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Durée</label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={e => handleUpdateItem(idx, 'duration', e.target.value)}
                        placeholder="Ex: 6 jours, 1 mois..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Quantité</label>
                      <input
                        type="text"
                        value={item.quantity || ''}
                        onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                        placeholder="Ex: 1 bt, 2 flacons..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Instructions au patient
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={e => handleUpdateItem(idx, 'instructions', e.target.value)}
                        placeholder="Ex: Au cours des repas, ne pas arrêter avant la fin..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Directives */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              3. Consignes & Précautions Particulières
            </h3>
            <textarea
              rows={3}
              value={additionalInstructions}
              onChange={e => setAdditionalInstructions(e.target.value)}
              placeholder="Conseils hygiéno-diététiques, signaux d'alerte imposant une nouvelle consultation..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition-all"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{template ? 'Sauvegarder les modifications' : 'Enregistrer le Modèle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
