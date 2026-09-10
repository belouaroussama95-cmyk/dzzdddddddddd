import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  ChevronRight,
  Phone,
  FileText,
  Check,
  CalendarDays,
  Table as TableIcon,
  ListFilter,
  ArrowUpDown,
  Search,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { FollowUp, Patient } from '../types';
import { useToast } from '../context/ToastContext';

interface FollowUpsPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export function FollowUpsPage({ onNavigate }: FollowUpsPageProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Complete modal state
  const [activeFollowUp, setActiveFollowUp] = useState<FollowUp | null>(null);
  const [consultNote, setConsultNote] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Edit Next Consultation modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    time: '09:00',
    reason: '',
    type: 'in_person' as 'in_person' | 'phone' | 'urgent',
    priority: 'routine' as 'routine' | 'high' | 'urgent',
    status: 'scheduled' as FollowUp['status'],
    notes: ''
  });

  // Schedule New Consultation Modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFormData, setNewFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    reason: 'Consultation clinique de contrôle et revue de traitement',
    type: 'in_person',
    notes: ''
  });

  const { showToast } = useToast();

  const loadFollowUps = async () => {
    try {
      const data = await api.getFollowUps({
        status: activeFilter === 'all' ? undefined : activeFilter
      });
      setFollowUps(data);
    } catch (err) {
      console.error('Failed loading follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const pts = await api.getPatients();
      setPatients(pts);
      if (pts.length > 0 && !newFormData.patientId) {
        setNewFormData(prev => ({ ...prev, patientId: pts[0].id }));
      }
    } catch (err) {
      console.error('Failed loading patients', err);
    }
  };

  useEffect(() => {
    loadFollowUps();
    loadPatients();
  }, [activeFilter]);

  const handleOpenEdit = (fu: FollowUp) => {
    setEditingFollowUp(fu);
    setEditFormData({
      date: fu.date || '',
      time: fu.time || '09:00',
      reason: fu.reason || '',
      type: (fu.type as any) || 'in_person',
      priority: (fu as any).priority || 'routine',
      status: fu.status,
      notes: fu.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;

    try {
      await api.updateFollowUp(editingFollowUp.id, {
        date: editFormData.date,
        time: editFormData.time,
        reason: editFormData.reason,
        type: editFormData.type as any,
        status: editFormData.status,
        notes: editFormData.notes
      });
      showToast('success', 'Consultation mise à jour', `Prochaine consultation de ${editingFollowUp.patientName} enregistrée.`);
      setShowEditModal(false);
      setEditingFollowUp(null);
      loadFollowUps();
    } catch (err: any) {
      showToast('error', 'Échec de la mise à jour', err.message);
    }
  };

  const handleMarkComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUp) return;

    try {
      await api.completeFollowUp(activeFollowUp.id, consultNote);
      showToast('success', 'Consultation validée', 'Compte-rendu enregistré dans le dossier du patient.');
      setShowCompleteModal(false);
      setActiveFollowUp(null);
      setConsultNote('');
      loadFollowUps();
    } catch (err: any) {
      showToast('error', 'Échec de la validation', err.message);
    }
  };

  const handleScheduleNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.patientId || !newFormData.date) return;

    try {
      await api.scheduleFollowUp(newFormData);
      showToast('success', 'Consultation programmée', 'Ajoutée à l’agenda du cabinet.');
      setShowNewModal(false);
      loadFollowUps();
    } catch (err: any) {
      showToast('error', 'Échec de la programmation', err.message);
    }
  };

  const filteredFollowUps = followUps.filter(fu => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      fu.patientName.toLowerCase().includes(q) ||
      fu.patientId.toLowerCase().includes(q) ||
      fu.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Agenda & Ordre des Consultations</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200/80">
                  {followUps.length} Consultations
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez l'ordre de passage, reprogrammez ou modifiez les prochaines consultations et visites de suivi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Consultation</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filter Chips, Search, & View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Left: Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['pending', 'overdue', 'completed', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'pending' ? 'À Venir' : tab === 'overdue' ? 'En Retard' : tab === 'completed' ? 'Terminées' : 'Toutes'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher patient, motif..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Right: View switcher */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Vue Tableau</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-teal-600" />
              <span>Vue Cartes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Order Table */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Planning des Consultations Programmées
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Cliquez sur "Modifier" pour reprogrammer la date ou le statut
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-center w-14">Ordre</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Date & Heure Consultation</th>
                  <th className="px-5 py-3">Type & Modalité</th>
                  <th className="px-5 py-3">Motif Consultation</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Chargement du tableau d'ordre des consultations...
                    </td>
                  </tr>
                ) : filteredFollowUps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Aucune consultation dans cette vue.
                    </td>
                  </tr>
                ) : (
                  filteredFollowUps.map((fu, idx) => {
                    const isOverdue = fu.status === 'overdue';
                    return (
                      <tr key={fu.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Order Sequence Badge */}
                        <td className="px-5 py-3 text-center">
                          <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs inline-flex items-center justify-center border border-slate-200">
                            #{idx + 1}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {fu.patientName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => onNavigate('patient-profile', fu.patientId)}
                                className="font-bold text-slate-900 hover:text-teal-700 hover:underline text-left block"
                              >
                                {fu.patientName}
                              </button>
                              <span className="text-[10px] font-mono text-slate-400">{fu.patientId}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                              <span>{fu.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{fu.time || '09:00'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 inline-block">
                            {fu.type === 'phone' ? 'Téléconsultation' : fu.type === 'urgent' ? 'Urgence Revue' : 'Cabinet Présentiel'}
                          </span>
                        </td>

                        {/* Reason & notes */}
                        <td className="px-5 py-3 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate" title={fu.reason}>
                            {fu.reason}
                          </p>
                          {fu.notes && (
                            <p className="text-[11px] text-slate-400 truncate italic">
                              Note : {fu.notes}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                              fu.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {fu.status === 'completed' ? 'Terminée' : isOverdue ? 'En retard' : fu.status === 'scheduled' ? 'Programmée' : 'En attente'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Explicit Edit Next Consultation button requested by user */}
                            <button
                              onClick={() => handleOpenEdit(fu)}
                              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold transition-all flex items-center gap-1 border border-teal-200/70 cursor-pointer text-xs"
                              title="Modifier la prochaine consultation"
                            >
                              <Edit2 className="w-3 h-3 text-teal-600" />
                              <span>Modifier</span>
                            </button>

                            {fu.status !== 'completed' && (
                              <button
                                onClick={() => {
                                  setActiveFollowUp(fu);
                                  setShowCompleteModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer text-xs"
                                title="Valider la consultation terminée"
                              >
                                <Check className="w-3 h-3" />
                                <span>Terminer</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredFollowUps.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Aucune consultation trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFollowUps.map((fu, idx) => {
                const isOverdue = fu.status === 'overdue';
                return (
                  <div
                    key={fu.id}
                    className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold inline-flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{fu.patientName}</span>
                        <span className="text-xs font-mono text-slate-400">({fu.patientId})</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            fu.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {fu.status === 'completed' ? 'Terminée' : isOverdue ? 'En retard' : fu.status === 'scheduled' ? 'Programmée' : 'En attente'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        Motif: <strong className="text-slate-800">{fu.reason}</strong>
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Date: {fu.date} à {fu.time || '09:00'}
                        </span>
                        {fu.completedAt && (
                          <span className="text-emerald-700 font-medium">
                            Terminé le {fu.completedAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(fu)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200/60 transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-teal-600" />
                        <span>Modifier Consultation</span>
                      </button>

                      {fu.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setActiveFollowUp(fu);
                            setShowCompleteModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terminer Visite</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Next Consultation Modal */}
      {showEditModal && editingFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Modifier la Prochaine Consultation
                </h3>
                <p className="text-xs text-slate-500">
                  Patient : <strong>{editingFollowUp.patientName}</strong> ({editingFollowUp.patientId})
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date de la Prochaine Consultation *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heure de Passage</label>
                  <input
                    type="time"
                    value={editFormData.time}
                    onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type de Visite</label>
                  <select
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="in_person">Consultation Cabinet Présentiel</option>
                    <option value="phone">Téléconsultation à distance</option>
                    <option value="urgent">Revue Urgente & Contrôle Spécialisé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="scheduled">Programmée (Scheduled)</option>
                    <option value="pending">En attente (Pending)</option>
                    <option value="overdue">En retard (Overdue)</option>
                    <option value="completed">Terminée (Completed)</option>
                    <option value="cancelled">Annulée (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif Clinique & Objectif de la Consultation *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.reason}
                  onChange={e => setEditFormData({ ...editFormData, reason: e.target.value })}
                  placeholder="Ex: Évaluation de la tolérance du traitement, contrôle de la tension artérielle"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consignes / Notes Cliniques Additionnelles
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ex: Demander au patient d'apporter le carnet d'auto-mesure tensionnelle"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule New Consultation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Programmer une Nouvelle Consultation</h3>
            <form onSubmit={handleScheduleNew} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sélectionner le Patient *</label>
                <select
                  value={newFormData.patientId}
                  onChange={e => setNewFormData({ ...newFormData, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newFormData.date}
                    onChange={e => setNewFormData({ ...newFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={newFormData.time}
                    onChange={e => setNewFormData({ ...newFormData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif de Consultation *</label>
                <input
                  type="text"
                  required
                  value={newFormData.reason}
                  onChange={e => setNewFormData({ ...newFormData, reason: e.target.value })}
                  placeholder="Ex: Suivi de traitement, renouvellement ordonnance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type de Consultation</label>
                <select
                  value={newFormData.type}
                  onChange={e => setNewFormData({ ...newFormData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="in_person">Consultation Cabinet Présentiel</option>
                  <option value="phone">Téléconsultation</option>
                  <option value="urgent">Revue Urgente</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold shadow-md shadow-teal-500/20"
                >
                  Programmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Follow-up Modal */}
      {showCompleteModal && activeFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Valider la Consultation Réalisée</h3>
            <p className="text-xs text-slate-500">
              Enregistrer le compte-rendu clinique pour <strong>{activeFollowUp.patientName}</strong> ({activeFollowUp.reason}).
            </p>

            <form onSubmit={handleMarkComplete} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observations Cliniques & Conclusion de la Visite
                </label>
                <textarea
                  rows={3}
                  required
                  value={consultNote}
                  onChange={e => setConsultNote(e.target.value)}
                  placeholder="Patient en bonne évolution, tolérance optimale du traitement, renouvellement effectué."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md shadow-emerald-500/20"
                >
                  Enregistrer & Terminer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
