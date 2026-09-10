import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  FileText,
  Activity,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Archive
} from 'lucide-react';
import { api } from '../services/api';
import type { Patient } from '../types';
import { useToast } from '../context/ToastContext';

interface PatientsPageProps {
  onNavigate: (page: string, param?: string) => void;
  openNewPatientModal?: boolean;
}

export function PatientsPage({ onNavigate, openNewPatientModal = false }: PatientsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'dob'>('name');
  const [showAddModal, setShowAddModal] = useState(openNewPatientModal);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dob: '1985-05-15',
    sex: 'Female' as 'Male' | 'Female' | 'Other',
    bloodType: 'O+',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    diagnosis: '',
    notes: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });

  const { showToast } = useToast();

  const loadPatients = async () => {
    try {
      const data = await api.getPatients({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [statusFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    }
    if (sortBy === 'lastVisit') {
      return new Date(b.lastVisitDate || 0).getTime() - new Date(a.lastVisitDate || 0).getTime();
    }
    return new Date(b.dob).getTime() - new Date(a.dob).getTime();
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.firstName.trim() || !newPatient.lastName.trim()) {
      showToast('warning', 'Erreur de Validation', 'Le prénom et le nom sont obligatoires.');
      return;
    }

    try {
      const created = await api.createPatient({
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        dob: newPatient.dob,
        sex: newPatient.sex,
        bloodType: newPatient.bloodType,
        phone: newPatient.phone,
        email: newPatient.email,
        address: newPatient.address,
        allergies: newPatient.allergies ? newPatient.allergies.split(',').map(s => s.trim()) : [],
        diagnosis: newPatient.diagnosis,
        medicalNotes: newPatient.notes || '',
        insurance: newPatient.insuranceProvider
          ? {
              provider: newPatient.insuranceProvider,
              policyNumber: newPatient.insurancePolicyNumber || ''
            }
          : undefined
      });

      showToast('success', 'Patient Enregistré', `Dossier créé pour ${created.firstName} ${created.lastName} (ID : ${created.id}).`);
      setShowAddModal(false);
      loadPatients();
    } catch (err: any) {
      showToast('error', 'Échec Enregistrement', err.message || 'Impossible d’enregistrer le dossier patient.');
    }
  };

  const statusLabels: Record<string, string> = {
    all: 'Tous',
    active: 'Actifs',
    completed: 'Terminés',
    archived: 'Archivés'
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Répertoire des Patients</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200/80">
                  {patients.length} Enregistrés
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion complète des dossiers cliniques, antécédents, bilans et prescriptions médicales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom, ID, téléphone, motif..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter chips & sort */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['all', 'active', 'completed', 'archived'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {statusLabels[tab]}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="name">Trier par Nom</option>
              <option value="lastVisit">Dernière Visite</option>
              <option value="dob">Âge / Date de Naissance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chargement du répertoire des patients...</div>
        ) : sortedPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Aucun patient trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Essayez d'ajuster votre recherche ou vos filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Dossier Patient</th>
                  <th className="py-3 px-5">Motif & Allergies</th>
                  <th className="py-3 px-5">Coordonnées</th>
                  <th className="py-3 px-5">Dernière Visite / Statut</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPatients.map(patient => {
                  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => onNavigate('patient-profile', patient.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Name & ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-200 transition-colors">
                            {patient.firstName[0]}
                            {patient.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors block">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              ID : {patient.id} • {age} ans ({patient.sex === 'Male' ? 'Homme' : patient.sex === 'Female' ? 'Femme' : 'Autre'}) • {patient.bloodType || 'Inconnu'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Diagnosis & Allergies */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 line-clamp-1">{patient.diagnosis}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.allergies.length > 0 ? (
                            patient.allergies.map((allergy, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200/60"
                              >
                                {allergy}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400">Aucune allergie connue (NKDA)</span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 text-xs font-medium">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{patient.phone}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{patient.email}</span>
                          </p>
                        </div>
                      </td>

                      {/* Last Visit / Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            patient.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : patient.status === 'completed'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {patient.status === 'active' ? 'Actif' : patient.status === 'completed' ? 'Terminé' : 'Archivé'}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1">
                          Visite : {patient.lastVisitDate || 'Récente'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onNavigate('new-prescription', patient.id)}
                            title="Rédiger une ordonnance pour ce patient"
                            className="p-1.5 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span className="hidden xl:inline">Prescrire</span>
                          </button>

                          <button
                            onClick={() => onNavigate('patient-profile', patient.id)}
                            title="Consulter le dossier médical"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register New Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enregistrer un Nouveau Patient</h3>
                  <p className="text-xs text-slate-500">Renseignez les données administratives et cliniques de prise en charge.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="Ex : Karim, Sarah..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom de Famille *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="Ex : Benali, Dupont..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={newPatient.dob}
                    onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sexe</label>
                  <select
                    value={newPatient.sex}
                    onChange={e => setNewPatient({ ...newPatient, sex: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  >
                    <option value="Male">Homme</option>
                    <option value="Female">Femme</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Groupe Sanguin</label>
                  <select
                    value={newPatient.bloodType}
                    onChange={e => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adresse E-mail</label>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnostic Principal / Motif de Prise en Charge
                </label>
                <input
                  type="text"
                  value={newPatient.diagnosis}
                  onChange={e => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                  placeholder="Ex : Hypertension artérielle essentielle, Diabète de type 2, Asthme..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Allergies (séparées par des virgules, sécurité thérapeutique)
                </label>
                <input
                  type="text"
                  value={newPatient.allergies}
                  onChange={e => setNewPatient({ ...newPatient, allergies: e.target.value })}
                  placeholder="Ex : Pénicilline, AINS, Sulfamides, Iode..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600 text-rose-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organisme d'Assurance / Mutuelle</label>
                  <input
                    type="text"
                    value={newPatient.insuranceProvider}
                    onChange={e => setNewPatient({ ...newPatient, insuranceProvider: e.target.value })}
                    placeholder="Ex : CNAS, CASNOS, MGEN, Mutuelle..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numéro d'Assuré / Sécurité Sociale</label>
                  <input
                    type="text"
                    value={newPatient.insurancePolicyNumber}
                    onChange={e => setNewPatient({ ...newPatient, insurancePolicyNumber: e.target.value })}
                    placeholder="Ex : 1 85 05 75 123 456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enregistrer le Dossier Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
