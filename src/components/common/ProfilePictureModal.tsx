import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Check,
  Camera,
  Trash2,
  Sparkles,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { AVATAR_PRESETS, AvatarPreset } from '../../data/avatarPresets';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarUpdated: (newUrl: string | undefined) => void;
}

export function ProfilePictureModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated
}: ProfilePictureModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(currentAvatarUrl);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setUploadError(null);
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (PNG, JPEG, WebP, SVG).');
      return;
    }

    // Check size (< 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("L'image est trop volumineuse (maximum 3 Mo autorisés).");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setSelectedAvatar(result);
      setActiveTab('upload');
      showToast('info', 'Image prête', 'Cliquez sur Enregistrer pour appliquer votre photo de profil.');
    };
    reader.onerror = () => {
      setUploadError("Échec de lecture du fichier image.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage for instant client reload
      if (selectedAvatar) {
        localStorage.setItem('ordocare_doctor_avatar', selectedAvatar);
      } else {
        localStorage.removeItem('ordocare_doctor_avatar');
      }

      // Update doctor profile on server
      await api.updateDoctorProfile({ avatarUrl: selectedAvatar || '' });

      onAvatarUpdated(selectedAvatar);
      showToast('success', 'Photo de profil mise à jour', 'Votre avatar médical a été enregistré avec succès.');
      onClose();
    } catch (err: any) {
      showToast('error', 'Erreur de sauvegarde', err.message || 'Impossible de sauvegarder la photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setSelectedAvatar(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Photo de Profil & Avatar Médical
              </h3>
              <p className="text-xs text-slate-500">
                Téléversez depuis votre PC ou choisissez un avatar clinique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current / Selected Preview */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-500 shadow-md bg-white flex items-center justify-center">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Aperçu avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-600 text-white font-black text-xl flex items-center justify-center">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3" />
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {user?.name || 'Dr. Oussama Belouar'}
              </p>
              <p className="text-[11px] text-teal-700 font-semibold">
                {selectedAvatar ? 'Photo personnalisée prête' : 'Initiales standard par défaut'}
              </p>
              <p className="text-[10px] text-slate-400">
                S'affichera sur l'en-tête, la barre latérale et vos documents
              </p>
            </div>
          </div>

          {selectedAvatar && (
            <button
              onClick={handleRemove}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Réinitialiser l'avatar"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          )}
        </div>

        {/* Tabs: Presets vs Upload */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Avatars Cliniques Prédéfinis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Téléverser depuis le PC</span>
          </button>
        </div>

        {/* Tab 1: Presets Gallery */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500">
              Sélectionnez un profil graphique médical :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
              {AVATAR_PRESETS.map(preset => {
                const isSelected = selectedAvatar === preset.svgDataUri;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.svgDataUri)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center gap-2 cursor-pointer group ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shadow-xs border border-slate-200/80 group-hover:scale-105 transition-transform bg-white">
                      <img
                        src={preset.svgDataUri}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {preset.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload from PC */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />

            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                dragOver
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Cliquez pour parcourir ou glissez-déposez une image ici
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Formats supportés : PNG, JPG, WebP ou SVG (Max 3 Mo)
                </p>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                Sélectionner un fichier sur mon PC
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <span>Enregistrement...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Appliquer cet Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
