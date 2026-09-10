import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ProfilePictureModal } from './components/common/ProfilePictureModal';
import { DoctorWelcomeAnimation } from './components/common/DoctorWelcomeAnimation';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { PrescriptionBuilder } from './components/prescriptions/PrescriptionBuilder';
import { PrintablePrescription } from './components/prescriptions/PrintablePrescription';
import { MedicationsPage } from './pages/MedicationsPage';
import { MedicalScoresPage } from './pages/MedicalScoresPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ContraindicationsPage } from './pages/ContraindicationsPage';
import { EmergencyCatPage } from './pages/EmergencyCatPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { OrdonnanceTypesPage } from './pages/OrdonnanceTypesPage';
import { NotesPage } from './pages/NotesPage';
import { BilansPage } from './pages/BilansPage';

import { api } from './services/api';
import type { Prescription, ClinicSettings, DoctorProfile } from './types';

function MainApplication() {
  const { user, loading, isAdmin } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [currentParam, setCurrentParam] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  // For viewing a single prescription
  const [viewedPrescription, setViewedPrescription] = useState<Prescription | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | undefined>();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | undefined>();

  // Fetch clinic info for prescription letterhead
  useEffect(() => {
    if (user) {
      api.getClinicSettings().then(setClinicSettings).catch(() => {});
      api.getDoctorProfile().then(setDoctorProfile).catch(() => {});

      // Welcome animation should ONLY be shown once, immediately after a successful login
      const justLoggedIn = sessionStorage.getItem('ordocare_just_logged_in') === 'true';
      if (justLoggedIn) {
        sessionStorage.removeItem('ordocare_just_logged_in');
        setShowWelcomeAnimation(true);
      } else {
        setShowWelcomeAnimation(false);
      }
    } else {
      setShowWelcomeAnimation(false);
      sessionStorage.removeItem('ordocare_just_logged_in');
    }
  }, [user]);

  // Handle global keyboard shortcuts (Cmd+K, N, P, M, O, T, U)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Avoid firing shortcuts when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setCurrentPage('new-prescription');
        setCurrentParam(undefined);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setCurrentPage('patients');
        setCurrentParam(undefined);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setCurrentPage('medications');
        setCurrentParam(undefined);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setCurrentPage('notes');
        setCurrentParam(undefined);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setCurrentPage('ordonnance-types');
        setCurrentParam(undefined);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setCurrentPage('bilans');
        setCurrentParam(undefined);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        setCurrentPage('cat-urgences');
        setCurrentParam(undefined);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (page: string, param?: string) => {
    setCurrentPage(page);
    setCurrentParam(param);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'prescription-view' && param) {
      api.getPrescriptionById(param)
        .then(rx => setViewedPrescription(rx))
        .catch(err => console.error('Failed loading prescription view', err));
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeAnimation(false);
    sessionStorage.setItem('ordocare_welcome_shown', 'true');
  };

  const currentAvatarUrl =
    doctorProfile?.avatarUrl ||
    user?.avatarUrl ||
    localStorage.getItem('ordocare_doctor_avatar') ||
    undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Verifying secure clinical session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Welcome Animation after login */}
      {showWelcomeAnimation && (
        <DoctorWelcomeAnimation
          onComplete={handleWelcomeComplete}
          doctorName={doctorProfile?.name || user?.name}
          avatarUrl={currentAvatarUrl}
        />
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onOpenProfilePicture={() => setProfilePictureModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenNewPrescription={() => navigate('new-prescription')}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={navigate}
          onOpenProfilePicture={() => setProfilePictureModalOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}

          {currentPage === 'patients' && (
            <PatientsPage
              onNavigate={navigate}
              openNewPatientModal={currentParam === 'new'}
            />
          )}

          {currentPage === 'patient-profile' && currentParam && (
            <PatientDetailPage
              patientId={currentParam}
              onNavigate={navigate}
              onBack={() => navigate('patients')}
            />
          )}

          {currentPage === 'prescriptions' && <PrescriptionsPage onNavigate={navigate} />}

          {currentPage === 'bilans' && (
            <BilansPage onNavigate={navigate} initialPatientId={currentParam} />
          )}

          {currentPage === 'notes' && <NotesPage onNavigate={navigate} />}

          {currentPage === 'ordonnance-types' && <OrdonnanceTypesPage onNavigate={navigate} />}

          {currentPage === 'new-prescription' && (
            <PrescriptionBuilder
              initialPatientId={currentParam}
              onPrescriptionCreated={newRx => {
                setViewedPrescription(newRx);
                navigate('prescription-view', newRx.id);
              }}
              onCancel={() => navigate('prescriptions')}
            />
          )}

          {currentPage === 'prescription-view' && (
            <div className="space-y-4">
              {viewedPrescription ? (
                <PrintablePrescription
                  prescription={viewedPrescription}
                  clinicSettings={clinicSettings}
                  doctorProfile={doctorProfile}
                  onBack={() => navigate('prescriptions')}
                />
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500">Loading prescription document...</p>
                </div>
              )}
            </div>
          )}

          {currentPage === 'medications' && (
            <MedicationsPage openNewModal={currentParam === 'new'} />
          )}

          {currentPage === 'scores' && <MedicalScoresPage onNavigate={navigate} />}

          {currentPage === 'followups' && <FollowUpsPage onNavigate={navigate} />}

          {currentPage === 'contraindications' && <ContraindicationsPage />}

          {currentPage === 'cat-urgences' && <EmergencyCatPage />}

          {currentPage === 'reports' && <ReportsPage />}

          {currentPage === 'settings' && <SettingsPage />}

          {currentPage === 'users' && isAdmin && <UsersManagementPage />}

          {currentPage === 'audit-logs' && isAdmin && <AuditLogsPage />}
        </main>
      </div>

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectPatient={id => navigate('patient-profile', id)}
        onSelectPrescription={id => navigate('prescription-view', id)}
        onSelectMedication={() => navigate('medications')}
        onSelectTreatment={ptId => navigate('patient-profile', ptId)}
      />

      {/* Profile Picture & Avatar Modal */}
      <ProfilePictureModal
        isOpen={profilePictureModalOpen}
        onClose={() => setProfilePictureModalOpen(false)}
        currentAvatarUrl={currentAvatarUrl}
        onAvatarUpdated={newUrl => {
          if (newUrl) {
            localStorage.setItem('ordocare_doctor_avatar', newUrl);
          } else {
            localStorage.removeItem('ordocare_doctor_avatar');
          }
          if (doctorProfile) {
            setDoctorProfile({ ...doctorProfile, avatarUrl: newUrl || '' });
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApplication />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
