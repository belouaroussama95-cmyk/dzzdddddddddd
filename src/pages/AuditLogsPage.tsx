import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Shield,
  Clock,
  User,
  ShieldAlert,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { AuditLog } from '../types';
import { useToast } from '../context/ToastContext';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { showToast } = useToast();

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs({
        action: actionFilter === 'all' ? undefined : actionFilter
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed loading audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorUsername.toLowerCase().includes(q) ||
      (log.patientId && log.patientId.toLowerCase().includes(q)) ||
      (log.prescriptionId && log.prescriptionId.toLowerCase().includes(q)) ||
      JSON.stringify(log.details).toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Date_Heure', 'Action', 'Utilisateur', 'Role', 'Adresse_IP', 'ID_Patient', 'ID_Ordonnance', 'Details'],
      ...filteredLogs.map(l => [
        l.id,
        l.timestamp,
        l.action,
        l.actorUsername,
        l.actorRole,
        l.ipAddress || '',
        l.patientId || '',
        l.prescriptionId || '',
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OrdoCare_Audit_Traçabilite_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Journal Exporté', 'La piste d’audit clinique a été téléchargée en CSV avec succès.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-700" />
              <span>Journal d'Audit Clinique & Traçabilité</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
              Conformité HDS / RGPD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique horodaté et inaltérable des opérations cliniques et accès aux dossiers patients.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter le Journal (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par action, utilisateur, ID patient ou détails..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-600 font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filtrer par action :</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Tous les événements</option>
            <option value="PRESCRIPTION_CREATED">Ordonnances créées</option>
            <option value="DOSAGE_ADJUSTED">Posologies ajustées</option>
            <option value="PATIENT_CREATED">Patients enregistrés</option>
            <option value="LOGIN_SUCCESS">Connexions réussies</option>
            <option value="LOGIN_FAILED">Échecs de connexion</option>
            <option value="SECURITY_EVENT">Événements de sécurité</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chargement du registre d'audit...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Aucun événement d'audit correspondant</p>
            <p className="text-xs text-slate-400 mt-1">Essayez d’effacer vos filtres ou termes de recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type d'Action</th>
                  <th className="py-3 px-4">Utilisateur / Soignant</th>
                  <th className="py-3 px-4">Références</th>
                  <th className="py-3 px-4">Détails de l'Opération</th>
                  <th className="py-3 px-4">Adresse IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map(log => {
                  const isSecurity = log.action.includes('SECURITY') || log.action.includes('FAILED');
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSecurity ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            isSecurity
                              ? 'bg-rose-100 text-rose-800'
                              : log.action.includes('PRESCRIPTION')
                              ? 'bg-teal-100 text-teal-800'
                              : log.action.includes('DOSAGE')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-900 font-sans font-semibold">
                        {log.actorUsername}{' '}
                        <span className="text-[10px] text-slate-400 uppercase font-mono">({log.actorRole})</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {log.patientId && <span className="block font-medium">Patient: {log.patientId}</span>}
                        {log.prescriptionId && <span className="block text-teal-700 font-medium">Ordo: {log.prescriptionId}</span>}
                        {!log.patientId && !log.prescriptionId && <span className="text-slate-400">—</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-sans text-xs max-w-xs truncate">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details)}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
