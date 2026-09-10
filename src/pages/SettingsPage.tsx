import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Stethoscope,
  Shield,
  KeyRound,
  Check,
  Save,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  Key,
  FileCheck2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import type { ClinicSettings, DoctorProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProfilePictureModal } from '../components/common/ProfilePictureModal';

export function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [clinic, setClinic] = useState<ClinicSettings>({
    clinicName: 'OrdoCare Medical Clinic',
    tagline: 'Patient Prescriptions & Clinical Monitoring',
    address: '450 Medical Heights Blvd, Suite 300, Boston, MA 02115',
    phone: '+1 (617) 555-0192',
    email: 'contact@ordocare.health',
    website: 'https://ordocare.health',
    headerNote: 'Licensed Medical Practice • Board Certified Internal Medicine',
    footerDisclaimer:
      'This electronic prescription is authenticated and verifiable under Digital Health Pharmacy Regulations. Void if altered or transferred.'
  });

  const [doctor, setDoctor] = useState<DoctorProfile>({
    name: 'Dr. Elena Vance, MD',
    specialty: 'Internal Medicine & Clinical Pharmacology',
    licenseNumber: 'MED-MA-8849201',
    phone: '+1 (617) 555-0199',
    email: 'elena.vance@ordocare.health'
  });

  // Admin Code Update state
  const [currentAdminCode, setCurrentAdminCode] = useState('');
  const [newAdminCode, setNewAdminCode] = useState('');
  const [updatingCode, setUpdatingCode] = useState(false);

  // User Password Change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [c, d] = await Promise.all([
          api.getClinicSettings().catch(() => null),
          api.getDoctorProfile().catch(() => null)
        ]);
        if (c) setClinic(c);
        if (d) setDoctor(d);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    loadConfig();
  }, []);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateClinicSettings(clinic);
      showToast('success', 'Profil du Cabinet Mis à Jour', 'En-tête des ordonnances enregistré avec succès.');
    } catch (err: any) {
      showToast('error', 'Échec de la mise à jour', err.message);
    }
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateDoctorProfile(doctor);
      showToast('success', 'Profil du Médecin Mis à Jour', 'Signature et numéro d’identification enregistrés.');
    } catch (err: any) {
      showToast('error', 'Échec de la mise à jour', err.message);
    }
  };

  const handleUpdateAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminCode || !newAdminCode) return;

    setUpdatingCode(true);
    try {
      await api.changeAdminCode(currentAdminCode, newAdminCode);
      showToast('success', 'Code Administrateur Modifié', 'Le nouveau code de sécurité est désormais actif.');
      setCurrentAdminCode('');
      setNewAdminCode('');
    } catch (err: any) {
      showToast('error', 'Échec de la mise à jour', err.message || 'Échec de la vérification du code actuel.');
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setUpdatingPassword(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      showToast('success', 'Mot de Passe Mis à Jour', 'Le mot de passe de votre compte praticien a été modifié.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast('error', 'Échec de la modification', err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-teal-700" />
              <span>Paramètres du Cabinet & Système</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
              Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez l’identité du cabinet, les informations du praticien, l’en-tête des ordonnances et la sécurité.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Letterhead Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              En-tête & Coordonnées du Cabinet
            </h2>
          </div>

          <form onSubmit={handleSaveClinic} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom du Cabinet / Clinique</label>
              <input
                type="text"
                required
                value={clinic.clinicName}
                onChange={e => setClinic({ ...clinic, clinicName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sous-titre / Spécialité de l’en-tête</label>
              <input
                type="text"
                value={clinic.headerNote || ''}
                onChange={e => setClinic({ ...clinic, headerNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adresse du Cabinet</label>
              <input
                type="text"
                required
                value={clinic.address}
                onChange={e => setClinic({ ...clinic, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  required
                  value={clinic.phone}
                  onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courriel / Email</label>
                <input
                  type="email"
                  required
                  value={clinic.email}
                  onChange={e => setClinic({ ...clinic, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mentions Légales du Bas d’Ordonnance
              </label>
              <textarea
                rows={2}
                value={clinic.footerDisclaimer || ''}
                onChange={e => setClinic({ ...clinic, footerDisclaimer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer l’En-tête</span>
              </button>
            </div>
          </form>
        </div>

        {/* Attending Physician Credentials & Stamp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Identité & Tampon du Médecin
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200/60 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Changer Photo / Avatar</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Avatar Profile Preview */}
            <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-teal-500/40 bg-teal-100 flex items-center justify-center shrink-0">
                {doctor.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') ? (
                  <img
                    src={doctor.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') || ''}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-teal-800 font-extrabold text-sm uppercase">
                    {doctor.name ? doctor.name.slice(0, 2) : 'DR'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{doctor.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{doctor.specialty || 'Médecin Praticien'}</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 hover:border-teal-300 font-semibold text-xs rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                Modifier Photo
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom Complet & Titre du Médecin</label>
                <input
                  type="text"
                  required
                  value={doctor.name}
                  onChange={e => setDoctor({ ...doctor, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Spécialité Médicale</label>
              <input
                type="text"
                required
                value={doctor.specialty}
                onChange={e => setDoctor({ ...doctor, specialty: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Numéro RPPS / Inscription à l’Ordre</label>
              <input
                type="text"
                required
                value={doctor.licenseNumber}
                onChange={e => setDoctor({ ...doctor, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ligne Directe</label>
                <input
                  type="text"
                  value={doctor.phone || ''}
                  onChange={e => setDoctor({ ...doctor, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Professionnel</label>
                <input
                  type="email"
                  value={doctor.email || ''}
                  onChange={e => setDoctor({ ...doctor, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Signature Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Aperçu du Tampon d'Ordonnance</span>
              <div className="h-10 flex items-center justify-start border-b border-slate-300">
                <span className="font-serif italic text-lg text-teal-800 font-semibold">{doctor.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">RPPS / Ordre: {doctor.licenseNumber}</span>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer le Profil Médecin</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security: Change Staff Password */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Lock className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Modifier le Mot de Passe
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nouveau mot de passe sécurisé (Min 8 caractères)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {updatingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Security: Master Admin Access Code (Admin only) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-teal-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Modifier le Code Administrateur
            </h2>
          </div>

          <p className="text-xs text-slate-500">
            Mettez à jour le code d’accès administrateur à 6 chiffres. La vérification est effectuée de manière sécurisée côté serveur.
          </p>

          <form onSubmit={handleUpdateAdminCode} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code Administrateur Actuel</label>
              <input
                type="password"
                required
                value={currentAdminCode}
                onChange={e => setCurrentAdminCode(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nouveau Code Administrateur (Min 6 caractères)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newAdminCode}
                onChange={e => setNewAdminCode(e.target.value)}
                placeholder="Saisir le nouveau code maître"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingCode}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updatingCode ? 'Vérification...' : 'Définir le Nouveau Code'}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>

      <ProfilePictureModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentAvatarUrl={doctor.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') || undefined}
        onAvatarUpdated={newUrl => {
          if (newUrl) {
            localStorage.setItem('ordocare_doctor_avatar', newUrl);
          } else {
            localStorage.removeItem('ordocare_doctor_avatar');
          }
          setDoctor(prev => ({ ...prev, avatarUrl: newUrl || '' }));
          api.updateDoctorProfile({ ...doctor, avatarUrl: newUrl || '' }).catch(() => {});
        }}
      />
    </div>
  );
}
