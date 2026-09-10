import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Lock,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldAlert,
  User,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';
import type { User as UserType, Role } from '../types';
import { useToast } from '../context/ToastContext';

export function UsersManagementPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UserType | null>(null);

  // New user form state
  const [newUserData, setNewUserData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'doctor' as Role,
    licenseNumber: '',
    password: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const { showToast } = useToast();

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password || !newUserData.name) {
      showToast('warning', 'Validation', 'L’identifiant, le nom complet et le mot de passe sont obligatoires.');
      return;
    }

    try {
      const created = await api.createUser(newUserData);
      showToast('success', 'Utilisateur Créé', `Compte créé pour ${created.name} (${created.role}).`);
      setShowCreateModal(false);
      setNewUserData({
        username: '',
        name: '',
        email: '',
        role: 'doctor',
        licenseNumber: '',
        password: ''
      });
      loadUsers();
    } catch (err: any) {
      showToast('error', 'Échec de la Création', err.message);
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUser(user.id, { status: newStatus });
      showToast('info', 'Statut Mis à Jour', `${user.name} est maintenant ${newStatus === 'active' ? 'actif' : 'suspendu'}.`);
      loadUsers();
    } catch (err: any) {
      showToast('error', 'Échec', err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !newPassword) return;

    try {
      await api.resetUserPassword(targetUser.id, newPassword);
      showToast('success', 'Mot de Passe Réinitialisé', `Mot de passe réinitialisé pour ${targetUser.name}.`);
      setShowResetModal(false);
      setTargetUser(null);
      setNewPassword('');
    } catch (err: any) {
      showToast('error', 'Échec de la Réinitialisation', err.message);
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'doctor': return 'Médecin';
      case 'assistant': return 'Assistant(e)';
      case 'viewer': return 'Observateur';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-700" />
              <span>Administration des Praticiens & Collaborateurs</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
              Espace Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des rôles (Administrateur, Médecin, Assistant, Observateur) et sécurité des accès.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chargement des utilisateurs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3.5 px-4">Collaborateur / Praticien</th>
                  <th className="py-3.5 px-4">Rôle & Permissions</th>
                  <th className="py-3.5 px-4">N° RPPS / Inscription</th>
                  <th className="py-3.5 px-4">Dernière Connexion</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-500 text-[11px] font-mono">
                            @{u.username} • {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'doctor'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : u.role === 'assistant'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getRoleLabel(u.role)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {u.licenseNumber || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setShowResetModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Réinitialiser</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspendre' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Créer un Compte Soignant / Praticien</h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom Complet & Titre *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="ex. Dr. Marc Dupont, Cardiologue"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Identifiant de connexion *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.username}
                    onChange={e => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="ex. marc.dupont"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rôle & Permissions *</label>
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData({ ...newUserData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="doctor">Médecin (Prescription complète)</option>
                    <option value="admin">Administrateur Système</option>
                    <option value="assistant">Assistant(e) Clinique</option>
                    <option value="viewer">Observateur (Lecture seule)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="m.dupont@ordocare.sante.fr"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Numéro RPPS / Inscription à l'Ordre</label>
                <input
                  type="text"
                  value={newUserData.licenseNumber}
                  onChange={e => setNewUserData({ ...newUserData, licenseNumber: e.target.value })}
                  placeholder="ex. 10003849201"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de Passe Initial *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserData.password}
                  onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Réinitialiser le Mot de Passe</h3>
            <p className="text-xs text-slate-500">
              Définition des nouveaux accès pour <strong>{targetUser.name}</strong> (@{targetUser.username}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nouveau mot de passe (Min 8 caractères)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Saisir le nouveau mot de passe sécurisé"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirmer la Réinitialisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
