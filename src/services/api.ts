import type {
  User,
  Patient,
  PatientNote,
  Medication,
  Prescription,
  Treatment,
  FollowUp,
  AuditLog,
  ClinicSettings,
  DoctorProfile,
  Role,
  OrdonnanceType,
  DoctorNote,
  BilanType,
  BilanPrescription
} from '../types';

let sessionToken: string | null = localStorage.getItem('ordocare_token') || sessionStorage.getItem('ordocare_token');

export function setApiToken(token: string | null, remember: boolean = false) {
  sessionToken = token;
  if (token) {
    if (remember) {
      localStorage.setItem('ordocare_token', token);
    } else {
      sessionStorage.setItem('ordocare_token', token);
      localStorage.removeItem('ordocare_token');
    }
  } else {
    localStorage.removeItem('ordocare_token');
    sessionStorage.removeItem('ordocare_token');
  }
}

export function getApiToken(): string | null {
  return sessionToken;
}

interface RequestOptions extends RequestInit {
  data?: any;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  const response = await fetch(endpoint, config);

  if (response.status === 401) {
    // Session expired or unauthenticated
    setApiToken(null);
    window.dispatchEvent(new CustomEvent('ordocare:session-expired'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Session expired or unauthenticated.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Request failed`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User; expiresAt: number }>('/api/auth/login', {
      method: 'POST',
      data: { username, password }
    }),

  adminCodeLogin: (accessCode: string) =>
    request<{ token: string; user: User; expiresAt: number; message: string }>('/api/auth/admin-code-login', {
      method: 'POST',
      data: { accessCode }
    }),

  adminResetPassword: (adminCode: string, targetUserId: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/admin-reset', {
      method: 'POST',
      data: { adminCode, targetUserId, newPassword }
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Patients
  getPatients: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return request<Patient[]>(`/api/patients?${query.toString()}`);
  },

  getPatient: (id: string) =>
    request<Patient>(`/api/patients/${id}`),

  getPatientById: (id: string) =>
    request<Patient>(`/api/patients/${id}`),

  createPatient: (data: Partial<Patient>) =>
    request<Patient>('/api/patients', { method: 'POST', data }),

  updatePatient: (id: string, data: Partial<Patient>) =>
    request<Patient>(`/api/patients/${id}`, { method: 'PUT', data }),

  archivePatient: (id: string) =>
    request<{ success: boolean }>(`/api/patients/${id}/archive`, { method: 'POST' }),

  restorePatient: (id: string) =>
    request<{ success: boolean }>(`/api/patients/${id}/restore`, { method: 'POST' }),

  getPatientNotes: (id: string) =>
    request<PatientNote[]>(`/api/patients/${id}/notes`),

  addPatientNote: (id: string, data: { content: string; type: PatientNote['type'] }) =>
    request<PatientNote>(`/api/patients/${id}/notes`, { method: 'POST', data }),

  addClinicalNote: (patientId: string, note: string, diagnosis?: string) =>
    request<PatientNote>(`/api/patients/${patientId}/notes`, {
      method: 'POST',
      data: { content: `${diagnosis ? `[${diagnosis}] ` : ''}${note}`, type: 'clinical' }
    }),

  getPatientTimeline: (id: string) =>
    request<any[]>(`/api/patients/${id}/timeline`),

  // Medications
  getMedications: (params?: { search?: string; category?: string; favorites?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.favorites) query.set('favorites', 'true');
    return request<Medication[]>(`/api/medications?${query.toString()}`);
  },

  getMedication: (id: string) =>
    request<Medication>(`/api/medications/${id}`),

  createMedication: (data: Partial<Medication>) =>
    request<Medication>('/api/medications', { method: 'POST', data }),

  updateMedication: (id: string, data: Partial<Medication>) =>
    request<Medication>(`/api/medications/${id}`, { method: 'PUT', data }),

  toggleMedicationFavorite: (id: string, isFavorite: boolean) =>
    request<Medication>(`/api/medications/${id}`, { method: 'PUT', data: { isFavorite } }),

  deleteMedication: (id: string) =>
    request<{ success: boolean }>(`/api/medications/${id}`, { method: 'DELETE' }),

  importMedications: (items: Partial<Medication>[]) =>
    request<{ success: boolean; importedCount: number }>('/api/medications/import', {
      method: 'POST',
      data: { items }
    }),

  // Prescriptions
  getPrescriptions: (params?: { patientId?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return request<Prescription[]>(`/api/prescriptions?${query.toString()}`);
  },

  getPrescription: (id: string) =>
    request<Prescription>(`/api/prescriptions/${id}`),

  getPrescriptionById: (id: string) =>
    request<Prescription>(`/api/prescriptions/${id}`),

  createPrescription: (data: any) =>
    request<Prescription>('/api/prescriptions', { method: 'POST', data }),

  duplicatePrescription: (id: string) =>
    request<Prescription>(`/api/prescriptions/${id}/duplicate`, { method: 'POST' }),

  updatePrescriptionStatus: (id: string, status: Prescription['status']) =>
    request<Prescription>(`/api/prescriptions/${id}/status`, { method: 'PATCH', data: { status } }),

  // Ordonnances Types (Prescription Templates)
  getOrdonnanceTypes: (params?: { category?: string; search?: string; favorites?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.favorites) query.set('favorites', 'true');
    return request<OrdonnanceType[]>(`/api/ordonnance-types?${query.toString()}`);
  },

  getOrdonnanceTypeById: (id: string) =>
    request<OrdonnanceType>(`/api/ordonnance-types/${id}`),

  createOrdonnanceType: (data: Partial<OrdonnanceType>) =>
    request<OrdonnanceType>('/api/ordonnance-types', { method: 'POST', data }),

  updateOrdonnanceType: (id: string, data: Partial<OrdonnanceType>) =>
    request<OrdonnanceType>(`/api/ordonnance-types/${id}`, { method: 'PUT', data }),

  deleteOrdonnanceType: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/ordonnance-types/${id}`, { method: 'DELETE' }),

  // Bilans Types (Lab & Medical Workup Panels)
  getBilanTypes: (params?: { category?: string; search?: string; favorites?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.favorites) query.set('favorites', 'true');
    return request<BilanType[]>(`/api/bilan-types?${query.toString()}`);
  },

  getBilanTypeById: (id: string) =>
    request<BilanType>(`/api/bilan-types/${id}`),

  createBilanType: (data: Partial<BilanType>) =>
    request<BilanType>('/api/bilan-types', { method: 'POST', data }),

  updateBilanType: (id: string, data: Partial<BilanType>) =>
    request<BilanType>(`/api/bilan-types/${id}`, { method: 'PUT', data }),

  deleteBilanType: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/bilan-types/${id}`, { method: 'DELETE' }),

  // Bilan Prescriptions (Ordonnances de bilans)
  getBilanPrescriptions: (params?: { patientId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.search) query.set('search', params.search);
    return request<BilanPrescription[]>(`/api/bilan-prescriptions?${query.toString()}`);
  },

  getBilanPrescriptionById: (id: string) =>
    request<BilanPrescription>(`/api/bilan-prescriptions/${id}`),

  createBilanPrescription: (data: Partial<BilanPrescription>) =>
    request<BilanPrescription>('/api/bilan-prescriptions', { method: 'POST', data }),

  deleteBilanPrescription: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/bilan-prescriptions/${id}`, { method: 'DELETE' }),

  // Treatments
  getTreatments: (params?: { patientId?: string; status?: string; adherence?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.status) query.set('status', params.status);
    if (params?.adherence) query.set('adherence', params.adherence);
    if (params?.search) query.set('search', params.search);
    return request<Treatment[]>(`/api/treatments?${query.toString()}`);
  },

  createTreatment: (data: Partial<Treatment>) =>
    request<Treatment>('/api/treatments', { method: 'POST', data }),

  updateTreatment: (id: string, data: Partial<Treatment>) =>
    request<Treatment>(`/api/treatments/${id}`, { method: 'PATCH', data }),

  recordDoseChange: (treatmentId: string, data: { previousDose: string; newDose: string; reason: string }) =>
    request<Treatment>(`/api/treatments/${treatmentId}/dose-change`, { method: 'POST', data }),

  adjustTreatment: (id: string, newDose: string, reason?: string, previousDose?: string) =>
    request<Treatment>(`/api/treatments/${id}/dose-change`, {
      method: 'POST',
      data: { previousDose: previousDose || 'Dose actuelle', newDose, reason: reason || 'Ajustement posologique' }
    }),

  extendTreatment: (id: string, additionalDays: number) =>
    request<Treatment>(`/api/treatments/${id}/extend`, { method: 'POST', data: { additionalDays } }),

  discontinueTreatment: (id: string, reason: string) =>
    request<Treatment>(`/api/treatments/${id}`, {
      method: 'PATCH',
      data: { status: 'discontinued', monitoringNotes: reason }
    }),

  logTreatmentSideEffect: (id: string, description: string, severity: string) =>
    request<Treatment>(`/api/treatments/${id}/side-effect`, {
      method: 'POST',
      data: { description, severity }
    }),

  // Follow-ups
  getFollowUps: (params?: { patientId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.status) query.set('status', params.status);
    return request<FollowUp[]>(`/api/follow-ups?${query.toString()}`);
  },

  createFollowUp: (data: Partial<FollowUp>) =>
    request<FollowUp>('/api/follow-ups', { method: 'POST', data }),

  scheduleFollowUp: (data: Partial<FollowUp>) =>
    request<FollowUp>('/api/follow-ups', { method: 'POST', data }),

  completeFollowUp: (id: string, notes: string) =>
    request<FollowUp>(`/api/follow-ups/${id}`, {
      method: 'PATCH',
      data: { status: 'completed', notes, completedAt: new Date().toISOString() }
    }),

  updateFollowUp: (id: string, data: Partial<FollowUp>) =>
    request<FollowUp>(`/api/follow-ups/${id}`, { method: 'PATCH', data }),

  // Reports
  getReportsSummary: () =>
    request<any>('/api/reports/summary'),

  // Clinical & Doctor Notes
  getDoctorNotes: () =>
    request<DoctorNote[]>('/api/notes'),

  getDoctorNoteById: (id: string) =>
    request<DoctorNote>(`/api/notes/${id}`),

  createDoctorNote: (data: Partial<DoctorNote>) =>
    request<DoctorNote>('/api/notes', { method: 'POST', data }),

  updateDoctorNote: (id: string, data: Partial<DoctorNote>) =>
    request<DoctorNote>(`/api/notes/${id}`, { method: 'PUT', data }),

  deleteDoctorNote: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/notes/${id}`, { method: 'DELETE' }),

  // Global Search
  globalSearch: (q: string) =>
    request<{ patients: Patient[]; prescriptions: Prescription[]; medications: Medication[]; treatments: Treatment[] }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),

  // Admin Management
  getUsers: () =>
    request<User[]>('/api/admin/users'),

  createUser: (data: any) =>
    request<User>('/api/admin/users', { method: 'POST', data }),

  updateUser: (id: string, data: any) =>
    request<User>(`/api/admin/users/${id}`, { method: 'PATCH', data }),

  resetUserPassword: (userId: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      data: { newPassword }
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      data: { currentPassword, newPassword }
    }),

  changeAdminCode: (currentCode: string, newCode: string) =>
    request<{ success: boolean; message: string }>('/api/admin/change-code', {
      method: 'POST',
      data: { currentCode, newCode }
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  getAuditLogs: (params?: { entityType?: string; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.action) query.set('action', params.action);
    return request<AuditLog[]>(`/api/admin/audit-logs?${query.toString()}`);
  },

  getClinicSettings: () =>
    request<ClinicSettings>('/api/settings/clinic'),

  updateClinicSettings: (data: Partial<ClinicSettings>) =>
    request<ClinicSettings>('/api/settings/clinic', { method: 'PUT', data }),

  getDoctorProfile: () =>
    request<DoctorProfile>('/api/settings/doctor'),

  updateDoctorProfile: (data: Partial<DoctorProfile>) =>
    request<DoctorProfile>('/api/settings/doctor', { method: 'PUT', data }),

  exportBackup: () =>
    request<any>('/api/admin/backup-export')
};
