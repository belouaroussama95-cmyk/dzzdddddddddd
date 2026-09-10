import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Activity,
  Plus,
  ArrowLeft,
  Clock,
  Pill,
  Archive,
  Edit2,
  FileText,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import type { Patient, Prescription, Treatment, ClinicalNote } from '../types';
import { useToast } from '../context/ToastContext';

interface PatientDetailPageProps {
  patientId: string;
  onNavigate: (page: string, param?: string) => void;
  onBack: () => void;
}

export function PatientDetailPage({ patientId, onNavigate, onBack }: PatientDetailPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Follow-up modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('Contrôle de l’efficacité thérapeutique et surveillance tensionnelle');

  const { showToast } = useToast();

  const loadPatientData = async () => {
    try {
      const [pt, rxs, treats, ptNotes] = await Promise.all([
        api.getPatientById(patientId),
        api.getPrescriptions({ patientId }),
        api.getTreatments({ patientId }),
        api.getPatientNotes(patientId).catch(() => [])
      ]);
      setPatient(pt);
      setNotes(ptNotes as any || []);
      setPrescriptions(rxs);
      setTreatments(treats);
    } catch (err) {
      console.error('Failed to load patient profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      await api.addClinicalNote(patientId, newNoteText.trim());
      const freshNotes = await api.getPatientNotes(patientId);
      setNotes(freshNotes as any || []);
      setNewNoteText('');
      showToast('success', 'Observation Clinique Ajoutée', 'Enregistrée dans le dossier médical longitudinal.');
    } catch (err: any) {
      showToast('error', 'Échec', err.message || 'Impossible d’enregistrer l’observation.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;

    try {
      await api.scheduleFollowUp({
        patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
        date: followUpDate,
        time: '10:00',
        reason: followUpReason || 'Consultation de suivi de routine',
        type: 'routine',
        status: 'scheduled'
      });
      showToast('success', 'Suivi Programmé', `Consultation de contrôle fixée au ${followUpDate}.`);
      setShowFollowUpModal(false);
      loadPatientData();
    } catch (err: any) {
      showToast('error', 'Échec de Programmation', err.message);
    }
  };

  const handleArchive = async () => {
    if (confirm('Archiver ce dossier patient ? Vous pourrez le restaurer à tout moment via les filtres du répertoire.')) {
      try {
        await api.updatePatient(patientId, { status: 'archived' });
        showToast('info', 'Patient Archivé', 'Le statut du patient a été mis à jour en archivé.');
        onBack();
      } catch (err: any) {
        showToast('error', 'Échec de l’archivage', err.message);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Chargement du dossier médical...</div>;
  }

  if (!patient) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Patient introuvable</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-1.5 bg-teal-100 text-teal-900 rounded-xl text-xs font-bold cursor-pointer"
        >
          Retour au répertoire
        </button>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
  const activeTreatments = treatments.filter(t => t.status === 'active' || t.status === 'ending_soon');

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Retour au répertoire des patients"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                {patient.id}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  patient.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {patient.status === 'active' ? 'Actif' : patient.status === 'completed' ? 'Terminé' : 'Archivé'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {age} ans • {patient.sex === 'Male' ? 'Homme' : patient.sex === 'Female' ? 'Femme' : 'Autre'} • Né(e) le : {patient.dob} • Groupe sanguin : {patient.bloodType || 'Inconnu'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('new-prescription', patient.id)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Nouvelle Ordonnance</span>
          </button>

          <button
            onClick={() => setShowFollowUpModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Planifier un Suivi</span>
          </button>

          <button
            onClick={handleArchive}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Archiver le dossier patient"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Patient Details / Demographics & Allergies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Demographics & Clinical Information */}
        <div className="space-y-6">
          {/* Allergies Highlight Card (Critical for clinical safety) */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Allergies & Contre-indications</h2>
            </div>
            {patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">Aucune allergie médicamenteuse connue signalée (NKDA).</p>
            )}
          </div>

          {/* Contact & Insurance Profile */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              État Civil & Coordonnées
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Téléphone</span>
                <span className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone || 'Non renseigné'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">E-mail</span>
                <span className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient.email || 'Non renseigné'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Adresse Domicile</span>
                <span className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {patient.address || 'Adresse au dossier'}
                </span>
              </div>

              {patient.emergencyContact && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact d'Urgence</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                  </span>
                  <span className="text-slate-600 block">{patient.emergencyContact.phone}</span>
                </div>
              )}

              {patient.insurance && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Couverture Sociale / Assurance</span>
                  <span className="font-semibold text-teal-800 mt-0.5 block">
                    {patient.insurance.provider}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] block">
                    N° Assuré : {patient.insurance.policyNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Diagnosis & Follow-up date */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              Diagnostic Clinique
            </h2>
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs">
              <span className="text-[10px] font-bold uppercase text-teal-800 block">Diagnostic Principal</span>
              <p className="font-bold text-slate-900 mt-0.5 text-sm">{patient.diagnosis}</p>
            </div>

            {patient.secondaryDiagnoses && patient.secondaryDiagnoses.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Pathologies Associées :</span>
                <ul className="list-disc pl-4 text-slate-700 space-y-0.5 font-medium">
                  {patient.secondaryDiagnoses.map((sec, idx) => (
                    <li key={idx}>{sec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Prochaine Visite Planifiée :</span>
              <span className="font-bold text-teal-800">
                {patient.nextFollowUpDate || 'Aucune planifiée'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col (2/3 width): Active Regimens, Prescriptions & Notes Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Treatments / Regimens Under Monitoring */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Traitements & Protocoles Thérapeutiques Actifs ({activeTreatments.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('prescriptions')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                Toutes les Ordonnances →
              </button>
            </div>

            {activeTreatments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucun traitement médicamenteux en cours d’administration.</p>
            ) : (
              <div className="space-y-3">
                {activeTreatments.map(t => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{t.medicationName}</span>
                        <span className="text-xs font-semibold text-teal-800 px-2 py-0.5 rounded bg-teal-100">
                          {t.dose}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          {t.status === 'active' ? 'Actif' : t.status === 'ending_soon' ? 'Fin proche' : t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Posologie : <strong className="text-slate-800">{t.frequency}</strong> • Début :{' '}
                        {t.startDate} • Réévaluation : {t.nextReview}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">{t.adherencePercentage}% d'Observance</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {t.status === 'ending_soon' ? 'Fin de traitement imminente' : 'Observance optimale'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Prescriptions History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Historique des Ordonnances ({prescriptions.length})
                </h2>
              </div>
            </div>

            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune ordonnance délivrée pour ce patient.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {prescriptions.map(rx => (
                  <div
                    key={rx.id}
                    onClick={() => onNavigate('prescription-view', rx.id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-700">
                          {rx.prescriptionNumber}
                        </span>
                        <span className="text-xs text-slate-500">{rx.date}</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                          {rx.items.length} méd.
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        {rx.items.map(i => `${i.medicationName} (${i.strength})`).join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigate('prescription-view', rx.id);
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      Consulter / Imprimer (A5)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinical Notes Timeline & Longitudinal Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Observations Médicales & Évolution Clinique
            </h2>

            {/* Note input box */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                placeholder="Ajouter une observation clinique, synthèse de consultation ou évolution..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-600 font-medium text-slate-800"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteText.trim()}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAddingNote ? 'Enregistrement...' : 'Ajouter une Note'}</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Aucune observation clinique enregistrée pour l’instant.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{note.authorName}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Planifier une Consultation de Suivi</h3>
            <form onSubmit={handleScheduleFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date de la Consultation de Suivi</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif Clinique / Objectif de Contrôle</label>
                <input
                  type="text"
                  required
                  value={followUpReason}
                  onChange={e => setFollowUpReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirmer le Rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
