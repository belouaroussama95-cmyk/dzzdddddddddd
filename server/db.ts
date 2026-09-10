import crypto from 'crypto';
import { officialAlgerianMedications } from './officialMedications';
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
} from '../src/types';

// Admin access code from server environment or default 321180
let ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '321180';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ordocare_clinical_secret_key_2026';

// Password hashing helper
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash: h, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const h = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return h === hash;
}

// Session store in memory
interface StoredSession {
  token: string;
  userId: string;
  expiresAt: number;
}
const activeSessions: Map<string, StoredSession> = new Map();

// In-memory Database Tables
interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

let users: StoredUser[] = [];
let patients: Patient[] = [];
let patientNotes: PatientNote[] = [];
let medications: Medication[] = [];
let prescriptions: Prescription[] = [];
let treatments: Treatment[] = [];
let followUps: FollowUp[] = [];
let auditLogs: AuditLog[] = [];
let ordonnanceTypes: OrdonnanceType[] = [];
let doctorNotes: DoctorNote[] = [];
let bilanTypes: BilanType[] = [];
let bilanPrescriptions: BilanPrescription[] = [];

let clinicSettings: ClinicSettings = {
  clinicName: "Cabinet Médical Dr. Oussama Belouar",
  address: "24 Dummy Street Area, Medical District",
  phone: "+12-345 678 9012",
  email: "oussama.belouar.mr@gmail.com",
  website: "https://ordocare.health",
  logoUrl: "",
  primaryColor: "#0284c7",
  accentColor: "#0080ff",
  headerNote: "QUALIFICATION • MÉDECINE GÉNÉRALE",
  footerDisclaimer: "This prescription is electronically signed and verifiable under Federal and State Telehealth & Pharmacy Regulation Acts. Not valid if altered.",
  watermarkEnabled: true,
  qrCodeEnabled: true
};

let doctorProfile: DoctorProfile = {
  name: "Dr. Oussama Belouar",
  specialty: "Médecine Générale & Thérapeutique",
  licenseNumber: "MED-DZ-948201",
  title: "Médecin Traitant / Praticien",
  signatureText: "Dr. Oussama Belouar",
  phone: "+12-345 678 9012",
  email: "oussama.belouar.mr@gmail.com",
  registrationCouncil: "Conseil National de l'Ordre des Médecins",
  avatarUrl: ""
};

