import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Pill,
  Users,
  Activity,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getReportsSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ['Indicateur', 'Valeur'],
      ['Total des Patients', data.metrics.totalPatients],
      ['Traitements Actifs', data.metrics.activeTreatments],
      ['Ordonnances Émises ce Mois', data.metrics.prescriptionsThisMonth],
      ['Total des Ordonnances', data.metrics.totalPrescriptions],
      ['Observance Optimale (>85%)', data.adherenceDistribution.optimal],
      ['Observance Modérée (70-85%)', data.adherenceDistribution.moderate],
      ['Observance Faible (<70%)', data.adherenceDistribution.low],
      [],
      ['Médicaments les Plus Prescrits', 'Nombre d’Ordonnances'],
      ...data.topMedications.map((m: any) => [m.name, m.count])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OrdoCare_Rapport_Clinique_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Rapport Exporté', 'Statistiques cliniques téléchargées au format CSV.');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Génération du tableau de bord analytique...</div>;
  }

  const metrics = data?.metrics || {};
  const topMeds = data?.topMedications || [];
  const monthlyData = data?.monthlyPrescriptions || [];
  const adherence = data?.adherenceDistribution || { optimal: 0, moderate: 0, low: 0 };
  const totalAdherenceTracked = adherence.optimal + adherence.moderate + adherence.low || 1;

  const maxPrescriptionsMonth = Math.max(...monthlyData.map((d: any) => d.count), 1);
  const maxMedsCount = Math.max(...topMeds.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-teal-700" />
              <span>Rapports d’Activité & Statistiques Cliniques</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
              Télémétrie Clinique en Temps Réel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Volumes de prescription, répartition du formulaire, taux d’observance et indicateurs d’activité médicale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Rapport</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordonnances Délivrées</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalPrescriptions}</span>
            <span className="text-xs text-emerald-600 font-semibold">+{metrics.prescriptionsThisMonth} ce mois</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ordonnances médicales certifiées</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">File Active des Patients</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.activePatients}</span>
            <span className="text-xs text-slate-500">sur {metrics.totalPatients} patients au total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consultations actives sur les 6 derniers mois</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux d’Observance Thérapeutique</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">
              {Math.round((adherence.optimal / totalAdherenceTracked) * 100)}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Conformité optimale</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Protocoles sous suivi actif</p>
        </div>
      </div>

      {/* Monthly Prescriptions & Formulary Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>Volume Mensuel des Prescriptions</span>
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {monthlyData.map((m: any, i: number) => {
              const pct = Math.round((m.count / maxPrescriptionsMonth) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{m.month}</span>
                    <span className="text-slate-900 font-bold">{m.count} ordonnances</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Prescribed Medications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-700" />
              <span>Médicaments les Plus Prescrits</span>
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {topMeds.map((med: any, idx: number) => {
              const pct = Math.round((med.count / maxMedsCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold">
                      {idx + 1}. {med.name}{' '}
                      <span className="text-slate-400 font-normal">({med.category})</span>
                    </span>
                    <span className="text-teal-700 font-bold">{med.count} ord.</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Treatment Adherence Breakdown Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <Activity className="w-4 h-4 text-teal-700" />
          <span>Répartition de l’Observance Thérapeutique des Patients</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase">Observance Optimale (&gt;85%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-900">{adherence.optimal} patients</div>
            <p className="text-[11px] text-emerald-700 mt-1">Excellente prise régulière des traitements prescrits</p>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase">Observance Modérée (70-85%)</span>
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-teal-900">{adherence.moderate} patients</div>
            <p className="text-[11px] text-teal-700 mt-1">Oublis ponctuels, surveillance clinique en cours</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase">Observance Faible (&lt;70%)</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-900">{adherence.low} patients</div>
            <p className="text-[11px] text-amber-700 mt-1">Consultation de contrôle conseillée pour identifier les freins</p>
          </div>
        </div>
      </div>
    </div>
  );
}
