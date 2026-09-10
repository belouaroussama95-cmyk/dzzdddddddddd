import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  XCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import type { Prescription } from '../types';
import { useToast } from '../context/ToastContext';

interface PrescriptionsPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export function PrescriptionsPage({ onNavigate }: PrescriptionsPageProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'archived'>('all');

  const { showToast } = useToast();

  const loadPrescriptions = async () => {
    try {
      const data = await api.getPrescriptions({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPrescriptions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusChange = async (id: string, newStatus: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updatePrescriptionStatus(id, newStatus);
      const statusFr = newStatus === 'active' ? 'en cours' : newStatus === 'completed' ? 'délivrée' : newStatus === 'cancelled' ? 'annulée' : 'archivée';
      showToast('info', 'Statut mis à jour', `Ordonnance marquée comme ${statusFr}.`);
      loadPrescriptions();
    } catch (err: any) {
      showToast('error', 'Échec de la mise à jour', err.message);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cloned = await api.duplicatePrescription(id);
      showToast('success', 'Ordonnance renouvelée', `Renouvelée sous le N° ${cloned.prescriptionNumber}.`);
      loadPrescriptions();
    } catch (err: any) {
      showToast('error', 'Échec du renouvellement', err.message);
    }
  };

  const statusLabels: Record<string, string> = {
    all: 'Toutes',
    active: 'En cours',
    completed: 'Délivrées',
    cancelled: 'Annulées',
    archived: 'Archivées'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Registre des Ordonnances</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200/80">
                  {prescriptions.length} Ordonnances
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historique des ordonnances médicales, traçabilité de délivrance et modèles A5 officiels prêts à imprimer.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-prescription')}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Ordonnance</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par N° d'ordonnance, patient, médicament..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {(['all', 'active', 'completed', 'cancelled', 'archived'] as const).map(tab => (
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
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chargement du registre des ordonnances...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Aucune ordonnance trouvée</p>
            <p className="text-xs text-slate-400 mt-1">Modifiez votre recherche ou rédigez une nouvelle prescription.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prescriptions.map(rx => (
              <div
                key={rx.id}
                onClick={() => onNavigate('prescription-view', rx.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-700">
                      {rx.prescriptionNumber}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{rx.patientName}</span>
                    <span className="text-xs text-slate-400">({rx.patientId})</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rx.date}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        rx.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : rx.status === 'completed'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                          : rx.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rx.status === 'active' ? 'En cours' : rx.status === 'completed' ? 'Délivrée' : rx.status === 'cancelled' ? 'Annulée' : 'Archivée'}
                    </span>
                  </div>

                  {/* Medications Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rx.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {item.medicationName} ({item.strength}) • {item.dose}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 pt-0.5">
                    Prescrit par <strong className="text-slate-700">{rx.doctorName}</strong> ({rx.doctorSpecialty})
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => onNavigate('prescription-view', rx.id)}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer A5</span>
                  </button>

                  <button
                    onClick={e => handleDuplicate(rx.id, e)}
                    title="Dupliquer / Renouveler l’ordonnance"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Quick status dropdown */}
                  <select
                    value={rx.status}
                    onChange={e => handleStatusChange(rx.id, e.target.value as any, e as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="active">En cours</option>
                    <option value="completed">Délivrée</option>
                    <option value="cancelled">Annulée</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
