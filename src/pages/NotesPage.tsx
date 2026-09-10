import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Copy,
  Tag,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
  Sparkles,
  Bookmark,
  Share2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { DoctorNote, Patient } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface NotesPageProps {
  onNavigate: (page: string, param?: string) => void;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  clinical: {
    label: 'Clinique',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200'
  },
  prescription: {
    label: 'Ordonnance',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  patient_followup: {
    label: 'Suivi Patient',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  },
  admin: {
    label: 'Administratif',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  research: {
    label: 'Recherche & Veille',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  }
};

const COLOR_STYLES: Record<string, { border: string; bg: string; accent: string; badge: string }> = {
  teal: {
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'bg-teal-50/20',
    accent: 'text-teal-600',
    badge: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  amber: {
    border: 'border-amber-200 hover:border-amber-400',
    bg: 'bg-amber-50/20',
    accent: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  emerald: {
    border: 'border-emerald-200 hover:border-emerald-400',
    bg: 'bg-emerald-50/20',
    accent: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  rose: {
    border: 'border-rose-200 hover:border-rose-400',
    bg: 'bg-rose-50/20',
    accent: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  indigo: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bg: 'bg-indigo-50/20',
    accent: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  slate: {
    border: 'border-slate-200 hover:border-slate-400',
    bg: 'bg-slate-50/40',
    accent: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

export function NotesPage({ onNavigate }: NotesPageProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DoctorNote | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DoctorNote['category']>('clinical');
  const [color, setColor] = useState<DoctorNote['color']>('teal');
  const [isPinned, setIsPinned] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, patientsData] = await Promise.all([
        api.getDoctorNotes(),
        api.getPatients()
      ]);
      setNotes(notesData);
      setPatients(patientsData);
    } catch (err: any) {
      showToast('error', 'Erreur de chargement', err.message || 'Impossible de récupérer les notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('clinical');
    setColor('teal');
    setIsPinned(false);
    setPatientId('');
    setTags([]);
    setTagInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (note: DoctorNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setColor(note.color || 'teal');
    setIsPinned(Boolean(note.isPinned));
    setPatientId(note.patientId || '');
    setTags(note.tags || []);
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('warning', 'Champs requis', 'Veuillez renseigner au minimum un titre et un contenu.');
      return;
    }

    setSaving(true);
    try {
      const selectedPatient = patients.find(p => p.id === patientId);
      const payload: Partial<DoctorNote> = {
        title: title.trim(),
        content: content.trim(),
        category,
        color: color || 'teal',
        isPinned,
        patientId: patientId || undefined,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined,
        tags,
        authorName: user?.name || 'Dr. Oussama Belouar'
      };

      if (editingNote) {
        const updated = await api.updateDoctorNote(editingNote.id, payload);
        setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
        showToast('success', 'Note mise à jour', `La note "${updated.title}" a été enregistrée.`);
      } else {
        const created = await api.createDoctorNote(payload);
        setNotes(prev => [created, ...prev]);
        showToast('success', 'Note créée', `La note "${created.title}" a été ajoutée.`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Erreur de sauvegarde', err.message || 'Échec de la sauvegarde de la note.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note: DoctorNote) => {
    try {
      const updated = await api.updateDoctorNote(note.id, { isPinned: !note.isPinned });
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      showToast('info', updated.isPinned ? 'Note épinglée' : 'Note détachée', updated.title);
    } catch (err: any) {
      showToast('error', 'Erreur', 'Impossible de modifier l’état épinglé.');
    }
  };

  const handleDelete = async (note: DoctorNote) => {
    if (!confirm(`Supprimer définitivement la note "${note.title}" ?`)) return;

    try {
      await api.deleteDoctorNote(note.id);
      setNotes(prev => prev.filter(n => n.id !== note.id));
      showToast('success', 'Note supprimée', 'La note a été retirée avec succès.');
    } catch (err: any) {
      showToast('error', 'Erreur', 'Impossible de supprimer la note.');
    }
  };

  const handleCopyContent = (note: DoctorNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    showToast('success', 'Copié', 'Contenu de la note copié dans le presse-papier.');
  };

  const applyTemplate = (templateTitle: string, templateBody: string, defaultCategory: DoctorNote['category']) => {
    setTitle(templateTitle);
    setContent(templateBody);
    setCategory(defaultCategory);
  };

  // Filtered Notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (n.patientName && n.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesPinned = !showPinnedOnly || n.isPinned;

    return matchesSearch && matchesCategory && matchesPinned;
  });

  const pinnedCount = notes.filter(n => n.isPinned).length;
  const urgentCount = notes.filter(n => n.category === 'urgent').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Notes & Mémos Cliniques
              </h1>
              <p className="text-xs text-slate-500">
                Espace personnel du médecin pour mémos, protocoles de garde, observations et rappels de suivi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Note</span>
          </button>
        </div>
      </div>

      {/* Stats and Quick Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm">
            {notes.length}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Mémos</p>
            <p className="text-xs font-semibold text-slate-800">Toutes catégories</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
            {pinnedCount}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Épinglées</p>
            <p className="text-xs font-semibold text-slate-800">Priorités du cabinet</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
            {urgentCount}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Urgences</p>
            <p className="text-xs font-semibold text-slate-800">Protocoles critiques</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
            {notes.filter(n => n.patientName).length}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Liées Patients</p>
            <p className="text-xs font-semibold text-slate-800">Dossiers associés</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, contenu, tag ou patient..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                showPinnedOnly
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Épinglées ({pinnedCount})</span>
            </button>

            <span className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toutes ({notes.length})
              </button>
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                const count = notes.filter(n => n.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === key
                        ? `${cat.bg} ${cat.text} ${cat.border} border font-bold`
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Chargement des notes cliniques...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <StickyNote className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Aucune note trouvée</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedCategory !== 'all' || showPinnedOnly
              ? 'Aucune note ne correspond aux critères de recherche actuels.'
              : 'Votre carnet de notes est vide. Créez votre première note médicale dès maintenant.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => {
            const catInfo = CATEGORY_MAP[note.category] || CATEGORY_MAP.clinical;
            const style = COLOR_STYLES[note.color || 'teal'] || COLOR_STYLES.teal;

            return (
              <div
                key={note.id}
                className={`bg-white rounded-3xl p-5 border transition-all duration-150 shadow-2xs hover:shadow-md flex flex-col justify-between group ${style.border} ${style.bg}`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                        {catInfo.label}
                      </span>
                      {note.patientName && (
                        <button
                          onClick={() => note.patientId && onNavigate('patient-profile', note.patientId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{note.patientName}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.isPinned ? 'Détacher la note' : 'Épingler en haut'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          note.isPinned
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(note)}
                        title="Modifier"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-900 transition-colors">
                    {note.title}
                  </h3>

                  {/* Note Content */}
                  <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-sans line-clamp-6">
                    {note.content}
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {note.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/80 border border-slate-200/80 text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <button
                    onClick={() => handleCopyContent(note)}
                    title="Copier le texte"
                    className="flex items-center gap-1 text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingNote ? 'Modifier la Note Clinique' : 'Créer une Nouvelle Note'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enregistrez vos observations médicales, check-lists ou rappels
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates (Only for new note) */}
            {!editingNote && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Modèles Prédéfinis Rapides
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        'Protocole HTA & Bilan Rénal',
                        '• Contrôle créatininémie, DFG et ionogramme (K+).\n• Rechercher microalbuminurie au matin.\n• Pas d’association IEC + ARA II.',
                        'clinical'
                      )
                    }
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-teal-400 text-slate-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    HTA / Néphro
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        'Checklist Trousse d\'Urgence',
                        '- [x] Adrénaline 1 mg/mL\n- [x] Solumédrol injectable\n- [x] Salbutamol aérosol\n- [x] Trinitrine spray\n- [ ] Contrôle des électrodes DAE',
                        'urgent'
                      )
                    }
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-teal-400 text-slate-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Trousse Urgences
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        'Suivi INR & Anticoagulant',
                        '• Dernier INR mesuré :\n• Cible thérapeutique : 2.0 - 3.0\n• Rappel des interactions alimentaires et signes d’alerte hémorragiques.',
                        'patient_followup'
                      )
                    }
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-teal-400 text-slate-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Suivi AVK
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de la note <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Conduite à tenir céphalées récurrentes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              {/* Category & Associated Patient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="clinical">Clinique</option>
                    <option value="prescription">Ordonnance</option>
                    <option value="patient_followup">Suivi Patient</option>
                    <option value="urgent">Urgence & Protocoles</option>
                    <option value="admin">Administratif</option>
                    <option value="research">Recherche & Veille</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Associer à un patient (Optionnel)</label>
                  <select
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Aucun patient lié --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contenu détaillé <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Écrivez vos observations, rappels de posologie, protocoles..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono leading-relaxed"
                />
              </div>

              {/* Color Theme & Pin Option */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Thème visuel</label>
                  <div className="flex items-center gap-2">
                    {(['teal', 'amber', 'emerald', 'rose', 'indigo', 'slate'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                          color === c ? 'scale-110 border-slate-900 shadow-xs' : 'border-transparent hover:scale-105'
                        }`}
                        style={{
                          backgroundColor:
                            c === 'teal'
                              ? '#0d9488'
                              : c === 'amber'
                              ? '#d97706'
                              : c === 'emerald'
                              ? '#059669'
                              : c === 'rose'
                              ? '#e11d48'
                              : c === 'indigo'
                              ? '#4f46e5'
                              : '#64748b'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={e => setIsPinned(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                    />
                    <span>Épingler cette note en tête</span>
                  </label>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Étiquettes / Tags</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Ajoutez un tag puis Entrée (ex: Cardiologie, Suivi...)"
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = tagInput.trim().replace(/^#/, '');
                      if (clean && !tags.includes(clean)) {
                        setTags([...tags, clean]);
                        setTagInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingNote ? 'Mettre à jour' : 'Enregistrer la note'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