// Seed demo data
export function initializeDatabase() {
  // Seed Users
  const adminHash = hashPassword('Admin2026!');
  const doctorHash = hashPassword('Doctor2026!');
  const assistantHash = hashPassword('Assistant2026!');

  users = [
    {
      id: 'USR-ADMIN-01',
      username: 'admin',
      email: 'admin@ordocare.health',
      name: 'System Administrator',
      role: 'admin',
      specialty: 'Clinical IT Administration',
      licenseNumber: 'IT-ADM-001',
      status: 'active',
      createdAt: '2026-01-01T08:00:00Z',
      lastLogin: '2026-09-06T07:30:00Z',
      passwordHash: adminHash.hash,
      salt: adminHash.salt
    },
    {
      id: 'USR-DOC-01',
      username: 'dr.oussama',
      email: 'oussama.belouar.mr@gmail.com',
      name: 'Dr. Oussama Belouar',
      role: 'doctor',
      specialty: 'Médecine Générale',
      licenseNumber: 'MED-DZ-948201',
      status: 'active',
      createdAt: '2026-01-15T09:00:00Z',
      lastLogin: '2026-09-06T07:45:00Z',
      passwordHash: doctorHash.hash,
      salt: doctorHash.salt
    },
    {
      id: 'USR-DOC-02',
      username: 'dr.elena',
      email: 'e.vance@ordocare.health',
      name: 'Dr. Elena Vance, MD',
      role: 'doctor',
      specialty: 'Internal Medicine',
      licenseNumber: 'MED-MA-8849201',
      status: 'active',
      createdAt: '2026-01-15T09:00:00Z',
      lastLogin: '2026-09-06T07:45:00Z',
      passwordHash: doctorHash.hash,
      salt: doctorHash.salt
    },
    {
      id: 'USR-ASST-01',
      username: 'sarah.nurse',
      email: 's.jenkins@ordocare.health',
      name: 'Sarah Jenkins, RN',
      role: 'assistant',
      specialty: 'Clinical Care Coordinator',
      status: 'active',
      createdAt: '2026-02-01T08:30:00Z',
      lastLogin: '2026-09-05T16:20:00Z',
      passwordHash: assistantHash.hash,
      salt: assistantHash.salt
    }
  ];

  // Seed Medications (12 diverse, realistic clinical medications with formulations)
  medications = [
    {
      id: 'MED-001',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      activeIngredient: 'Amoxicillin Trihydrate',
      strength: '500 mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      category: 'Antibiotics',
      defaultFrequency: 'Three times daily',
      standardDose: '500 mg',
      defaultDuration: '7 days',
      instructions: 'Take with or without food. Complete the full course of antibiotics.',
      notes: 'Check for penicillin allergies before prescribing.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-002',
      genericName: 'Amoxicillin / Clavulanate',
      brandName: 'Augmentin',
      activeIngredient: 'Amoxicillin + Potassium Clavulanate',
      strength: '875 mg / 125 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Antibiotics',
      defaultFrequency: 'Twice daily',
      standardDose: '1 tablet',
      defaultDuration: '10 days',
      instructions: 'Take at the start of a meal to enhance absorption and reduce GI discomfort.',
      notes: 'Broad-spectrum beta-lactamase inhibitor.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-003',
      genericName: 'Lisinopril',
      brandName: 'Prinivil / Zestril',
      activeIngredient: 'Lisinopril Dihydrate',
      strength: '10 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Cardiovascular',
      defaultFrequency: 'Once daily',
      standardDose: '10 mg',
      defaultDuration: '30 days',
      instructions: 'Take once daily in the morning with water. Monitor blood pressure weekly.',
      notes: 'ACE inhibitor for hypertension and heart failure. Monitor renal function and potassium.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-004',
      genericName: 'Atorvastatin',
      brandName: 'Lipitor',
      activeIngredient: 'Atorvastatin Calcium',
      strength: '20 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Cardiovascular',
      defaultFrequency: 'At bedtime',
      standardDose: '20 mg',
      defaultDuration: '90 days',
      instructions: 'Take once daily in the evening or bedtime. Avoid excessive grapefruit consumption.',
      notes: 'HMG-CoA reductase inhibitor for dyslipidemia and cardiovascular prevention.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-005',
      genericName: 'Metformin Hydrochloride',
      brandName: 'Glucophage XR',
      activeIngredient: 'Metformin HCl',
      strength: '500 mg',
      dosageForm: 'Extended Release Tablet',
      route: 'Oral',
      category: 'Antidiabetics',
      defaultFrequency: 'Twice daily',
      standardDose: '500 mg',
      defaultDuration: '60 days',
      instructions: 'Take with dinner and breakfast to minimize gastrointestinal upset.',
      notes: 'First-line biguanide for Type 2 Diabetes Mellitus. Monitor eGFR and B12 levels.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-006',
      genericName: 'Albuterol Sulfate',
      brandName: 'ProAir HFA / Ventolin',
      activeIngredient: 'Albuterol',
      strength: '90 mcg / actuation',
      dosageForm: 'Inhaler',
      route: 'Inhaled',
      category: 'Respiratory',
      defaultFrequency: 'As needed',
      standardDose: '1-2 puffs',
      defaultDuration: '30 days',
      instructions: 'Inhale 1 to 2 puffs every 4-6 hours as needed for wheezing or shortness of breath.',
      notes: 'Short-acting beta-2 agonist (SABA) rescue inhaler. Rinse mouth after use.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-007',
      genericName: 'Omeprazole',
      brandName: 'Prilosec',
      activeIngredient: 'Omeprazole Magnesium',
      strength: '20 mg',
      dosageForm: 'Delayed Release Capsule',
      route: 'Oral',
      category: 'Gastrointestinal',
      defaultFrequency: 'Once daily',
      standardDose: '20 mg',
      defaultDuration: '30 days',
      instructions: 'Take 30 to 60 minutes before breakfast with a full glass of water.',
      notes: 'Proton pump inhibitor (PPI) for GERD and peptic ulcer prophylaxis.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-008',
      genericName: 'Sertraline Hydrochloride',
      brandName: 'Zoloft',
      activeIngredient: 'Sertraline HCl',
      strength: '50 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Psychiatric',
      defaultFrequency: 'Once daily',
      standardDose: '50 mg',
      defaultDuration: '30 days',
      instructions: 'Take once daily in the morning with food. Do not abruptly discontinue.',
      notes: 'SSRI for Major Depressive Disorder and Generalized Anxiety.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-009',
      genericName: 'Fluticasone Propionate',
      brandName: 'Flonase',
      activeIngredient: 'Fluticasone Propionate',
      strength: '50 mcg / spray',
      dosageForm: 'Nasal Spray',
      route: 'Nasal',
      category: 'Respiratory',
      defaultFrequency: 'Once daily',
      standardDose: '1-2 sprays per nostril',
      defaultDuration: '30 days',
      instructions: 'Shake gently before use. Administer 1 spray in each nostril daily.',
      notes: 'Nasal corticosteroid for allergic rhinitis.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-010',
      genericName: 'Ibuprofen',
      brandName: 'Motrin / Advil',
      activeIngredient: 'Ibuprofen',
      strength: '400 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Analgesics',
      defaultFrequency: 'Every 8 hours',
      standardDose: '400 mg',
      defaultDuration: '5 days',
      instructions: 'Take with food or milk to prevent stomach irritation. Max 1200 mg/day OTC.',
      notes: 'NSAID. Caution in renal impairment, peptic ulcer, or cardiovascular disease.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-011',
      genericName: 'Ciprofloxacin',
      brandName: 'Cipro',
      activeIngredient: 'Ciprofloxacin Hydrochloride',
      strength: '500 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Antibiotics',
      defaultFrequency: 'Every 12 hours',
      standardDose: '500 mg',
      defaultDuration: '7 days',
      instructions: 'Avoid taking with dairy products or antacids containing magnesium/aluminum.',
      notes: 'Fluoroquinolone. Monitor for tendonitis symptoms.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-012',
      genericName: 'Levothyroxine Sodium',
      brandName: 'Synthroid',
      activeIngredient: 'Levothyroxine Sodium',
      strength: '75 mcg',
      dosageForm: 'Tablet',
      route: 'Oral',
      category: 'Endocrine',
      defaultFrequency: 'Once daily',
      standardDose: '75 mcg',
      defaultDuration: '90 days',
      instructions: 'Take in the morning on an empty stomach at least 30-60 minutes before breakfast.',
      notes: 'Synthetic thyroid hormone. Monitor TSH/Free T4 at 6-8 week intervals.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-013',
      genericName: 'Bisoprolol Fumarate',
      brandName: 'Cardensiel / Détensiel',
      activeIngredient: 'Bisoprolol Hemifumarate',
      strength: '5 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Cardiovascular',
      defaultFrequency: 'Once daily (morning)',
      standardDose: '5 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre le matin avec ou sans nourriture. Ne jamais arrêter brutalement.',
      notes: 'Bêta-bloquant cardiosélectif. Surveiller FC (< 50 bpm = alerte) et PA.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-014',
      genericName: 'Ramipril',
      brandName: 'Triatec',
      activeIngredient: 'Ramipril',
      strength: '5 mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      category: 'Cardiovascular',
      defaultFrequency: 'Once daily',
      standardDose: '5 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre à heure fixe de préférence le matin. Signaler toute toux sèche persistante.',
      notes: 'Inhibiteur de l’enzyme de conversion (IEC). Contrôle iono et créatinine à J7-J14.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-015',
      genericName: 'Apixaban',
      brandName: 'Eliquis',
      activeIngredient: 'Apixaban',
      strength: '5 mg',
      dosageForm: 'Film-coated Tablet',
      route: 'Oral',
      category: 'Hematology / Anticoagulants',
      defaultFrequency: 'Twice daily (morning and evening)',
      standardDose: '5 mg',
      defaultDuration: '30 days',
      instructions: 'Prendre un comprimé matin et soir à 12h d’intervalle avec un verre d’eau.',
      notes: 'AOD direct inhibiteur FXa. Pas de monitoring INR requis. Réduire à 2.5 mg si ≥2 critères (âge ≥80, poids ≤60kg, créat ≥133).',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-016',
      genericName: 'Rivaroxaban',
      brandName: 'Xarelto',
      activeIngredient: 'Rivaroxaban',
      strength: '20 mg',
      dosageForm: 'Film-coated Tablet',
      route: 'Oral',
      category: 'Hematology / Anticoagulants',
      defaultFrequency: 'Once daily with evening meal',
      standardDose: '20 mg',
      defaultDuration: '30 days',
      instructions: 'Prendre impérativement au cours d’un repas (optimisation de la biodisponibilité).',
      notes: 'AOD direct FXa. Prévention AVC en cas de fibrillation atriale non valvulaire.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-017',
      genericName: 'Paracétamol',
      brandName: 'Doliprane / Efferalgan',
      activeIngredient: 'Paracétamol (Acétaminophène)',
      strength: '1000 mg',
      dosageForm: 'Tablet / Effervescent',
      route: 'Oral',
      category: 'Analgesics / Antipyretics',
      defaultFrequency: 'Every 6-8 hours as needed',
      standardDose: '1000 mg',
      defaultDuration: '5 days',
      instructions: 'Espacer les prises de 4 à 6 heures minimum. Ne jamais dépasser 3 g à 4 g par 24 heures.',
      notes: 'Antalgique de palier 1. Risque d’hépatotoxicité aiguë sévère en cas de surdosage (> 10g).',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-018',
      genericName: 'Amlodipine Bésylate',
      brandName: 'Amlor',
      activeIngredient: 'Amlodipine',
      strength: '5 mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      category: 'Cardiovascular',
      defaultFrequency: 'Once daily',
      standardDose: '5 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre le matin. Prévenir le médecin en cas de gonflements des chevilles (œdèmes des membres inférieurs).',
      notes: 'Inhibiteur calcique dihydropyridinique. Efficace en monoprise sur l’HTA essentielle.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-019',
      genericName: 'Furosémide',
      brandName: 'Lasilix',
      activeIngredient: 'Furosémide',
      strength: '40 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Nephrology / Diuretics',
      defaultFrequency: 'Once daily (morning)',
      standardDose: '40 mg',
      defaultDuration: '30 days',
      instructions: 'Prendre le matin au réveil pour éviter les réveils nocturnes mictionnels.',
      notes: 'Diurétique de l’anse puissant. Surveiller la kaliémie (risque d’hypokaliémie) et la créatinine.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-020',
      genericName: 'Ésoméprazole Magnésium',
      brandName: 'Inexium',
      activeIngredient: 'Ésoméprazole',
      strength: '20 mg',
      dosageForm: 'Gastro-resistant Tablet',
      route: 'Oral',
      category: 'Gastroenterology',
      defaultFrequency: 'Once daily (morning before meal)',
      standardDose: '20 mg',
      defaultDuration: '28 days',
      instructions: 'Prendre 30 minutes avant le petit-déjeuner. Avaler entier sans mâcher ni écraser.',
      notes: 'IPP énantiomère S de l’oméprazole. Traitement RGO, ulcères et co-prescription gastro-protectrice sous AINS.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-021',
      genericName: 'Prednisolone',
      brandName: 'Solupred',
      activeIngredient: 'Prednisolone Métasulfobenzoate',
      strength: '20 mg',
      dosageForm: 'Orodispersible Tablet',
      route: 'Oral',
      category: 'Anti-inflammatory / Corticosteroid',
      defaultFrequency: 'Once daily with breakfast',
      standardDose: '20-40 mg',
      defaultDuration: '5 days',
      instructions: 'Dissoudre dans un verre d’eau au cours du petit-déjeuner pour respecter le rythme circadien.',
      notes: 'Corticothérapie courte. Surveillance glycémique et tensionnelle. Régime hyposodé si cure prolongée.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-022',
      genericName: 'Azithromycine Dihydrate',
      brandName: 'Zithromax Monodose',
      activeIngredient: 'Azithromycine',
      strength: '250 mg',
      dosageForm: 'Film-coated Tablet',
      route: 'Oral',
      category: 'Antibiotics',
      defaultFrequency: 'Once daily for 3 days',
      standardDose: '500 mg (2 comprimés)',
      defaultDuration: '3 days',
      instructions: 'Prendre les 2 comprimés ensemble en une prise unique par jour pendant 3 jours consécutifs.',
      notes: 'Macrolide à longue demi-vie tissulaire. Attention allongement de l’intervalle QT.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-023',
      genericName: 'Salbutamol Aérosol',
      brandName: 'Ventoline 100 µg',
      activeIngredient: 'Salbutamol Sulfate',
      strength: '100 mcg / dose',
      dosageForm: 'Pressurized Inhalation Suspension',
      route: 'Inhalation',
      category: 'Respiratory',
      defaultFrequency: 'As needed for acute dyspnea',
      standardDose: '1 to 2 puffs',
      defaultDuration: '30 days',
      instructions: 'Bien agiter le flacon, expirer à fond, déclencher la bouffée au début d’une inspiration lente et profonde.',
      notes: 'Bronchodilatateur bêta-2 agoniste d’action rapide de secours. Si > 2 flacons/an, réévaluer le traitement de fond.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-024',
      genericName: 'Clopidogrel',
      brandName: 'Plavix',
      activeIngredient: 'Clopidogrel Hydrogénosulfate',
      strength: '75 mg',
      dosageForm: 'Film-coated Tablet',
      route: 'Oral',
      category: 'Cardiovascular / Antiplatelet',
      defaultFrequency: 'Once daily',
      standardDose: '75 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre avec un verre d’eau à n’importe quel moment de la journée.',
      notes: 'Antiagrégant plaquettaire inhibiteur du récepteur P2Y12. Prévention secondaire après SCA ou AVC.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-025',
      genericName: 'Allopurinol',
      brandName: 'Zyloric',
      activeIngredient: 'Allopurinol',
      strength: '200 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Rheumatology / Antigout',
      defaultFrequency: 'Once daily after meals',
      standardDose: '200 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre après un repas et boire abondamment (au moins 1.5 L d’eau par jour).',
      notes: 'Inhibiteur de la xanthine oxydase. Ne pas introduire pendant la crise aiguë de goutte. Alerte éruption cutanée (DRESS).',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-026',
      genericName: 'Dapagliflozine',
      brandName: 'Forxiga',
      activeIngredient: 'Dapagliflozine Propanediol',
      strength: '10 mg',
      dosageForm: 'Film-coated Tablet',
      route: 'Oral',
      category: 'Endocrinology / SGLT2 Inhibitor',
      defaultFrequency: 'Once daily',
      standardDose: '10 mg',
      defaultDuration: '90 days',
      instructions: 'Prendre le matin avec un grand verre d’eau. Bonne hydratation quotidienne indispensable.',
      notes: 'Inhibiteur SGLT2 gliflozine. Bénéfice cardiorénal majeur (diabète T2, insuffisance cardiaque et maladie rénale chronique).',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-027',
      genericName: 'Spironolactone',
      brandName: 'Aldactone',
      activeIngredient: 'Spironolactone',
      strength: '25 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Cardiovascular / Diuretics',
      defaultFrequency: 'Once daily (morning)',
      standardDose: '25 mg',
      defaultDuration: '60 days',
      instructions: 'Prendre le matin avec le petit-déjeuner.',
      notes: 'Antagoniste de l’aldostérone épargneur de potassium. Surveillance étroite de la kaliémie.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-028',
      genericName: 'Tramadol Chlorhydrate',
      brandName: 'Topalgic',
      activeIngredient: 'Tramadol HCl',
      strength: '50 mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      category: 'Analgesics / Opioid',
      defaultFrequency: 'Every 6-8 hours as needed (max 400 mg/d)',
      standardDose: '50 mg',
      defaultDuration: '7 days',
      instructions: 'À prendre uniquement en cas de douleur modérée à intense ne cédant pas au paracétamol.',
      notes: 'Antalgique opioïde de palier 2. Risque de vertiges, nausées et dépendance. Attention syndrome sérotoninergique.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-029',
      genericName: 'Diazépam',
      brandName: 'Valium',
      activeIngredient: 'Diazépam',
      strength: '5 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Neurology / Anxiolytic',
      defaultFrequency: '1 to 2 times daily (short duration)',
      standardDose: '5 mg',
      defaultDuration: '14 days',
      instructions: 'Prendre le soir ou en cas de crise anxieuse aiguë. Éviter la conduite de véhicules.',
      notes: 'Benzodiazépine anxiolytique, sédative et myorelaxante. Prescription limitée à 12 semaines maximum.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-030',
      genericName: 'Ceftriaxone Sodique',
      brandName: 'Rocéphine',
      activeIngredient: 'Ceftriaxone',
      strength: '1 g',
      dosageForm: 'Powder and solvent for IM/IV injection',
      route: 'IM / IV',
      category: 'Antibiotics',
      defaultFrequency: 'Once daily',
      standardDose: '1 g',
      defaultDuration: '5 days',
      instructions: 'Reconstituer la poudre avec le solvant lidocaïne pour la voie IM stricte, ou NaCl pour la voie IV.',
      notes: 'Céphalosporine de 3e génération (C3G) injectable à spectre large. Traitement d’urgence des pyélonéphrites et pneumonies.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-031',
      genericName: 'Adrénaline (Épinéphrine)',
      brandName: 'Adrénaline Aguettant 1 mg/mL',
      activeIngredient: 'Épinéphrine Tartrate',
      strength: '1 mg / 1 mL',
      dosageForm: 'Injectable Solution (Ampoule)',
      route: 'IM / IV (Urgence)',
      category: 'Emergency / Resuscitation',
      defaultFrequency: 'Immediate single dose (repeat every 5-15 min if needed)',
      standardDose: '0.5 mg (0.5 mL)',
      defaultDuration: '1 day',
      instructions: 'Injection IM stricte dans la face antéro-latérale de la cuisse en cas de choc anaphylactique.',
      notes: 'Médicament d’urgence vitale absolue. Pas de contre-indication absolue en situation d’arrêt ou de choc vital.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-032',
      genericName: 'Méthylprednisolone Hémisuccinate',
      brandName: 'Solumédrol 80 mg',
      activeIngredient: 'Méthylprednisolone',
      strength: '80 mg',
      dosageForm: 'Powder and solvent for injection',
      route: 'IV / IM',
      category: 'Anti-inflammatory / Emergency',
      defaultFrequency: 'Once daily or in acute emergency bolus',
      standardDose: '80 mg',
      defaultDuration: '3 days',
      instructions: 'Injecter par voie IV lente ou IM après reconstitution.',
      notes: 'Traitement anti-inflammatoire d’urgence des crises d’asthme sévères et prévention de la rechute anaphylactique.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-033',
      genericName: 'Trinitrine Sublinguale',
      brandName: 'Natispray 0.40 mg/dose',
      activeIngredient: 'Trinitrine (Nitroglycérine)',
      strength: '0.40 mg / dose',
      dosageForm: 'Sublingual Spray',
      route: 'Sublingual',
      category: 'Cardiovascular / Emergency',
      defaultFrequency: '1 to 2 puffs at onset of chest pain',
      standardDose: '1 puff (0.40 mg)',
      defaultDuration: 'As needed',
      instructions: 'Pulvériser sous la langue sans inhaler. Position assise recommandée (risque de chute tensionnelle).',
      notes: 'Vasodilatateur coronarien. CONTRE-INDIQUÉ formellement en cas de prise de Viagra/Cialis < 48h ou PAS < 90 mmHg.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-034',
      genericName: 'Sulfate d’Atropine',
      brandName: 'Atropine Aguettant 0.5 mg/mL',
      activeIngredient: 'Atropine Sulfate',
      strength: '0.5 mg / mL',
      dosageForm: 'Injectable Solution',
      route: 'IV',
      category: 'Emergency / Resuscitation',
      defaultFrequency: 'Every 3-5 minutes as needed (max 3 mg)',
      standardDose: '0.5 mg to 1 mg',
      defaultDuration: '1 day',
      instructions: 'Bolus IV direct rapide en cas de bradycardie symptomatique sévère ou arrêt sino-atrial.',
      notes: 'Parasympatholytique anticholinergique d’urgence.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-035',
      genericName: 'Sérum Glucosé 30%',
      brandName: 'Glucose 30% Lavoisier',
      activeIngredient: 'Glucose Hypertonique',
      strength: '30% (3 g / 10 mL)',
      dosageForm: 'Ampoules 10 mL & 20 mL',
      route: 'IVD stricte',
      category: 'Emergency / Metabolism',
      defaultFrequency: 'Immediate bolus (20 to 40 mL)',
      standardDose: '20 mL to 40 mL',
      defaultDuration: '1 day',
      instructions: 'Injection intraveineuse directe lente sur une grosse veine. Rincer abondamment après injection.',
      notes: 'Traitement d’urgence du coma hypoglycémique grave.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-036',
      genericName: 'Glucagon Recombinant',
      brandName: 'GlucaGen HypoKit 1 mg',
      activeIngredient: 'Glucagon',
      strength: '1 mg',
      dosageForm: 'Powder and pre-filled syringe',
      route: 'IM / SC',
      category: 'Emergency / Metabolism',
      defaultFrequency: 'Single dose',
      standardDose: '1 mg',
      defaultDuration: '1 day',
      instructions: 'Injecter en IM dans la cuisse ou le deltoïde si aucun abord veineux n’est disponible.',
      notes: 'Mobilise les réserves de glycogène hépatique. Administrer des glucides oraux dès le réveil.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-037',
      genericName: 'Naloxone Chlorhydrate',
      brandName: 'Narcan 0.4 mg/mL',
      activeIngredient: 'Naloxone HCl',
      strength: '0.4 mg / mL',
      dosageForm: 'Injectable Solution',
      route: 'IV / IM / Intranasal',
      category: 'Emergency / Toxicology',
      defaultFrequency: 'Titrated boluses every 2-3 minutes',
      standardDose: '0.1 to 0.4 mg',
      defaultDuration: '1 day',
      instructions: 'Titrer par fractions de 0.1 mg IV jusqu’à réapparition d’une fréquence respiratoire ≥ 12/min.',
      notes: 'Antidote spécifique pur des morphiniques. Risque de réendormissement car demi-vie courte (surveiller ≥ 4h).',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-038',
      genericName: 'Gluconate de Calcium 10%',
      brandName: 'Calcium Gluconate Aguettant 10%',
      activeIngredient: 'Gluconate de Calcium',
      strength: '1 g / 10 mL',
      dosageForm: 'Ampoule 10 mL',
      route: 'IV lente',
      category: 'Emergency / Resuscitation',
      defaultFrequency: '10 mL over 3 to 5 minutes',
      standardDose: '1 g (10 mL)',
      defaultDuration: '1 day',
      instructions: 'Injection intraveineuse lente sous surveillance ECG en cas d’hyperkaliémie avec anomalies électriques.',
      notes: 'Cardioprotecteur membranaire immédiat. N’abaisse pas le chiffre de kaliémie.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-039',
      genericName: 'Escitalopram',
      brandName: 'Seroplex',
      activeIngredient: 'Escitalopram Oxalate',
      strength: '10 mg',
      dosageForm: 'Scored Film-coated Tablet',
      route: 'Oral',
      category: 'Psychiatry / Antidepressant',
      defaultFrequency: 'Once daily (morning)',
      standardDose: '10 mg',
      defaultDuration: '6 months',
      instructions: 'Prendre le matin en une prise unique avec ou sans nourriture.',
      notes: 'ISRS de référence dans la dépression et l’anxiété généralisée. Délai d’efficacité 2 à 4 semaines. Surveillance QT.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-040',
      genericName: 'Sertraline Chlorhydrate',
      brandName: 'Zoloft',
      activeIngredient: 'Sertraline HCl',
      strength: '50 mg',
      dosageForm: 'Scored Tablet',
      route: 'Oral',
      category: 'Psychiatry / Antidepressant',
      defaultFrequency: 'Once daily (morning or evening)',
      standardDose: '50 mg',
      defaultDuration: '6 months',
      instructions: 'Prendre au cours d’un repas.',
      notes: 'ISRS de premier choix, excellent profil de sécurité cardiovasculaire chez le coronarien.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-041',
      genericName: 'Gentamicine Sulfate',
      brandName: 'Gentalline 80 mg',
      activeIngredient: 'Gentamicine',
      strength: '80 mg / 2 mL',
      dosageForm: 'Injectable Solution',
      route: 'IM / IV (perfusion 30 min)',
      category: 'Antibiotics / Aminoglycoside',
      defaultFrequency: 'Once daily (single daily dose 5-7 mg/kg)',
      standardDose: '3 mg/kg to 6 mg/kg',
      defaultDuration: '3 to 5 days',
      instructions: 'Administrer en perfusion de 30 minutes dans 100 mL de sérum physiologique.',
      notes: 'Aminoside bactéricide puissant. Dosage de la concentration résiduelle obligatoire. Néphrotoxique et ototoxique.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-042',
      genericName: 'Lévofloxacine',
      brandName: 'Tavanic 500 mg',
      activeIngredient: 'Lévofloxacine Hémihydrate',
      strength: '500 mg',
      dosageForm: 'Scored Film-coated Tablet',
      route: 'Oral',
      category: 'Antibiotics / Fluoroquinolone',
      defaultFrequency: 'Once or twice daily',
      standardDose: '500 mg',
      defaultDuration: '7 to 10 days',
      instructions: 'Prendre avec un grand verre d’eau au moins 2 heures avant ou après les sels de fer/magnésium.',
      notes: 'Fluoroquinolone à tropisme respiratoire et urinaire. Alerte tendinopathie achilléenne et allongement QT.',
      isFavorite: false,
      status: 'active'
    },
    {
      id: 'MED-043',
      genericName: 'Morphine Chlorhydrate',
      brandName: 'Morphine Renaudin 10 mg/mL',
      activeIngredient: 'Chlorhydrate de Morphine',
      strength: '10 mg / 1 mL',
      dosageForm: 'Injectable Solution',
      route: 'SC / IV titrée',
      category: 'Analgesics / Opioid (Level 3)',
      defaultFrequency: 'Titrated IV bolus (1-2 mg every 5-10 min) or SC every 4h',
      standardDose: '2 to 3 mg IV titrée',
      defaultDuration: 'As needed',
      instructions: 'Diluer 10 mg dans 10 mL de sérum physiologique (1 mg/mL) et titrer selon l’échelle visuelle analogique (EVA).',
      notes: 'Stupéfiant. Avoir la Naloxone prête en réserve. Surveillance fréquence respiratoire et conscience.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-044',
      genericName: 'Enoxaparine Sodique',
      brandName: 'Lovenox 4 000 UI / 0.4 mL',
      activeIngredient: 'Enoxaparine',
      strength: '4 000 UI anti-Xa (40 mg)',
      dosageForm: 'Pre-filled Syringe',
      route: 'Subcutaneous',
      category: 'Hematology / Anticoagulants',
      defaultFrequency: 'Once daily for thromboprophylaxis',
      standardDose: '4 000 UI (0.4 mL)',
      defaultDuration: '10 to 14 days',
      instructions: 'Injection sous-cutanée stricte dans le tissu abdominal sans purger la bulle d’air avant injection.',
      notes: 'HBPM. Prévention de la maladie thromboembolique veineuse. Surveillance plaquettaire (TIH) si contexte à risque.',
      isFavorite: true,
      status: 'active'
    },
    {
      id: 'MED-045',
      genericName: 'Pantoprazole Sodique',
      brandName: 'Eupantol 40 mg',
      activeIngredient: 'Pantoprazole',
      strength: '40 mg',
      dosageForm: 'Gastro-resistant Tablet',
      route: 'Oral',
      category: 'Gastroenterology / IPP',
      defaultFrequency: 'Once daily (morning before meal)',
      standardDose: '40 mg',
      defaultDuration: '28 days',
      instructions: 'Prendre 30 minutes avant le petit-déjeuner. Avaler entier sans croquer.',
      notes: 'IPP de choix en association avec le Clopidogrel (faible inhibition du CYP2C19 par rapport à l’oméprazole).',
      isFavorite: true,
      status: 'active'
    },
    ...officialAlgerianMedications
  ];

  // Seed 3 Fictional Patients (Clearly marked as DEMO DATA)
  patients = [
    {
      id: 'PT-10021',
      firstName: 'Eleanor',
      lastName: 'Rigby',
      dob: '1968-04-14',
      sex: 'Female',
      phone: '+1 (617) 555-8391',
      email: 'eleanor.rigby.demo@example.com',
      address: '142 Beacon St, Apt 4B, Boston, MA 02116',
      insurance: {
        provider: 'Blue Cross Blue Shield MA',
        policyNumber: 'BCB-88390214',
        groupNumber: 'GRP-9902'
      },
      emergencyContact: {
        name: 'Thomas Rigby',
        relation: 'Spouse',
        phone: '+1 (617) 555-8399'
      },
      allergies: ['Penicillins (Hives)', 'Sulfa Drugs (Mild rash)'],
      diagnosis: 'Essential Hypertension & Dyslipidemia (DEMO DATA)',
      medicalNotes: 'Patient has well-controlled blood pressure on Lisinopril. Regular morning runner, maintains low sodium diet. Follow-up lipid panel scheduled.',
      status: 'active',
      createdDate: '2026-03-12',
      lastVisit: '2026-08-28',
      nextFollowUp: '2026-09-28'
    },
    {
      id: 'PT-10022',
      firstName: 'Marcus',
      lastName: 'Chen',
      dob: '1982-11-03',
      sex: 'Male',
      phone: '+1 (617) 555-4429',
      email: 'marcus.chen.demo@example.com',
      address: '88 Commonwealth Ave, Brookline, MA 02446',
      insurance: {
        provider: 'Harvard Pilgrim Health',
        policyNumber: 'HPH-71193041',
        groupNumber: 'GRP-4410'
      },
      emergencyContact: {
        name: 'Grace Chen',
        relation: 'Sister',
        phone: '+1 (617) 555-4430'
      },
      allergies: ['None Known Drug Allergies (NKDA)'],
      diagnosis: 'Type 2 Diabetes Mellitus & Mild Asthma (DEMO DATA)',
      medicalNotes: 'Recent HbA1c 6.8%. Adherent with Metformin 500mg BID. Uses Albuterol sparingly before intense cardiovascular exercise.',
      status: 'active',
      createdDate: '2026-04-05',
      lastVisit: '2026-09-01',
      nextFollowUp: '2026-10-15'
    },
    {
      id: 'PT-10023',
      firstName: 'Sophia',
      lastName: 'Alvarez',
      dob: '1995-07-22',
      sex: 'Female',
      phone: '+1 (617) 555-9012',
      email: 'sophia.alvarez.demo@example.com',
      address: '210 Tremont St, Boston, MA 02111',
      insurance: {
        provider: 'Aetna Health HMO',
        policyNumber: 'AET-33091822',
        groupNumber: 'GRP-1200'
      },
      emergencyContact: {
        name: 'Mateo Alvarez',
        relation: 'Father',
        phone: '+1 (617) 555-9015'
      },
      allergies: ['Latex (Contact dermatitis)', 'Aspirin (Bronchospasm)'],
      diagnosis: 'Allergic Rhinitis & Recurrent Pharyngitis (DEMO DATA)',
      medicalNotes: 'Seasonal flare-ups in spring and autumn. Completed antibiotic course for pharyngitis. Currently on maintenance nasal fluticasone.',
      status: 'active',
      createdDate: '2026-05-18',
      lastVisit: '2026-09-04',
      nextFollowUp: '2026-09-18'
    }
  ];

  // Seed Patient Notes
  patientNotes = [
    {
      id: 'NOT-001',
      patientId: 'PT-10021',
      authorName: 'Dr. Elena Vance, MD',
      authorRole: 'Doctor',
      date: '2026-08-28T10:15:00Z',
      type: 'clinical',
      content: 'Routine quarterly checkup. Resting BP 124/80 mmHg. Pulse 68 bpm. Heart sounds regular S1/S2 without murmurs. Renewed Lisinopril and Atorvastatin. Advised maintaining current daily 30-min brisk walking regimen.'
    },
    {
      id: 'NOT-002',
      patientId: 'PT-10022',
      authorName: 'Dr. Elena Vance, MD',
      authorRole: 'Doctor',
      date: '2026-09-01T14:30:00Z',
      type: 'consultation',
      content: 'Patient reported occasional night-time wheezing after gym sessions. Inhaler technique reviewed and confirmed optimal. Metformin tolerated well with zero gastrointestinal adverse symptoms.'
    },
    {
      id: 'NOT-003',
      patientId: 'PT-10023',
      authorName: 'Sarah Jenkins, RN',
      authorRole: 'Assistant',
      date: '2026-09-04T11:00:00Z',
      type: 'phone',
      content: 'Patient called to report complete resolution of sore throat symptoms following 5th day of therapy. Confirmed instructions to finish full course.'
    }
  ];

  // Seed Prescriptions
  prescriptions = [
    {
      id: 'RX-2026-0891',
      prescriptionNumber: 'RX-2026-0891',
      patientId: 'PT-10021',
      patientName: 'Eleanor Rigby',
      patientDob: '1968-04-14',
      patientAge: 58,
      patientSex: 'Female',
      patientInsurance: 'Blue Cross Blue Shield MA (BCB-88390214)',
      patientDiagnosis: 'Essential Hypertension & Dyslipidemia',
      doctorName: 'Dr. Elena Vance, MD',
      doctorSpecialty: 'Internal Medicine',
      doctorLicense: 'MED-MA-8849201',
      clinicName: clinicSettings.clinicName,
      clinicAddress: clinicSettings.address,
      clinicPhone: clinicSettings.phone,
      clinicEmail: clinicSettings.email,
      date: '2026-08-28',
      status: 'active',
      items: [
        {
          id: 'RXI-001',
          medicationId: 'MED-003',
          medicationName: 'Lisinopril',
          activeIngredient: 'Lisinopril Dihydrate',
          strength: '10 mg',
          dosageForm: 'Tablet',
          dose: '10 mg (1 tablet)',
          route: 'Oral',
          frequency: 'Once daily',
          duration: '30 days',
          quantity: '30 tablets',
          timing: 'Morning',
          instructions: '',
          notes: 'No refills without clinical review.'
        },
        {
          id: 'RXI-002',
          medicationId: 'MED-004',
          medicationName: 'Atorvastatin',
          activeIngredient: 'Atorvastatin Calcium',
          strength: '20 mg',
          dosageForm: 'Tablet',
          dose: '20 mg (1 tablet)',
          route: 'Oral',
          frequency: 'At bedtime',
          duration: '90 days',
          quantity: '90 tablets',
          timing: 'Evening / Bedtime',
          instructions: '',
          notes: 'Routine lipid profile repeat at next quarterly visit.'
        }
      ],
      additionalInstructions: '',
      doctorSignatureText: 'Dr. Elena Vance, MD',
      doctorSignatureDate: '2026-08-28',
      qrVerificationData: 'https://ordocare.health/verify/RX-2026-0891',
      createdAt: '2026-08-28T10:30:00Z',
      updatedAt: '2026-08-28T10:30:00Z'
    },
    {
      id: 'RX-2026-0904',
      prescriptionNumber: 'RX-2026-0904',
      patientId: 'PT-10022',
      patientName: 'Marcus Chen',
      patientDob: '1982-11-03',
      patientAge: 43,
      patientSex: 'Male',
      patientInsurance: 'Harvard Pilgrim Health (HPH-71193041)',
      patientDiagnosis: 'Type 2 Diabetes Mellitus & Mild Exercise-Induced Bronchospasm',
      doctorName: 'Dr. Elena Vance, MD',
      doctorSpecialty: 'Internal Medicine',
      doctorLicense: 'MED-MA-8849201',
      clinicName: clinicSettings.clinicName,
      clinicAddress: clinicSettings.address,
      clinicPhone: clinicSettings.phone,
      clinicEmail: clinicSettings.email,
      date: '2026-09-01',
      status: 'active',
      items: [
        {
          id: 'RXI-003',
          medicationId: 'MED-005',
          medicationName: 'Metformin Hydrochloride',
          activeIngredient: 'Metformin HCl',
          strength: '500 mg',
          dosageForm: 'Extended Release Tablet',
          dose: '500 mg (1 tablet)',
          route: 'Oral',
          frequency: 'Twice daily',
          duration: '60 days',
          quantity: '120 tablets',
          timing: 'Morning and Evening with meals',
          instructions: '',
          notes: 'Maintain glucose logbook.'
        },
        {
          id: 'RXI-004',
          medicationId: 'MED-006',
          medicationName: 'Albuterol Sulfate',
          activeIngredient: 'Albuterol',
          strength: '90 mcg / actuation',
          dosageForm: 'Inhaler',
          dose: '1-2 puffs (90-180 mcg)',
          route: 'Inhaled',
          frequency: 'As needed',
          duration: '30 days',
          quantity: '1 canister (200 inhalations)',
          timing: '15 minutes prior to exercise or during acute wheezing',
          instructions: '',
          notes: 'Check canister counter weekly.'
        }
      ],
      additionalInstructions: '',
      doctorSignatureText: 'Dr. Elena Vance, MD',
      doctorSignatureDate: '2026-09-01',
      qrVerificationData: 'https://ordocare.health/verify/RX-2026-0904',
      createdAt: '2026-09-01T15:00:00Z',
      updatedAt: '2026-09-01T15:00:00Z'
    },
    {
      id: 'RX-2026-0912',
      prescriptionNumber: 'RX-2026-0912',
      patientId: 'PT-10023',
      patientName: 'Sophia Alvarez',
      patientDob: '1995-07-22',
      patientAge: 31,
      patientSex: 'Female',
      patientInsurance: 'Aetna Health HMO (AET-33091822)',
      patientDiagnosis: 'Allergic Rhinitis & Seasonal Flare',
      doctorName: 'Dr. Elena Vance, MD',
      doctorSpecialty: 'Internal Medicine',
      doctorLicense: 'MED-MA-8849201',
      clinicName: clinicSettings.clinicName,
      clinicAddress: clinicSettings.address,
      clinicPhone: clinicSettings.phone,
      clinicEmail: clinicSettings.email,
      date: '2026-09-04',
      status: 'active',
      items: [
        {
          id: 'RXI-005',
          medicationId: 'MED-009',
          medicationName: 'Fluticasone Propionate',
          activeIngredient: 'Fluticasone Propionate',
          strength: '50 mcg / spray',
          dosageForm: 'Nasal Spray',
          dose: '1 spray each nostril',
          route: 'Nasal',
          frequency: 'Once daily',
          duration: '30 days',
          quantity: '1 bottle (120 metered sprays)',
          timing: 'Morning',
          instructions: '',
          notes: 'Shake well before each use.'
        }
      ],
      additionalInstructions: '',
      doctorSignatureText: 'Dr. Elena Vance, MD',
      doctorSignatureDate: '2026-09-04',
      qrVerificationData: 'https://ordocare.health/verify/RX-2026-0912',
      createdAt: '2026-09-04T11:30:00Z',
      updatedAt: '2026-09-04T11:30:00Z'
    }
  ];

  // Seed Treatments (Patient Treatment Monitoring over time)
  treatments = [
    {
      id: 'TRT-001',
      patientId: 'PT-10021',
      patientName: 'Eleanor Rigby',
      prescriptionId: 'RX-2026-0891',
      prescriptionNumber: 'RX-2026-0891',
      medicationId: 'MED-003',
      medicationName: 'Lisinopril 10 mg',
      dose: '10 mg',
      frequency: 'Once daily',
      route: 'Oral',
      startDate: '2026-08-28',
      expectedEndDate: '2026-09-27',
      status: 'active',
      adherence: 'optimal',
      adherencePercentage: 98,
      lastCheck: '2026-08-28',
      nextReview: '2026-09-28',
      notes: 'Blood pressure down to 124/80. No dizziness reported.',
      sideEffects: 'None reported',
      doseHistory: [
        {
          date: '2026-05-10',
          previousDose: '5 mg',
          newDose: '10 mg',
          reason: 'Titrated up to achieve target BP < 130/80 mmHg'
        }
      ]
    },
    {
      id: 'TRT-002',
      patientId: 'PT-10021',
      patientName: 'Eleanor Rigby',
      prescriptionId: 'RX-2026-0891',
      prescriptionNumber: 'RX-2026-0891',
      medicationId: 'MED-004',
      medicationName: 'Atorvastatin 20 mg',
      dose: '20 mg',
      frequency: 'At bedtime',
      route: 'Oral',
      startDate: '2026-08-28',
      expectedEndDate: '2026-11-26',
      status: 'active',
      adherence: 'optimal',
      adherencePercentage: 95,
      lastCheck: '2026-08-28',
      nextReview: '2026-09-28',
      notes: 'LDL cholesterol reduction monitored.',
      sideEffects: 'No myalgia or muscle ache'
    },
    {
      id: 'TRT-003',
      patientId: 'PT-10022',
      patientName: 'Marcus Chen',
      prescriptionId: 'RX-2026-0904',
      prescriptionNumber: 'RX-2026-0904',
      medicationId: 'MED-005',
      medicationName: 'Metformin HCl 500 mg XR',
      dose: '500 mg',
      frequency: 'Twice daily',
      route: 'Oral',
      startDate: '2026-09-01',
      expectedEndDate: '2026-10-31',
      status: 'active',
      adherence: 'optimal',
      adherencePercentage: 92,
      lastCheck: '2026-09-01',
      nextReview: '2026-10-15',
      notes: 'HbA1c improved to 6.8%. Excellent dietary compliance.',
      sideEffects: 'Mild transient nausea resolved after taking with full meals'
    },
    {
      id: 'TRT-004',
      patientId: 'PT-10022',
      patientName: 'Marcus Chen',
      prescriptionId: 'RX-2026-0904',
      prescriptionNumber: 'RX-2026-0904',
      medicationId: 'MED-006',
      medicationName: 'Albuterol Sulfate 90 mcg',
      dose: '1-2 puffs',
      frequency: 'As needed',
      route: 'Inhaled',
      startDate: '2026-09-01',
      expectedEndDate: '2026-10-01',
      status: 'ending_soon',
      adherence: 'moderate',
      adherencePercentage: 80,
      lastCheck: '2026-09-01',
      nextReview: '2026-09-20',
      notes: 'Refill canister requested. Needs review before athletic marathon.',
      sideEffects: 'Mild tremor reported if used twice consecutively'
    },
    {
      id: 'TRT-005',
      patientId: 'PT-10023',
      patientName: 'Sophia Alvarez',
      prescriptionId: 'RX-2026-0912',
      prescriptionNumber: 'RX-2026-0912',
      medicationId: 'MED-009',
      medicationName: 'Fluticasone Propionate 50 mcg',
      dose: '1 spray per nostril',
      frequency: 'Once daily',
      route: 'Nasal',
      startDate: '2026-09-04',
      expectedEndDate: '2026-10-04',
      status: 'active',
      adherence: 'optimal',
      adherencePercentage: 100,
      lastCheck: '2026-09-04',
      nextReview: '2026-09-18',
      notes: 'Seasonal rhinitis symptom control.',
      sideEffects: 'None'
    }
  ];

  // Seed Follow-ups
  followUps = [
    {
      id: 'FOL-001',
      patientId: 'PT-10023',
      patientName: 'Sophia Alvarez',
      treatmentId: 'TRT-005',
      date: '2026-09-08',
      time: '10:30',
      type: 'in_person',
      reason: 'Allergic rhinitis therapy response review',
      status: 'scheduled',
      notes: 'Evaluate nasal airway congestion improvement'
    },
    {
      id: 'FOL-002',
      patientId: 'PT-10021',
      patientName: 'Eleanor Rigby',
      treatmentId: 'TRT-001',
      date: '2026-09-28',
      time: '09:00',
      type: 'routine',
      reason: 'Hypertension quarterly surveillance & blood pressure check',
      status: 'scheduled',
      notes: 'Repeat basic metabolic panel and electrolyte profile'
    },
    {
      id: 'FOL-003',
      patientId: 'PT-10022',
      patientName: 'Marcus Chen',
      treatmentId: 'TRT-003',
      date: '2026-10-15',
      time: '14:00',
      type: 'lab_review',
      reason: 'Diabetic metabolic panel review & HbA1c testing',
      status: 'scheduled',
      notes: 'Review home glucose monitoring log'
    }
  ];

  // Seed Audit Logs
  auditLogs = [
    {
      id: 'AUD-001',
      timestamp: '2026-09-01T08:00:00Z',
      userId: 'USR-ADMIN-01',
      userName: 'System Administrator',
      userRole: 'admin',
      action: 'LOGIN',
      entityType: 'AUTH',
      details: 'Administrator logged into clinical management console from verified station.',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'AUD-002',
      timestamp: '2026-09-01T14:55:00Z',
      userId: 'USR-DOC-01',
      userName: 'Dr. Elena Vance, MD',
      userRole: 'doctor',
      action: 'CREATE',
      entityType: 'PRESCRIPTION',
      entityId: 'RX-2026-0904',
      entityName: 'Prescription for Marcus Chen',
      details: 'Issued prescription RX-2026-0904 containing Metformin 500mg XR and Albuterol 90mcg.',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'AUD-003',
      timestamp: '2026-09-04T11:25:00Z',
      userId: 'USR-DOC-01',
      userName: 'Dr. Elena Vance, MD',
      userRole: 'doctor',
      action: 'CREATE',
      entityType: 'PRESCRIPTION',
      entityId: 'RX-2026-0912',
      entityName: 'Prescription for Sophia Alvarez',
      details: 'Issued prescription RX-2026-0912 containing Fluticasone Propionate Nasal Spray.',
      ipAddress: '127.0.0.1'
    }
  ];

  // Seed Ordonnance Types (Prescription Templates for clinical conditions)
  ordonnanceTypes = [
    {
      id: 'ORD-TYP-01',
      name: 'Angine Aiguë Bactérienne (Adulte)',
      category: 'Infectiologie / ORL',
      diagnosis: 'Angine érythémato-pultacée bactérienne (Streptocoque A)',
      description: 'Traitement antibactérien de première intention avec antalgie et soins locaux pharyngés.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-01T08:00:00Z',
      items: [
        {
          medicationName: 'Amoxicilline',
          strength: '1 g',
          dosageForm: 'Comprimé dispersible',
          dose: '1 g',
          route: 'Oral',
          frequency: '2 / J',
          duration: '6 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Paracétamol',
          strength: '1 g',
          dosageForm: 'Comprimé',
          dose: '1 g',
          route: 'Oral',
          frequency: 'Toutes les 6 à 8 heures',
          duration: '5 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Collutoire Chlorhexidine / Tétracaïne',
          strength: '0.12%',
          dosageForm: 'Spray buccal',
          dose: '2 pulvérisations',
          route: 'Topical',
          frequency: '3 fois par jour',
          duration: '5 jours',
          quantity: '1 flacon',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    },
    {
      id: 'ORD-TYP-02',
      name: 'Gastro-Entérite Aiguë (GEA)',
      category: 'Gastro-entérologie',
      diagnosis: 'Gastro-entérite aiguë virale / Syndrome diarrhéique aigu',
      description: 'Réhydratation orale prioritaire, antispasmodique et antisécrétoire intestinal.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-05T09:00:00Z',
      items: [
        {
          medicationName: 'Soluté de Réhydratation Orale (SRO)',
          strength: 'Sachet pour 200ml',
          dosageForm: 'Poudre pour solution',
          dose: '1 sachet dans 200 ml d’eau',
          route: 'Oral',
          frequency: 'À volonté après chaque selle liquide',
          duration: '3 jours',
          quantity: '10 sachets',
          instructions: ''
        },
        {
          medicationName: 'Phloroglucinol (Spasfon)',
          strength: '80 mg',
          dosageForm: 'Comprimé orodispersible',
          dose: '160 mg (2 comprimés)',
          route: 'Oral',
          frequency: '3 / J',
          duration: '4 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Racécadotril (Tiorfan)',
          strength: '100 mg',
          dosageForm: 'Gélule',
          dose: '100 mg',
          route: 'Oral',
          frequency: '3 / J (avant repas)',
          duration: '3 à 5 jours',
          quantity: '1 bt',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    },
    {
      id: 'ORD-TYP-03',
      name: 'Lombalgie Aiguë / Lumbago',
      category: 'Rhumatologie',
      diagnosis: 'Lombalgie commune aiguë sans signe de compression radiculaire',
      description: 'Trithérapie antalgique, anti-inflammatoire et myorelaxante avec protection gastrique.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-10T10:00:00Z',
      items: [
        {
          medicationName: 'Paracétamol',
          strength: '1 g',
          dosageForm: 'Comprimé',
          dose: '1 g',
          route: 'Oral',
          frequency: '3 / J',
          duration: '7 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Kétoprofène (Bi-Profénid)',
          strength: '100 mg',
          dosageForm: 'Comprimé sécable',
          dose: '100 mg',
          route: 'Oral',
          frequency: '2 / J',
          duration: '5 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Oméprazole (IPP)',
          strength: '20 mg',
          dosageForm: 'Gélule',
          dose: '20 mg',
          route: 'Oral',
          frequency: '1 / J (matin)',
          duration: '5 jours',
          quantity: '1 bt',
          instructions: ''
        },
        {
          medicationName: 'Thiocolchicoside (Miorel)',
          strength: '4 mg',
          dosageForm: 'Comprimé',
          dose: '4 mg',
          route: 'Oral',
          frequency: '2 / J',
          duration: '5 jours',
          quantity: '1 bt',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    },
    {
      id: 'ORD-TYP-04',
      name: 'Cystite Aiguë Simple',
      category: 'Infectiologie',
      diagnosis: 'Cystite aiguë bactérienne non compliquée',
      description: 'Antibiothérapie monodose de première intention selon recommandations HAS/SPILF.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-12T11:00:00Z',
      items: [
        {
          medicationName: 'Fosfomycine-Trométamol',
          strength: '3 g',
          dosageForm: 'Granulés pour solution buvable',
          dose: '1 sachet (3 g)',
          route: 'Oral',
          frequency: 'Prise unique',
          duration: '1 jour (dose unique)',
          quantity: '1 sachet monodose',
          instructions: ''
        },
        {
          medicationName: 'Phloroglucinol (Spasfon)',
          strength: '80 mg',
          dosageForm: 'Comprimé',
          dose: '80 mg',
          route: 'Oral',
          frequency: 'Si spasmes ou brûlures',
          duration: '3 jours',
          quantity: '1 bt',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    },
    {
      id: 'ORD-TYP-05',
      name: 'HTA Essentielle - Traitement Initial',
      category: 'Cardiologie',
      diagnosis: 'Hypertension artérielle essentielle confirmée',
      description: 'Inhibiteur de l’enzyme de conversion ou antagoniste calcique avec auto-surveillance.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-15T14:00:00Z',
      items: [
        {
          medicationName: 'Périndopril / Amlodipine',
          strength: '5 mg / 5 mg',
          dosageForm: 'Comprimé',
          dose: '1 comprimé',
          route: 'Oral',
          frequency: '1 / J',
          duration: '1 mois',
          quantity: '1 bt',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    },
    {
      id: 'ORD-TYP-06',
      name: 'Crise d’Asthme / Bronchospasme',
      category: 'Pneumologie',
      diagnosis: 'Exacerbation aiguë d’asthme bronchique',
      description: 'Bronchodilatateur d’action rapide à la demande et corticothérapie orale brève.',
      isFavorite: false,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-25T16:00:00Z',
      items: [
        {
          medicationName: 'Salbutamol (Ventoline)',
          strength: '100 µg / dose',
          dosageForm: 'Aérosol doseur',
          dose: '2 bouffées',
          route: 'Inhaled',
          frequency: 'Toutes les 4 heures si sifflement ou dyspnée',
          duration: '10 jours',
          quantity: '1 flacon',
          instructions: ''
        },
        {
          medicationName: 'Prednisolone',
          strength: '20 mg',
          dosageForm: 'Comprimé orodispersible',
          dose: '40 mg (2 comprimés)',
          route: 'Oral',
          frequency: '1 / J (matin)',
          duration: '5 jours',
          quantity: '1 bt',
          instructions: ''
        }
      ],
      additionalInstructions: ''
    }
  ];

  // Seed Doctor Practice & Clinical Notes
  doctorNotes = [
    {
      id: 'NOTE-101',
      title: 'Protocole de Surveillance HTA & Bilan Rénal Annuel',
      content: `• Contrôle systématique créatininémie, DFG (CKD-EPI) et ionogramme (K+) chez tous les patients sous IEC/ARA II.\n• Si protéinurie au Dextro ou bandelette urinaire : doser le rapport Albuminurie/Créatininurie (RAC) au matin.\n• Rappel : Ne jamais associer IEC + ARA II (risque d'hyperkaliémie et défaillance rénale aiguë).`,
      category: 'clinical',
      isPinned: true,
      color: 'teal',
      tags: ['HTA', 'Néphrologie', 'IEC', 'Bilan'],
      createdAt: '2026-03-01T08:30:00Z',
      updatedAt: '2026-03-01T08:30:00Z',
      authorName: 'Dr. Oussama Belouar'
    },
    {
      id: 'NOTE-102',
      title: 'Rappel Patient : Contrôle INR sous AVK (Mme. Kaci)',
      content: `• Vérifier le carnet de suivi AVK et le dernier INR (cible 2.0 - 3.0 pour fibrillation atriale).\n• Si INR > 4.5 sans saignement : sauter une prise et réadapter la posologie par paliers de quart de comprimé.\n• Rappel des aliments riches en vitamine K (choux, épinards, brocolis) à consommer de manière régulière sans excès brusque.`,
      category: 'patient_followup',
      patientName: 'Mme. Kaci Fatima',
      isPinned: true,
      color: 'amber',
      tags: ['AVK', 'INR', 'Cardiologie'],
      createdAt: '2026-03-03T10:15:00Z',
      updatedAt: '2026-03-03T10:15:00Z',
      authorName: 'Dr. Oussama Belouar'
    },
    {
      id: 'NOTE-103',
      title: 'Trousse d\'Urgence Cabinet Médical : Vérification Mensuelle',
      content: `Matériel et ampoules à vérifier avant la première semaine de chaque mois :\n- [x] Adrénaline 1 mg/1 mL (3 ampoules)\n- [x] Solumédrol 120 mg injectable\n- [x] Ventoline aérosol-doseur et chambre d'inhalation adulte/enfant\n- [x] G30% et Glucagen pour hypoglycémie sévère\n- [x] Trinitrine spray sublingual\n- [ ] Renouveler les électrodes du DAE et vérifier la batterie.`,
      category: 'urgent',
      isPinned: false,
      color: 'rose',
      tags: ['Urgences', 'Trousse', 'Matériel', 'Sécurité'],
      createdAt: '2026-03-04T14:00:00Z',
      updatedAt: '2026-03-04T14:00:00Z',
      authorName: 'Dr. Oussama Belouar'
    },
    {
      id: 'NOTE-104',
      title: 'Règles de Prescription Diabète Type 2 & SGLT2',
      content: `Points clés de pratique clinique :\n• Pour l'initiation des inhibiteurs SGLT2 (Dapagliflozine 10 mg ou Empagliflozine 10 mg) : vérifier la fonction rénale préalable (DFG > 20 mL/min).\n• Prévenir expressément le patient du risque d'infections mycosiques génitales et d'acidocétose euglycémique.\n• Suspendre le SGLT2 en cas de jeûne prolongé, déshydratation aiguë ou intervention chirurgicale.`,
      category: 'prescription',
      isPinned: false,
      color: 'emerald',
      tags: ['Diabète', 'SGLT2', 'Pharmacologie'],
      createdAt: '2026-03-05T09:20:00Z',
      updatedAt: '2026-03-05T09:20:00Z',
      authorName: 'Dr. Oussama Belouar'
    }
  ];

  // Seed Bilans Types (Standard Test Profiles & Workup Panels)
  bilanTypes = [
    {
      id: 'BIL-TYP-01',
      name: 'Bilan Standard / Check-Up Général',
      category: 'Médecine Générale / Dépistage',
      description: 'Bilan biologique de routine pour surveillance globale des fonctions métabolique, hématologique et rénale.',
      items: [
        'Numération Formule Sanguine (NFS / Hémogramme complet)',
        'Vitesse de Sédimentation (VS)',
        'Glycémie à jeun',
        'Créatininémie + Clairance (DFG CKD-EPI)',
        'Ionogramme sanguin (Na+, K+, Cl-)',
        'Bilan lipidique (EAL : Cholestérol total, HDL, LDL calculé, Triglycérides)',
        'Transaminases hépatiques (ASAT / ALAT)'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Bilan biologique systématique et contrôle annuel de routine.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-01T08:00:00Z'
    },
    {
      id: 'BIL-TYP-02',
      name: 'Bilan Métabolique & Diabète (Suivi / Dépistage)',
      category: 'Endocrinologie / Diabétologie',
      description: 'Surveillance trimestrielle ou dépistage du diabète de type 1 ou 2 avec évaluation du retentissement micro/macro-vasculaire.',
      items: [
        'Glycémie veineuse à jeun',
        'Hémoglobine glyquée (HbA1c)',
        'Bilan lipidique complet (EAL)',
        'Créatininémie avec estimation du DFG (CKD-EPI)',
        'Microalbuminurie sur échantillon urinaire du matin',
        'Ionogramme sanguin complet'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Suivi trimestriel du diabète de type 2 et dépistage néphropathie/dyslipidémie.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-05T09:30:00Z'
    },
    {
      id: 'BIL-TYP-03',
      name: 'Bilan Hépatique Complet',
      category: 'Gastro-entérologie / Hépatologie',
      description: 'Exploration approfondie de la cytolyse, cholestase et fonction de synthèse hépatique.',
      items: [
        'Transaminases ASAT (TGO)',
        'Transaminases ALAT (TGP)',
        'Gamma-Glutamyl Transférase (Gamma-GT / GGT)',
        'Phosphatases Alcalines (PAL)',
        'Bilirubine totale, conjuguée et libre',
        'Taux de Prothrombine (TP) / INR',
        'Électrophorèse des protéines sériques (EPS) & Albuminémie'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Exploration d’une élévation enzymatique hépatique / surveillance thérapeutique.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-10T11:00:00Z'
    },
    {
      id: 'BIL-TYP-04',
      name: 'Bilan Rénal & Électrolytique',
      category: 'Néphrologie',
      description: 'Évaluation de la filtration glomérulaire, de l’équilibre hydro-électrolytique et protéinurie.',
      items: [
        'Créatinine sérique + DFG selon formule CKD-EPI',
        'Urée sanguine',
        'Ionogramme sanguin (Sodium, Potassium, Chlore, Bicarbonates CO2)',
        'Acide urique sérique (Uricémie)',
        'Calcémie et Phosphorémie',
        'Protéinurie des 24h ou Rapport Protéine/Créatinine sur miction'
      ],
      fastingRequired: false,
      urgent: false,
      defaultClinicalIndication: 'Évaluation de la fonction rénale et surveillance équilibre hydro-électrolytique.',
      isFavorite: false,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-12T14:00:00Z'
    },
    {
      id: 'BIL-TYP-05',
      name: 'Bilan d\'Anémie & Carence Martiale',
      category: 'Hématologie',
      description: 'Diagnostic étiologique d\'un syndrome anémique microcytaire ou normocytaire avec réserves en fer.',
      items: [
        'Numération Formule Sanguine (NFS / Hémogramme complet)',
        'Taux de Réticulocytes (avec formule)',
        'Ferritinémie (Ferritine sérique)',
        'Fer sérique & Capacité totale de saturation de la transferrine (Coefficient de saturation)',
        'Protéine C-Réactive (CRP ultrasensible)'
      ],
      fastingRequired: false,
      urgent: false,
      defaultClinicalIndication: 'Suspicion d’anémie / asthénie marquée / bilan de carence martiale.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-15T08:30:00Z'
    },
    {
      id: 'BIL-TYP-06',
      name: 'Bilan Thyroïdien Complet',
      category: 'Endocrinologie',
      description: 'Dépistage et contrôle des dysthyroïdies (hypo ou hyperthyroïdie, nodules, Hashimoto).',
      items: [
        'TSH ultra-sensible (TSHus)',
        'Thyroxine libre (T4 libre / FT4)',
        'Triiodothyronine libre (T3 libre / FT3)',
        'Anticorps anti-théroperoxydase (Anti-TPO si TSH anormale)'
      ],
      fastingRequired: false,
      urgent: false,
      defaultClinicalIndication: 'Exploration d’une symptomatologie de dysthyroïdie / suivi traitement lévothyroxine.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-18T10:15:00Z'
    },
    {
      id: 'BIL-TYP-07',
      name: 'Bilan Cardiovasculaire & Risque Athérogène',
      category: 'Cardiologie',
      description: 'Évaluation globale du risque cardiovasculaire avec marqueurs myocardiques et lipidiques.',
      items: [
        'Bilan lipidique complet (EAL : CT, HDL, LDL calculé, Triglycérides)',
        'Glycémie veineuse à jeun',
        'Ionogramme sanguin avec Kaliémie',
        'Troponine Ic ou T ultra-sensible',
        'NT-proBNP ou BNP plasmatique',
        'Électrocardiogramme de repos (ECG 12 dérivations)'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Stratification du risque cardiovasculaire global / dyspnée d’effort.',
      isFavorite: false,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-20T16:00:00Z'
    },
    {
      id: 'BIL-TYP-08',
      name: 'Bilan Pré-Opératoire Standard',
      category: 'Chirurgie / Anesthésie',
      description: 'Bilan hémostatique, immuno-hématologique et rénal avant tout acte chirurgical programmé.',
      items: [
        'Numération Formule Sanguine (NFS / Plaquettes)',
        'Taux de Prothrombine (TP) / INR',
        'Temps de Céphaline Activée (TCA)',
        'Fibrinogène sérique',
        'Groupe sanguin ABO-Rhésus (2 déterminations)',
        'Recherche d\'Agglutinines Irrégulières (RAI < 72h)',
        'Créatininémie + DFG',
        'Ionogramme sanguin (Na, K)'
      ],
      fastingRequired: false,
      urgent: false,
      defaultClinicalIndication: 'Consultation pré-anesthésique et bilan pré-opératoire réglementaire.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-22T09:00:00Z'
    },
    {
      id: 'BIL-TYP-09',
      name: 'Bilan d\'Asthénie & Fatigue Chronique',
      category: 'Médecine Générale / Médecine Interne',
      description: 'Recherche de carence vitaminique, perturbation endocrinienne ou syndrome inflammatoire chronique.',
      items: [
        'NFS / Hémogramme complet',
        'Ferritine sérique',
        '25-Hydroxyvitamine D (Vitamine D3)',
        'Vitamine B12 & Folates sériques (B9)',
        'TSH ultra-sensible',
        'Protéine C-Réactive (CRP)',
        'Ionogramme sanguin & Calcémie',
        'Glycémie veineuse à jeun'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Asthénie inexpliquée évoluant depuis plus de 4 semaines.',
      isFavorite: true,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-25T14:30:00Z'
    },
    {
      id: 'BIL-TYP-10',
      name: 'Bilan Radiologique & Imagerie Médicale',
      category: 'Radiologie / Imagerie Médicale',
      description: 'Prescription d\'examens d\'imagerie médicale de première intention.',
      items: [
        'Radiographie Pulmonaire Thorax Face (debout)',
        'Échographie Abdomino-Pelvienne complète',
        'Électrocardiogramme (ECG) 12 dérivations au repos'
      ],
      fastingRequired: true,
      urgent: false,
      defaultClinicalIndication: 'Exploration clinique complémentaire par imagerie médicale.',
      isFavorite: false,
      authorName: 'Dr. Oussama Belouar',
      createdAt: '2026-02-28T11:00:00Z'
    }
  ];

  // Seed Sample Bilan Prescriptions
  bilanPrescriptions = [
    {
      id: 'BIL-PRES-01',
      prescriptionNumber: 'BIL-2026-0041',
      patientId: 'PT-1001',
      patientName: 'Sarah Jenkins',
      patientDob: '1985-04-12',
      patientSex: 'Female',
      patientAge: 41,
      doctorName: 'Dr. Oussama Belouar',
      doctorSpecialty: 'Médecine Générale & Thérapeutique',
      doctorLicense: 'MED-DZ-948201',
      clinicName: 'Cabinet Médical Dr. Oussama Belouar',
      clinicAddress: '24 Dummy Street Area, Medical District',
      clinicPhone: '+12-345 678 9012',
      date: '2026-03-02',
      items: [
        'Numération Formule Sanguine (NFS / Hémogramme complet)',
        'Ferritinémie (Ferritine sérique)',
        '25-Hydroxyvitamine D (Vitamine D3)',
        'TSH ultra-sensible (TSHus)',
        'Glycémie à jeun'
      ],
      clinicalIndication: 'Bilan de fatigue persistante avec suspicion de carence martiale post-infectieuse.',
      fastingRequired: true,
      urgent: false,
      additionalNotes: 'Résultats à adresser au patient ainsi qu’au médecin prescripteur.',
      doctorSignatureText: 'Dr. Oussama Belouar',
      status: 'active',
      createdAt: '2026-03-02T09:30:00Z'
    },
    {
      id: 'BIL-PRES-02',
      prescriptionNumber: 'BIL-2026-0042',
      patientId: 'PT-1002',
      patientName: 'Marcus Chen',
      patientDob: '1968-11-23',
      patientSex: 'Male',
      patientAge: 57,
      doctorName: 'Dr. Oussama Belouar',
      doctorSpecialty: 'Médecine Générale & Thérapeutique',
      doctorLicense: 'MED-DZ-948201',
      clinicName: 'Cabinet Médical Dr. Oussama Belouar',
      clinicAddress: '24 Dummy Street Area, Medical District',
      clinicPhone: '+12-345 678 9012',
      date: '2026-03-05',
      items: [
        'Glycémie veineuse à jeun',
        'Hémoglobine glyquée (HbA1c)',
        'Bilan lipidique complet (EAL : CT, HDL, LDL calculé, Triglycérides)',
        'Créatininémie avec estimation du DFG (CKD-EPI)',
        'Microalbuminurie sur échantillon urinaire du matin',
        'Ionogramme sanguin (Sodium, Potassium, Chlore)'
      ],
      clinicalIndication: 'Suivi trimestriel du Diabète de type 2 et contrôle sous Metformine.',
      fastingRequired: true,
      urgent: false,
      additionalNotes: 'Prélèvement impérativement à jeun de 12 heures.',
      doctorSignatureText: 'Dr. Oussama Belouar',
      status: 'active',
      createdAt: '2026-03-05T14:15:00Z'
    }
  ];
}

// Ensure database is initialized once on load
initializeDatabase();

// Audit Logging helper
export function recordAuditLog(
  user: { id: string; name: string; role: Role },
  action: AuditLog['action'],
  entityType: AuditLog['entityType'],
  details: string,
  entityId?: string,
  entityName?: string,
  ip?: string
): AuditLog {
  const log: AuditLog = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action,
    entityType,
    entityId,
    entityName,
    details,
    ipAddress: ip || '127.0.0.1'
  };
  auditLogs.unshift(log);
  // Keep audit log to a reasonable size
  if (auditLogs.length > 500) {
    auditLogs = auditLogs.slice(0, 500);
  }
  return log;
}

// Session Helpers
export function createSession(user: StoredUser): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  // 8 hours session expiry
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  activeSessions.set(token, { token, userId: user.id, expiresAt });
  return { token, expiresAt };
}

export function validateSession(token: string): StoredUser | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }
  const user = users.find(u => u.id === session.userId && u.status === 'active');
  return user || null;
}

export function destroySession(token: string): boolean {
  return activeSessions.delete(token);
}

// Admin Code Verification
export function verifyAdminAccessCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return code.trim() === ADMIN_ACCESS_CODE.trim();
}

export function updateAdminAccessCode(newCode: string): void {
  ADMIN_ACCESS_CODE = newCode;
}

// Database API functions
export const db = {
  // Users
  getUsers: () => users.map(({ passwordHash, salt, ...u }) => u),
  getUserById: (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return null;
    const { passwordHash, salt, ...safe } = u;
    return safe;
  },
  getUserRawById: (id: string) => users.find(x => x.id === id) || null,
  getUserByUsername: (username: string) => users.find(x => x.username.toLowerCase() === username.toLowerCase()),
  createUser: (userData: Omit<StoredUser, 'id' | 'createdAt'>) => {
    const id = `USR-${Date.now().toString().slice(-6)}`;
    const newUser: StoredUser = {
      ...userData,
      id,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
  },
  updateUser: (id: string, updates: Partial<StoredUser>) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    const { passwordHash, salt, ...safe } = users[index];
    return safe;
  },
  deleteUser: (id: string) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  },

  // Patients
  getPatients: () => patients,
  getPatientById: (id: string) => patients.find(p => p.id === id) || null,
  createPatient: (patientData: Omit<Patient, 'id' | 'createdDate'>) => {
    const id = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPatient: Patient = {
      ...patientData,
      id,
      createdDate: new Date().toISOString().split('T')[0]
    };
    patients.unshift(newPatient);
    return newPatient;
  },
  updatePatient: (id: string, updates: Partial<Patient>) => {
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    patients[index] = { ...patients[index], ...updates };
    return patients[index];
  },
  archivePatient: (id: string) => {
    const p = patients.find(x => x.id === id);
    if (!p) return false;
    p.status = 'archived';
    return true;
  },
  restorePatient: (id: string) => {
    const p = patients.find(x => x.id === id);
    if (!p) return false;
    p.status = 'active';
    return true;
  },

  // Patient Notes
  getPatientNotes: (patientId: string) => patientNotes.filter(n => n.patientId === patientId),
  createPatientNote: (note: Omit<PatientNote, 'id' | 'date'>) => {
    const newNote: PatientNote = {
      ...note,
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString()
    };
    patientNotes.unshift(newNote);
    return newNote;
  },

  // Medications
  getMedications: () => medications,
  getMedicationById: (id: string) => medications.find(m => m.id === id) || null,
  createMedication: (medData: Omit<Medication, 'id'>) => {
    const id = `MED-${Math.floor(100 + Math.random() * 900)}`;
    const newMed: Medication = { ...medData, id };
    medications.push(newMed);
    return newMed;
  },
  updateMedication: (id: string, updates: Partial<Medication>) => {
    const index = medications.findIndex(m => m.id === id);
    if (index === -1) return null;
    medications[index] = { ...medications[index], ...updates };
    return medications[index];
  },
  deleteMedication: (id: string) => {
    const index = medications.findIndex(m => m.id === id);
    if (index === -1) return false;
    medications.splice(index, 1);
    return true;
  },

  // Prescriptions
  getPrescriptions: () => prescriptions,
  getPrescriptionById: (id: string) => prescriptions.find(p => p.id === id) || null,
  getPrescriptionsByPatient: (patientId: string) => prescriptions.filter(p => p.patientId === patientId),
  createPrescription: (data: Omit<Prescription, 'id' | 'prescriptionNumber' | 'createdAt' | 'updatedAt'>) => {
    const year = new Date().getFullYear();
    const rxNumber = `RX-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = rxNumber;
    const now = new Date().toISOString();
    const newPrescription: Prescription = {
      ...data,
      id,
      prescriptionNumber: rxNumber,
      qrVerificationData: `https://ordocare.health/verify/${rxNumber}`,
      createdAt: now,
      updatedAt: now
    };
    prescriptions.unshift(newPrescription);

    // Auto-create active treatments for each medication in the prescription
    data.items.forEach(item => {
      const treatmentId = `TRT-${Math.floor(100 + Math.random() * 900)}`;
      const startDate = data.date;
      // Estimate end date from duration
      let days = 30;
      const numMatch = item.duration.match(/\d+/);
      if (numMatch) {
        const n = parseInt(numMatch[0], 10);
        if (item.duration.toLowerCase().includes('week')) days = n * 7;
        else if (item.duration.toLowerCase().includes('month')) days = n * 30;
        else days = n;
      }
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + days);
      const expectedEndDate = endDateObj.toISOString().split('T')[0];

      const newTreatment: Treatment = {
        id: treatmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        prescriptionId: newPrescription.id,
        prescriptionNumber: rxNumber,
        medicationId: item.medicationId || 'CUSTOM-MED',
        medicationName: `${item.medicationName} ${item.strength}`,
        dose: item.dose,
        frequency: item.frequency,
        route: item.route,
        startDate,
        expectedEndDate,
        status: 'active',
        adherence: 'optimal',
        adherencePercentage: 100,
        lastCheck: startDate,
        nextReview: expectedEndDate,
        notes: item.instructions || 'Initial prescription treatment tracking',
        sideEffects: 'None monitored yet'
      };
      treatments.unshift(newTreatment);
    });

    return newPrescription;
  },
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => {
    const rx = prescriptions.find(p => p.id === id);
    if (!rx) return null;
    rx.status = status;
    rx.updatedAt = new Date().toISOString();
    return rx;
  },

  // Treatments
  getTreatments: () => treatments,
  getTreatmentsByPatient: (patientId: string) => treatments.filter(t => t.patientId === patientId),
  createTreatment: (data: Partial<Treatment> & { patientId: string; patientName: string; medicationName: string; dose: string; frequency: string }) => {
    const id = `TRT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().split('T')[0];
    const newTrt: Treatment = {
      id,
      patientId: data.patientId,
      patientName: data.patientName,
      prescriptionId: data.prescriptionId || `MANUAL-${id}`,
      prescriptionNumber: data.prescriptionNumber || 'Suivi Clinique Direct',
      medicationId: data.medicationId || 'MED-CUSTOM',
      medicationName: data.medicationName,
      dose: data.dose,
      frequency: data.frequency,
      route: data.route || 'Oral',
      startDate: data.startDate || now,
      expectedEndDate: data.expectedEndDate || now,
      status: (data.status as any) || 'active',
      adherence: (data.adherence as any) || 'optimal',
      adherencePercentage: data.adherencePercentage ?? 95,
      lastCheck: now,
      nextReview: data.nextReview || data.expectedEndDate || now,
      notes: data.notes || 'Suivi clinique ambulatoire',
      sideEffects: data.sideEffects || 'Aucun effet secondaire signalé',
      doseHistory: []
    };
    treatments.unshift(newTrt);
    return newTrt;
  },
  updateTreatment: (id: string, updates: Partial<Treatment>) => {
    const index = treatments.findIndex(t => t.id === id);
    if (index === -1) return null;
    treatments[index] = { ...treatments[index], ...updates };
    return treatments[index];
  },
  addTreatmentDoseChange: (treatmentId: string, change: { previousDose: string; newDose: string; reason: string }) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment) return null;
    if (!treatment.doseHistory) treatment.doseHistory = [];
    treatment.doseHistory.unshift({
      date: new Date().toISOString().split('T')[0],
      ...change
    });
    treatment.dose = change.newDose;
    return treatment;
  },
  extendTreatment: (treatmentId: string, additionalDays: number) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment) return null;
    const baseDate = treatment.expectedEndDate || treatment.startDate || new Date().toISOString().split('T')[0];
    const currentEnd = new Date(baseDate);
    currentEnd.setDate(currentEnd.getDate() + additionalDays);
    treatment.expectedEndDate = currentEnd.toISOString().split('T')[0];
    treatment.nextReview = treatment.expectedEndDate;
    treatment.status = 'active';
    const now = new Date().getTime();
    treatment.daysRemaining = Math.max(0, Math.ceil((currentEnd.getTime() - now) / (1000 * 60 * 60 * 24)));
    return treatment;
  },
  addTreatmentSideEffect: (treatmentId: string, sideEffect: { description: string; severity: string }) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment) return null;
    if (!Array.isArray(treatment.sideEffects)) {
      const prev = typeof treatment.sideEffects === 'string' && treatment.sideEffects.toLowerCase() !== 'none' && treatment.sideEffects.toLowerCase() !== 'none reported' && treatment.sideEffects.toLowerCase() !== 'none monitored yet'
        ? [{ description: treatment.sideEffects, severity: 'mild' }]
        : [];
      treatment.sideEffects = prev;
    }
    treatment.sideEffects.unshift({
      description: sideEffect.description,
      severity: sideEffect.severity || 'mild',
      date: new Date().toISOString().split('T')[0]
    });
    return treatment;
  },

  // Follow-ups
  getFollowUps: () => followUps,
  getFollowUpsByPatient: (patientId: string) => followUps.filter(f => f.patientId === patientId),
  createFollowUp: (data: Omit<FollowUp, 'id'>) => {
    const newFollowUp: FollowUp = {
      ...data,
      id: `FOL-${Math.floor(100 + Math.random() * 900)}`
    };
    followUps.unshift(newFollowUp);
    return newFollowUp;
  },
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => {
    const index = followUps.findIndex(f => f.id === id);
    if (index === -1) return null;
    followUps[index] = { ...followUps[index], ...updates };
    return followUps[index];
  },

  // Audit Logs
  getAuditLogs: () => auditLogs,

  // Settings
  getClinicSettings: () => clinicSettings,
  updateClinicSettings: (updates: Partial<ClinicSettings>) => {
    clinicSettings = { ...clinicSettings, ...updates };
    return clinicSettings;
  },
  getDoctorProfile: () => doctorProfile,
  updateDoctorProfile: (updates: Partial<DoctorProfile>) => {
    doctorProfile = { ...doctorProfile, ...updates };
    return doctorProfile;
  },

  // Ordonnance Types (Prescription Templates)
  getOrdonnanceTypes: () => ordonnanceTypes,
  getOrdonnanceTypeById: (id: string) => ordonnanceTypes.find(o => o.id === id) || null,
  createOrdonnanceType: (data: Omit<OrdonnanceType, 'id' | 'createdAt'>) => {
    const newOrd: OrdonnanceType = {
      ...data,
      id: `ORD-TYP-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString()
    };
    ordonnanceTypes.unshift(newOrd);
    return newOrd;
  },
  updateOrdonnanceType: (id: string, updates: Partial<OrdonnanceType>) => {
    const index = ordonnanceTypes.findIndex(o => o.id === id);
    if (index === -1) return null;
    ordonnanceTypes[index] = {
      ...ordonnanceTypes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return ordonnanceTypes[index];
  },
  deleteOrdonnanceType: (id: string) => {
    const index = ordonnanceTypes.findIndex(o => o.id === id);
    if (index === -1) return false;
    ordonnanceTypes.splice(index, 1);
    return true;
  },

  // Practice & Doctor Notes
  getDoctorNotes: () => doctorNotes,
  getDoctorNoteById: (id: string) => doctorNotes.find(n => n.id === id) || null,
  createDoctorNote: (data: Omit<DoctorNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: DoctorNote = {
      ...data,
      id: `NOTE-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    doctorNotes.unshift(newNote);
    return newNote;
  },
  updateDoctorNote: (id: string, updates: Partial<DoctorNote>) => {
    const index = doctorNotes.findIndex(n => n.id === id);
    if (index === -1) return null;
    doctorNotes[index] = {
      ...doctorNotes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return doctorNotes[index];
  },
  deleteDoctorNote: (id: string) => {
    const index = doctorNotes.findIndex(n => n.id === id);
    if (index === -1) return false;
    doctorNotes.splice(index, 1);
    return true;
  },

  // Bilans Types (Workup Panels & Lab Test Profiles)
  getBilanTypes: () => bilanTypes,
  getBilanTypeById: (id: string) => bilanTypes.find(b => b.id === id) || null,
  createBilanType: (data: Omit<BilanType, 'id' | 'createdAt'>) => {
    const newBilan: BilanType = {
      ...data,
      id: `BIL-TYP-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString()
    };
    bilanTypes.unshift(newBilan);
    return newBilan;
  },
  updateBilanType: (id: string, updates: Partial<BilanType>) => {
    const index = bilanTypes.findIndex(b => b.id === id);
    if (index === -1) return null;
    bilanTypes[index] = {
      ...bilanTypes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return bilanTypes[index];
  },
  deleteBilanType: (id: string) => {
    const index = bilanTypes.findIndex(b => b.id === id);
    if (index === -1) return false;
    bilanTypes.splice(index, 1);
    return true;
  },

  // Bilan Prescriptions (Lab & Medical Imaging Orders)
  getBilanPrescriptions: () => bilanPrescriptions,
  getBilanPrescriptionById: (id: string) => bilanPrescriptions.find(p => p.id === id) || null,
  createBilanPrescription: (data: Omit<BilanPrescription, 'id' | 'prescriptionNumber' | 'createdAt'>) => {
    const count = bilanPrescriptions.length + 1;
    const rxNumber = `BIL-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const newRx: BilanPrescription = {
      ...data,
      id: `BIL-PRES-${Date.now()}`,
      prescriptionNumber: rxNumber,
      createdAt: new Date().toISOString()
    };
    bilanPrescriptions.unshift(newRx);
    return newRx;
  },
  deleteBilanPrescription: (id: string) => {
    const index = bilanPrescriptions.findIndex(p => p.id === id);
    if (index === -1) return false;
    bilanPrescriptions.splice(index, 1);
    return true;
  }
};
