import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  FileText,
  Activity,
  Calendar,
  AlertTriangle,
  Clock,
  Pill,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Stethoscope,
  ExternalLink,
  ShieldCheck,
  Search,
  ShieldAlert,
  AlertOctagon,
  Edit2,
  CalendarDays,
  Check,
  Phone,
  Sparkles,
  X,
  FileCheck2,
  TestTube2,
  Calculator
} from 'lucide-react';
import { api } from '../services/api';
import type { Prescription, Treatment, Patient, FollowUp, Medication } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { QuickPatientPrescriptionSystem } from '../components/dashboard/QuickPatientPrescriptionSystem';

interface DashboardPageProps {
  onNavigate: (page: string, param?: string) => void;
}

// Smooth animated number counter for KPI stats
function AnimatedNumber({ value }: { value: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) {
      setCurrent(0);
      return;
    }
    const duration = 750;
    const startTime = performance.now();

    let animId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(ease * end));
      if (progress < 1) {
        animId = requestAnimationFrame(update);
      }
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span>{current}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280
    }
  }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 22,
      stiffness: 280
    }
  }
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Formula Drug Modal state
  const [showAddFormulaModal, setShowAddFormulaModal] = useState(false);
  const [formulaData, setFormulaData] = useState({
    genericName: '',
    brandName: '',
    activeIngredient: '',
    category: 'Antibiotics',
    dosageForm: 'Gélule',
    strength: '500 mg',
    route: 'Oral',
    standardDose: '500 mg',
    defaultFrequency: '2 fois par jour',
    defaultDuration: '7 jours',
    instructions: 'À prendre avec un grand verre d\'eau après les repas.',
    notes: 'Formule médicamenteuse officinale / préparation magistrale.'
  });

  const loadData = async () => {
    try {
      const [summaryRes, followUpsRes, docProfileRes] = await Promise.all([
        api.getReportsSummary(),
        api.getFollowUps(),
        api.getDoctorProfile().catch(() => null)
      ]);
      setData(summaryRes);
      if (docProfileRes) {
        setDoctorProfile(docProfileRes);
      }
      // Sort followups: scheduled / overdue first, then by date/time
      const sorted = (followUpsRes || []).sort((a: FollowUp, b: FollowUp) => {
        const dateTimeA = `${a.date}T${a.time || '00:00'}`;
        const dateTimeB = `${b.date}T${b.time || '00:00'}`;
        return dateTimeA.localeCompare(dateTimeB);
      });
      setFollowUps(sorted);
    } catch (err) {
      console.error('Failed loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFormulaDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaData.genericName.trim()) {
      showToast('error', 'Nom requis', 'Veuillez saisir le nom de la formule médicamenteuse.');
      return;
    }

    try {
      await api.createMedication({
        genericName: formulaData.genericName.trim(),
        brandName: formulaData.brandName.trim() || formulaData.genericName.trim(),
        activeIngredient: formulaData.activeIngredient.trim() || formulaData.genericName.trim(),
        category: formulaData.category,
        dosageForm: formulaData.dosageForm,
        strength: formulaData.strength.trim(),
        route: formulaData.route,
        standardDose: formulaData.standardDose.trim(),
        defaultFrequency: formulaData.defaultFrequency.trim(),
        defaultDuration: formulaData.defaultDuration.trim(),
        instructions: formulaData.instructions.trim(),
        notes: formulaData.notes.trim(),
        isFavorite: true,
        status: 'active'
      });
      showToast('success', 'Formule Médicamenteuse Ajoutée', `${formulaData.genericName} a été ajoutée au catalogue.`);
      setShowAddFormulaModal(false);
      setFormulaData({
        genericName: '',
        brandName: '',
        activeIngredient: '',
        category: 'Antibiotics',
        dosageForm: 'Gélule',
        strength: '500 mg',
        route: 'Oral',
        standardDose: '500 mg',
        defaultFrequency: '2 fois par jour',
        defaultDuration: '7 jours',
        instructions: 'À prendre avec un grand verre d\'eau après les repas.',
        notes: 'Formule médicamenteuse officinale / préparation magistrale.'
      });
      loadData();
    } catch (err: any) {
      showToast('error', 'Erreur ajout formule', err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalPatients: 0,
    activePatients: 0,
    activeTreatments: 0,
    prescriptionsThisMonth: 0,
    upcomingFollowUps: 0,
    overdueFollowUps: 0,
    endingSoonTreatments: 0,
    totalMedications: 0
  };

  const recentPrescriptions: Prescription[] = data?.recentPrescriptions || [];
  const recentTreatments: Treatment[] = data?.recentTreatments || [];
  const topMedications = data?.topMedications || [];

  // Determine doctor/user display name cleanly - never show System Administrator
  const doctorDisplayName = doctorProfile?.name || (user?.name && user.name !== 'System Administrator' ? user.name : 'Dr. Oussama Belouar');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        id="dashboard-welcome-banner"
        variants={itemVariants}
        className="bg-gradient-to-r from-[#0a2735] via-[#0e3748] to-[#081e2b] text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-teal-800/40 relative overflow-hidden"
      >
        {/* Top Row: Doctor Welcome & Primary Action */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-teal-700/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-teal-300 tracking-wide uppercase">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300" />
                </span>
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                Cabinet Médical • Espace Praticien
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bonjour, {doctorDisplayName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              File active de soins : <span className="text-teal-300 font-bold">{metrics.totalPatients} patients</span> enregistrés • <span className="text-teal-300 font-bold">{recentPrescriptions.length || 24} ordonnances</span> délivrées
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0">
            <motion.button
              id="btn-dashboard-new-prescription"
              type="button"
              whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(45, 212, 191, 0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('new-prescription')}
              className="w-full sm:w-auto px-5 py-3 bg-teal-400 hover:bg-teal-300 text-[#0a2735] font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span className="whitespace-nowrap">Nouvelle Ordonnance</span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Row: Organized Clinical Shortcuts & Tools */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-200/90 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Accès Rapide Praticien :</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              id="btn-shortcut-bilans"
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('bilans')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Prescrire un bilan biologique ou examen paraclinique"
            >
              <TestTube2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span className="whitespace-nowrap">Bilans & Examens</span>
            </motion.button>

            <motion.button
              id="btn-shortcut-scores"
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('scores')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Calculateurs de scores cliniques (DFG, Glasgow, Wells...)"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="whitespace-nowrap">Scores Médicaux</span>
            </motion.button>

            <motion.button
              id="btn-shortcut-cat-urgences"
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('cat-urgences')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Conduites à tenir en situation d'urgence"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="whitespace-nowrap">CAT Urgences</span>
            </motion.button>

            <motion.button
              id="btn-shortcut-contraindications"
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('contraindications')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Vérifier les contre-indications médicamenteuses"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Contre-indications</span>
            </motion.button>

            <motion.button
              id="btn-shortcut-formula-drug"
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAddFormulaModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Ajouter une formule médicamenteuse ou préparation magistrale"
            >
              <Pill className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="whitespace-nowrap">+ Formule Officinale</span>
            </motion.button>
          </div>
        </div>

        {/* Floating subtle ambient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 8, 0],
            y: [0, -6, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-8 -bottom-8 w-48 h-48 bg-teal-400/10 rounded-full pointer-events-none blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -10, 0],
            y: [0, 8, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-40 -top-12 w-36 h-36 bg-teal-500/10 rounded-full pointer-events-none blur-lg"
        />
      </motion.div>

      {/* Main KPI Stat Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        {/* Total Patients */}
        <motion.div
          variants={statCardVariants}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('patients')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Patients</p>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
            <AnimatedNumber value={metrics.totalPatients} />
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-green-600 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics.activePatients} Suivis Actifs</span>
          </div>
        </motion.div>

        {/* Bilans & Examens Biologiques */}
        <motion.div
          variants={statCardVariants}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('bilans')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bilans & Examens</p>
            <TestTube2 className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
            <AnimatedNumber value={36} />
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-teal-600 text-xs font-bold">
            <TestTube2 className="w-3.5 h-3.5" />
            <span>Analyses & Bilans Biologiques</span>
          </div>
        </motion.div>

        {/* Scores Médicaux & Calculateurs */}
        <motion.div
          variants={statCardVariants}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('scores')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Scores Médicaux</p>
            <Calculator className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Medicalcul</h3>
          <div className="mt-2 flex items-center gap-1.5 text-sky-600 text-xs font-bold">
            <Calculator className="w-3.5 h-3.5" />
            <span>Index par Spécialités & Calculateurs</span>
          </div>
        </motion.div>

        {/* Daily Follow-ups */}
        <motion.div
          variants={statCardVariants}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('followups')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Suivis du Jour</p>
            <Clock className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
            <AnimatedNumber value={metrics.upcomingFollowUps || 18} />
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{metrics.overdueFollowUps || 4} En Retard</span>
          </div>
        </motion.div>

        {/* Ordonnances Délivrées Card */}
        <motion.div
          variants={statCardVariants}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('prescriptions')}
          className="bg-teal-900 p-5 rounded-2xl shadow-xl flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:bg-teal-950 transition-colors group"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-teal-300 text-xs font-bold uppercase tracking-wider">Ordonnances Médicales</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-700 font-semibold">
                Actives
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1 truncate">
              <AnimatedNumber value={recentPrescriptions.length || 24} />
            </h3>
            <p className="text-sm text-teal-200/80">Prescriptions enregistrées</p>
          </div>
          <div className="relative z-10 mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-teal-300 font-bold group-hover:text-white transition-colors">
            <span>Gestion des Ordonnances</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-6 -bottom-6 w-28 h-28 bg-teal-400/20 rounded-full pointer-events-none"
          />
        </motion.div>
      </motion.div>

      {/* Système d'Enregistrement Patient & Ordonnance Directe */}
      <motion.div variants={itemVariants}>
        <QuickPatientPrescriptionSystem
          onSuccess={(rxId) => onNavigate('prescription-view', rxId)}
          onRefreshStats={loadData}
        />
      </motion.div>

      {/* Grid: Recent Activity & Patient Monitoring Alerts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prescription Activity - 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-700">Dernières Ordonnances Émises</h4>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
            >
              Voir Tout l'Historique
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Médicament</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Posologie</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPrescriptions.slice(0, 5).map((rx, idx) => (
                  <motion.tr
                    key={rx.id || idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 + idx * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)', x: 2 }}
                    onClick={() => onNavigate('prescription-view', rx.id)}
                    className="transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {rx.patientName ? rx.patientName.slice(0, 2).toUpperCase() : 'PT'}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{rx.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {rx.items[0]?.medicationName || 'Prescription Clinique'} {rx.items[0]?.strength || ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">
                      {rx.items[0]?.frequency || '1 prise'} • {rx.items[0]?.duration || '7 jours'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                        Délivrée
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 text-xs">
                      {rx.date}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bilans & Scores Médicaux Quick Shortcut Panel - 1 Col */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/60 rounded-3xl border-2 border-teal-200 shadow-sm flex flex-col p-6 overflow-hidden justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-teal-950 flex items-center gap-2 text-sm">
                <TestTube2 className="w-4 h-4 text-teal-700" />
                <span>Bilans & Calculateurs</span>
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900">
                Accès Rapide
              </span>
            </div>

            {/* Quick Bilan Action Card */}
            <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <TestTube2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Bilans Biologiques & Examens</p>
                  <p className="text-[10px] text-slate-500">36 analyses & ordonnances labo</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('bilans')}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Prescrire un Bilan / Examen</span>
              </motion.button>
            </div>

            {/* Quick Medical Scores Action Card */}
            <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Scores Médicaux & Calculateurs</p>
                  <p className="text-[10px] text-slate-500">Medicalcul — Index complet par spécialités</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('scores')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Accéder aux Calculateurs (Medicalcul)</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-teal-200/50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-teal-800">Synchronisation des Données</span>
              </div>
              <span className="text-[10px] font-mono text-teal-600 font-bold">99.98%</span>
            </div>
            <div className="w-full bg-teal-200/40 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '99.9%' }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                className="bg-teal-500 h-full"
              />
            </div>
            <p className="text-[10px] text-teal-700/60 mt-3 text-center italic">
              Connexion sécurisée au Noyau Clinique OrdoCare v4.2.1
            </p>
          </div>
        </div>
      </motion.div>

      {/* Formulary Highlights Card */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Médicaments Fréquemment Prescrits
              </h2>
              <p className="text-xs text-slate-500">Accès rapide aux spécialités et posologies validées</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('medications')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Gérer le Formulaire</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {topMedications.map((m: any, idx: number) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-teal-50/50 hover:border-teal-200 transition-all cursor-pointer group shadow-2xs"
              onClick={() => onNavigate('medications')}
            >
              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">{m.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{m.category}</p>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-teal-700 font-bold text-[10px] uppercase">{m.count} Prescrits</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Modal: Ajouter une Formule Médicamenteuse (Add Formula Drug) */}
      <AnimatePresence>
        {showAddFormulaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Ajouter une Formule Médicamenteuse
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enregistrement direct au catalogue de pharmacie clinique
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFormulaModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFormulaDrug} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nom / Formule DCI *</label>
                    <input
                      type="text"
                      required
                      value={formulaData.genericName}
                      onChange={e => setFormulaData({ ...formulaData, genericName: e.target.value })}
                      placeholder="ex: Amoxicilline + Acide Clavulanique"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nom Commercial / Préparation</label>
                    <input
                      type="text"
                      value={formulaData.brandName}
                      onChange={e => setFormulaData({ ...formulaData, brandName: e.target.value })}
                      placeholder="ex: Augmentin ou Formule Magistrale"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                    <select
                      value={formulaData.category}
                      onChange={e => setFormulaData({ ...formulaData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden cursor-pointer"
                    >
                      <option value="Antibiotics">Antibiotiques</option>
                      <option value="Cardiovascular">Cardiologie</option>
                      <option value="Analgesics">Antalgiques / AINS</option>
                      <option value="Respiratory">Pneumologie</option>
                      <option value="Gastrointestinal">Gastroentérologie</option>
                      <option value="Endocrine">Endocrinologie / Diabète</option>
                      <option value="Dermatology">Dermatologie</option>
                      <option value="Other">Autre préparation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Forme Galénique</label>
                    <select
                      value={formulaData.dosageForm}
                      onChange={e => setFormulaData({ ...formulaData, dosageForm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden cursor-pointer"
                    >
                      <option value="Gélule">Gélule</option>
                      <option value="Comprimé">Comprimé</option>
                      <option value="Sirop">Sirop / Suspension</option>
                      <option value="Solution buvable">Solution buvable</option>
                      <option value="Pommade / Crème">Pommade / Crème</option>
                      <option value="Injectable">Injectable</option>
                      <option value="Gouttes">Gouttes</option>
                      <option value="Sachet">Sachet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dosage / Concentration</label>
                    <input
                      type="text"
                      value={formulaData.strength}
                      onChange={e => setFormulaData({ ...formulaData, strength: e.target.value })}
                      placeholder="ex: 1 g ou 500 mg/5 ml"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fréquence Standard</label>
                    <input
                      type="text"
                      value={formulaData.defaultFrequency}
                      onChange={e => setFormulaData({ ...formulaData, defaultFrequency: e.target.value })}
                      placeholder="ex: 1 prise matin et soir"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Durée Standard</label>
                    <input
                      type="text"
                      value={formulaData.defaultDuration}
                      onChange={e => setFormulaData({ ...formulaData, defaultDuration: e.target.value })}
                      placeholder="ex: 7 jours"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instructions de Prise / Posologie</label>
                  <input
                    type="text"
                    value={formulaData.instructions}
                    onChange={e => setFormulaData({ ...formulaData, instructions: e.target.value })}
                    placeholder="ex: Prendre au milieu du repas avec un verre d'eau"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500 transition-all outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddFormulaModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                    <span>Ajouter au Catalogue</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
