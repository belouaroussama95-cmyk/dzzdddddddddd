import React, { useState } from 'react';
import { Search, Bell, Shield, LogOut, Plus, Menu, Clock, User, ShieldCheck, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNewPrescription: () => void;
  onToggleSidebar: () => void;
  onNavigate: (page: string, param?: string) => void;
  notificationCount?: number;
  onOpenProfilePicture?: () => void;
}

export function Header({
  onOpenSearch,
  onOpenNewPrescription,
  onToggleSidebar,
  onNavigate,
  notificationCount = 2,
  onOpenProfilePicture
}: HeaderProps) {
  const { user, logout, isAdmin, sessionTimeLeftMinutes } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const avatar = user?.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') || '';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#102334] border-b border-slate-200 dark:border-[#1e3850] px-4 sm:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left section: mobile hamburger & search trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar Button */}
        <button
          onClick={onOpenSearch}
          className="w-full max-w-md flex items-center justify-between pl-4 pr-3 py-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full border border-transparent hover:border-teal-500/40 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-xs sm:text-sm font-medium group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            <span className="truncate text-slate-600 dark:text-slate-300">Rechercher patients, médicaments, ordonnances...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right section: live status, actions, notifications, user profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live database indicator from theme */}
        <div className="hidden lg:flex items-center gap-2 mr-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Base synchronisée</span>
        </div>

        {/* Quick New Prescription button */}
        <button
          onClick={onOpenNewPrescription}
          className="hidden sm:flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Ordonnance</span>
        </button>

        {/* Inactivity Security Badge */}
        {sessionTimeLeftMinutes !== null && (
          <div
            title={`Session active. Déconnexion automatique après ${sessionTimeLeftMinutes} min d'inactivité pour la protection des données médicales.`}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{sessionTimeLeftMinutes}m verrou</span>
          </div>
        )}

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => onNavigate('followups')}
          title="Alertes cliniques & suivis"
          className="relative p-2 text-slate-400 hover:text-teal-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-800 font-bold text-xs uppercase shadow-2xs">
              {avatar ? (
                <img src={avatar} alt={user?.name || 'Docteur'} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left pr-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight line-clamp-1">
                {user?.name && user.name !== 'System Administrator' ? user.name : 'Dr. Oussama Belouar'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    Admin Médical
                  </>
                ) : (
                  user?.role === 'physician' || user?.role === 'doctor' ? 'Médecin' : (user?.role || 'Praticien')
                )}
              </span>
            </div>
          </button>

          {/* Profile Popover Menu */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-800 font-bold text-xs uppercase shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={user?.name || 'Docteur'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name && user.name !== 'System Administrator' ? user.name.slice(0, 2).toUpperCase() : 'OB'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {user?.name && user.name !== 'System Administrator' ? user.name : 'Dr. Oussama Belouar'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  {user?.licenseNumber && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">N° Ordre : {user.licenseNumber}</p>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfilePicture?.();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>Changer Photo / Avatar</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Paramètres Cabinet & Profil
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('users');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-teal-600" />
                    Administration Utilisateurs
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
