export type Role = 'admin' | 'doctor' | 'assistant' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  specialty?: string;
  licenseNumber?: string;
  avatarUrl?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

export interface PatientInsurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  insurance: PatientInsurance;
  emergencyContact: EmergencyContact;
  allergies: string[];
  diagnosis: string;
  medicalNotes: string;
  bloodType?: string;
  status: 'active' | 'archived';
  createdDate: string;
  lastVisit: string;
  nextFollowUp?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string;
  authorName: string;
  authorRole: string;
  content: string;
  diagnosis?: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  authorName: string;
  authorRole: string;
  date: string;
  type: 'clinical' | 'consultation' | 'followup' | 'phone';
  content: string;
}

export interface Medication {
  id: string;
  genericName: string;
  brandName: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  route: string;
  category: string;
  defaultFrequency: string;
  standardDose: string;
  defaultDuration: string;
  instructions: string;
  notes: string;
  isFavorite: boolean;
  status: 'active' | 'inactive';
  registrationNumber?: string;
  code?: string;
  packaging?: string;
  origin?: string;
  contraindications?: string[];
  sideEffects?: string[];
  pregnancyCategory?: string;
}

export interface PrescriptionItem {
  id: string;
  medicationId?: string;
  medicationName: string;
  activeIngredient?: string;
  strength: string;
  dosageForm: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  timing?: string;
  instructions: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientAge: number;
  patientSex: string;
  patientWeight?: string;
  patientInsurance?: string;
  patientDiagnosis?: string;
  patientAddress?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorLicense: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled' | 'archived';
  items: PrescriptionItem[];
  additionalInstructions?: string;
  doctorSignatureText?: string;
  doctorSignatureDate?: string;
  qrVerificationData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoseChangeHistory {
  date: string;
  previousDose: string;
  newDose: string;
  reason: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  patientName: string;
  prescriptionId: string;
  prescriptionNumber: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: 'active' | 'needs_review' | 'ending_soon' | 'completed' | 'stopped' | 'paused' | 'discontinued';
  adherence: 'optimal' | 'moderate' | 'poor';
  adherencePercentage: number;
  lastCheck: string;
  nextReview?: string;
  notes: string;
  sideEffects?: any;
  doseHistory?: DoseChangeHistory[];
  dosageAdjustments?: any[];
  daysRemaining?: number;
  duration?: string;
  monitoringNotes?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  treatmentId?: string;
  date: string;
  time: string;
  type: 'in_person' | 'telehealth' | 'lab_review' | 'routine';
  reason: string;
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ARCHIVE' | 'RESTORE' | 'ADMIN_RESET' | 'ADMIN_CODE_LOGIN' | 'EXPORT';
  entityType: 'PATIENT' | 'PRESCRIPTION' | 'MEDICATION' | 'TREATMENT' | 'FOLLOWUP' | 'USER' | 'SETTINGS' | 'AUTH' | 'NOTE';
  entityId?: string;
  entityName?: string;
  details: string;
  ipAddress?: string;
}

export interface ClinicSettings {
  clinicName: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  headerNote: string;
  footerDisclaimer: string;
  watermarkEnabled: boolean;
  qrCodeEnabled: boolean;
}

export interface DoctorProfile {
  name: string;
  specialty: string;
  licenseNumber: string;
  title: string;
  signatureText: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  registrationCouncil?: string;
}

export interface DoctorNote {
  id: string;
  title: string;
  content: string;
  category: 'clinical' | 'prescription' | 'patient_followup' | 'urgent' | 'admin' | 'research';
  patientId?: string;
  patientName?: string;
  isPinned?: boolean;
  color?: 'teal' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'slate';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

export interface OrdonnanceTypeItem {
  id?: string;
  medicationName: string;
  strength: string;
  dosageForm: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  quantity?: string;
  instructions: string;
  notes?: string;
}

export interface OrdonnanceType {
  id: string;
  name: string;
  category: string;
  diagnosis: string;
  description?: string;
  items: OrdonnanceTypeItem[];
  additionalInstructions?: string;
  isFavorite?: boolean;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BilanCategory =
  | 'Hématologie'
  | 'Biochimie'
  | 'Ionogramme'
  | 'Bilan Lipidique'
  | 'Hémostase'
  | 'Endocrinologie / Hormones'
  | 'Infectieux / Sérologie'
  | 'Urines'
  | 'Imagerie / Radiologie'
  | 'Autre';

export interface BilanExamItem {
  id: string;
  name: string;
  category: BilanCategory;
  fastingRequired?: boolean;
  indication?: string;
  sampleType?: string;
}

export interface BilanType {
  id: string;
  name: string;
  category: string;
  description: string;
  items: string[];
  fastingRequired: boolean;
  urgent?: boolean;
  defaultClinicalIndication: string;
  isFavorite?: boolean;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BilanPrescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientDob?: string;
  patientSex?: 'Male' | 'Female' | 'Other';
  patientAge?: number;
  doctorName: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  date: string;
  items: string[];
  clinicalIndication: string;
  fastingRequired: boolean;
  urgent: boolean;
  additionalNotes?: string;
  doctorSignatureText?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

