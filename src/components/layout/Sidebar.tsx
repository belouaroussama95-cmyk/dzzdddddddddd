import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Pill,
  Activity,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  FileCheck2,
  X,
  Stethoscope,
  LogOut,
  ChevronRight,
  ShieldAlert,
  AlertOctagon,
  BookOpen,
  StickyNote,
  Camera,
  TestTube2,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenProfilePicture?: () => void;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onCloseMobile, onOpenProfilePicture }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const avatar = user?.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') || '';

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, shortcut: null },
    { id: 'patients', label: 'Dossiers Patients', icon: Users, shortcut: 'P' },
    { id: 'prescriptions', label: 'Ordonnances', icon: FileText, shortcut: null },
    { id: 'new-prescription', label: 'Nouvelle Ordonnance', icon: FileCheck2, shortcut: 'N', highlight: true },
    { id: 'bilans', label: 'Bilans & Examens', icon: TestTube2, shortcut: 'B', badge: 'Labo' },
    { id: 'notes', label: 'Notes Cliniques', icon: StickyNote, shortcut: 'O', badge: 'Mémos' },
    { id: 'ordonnance-types', label: 'Ordonnances Types', icon: BookOpen, shortcut: 'T', badge: 'Types' },
    { id: 'medications', label: 'Médicaments', icon: Pill, shortcut: 'M' },
    { id: 'scores', label: 'Scores Médicaux', icon: Calculator, shortcut: 'S', badge: 'Medicalcul' },
    { id: 'followups', label: 'Rendez-vous & Suivis', icon: Calendar, shortcut: null },
    { id: 'contraindications', label: 'Contre-indications', icon: ShieldAlert, shortcut: null },
    { id: 'cat-urgences', label: 'CAT Urgences', icon: AlertOctagon, shortcut: 'U', alert: true },
    { id: 'reports', label: 'Rapports & Statistiques', icon: BarChart3, shortcut: null },
    { id: 'settings', label: 'Paramètres Cabinet', icon: Settings, shortcut: null },
  ];

  const adminItems = [
    { id: 'users', label: 'Gestion Utilisateurs', icon: Shield },
    { id: 'audit-logs', label: 'Journal d\'Audit', icon: FileText },
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d2f3f] text-slate-100 flex flex-col shadow-2xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:bg-teal-300 transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-white group-hover:text-teal-300 transition-colors">
                  OrdoCare
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-teal-400/20 text-teal-300 rounded border border-teal-400/30">
                  Rx
                </span>
              </div>
              <p className="text-[10px] text-teal-200/70 font-medium tracking-wide">Pratique Clinique & Ordonnances</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-teal-900">
          <div className="text-[10px] uppercase tracking-widest text-slate-400/80 font-bold px-3 mb-2">
            Espace Clinique
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'patients' && currentPage === 'patient-profile') ||
              (item.id === 'prescriptions' && (currentPage === 'prescription-view' || currentPage === 'printable-prescription'));

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all group ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-400 font-semibold'
                    : item.highlight
                    ? 'text-teal-300 bg-teal-400/10 hover:bg-teal-400/15 hover:text-teal-200 font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-teal-400'
                        : item.alert
                        ? 'text-rose-400 group-hover:text-rose-300'
                        : item.highlight
                        ? 'text-teal-300'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className={item.alert && !isActive ? 'text-rose-200 group-hover:text-white' : ''}>
                    {item.label}
                  </span>
                </div>
                {item.alert ? (
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    15
                  </span>
                ) : item.shortcut ? (
                  <kbd
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-teal-400/20 text-teal-300'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                ) : null}
              </button>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-widest text-slate-400/80 font-bold px-3 mb-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-teal-400" />
                Administration
              </div>
              <div className="space-y-1">
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all group ${
                        isActive
                          ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-400 font-semibold'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer User Info */}
        <div className="p-4 mt-auto bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between gap-2.5">
            <div
              onClick={onOpenProfilePicture}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group hover:opacity-90 transition-opacity"
              title="Modifier la photo de profil / avatar"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-teal-400/40 bg-teal-500/20 flex items-center justify-center shrink-0">
                {avatar ? (
                  <img src={avatar} alt={user?.name || 'Docteur'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal-300 font-bold text-xs">
                    {user?.name && user.name !== 'System Administrator' ? user.name.slice(0, 2).toUpperCase() : 'OB'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate group-hover:text-teal-300 transition-colors">
                  {user?.name && user.name !== 'System Administrator' ? user.name : 'Dr. Oussama Belouar'}
                </p>
                <p className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                  <span>{user?.role === 'admin' ? 'Administrateur' : user?.role === 'physician' || user?.role === 'doctor' ? 'Médecin' : (user?.role || 'Praticien')}</span>
                  <span className="text-teal-400/60">• Photo</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => logout()}
                title="Se déconnecter"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
