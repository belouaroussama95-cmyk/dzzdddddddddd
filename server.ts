import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import {
  db,
  createSession,
  validateSession,
  destroySession,
  verifyPassword,
  hashPassword,
  verifyAdminAccessCode,
  updateAdminAccessCode,
  recordAuditLog
} from './server/db.ts';
import type { User, Role } from './src/types.ts';

// Extended Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Auth extraction middleware
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.ordocare_token) {
    token = req.cookies.ordocare_token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Sensitive patient and clinical records are protected.',
      code: 'AUTH_REQUIRED'
    });
  }

  const user = validateSession(token);
  if (!user) {
    return res.status(401).json({
      error: 'Session expired or invalid. Please authenticate again.',
      code: 'SESSION_EXPIRED'
    });
  }

  req.user = user;
  req.token = token;
  next();
}

// Role restriction middleware
function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' does not have sufficient permission for this action.`,
        code: 'ROLE_FORBIDDEN'
      });
    }
    next();
  };
}

// ==========================================
// PUBLIC & AUTHENTICATION ENDPOINTS
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OrdoCare Clinical Backend',
    timestamp: new Date().toISOString()
  });
});

// Standard Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.getUserByUsername(username);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    recordAuditLog(
      { id: user.id, name: user.name, role: user.role },
      'LOGIN',
      'AUTH',
      `Failed password login attempt for username: ${username}`,
      undefined,
      undefined,
      req.ip
    );
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Update last login
  db.updateUser(user.id, { lastLogin: new Date().toISOString() });

  const { token, expiresAt } = createSession(user);
  res.cookie('ordocare_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 3600 * 1000
  });

  const { passwordHash, salt, ...safeUser } = user;
  recordAuditLog(
    { id: user.id, name: user.name, role: user.role },
    'LOGIN',
    'AUTH',
    `User ${user.name} (${user.role}) logged in successfully.`,
    user.id,
    user.name,
    req.ip
  );

  res.json({
    token,
    user: safeUser,
    expiresAt
  });
});

// Admin Access Code Login / Direct Unlock (Validates 321180 purely on the server)
app.post('/api/auth/admin-code-login', (req, res) => {
  const { accessCode } = req.body;
  if (!accessCode) {
    return res.status(400).json({ error: 'Administrator access code is required' });
  }

  const isMatch = verifyAdminAccessCode(accessCode);
  if (!isMatch) {
    return res.status(401).json({
      error: 'Invalid administrator access code. Authorization denied.',
      code: 'INVALID_ADMIN_CODE'
    });
  }

  // Fetch or resolve admin user
  const adminUser = db.getUserByUsername('admin');
  if (!adminUser) {
    return res.status(500).json({ error: 'Administrator account not configured' });
  }

  db.updateUser(adminUser.id, { lastLogin: new Date().toISOString() });
  const { token, expiresAt } = createSession(adminUser);

  res.cookie('ordocare_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 3600 * 1000
  });

  const { passwordHash, salt, ...safeUser } = adminUser;
  recordAuditLog(
    { id: adminUser.id, name: adminUser.name, role: adminUser.role },
    'ADMIN_CODE_LOGIN',
    'AUTH',
    `Administrator session established via secure master access code.`,
    adminUser.id,
    adminUser.name,
    req.ip
  );

  res.json({
    token,
    user: safeUser,
    expiresAt,
    message: 'Administrator session authenticated successfully'
  });
});

// Admin Password Reset Flow (Requires server-side validation of master admin code)
app.post('/api/auth/admin-reset', (req, res) => {
  const { adminCode, targetUserId, newPassword } = req.body;

  if (!adminCode || !targetUserId || !newPassword) {
    return res.status(400).json({ error: 'Admin code, target user ID, and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const isValidCode = verifyAdminAccessCode(adminCode);
  if (!isValidCode) {
    return res.status(401).json({ error: 'Incorrect administrator master access code.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  const updated = db.updateUser(targetUserId, { passwordHash: hash, salt });
  if (!updated) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  recordAuditLog(
    { id: 'SYSTEM', name: 'Master Security Reset', role: 'admin' },
    'ADMIN_RESET',
    'USER',
    `Password reset for user ID ${targetUserId} performed using verified administrator code.`,
    targetUserId,
    updated.name,
    req.ip
  );

  res.json({
    success: true,
    message: `Password reset successfully for ${updated.name}`
  });
});

// Current Authenticated User & Session Check
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    destroySession(req.token);
  }
  res.clearCookie('ordocare_token');

  if (req.user) {
    recordAuditLog(
      req.user,
      'LOGOUT',
      'AUTH',
      `User ${req.user.name} logged out.`,
      req.user.id,
      req.user.name,
      req.ip
    );
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// PATIENT MANAGEMENT ENDPOINTS (PROTECTED)
// ==========================================

// Get Patients (with search & status filters)
app.get('/api/patients', authMiddleware, (req: AuthenticatedRequest, res) => {
  const query = (req.query.search as string || '').toLowerCase().trim();
  const status = req.query.status as string;

  let list = db.getPatients();

  if (status && status !== 'all') {
    list = list.filter(p => p.status === status);
  }

  if (query) {
    list = list.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.diagnosis.toLowerCase().includes(query) ||
      p.dob.includes(query)
    );
  }

  res.json(list);
});

// Get Single Patient
app.get('/api/patients/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// Create Patient
app.post('/api/patients', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { firstName, lastName, dob, sex, phone, email, address, insurance, emergencyContact, allergies, diagnosis, medicalNotes } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'Le prénom et le nom sont obligatoires.' });
  }

  const newPatient = db.createPatient({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    dob: dob || '1990-01-01',
    sex: sex || 'Male',
    phone: phone || 'Non renseigné',
    email: email || '',
    address: address || '',
    insurance: insurance || { provider: 'Sécurité Sociale / Caisse Générale', policyNumber: '' },
    emergencyContact: emergencyContact || { name: '', relation: '', phone: '' },
    allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : ['Aucune allergie connue']),
    diagnosis: diagnosis || 'Consultation générale',
    medicalNotes: medicalNotes || '',
    status: 'active',
    lastVisit: new Date().toISOString().split('T')[0]
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PATIENT',
    `Created new patient record ${newPatient.id} (${newPatient.firstName} ${newPatient.lastName}).`,
    newPatient.id,
    `${newPatient.firstName} ${newPatient.lastName}`,
    req.ip
  );

  res.status(201).json(newPatient);
});

// Update Patient
app.put('/api/patients/:id', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const updated = db.updatePatient(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  recordAuditLog(
    req.user!,
    'UPDATE',
    'PATIENT',
    `Updated clinical demographics and profile for patient ${updated.id} (${updated.firstName} ${updated.lastName}).`,
    updated.id,
    `${updated.firstName} ${updated.lastName}`,
    req.ip
  );

  res.json(updated);
});

// Archive Patient
app.post('/api/patients/:id/archive', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const ok = db.archivePatient(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not archive patient' });

  recordAuditLog(
    req.user!,
    'ARCHIVE',
    'PATIENT',
    `Archived patient record ${patient.id} (${patient.firstName} ${patient.lastName}).`,
    patient.id,
    `${patient.firstName} ${patient.lastName}`,
    req.ip
  );

  res.json({ success: true, message: 'Patient archived successfully' });
});

// Restore Patient
app.post('/api/patients/:id/restore', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const ok = db.restorePatient(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not restore patient' });

  recordAuditLog(
    req.user!,
    'RESTORE',
    'PATIENT',
    `Restored archived patient record ${patient.id} (${patient.firstName} ${patient.lastName}) to active status.`,
    patient.id,
    `${patient.firstName} ${patient.lastName}`,
    req.ip
  );

  res.json({ success: true, message: 'Patient restored successfully' });
});

// Patient Notes
app.get('/api/patients/:id/notes', authMiddleware, (req: AuthenticatedRequest, res) => {
  const notes = db.getPatientNotes(req.params.id);
  res.json(notes);
});

app.post('/api/patients/:id/notes', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { content, type } = req.body;
  if (!content) return res.status(400).json({ error: 'Note content is required' });

  const note = db.createPatientNote({
    patientId: req.params.id,
    authorName: req.user!.name,
    authorRole: req.user!.role,
    type: type || 'clinical',
    content
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PATIENT',
    `Added ${note.type} note to patient ${req.params.id}.`,
    req.params.id,
    undefined,
    req.ip
  );

  res.status(201).json(note);
});

// Chronological Patient Timeline
app.get('/api/patients/:id/timeline', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patientId = req.params.id;
  const patient = db.getPatientById(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const rxList = db.getPrescriptionsByPatient(patientId);
  const trtList = db.getTreatmentsByPatient(patientId);
  const folList = db.getFollowUpsByPatient(patientId);
  const notesList = db.getPatientNotes(patientId);

  interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    type: 'creation' | 'prescription' | 'treatment' | 'dose_change' | 'follow_up' | 'note' | 'consultation';
    description: string;
    metadata?: any;
  }

  const events: TimelineEvent[] = [];

  // Creation
  events.push({
    id: `tl-create-${patient.id}`,
    date: patient.createdDate,
    title: 'Patient Record Created',
    type: 'creation',
    description: `Registered at OrdoCare Clinical Management. Initial diagnosis: ${patient.diagnosis}.`
  });

  // Prescriptions
  rxList.forEach(rx => {
    events.push({
      id: `tl-rx-${rx.id}`,
      date: rx.date,
      title: `Prescription Issued (${rx.prescriptionNumber})`,
      type: 'prescription',
      description: `Issued by ${rx.doctorName} with ${rx.items.length} medication(s): ${rx.items.map(i => i.medicationName).join(', ')}.`,
      metadata: { prescriptionId: rx.id }
    });
  });

  // Treatments & Dose changes
  trtList.forEach(trt => {
    events.push({
      id: `tl-trt-${trt.id}`,
      date: trt.startDate,
      title: `Treatment Started: ${trt.medicationName}`,
      type: 'treatment',
      description: `Regimen: ${trt.dose} via ${trt.route}, ${trt.frequency}. Expected duration until ${trt.expectedEndDate}.`,
      metadata: { treatmentId: trt.id, status: trt.status }
    });

    if (trt.doseHistory) {
      trt.doseHistory.forEach((dh, idx) => {
        events.push({
          id: `tl-dh-${trt.id}-${idx}`,
          date: dh.date,
          title: `Dose Modification: ${trt.medicationName}`,
          type: 'dose_change',
          description: `Adjusted from ${dh.previousDose} to ${dh.newDose}. Reason: ${dh.reason}`,
          metadata: { treatmentId: trt.id }
        });
      });
    }
  });

  // Follow-ups
  folList.forEach(fol => {
    events.push({
      id: `tl-fol-${fol.id}`,
      date: fol.date,
      title: `Follow-up (${fol.status.toUpperCase()}): ${fol.reason}`,
      type: 'follow_up',
      description: `${fol.type.replace('_', ' ')} appointment scheduled at ${fol.time}. ${fol.notes || ''}`,
      metadata: { followUpId: fol.id, status: fol.status }
    });
  });

  // Notes
  notesList.forEach(n => {
    events.push({
      id: `tl-note-${n.id}`,
      date: n.date.split('T')[0],
      title: `${n.type.charAt(0).toUpperCase() + n.type.slice(1)} Note by ${n.authorName}`,
      type: 'note',
      description: n.content,
      metadata: { noteId: n.id }
    });
  });

  // Sort descending by date
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json(events);
});

// ==========================================
// MEDICATION DATABASE ENDPOINTS (PROTECTED)
// ==========================================

// Search & List Medications
app.get('/api/medications', authMiddleware, (req: AuthenticatedRequest, res) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  const category = req.query.category as string;
  const favoritesOnly = req.query.favorites === 'true';

  let list = db.getMedications();

  if (category && category !== 'all') {
    list = list.filter(m => m.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (favoritesOnly) {
    list = list.filter(m => m.isFavorite);
  }

  if (search) {
    list = list.filter(m =>
      m.genericName.toLowerCase().includes(search) ||
      m.brandName.toLowerCase().includes(search) ||
      m.activeIngredient.toLowerCase().includes(search) ||
      m.strength.toLowerCase().includes(search) ||
      m.dosageForm.toLowerCase().includes(search) ||
      m.category.toLowerCase().includes(search) ||
      (m.code && m.code.toLowerCase().includes(search)) ||
      (m.registrationNumber && m.registrationNumber.toLowerCase().includes(search)) ||
      (m.packaging && m.packaging.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Single Medication
app.get('/api/medications/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const med = db.getMedicationById(req.params.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  res.json(med);
});

// Add Medication (Admin / Doctor)
app.post('/api/medications', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { genericName, brandName, activeIngredient, strength, dosageForm, route, category, defaultFrequency, standardDose, defaultDuration, instructions, notes, isFavorite } = req.body;

  if (!genericName || !strength || !dosageForm || !route) {
    return res.status(400).json({ error: 'Generic name, strength, dosage form, and route are required' });
  }

  const newMed = db.createMedication({
    genericName,
    brandName: brandName || '',
    activeIngredient: activeIngredient || genericName,
    strength,
    dosageForm,
    route,
    category: category || 'General',
    defaultFrequency: defaultFrequency || 'Once daily',
    standardDose: standardDose || strength,
    defaultDuration: defaultDuration || '30 days',
    instructions: instructions || 'Take as directed.',
    notes: notes || '',
    isFavorite: !!isFavorite,
    status: 'active'
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'MEDICATION',
    `Added medication ${newMed.genericName} (${newMed.strength}) to clinical formulary database.`,
    newMed.id,
    newMed.genericName,
    req.ip
  );

  res.status(201).json(newMed);
});

// Update Medication (Admin / Doctor)
app.put('/api/medications/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateMedication(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Medication not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'MEDICATION',
    `Updated medication record ${updated.genericName} (${updated.id}).`,
    updated.id,
    updated.genericName,
    req.ip
  );

  res.json(updated);
});

// Delete Medication (Admin Only)
app.delete('/api/medications/:id', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const med = db.getMedicationById(req.params.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const ok = db.deleteMedication(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not delete medication' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'MEDICATION',
    `Deleted medication ${med.genericName} (${med.id}) from formulary.`,
    med.id,
    med.genericName,
    req.ip
  );

  res.json({ success: true, message: 'Medication removed from database' });
});

// Import Medications in Bulk (Admin Only)
app.post('/api/medications/import', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Array of medication objects is required' });
  }

  let importedCount = 0;
  for (const item of items) {
    if (item.genericName && item.strength) {
      db.createMedication({
        genericName: item.genericName,
        brandName: item.brandName || '',
        activeIngredient: item.activeIngredient || item.genericName,
        strength: item.strength,
        dosageForm: item.dosageForm || 'Tablet',
        route: item.route || 'Oral',
        category: item.category || 'Imported',
        defaultFrequency: item.defaultFrequency || 'Once daily',
        standardDose: item.standardDose || item.strength,
        defaultDuration: item.defaultDuration || '30 days',
        instructions: item.instructions || 'Take as directed.',
        notes: item.notes || 'Imported dataset',
        isFavorite: !!item.isFavorite,
        status: 'active'
      });
      importedCount++;
    }
  }

  recordAuditLog(
    req.user!,
    'CREATE',
    'MEDICATION',
    `Bulk imported ${importedCount} medication records into formulary.`,
    undefined,
    undefined,
    req.ip
  );

  res.json({ success: true, importedCount });
});

// ==========================================
// PRESCRIPTION BUILDER & RECORD ENDPOINTS
// ==========================================

// List Prescriptions
app.get('/api/prescriptions', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patientId = req.query.patientId as string;
  const status = req.query.status as string;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.getPrescriptions();

  if (patientId) {
    list = list.filter(p => p.patientId === patientId);
  }

  if (status && status !== 'all') {
    list = list.filter(p => p.status === status);
  }

  if (search) {
    list = list.filter(p =>
      p.prescriptionNumber.toLowerCase().includes(search) ||
      p.patientName.toLowerCase().includes(search) ||
      p.doctorName.toLowerCase().includes(search) ||
      p.items.some(i => i.medicationName.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Single Prescription (with printable details)
app.get('/api/prescriptions/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const rx = db.getPrescriptionById(req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });
  res.json(rx);
});

// Create Prescription
app.post('/api/prescriptions', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { patientId, items, additionalInstructions, notes, date } = req.body;

  if (!patientId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Patient and at least one medication item are required' });
  }

  const patient = db.getPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Selected patient does not exist' });
  }

  // Calculate age
  const birthYear = new Date(patient.dob).getFullYear();
  const currentYear = new Date().getFullYear();
  const patientAge = currentYear - birthYear;

  const clinic = db.getClinicSettings();
  const doctor = db.getDoctorProfile();

  const newRx = db.createPrescription({
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientDob: patient.dob,
    patientAge,
    patientSex: patient.sex,
    patientInsurance: patient.insurance ? `${patient.insurance.provider} (${patient.insurance.policyNumber})` : 'Self-Pay',
    patientDiagnosis: patient.diagnosis,
    patientAddress: patient.address || '24 Dummy Street Area, Suite 100',
    doctorName: req.user!.name || doctor.name,
    doctorSpecialty: req.user!.specialty || doctor.specialty,
    doctorLicense: req.user!.licenseNumber || doctor.licenseNumber,
    clinicName: clinic.clinicName,
    clinicAddress: clinic.address,
    clinicPhone: clinic.phone,
    clinicEmail: clinic.email,
    date: date || new Date().toISOString().split('T')[0],
    status: 'active',
    items,
    additionalInstructions: additionalInstructions || 'Take strictly as prescribed. Contact clinic for refills or unexpected adverse reactions.',
    doctorSignatureText: req.user!.name || doctor.name,
    doctorSignatureDate: date || new Date().toISOString().split('T')[0]
  });

  // Update patient's last visit
  db.updatePatient(patient.id, { lastVisit: newRx.date });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PRESCRIPTION',
    `Created prescription ${newRx.prescriptionNumber} for patient ${patient.firstName} ${patient.lastName} (${items.length} items).`,
    newRx.id,
    newRx.prescriptionNumber,
    req.ip
  );

  res.status(201).json(newRx);
});

// Update Prescription Status
app.patch('/api/prescriptions/:id/status', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!['active', 'completed', 'cancelled', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const updated = db.updatePrescriptionStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Prescription not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'PRESCRIPTION',
    `Updated prescription ${updated.prescriptionNumber} status to ${status}.`,
    updated.id,
    updated.prescriptionNumber,
    req.ip
  );

  res.json(updated);
});

// ==========================================
// ORDONNANCES TYPES (PRESCRIPTION TEMPLATES)
// ==========================================

// List Ordonnances Types
app.get('/api/ordonnance-types', authMiddleware, (req: AuthenticatedRequest, res) => {
  const category = req.query.category as string;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const favoritesOnly = req.query.favorites === 'true';

  let list = db.getOrdonnanceTypes();

  if (category && category !== 'all') {
    list = list.filter(o => o.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (favoritesOnly) {
    list = list.filter(o => o.isFavorite);
  }

  if (search) {
    list = list.filter(o =>
      o.name.toLowerCase().includes(search) ||
      o.diagnosis.toLowerCase().includes(search) ||
      (o.description && o.description.toLowerCase().includes(search)) ||
      o.items.some(i => i.medicationName.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Single Ordonnance Type
app.get('/api/ordonnance-types/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const item = db.getOrdonnanceTypeById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Ordonnance type not found' });
  res.json(item);
});

// Create Ordonnance Type
app.post('/api/ordonnance-types', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { name, category, diagnosis, description, items, additionalInstructions, isFavorite } = req.body;

  if (!name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Name and at least one medication item are required' });
  }

  const newOrd = db.createOrdonnanceType({
    name,
    category: category || 'Médecine Générale',
    diagnosis: diagnosis || '',
    description: description || '',
    items,
    additionalInstructions: additionalInstructions || '',
    isFavorite: !!isFavorite,
    authorName: req.user?.name || 'Dr. Oussama Belouar'
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PRESCRIPTION',
    `Created prescription template (Ordonnance Type): ${newOrd.name} with ${items.length} items.`,
    newOrd.id,
    newOrd.name,
    req.ip
  );

  res.status(201).json(newOrd);
});

// Update Ordonnance Type
app.put('/api/ordonnance-types/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateOrdonnanceType(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ordonnance type not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'PRESCRIPTION',
    `Updated prescription template (Ordonnance Type): ${updated.name}.`,
    updated.id,
    updated.name,
    req.ip
  );

  res.json(updated);
});

// Delete Ordonnance Type
app.delete('/api/ordonnance-types/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const existing = db.getOrdonnanceTypeById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ordonnance type not found' });

  const ok = db.deleteOrdonnanceType(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not delete template' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'PRESCRIPTION',
    `Deleted prescription template (Ordonnance Type): ${existing.name}.`,
    existing.id,
    existing.name,
    req.ip
  );

  res.json({ success: true, message: 'Ordonnance type deleted' });
});

// ==========================================
// BILANS TYPES & BILAN PRESCRIPTIONS (LAB & WORKUP)
// ==========================================

// List Bilan Types
app.get('/api/bilan-types', authMiddleware, (req: AuthenticatedRequest, res) => {
  const category = req.query.category as string;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const favoritesOnly = req.query.favorites === 'true';

  let list = db.getBilanTypes();

  if (category && category !== 'all') {
    list = list.filter(b => b.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (favoritesOnly) {
    list = list.filter(b => b.isFavorite);
  }

  if (search) {
    list = list.filter(b =>
      b.name.toLowerCase().includes(search) ||
      b.description.toLowerCase().includes(search) ||
      b.category.toLowerCase().includes(search) ||
      b.items.some(item => item.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Single Bilan Type
app.get('/api/bilan-types/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const item = db.getBilanTypeById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Bilan type not found' });
  res.json(item);
});

// Create Bilan Type
app.post('/api/bilan-types', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { name, category, description, items, fastingRequired, urgent, defaultClinicalIndication, isFavorite } = req.body;

  if (!name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Name and at least one lab test item are required.' });
  }

  const created = db.createBilanType({
    name,
    category: category || 'Médecine Générale',
    description: description || '',
    items,
    fastingRequired: !!fastingRequired,
    urgent: !!urgent,
    defaultClinicalIndication: defaultClinicalIndication || '',
    isFavorite: !!isFavorite,
    authorName: req.user!.name
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PRESCRIPTION',
    `Created standard lab panel (Bilan Type): ${created.name} with ${items.length} tests.`,
    created.id,
    created.name,
    req.ip
  );

  res.status(201).json(created);
});

// Update Bilan Type
app.put('/api/bilan-types/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const existing = db.getBilanTypeById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bilan type not found' });

  const updated = db.updateBilanType(req.params.id, req.body);
  if (!updated) return res.status(400).json({ error: 'Could not update bilan type' });

  res.json(updated);
});

// Delete Bilan Type
app.delete('/api/bilan-types/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const existing = db.getBilanTypeById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bilan type not found' });

  const ok = db.deleteBilanType(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not delete bilan type' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'PRESCRIPTION',
    `Deleted lab panel template: ${existing.name}.`,
    existing.id,
    existing.name,
    req.ip
  );

  res.json({ success: true, message: 'Bilan type deleted' });
});

// List Bilan Prescriptions (Ordonnances de bilans délivrées)
app.get('/api/bilan-prescriptions', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patientId = req.query.patientId as string;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.getBilanPrescriptions();

  if (patientId) {
    list = list.filter(p => p.patientId === patientId);
  }

  if (search) {
    list = list.filter(p =>
      p.prescriptionNumber.toLowerCase().includes(search) ||
      p.patientName.toLowerCase().includes(search) ||
      p.clinicalIndication.toLowerCase().includes(search) ||
      p.items.some(i => i.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Single Bilan Prescription
app.get('/api/bilan-prescriptions/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const item = db.getBilanPrescriptionById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Bilan prescription not found' });
  res.json(item);
});

// Create Bilan Prescription (Ordonnance de bilan)
app.post('/api/bilan-prescriptions', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const {
    patientId,
    patientName,
    patientDob,
    patientSex,
    patientAge,
    items,
    clinicalIndication,
    fastingRequired,
    urgent,
    additionalNotes
  } = req.body;

  if (!patientId || !patientName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Patient information and at least one lab test item are required.' });
  }

  const clinic = db.getClinicSettings();
  const doctor = db.getDoctorProfile();

  const created = db.createBilanPrescription({
    patientId,
    patientName,
    patientDob,
    patientSex,
    patientAge,
    doctorName: doctor.name || req.user!.name,
    doctorSpecialty: doctor.specialty || 'Médecine Générale',
    doctorLicense: doctor.licenseNumber || 'RPPS-MED',
    clinicName: clinic.clinicName || 'Cabinet Médical',
    clinicAddress: clinic.address || '',
    clinicPhone: clinic.phone || '',
    date: new Date().toISOString().split('T')[0],
    items,
    clinicalIndication: clinicalIndication || 'Bilan biologique prescrit pour exploration clinique.',
    fastingRequired: !!fastingRequired,
    urgent: !!urgent,
    additionalNotes: additionalNotes || '',
    doctorSignatureText: doctor.signatureText || doctor.name || req.user!.name,
    status: 'active'
  });

  // Record audit log
  recordAuditLog(
    req.user!,
    'CREATE',
    'PRESCRIPTION',
    `Prescribed lab order ${created.prescriptionNumber} for patient ${created.patientName} (${items.length} tests).`,
    created.id,
    `Bilan ${created.prescriptionNumber}`,
    req.ip
  );

  res.status(201).json(created);
});

// Delete Bilan Prescription
app.delete('/api/bilan-prescriptions/:id', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const existing = db.getBilanPrescriptionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bilan prescription not found' });

  const ok = db.deleteBilanPrescription(req.params.id);
  if (!ok) return res.status(400).json({ error: 'Could not delete prescription' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'PRESCRIPTION',
    `Cancelled/deleted lab order ${existing.prescriptionNumber} for ${existing.patientName}.`,
    existing.id,
    existing.prescriptionNumber,
    req.ip
  );

  res.json({ success: true, message: 'Bilan prescription deleted' });
});

// ==========================================
// TREATMENT MONITORING ENDPOINTS
// ==========================================

// Get Treatments
app.get('/api/treatments', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patientId = req.query.patientId as string;
  const status = req.query.status as string;
  const adherence = req.query.adherence as string;
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let list = db.getTreatments();

  if (patientId) {
    list = list.filter(t => t.patientId === patientId);
  }

  if (status && status !== 'all') {
    list = list.filter(t => t.status === status);
  }

  if (adherence && adherence !== 'all') {
    list = list.filter(t => t.adherence === adherence);
  }

  if (search) {
    list = list.filter(t =>
      (t.patientName && t.patientName.toLowerCase().includes(search)) ||
      (t.medicationName && t.medicationName.toLowerCase().includes(search)) ||
      (t.notes && t.notes.toLowerCase().includes(search)) ||
      (t.prescriptionNumber && t.prescriptionNumber.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Create Treatment Manually
app.post('/api/treatments', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { patientId, medicationName, dose, frequency } = req.body;
  if (!patientId || !medicationName || !dose) {
    return res.status(400).json({ error: 'Patient ID, Medication Name, and Dose are required' });
  }

  const patient = db.getPatientById(patientId);
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : (req.body.patientName || 'Patient Inconnu');

  const newTrt = db.createTreatment({
    ...req.body,
    patientId,
    patientName,
    medicationName,
    dose,
    frequency: frequency || '1x par jour'
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'TREATMENT',
    `Created treatment monitoring regimen ${newTrt.id} (${newTrt.medicationName}) for ${newTrt.patientName}.`,
    newTrt.id,
    newTrt.medicationName,
    req.ip
  );

  res.status(201).json(newTrt);
});

// Update Treatment (Status, Adherence, Notes)
app.patch('/api/treatments/:id', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateTreatment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Treatment not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'TREATMENT',
    `Updated treatment ${updated.id} (${updated.medicationName}) for patient ${updated.patientName}. Status: ${updated.status}.`,
    updated.id,
    updated.medicationName,
    req.ip
  );

  res.json(updated);
});

// Add Dose Change to Treatment
app.post('/api/treatments/:id/dose-change', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const { previousDose, newDose, reason } = req.body;
  if (!newDose || !newDose.trim()) {
    return res.status(400).json({ error: 'New prescribed dose is required' });
  }

  const prev = previousDose || 'Dose initiale';
  const reasonText = (reason && reason.trim()) || 'Ajustement posologique clinique';

  const updated = db.addTreatmentDoseChange(req.params.id, { previousDose: prev, newDose: newDose.trim(), reason: reasonText });
  if (!updated) return res.status(404).json({ error: 'Treatment not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'TREATMENT',
    `Modified dose for ${updated.medicationName} from ${prev} to ${newDose}. Reason: ${reasonText}.`,
    updated.id,
    updated.medicationName,
    req.ip
  );

  res.json(updated);
});

// Extend Treatment Duration
app.post('/api/treatments/:id/extend', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { additionalDays } = req.body;
  const days = parseInt(additionalDays, 10) || 14;
  const updated = db.extendTreatment(req.params.id, days);
  if (!updated) return res.status(404).json({ error: 'Treatment not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'TREATMENT',
    `Extended treatment ${updated.medicationName} by ${days} days for ${updated.patientName}.`,
    updated.id,
    updated.medicationName,
    req.ip
  );

  res.json(updated);
});

// Log Treatment Side Effect
app.post('/api/treatments/:id/side-effect', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { description, severity } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Side effect description is required' });
  }

  const updated = db.addTreatmentSideEffect(req.params.id, { description: description.trim(), severity: severity || 'mild' });
  if (!updated) return res.status(404).json({ error: 'Treatment not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'TREATMENT',
    `Reported adverse side effect for ${updated.medicationName}: "${description.trim()}" (${severity || 'mild'}).`,
    updated.id,
    updated.medicationName,
    req.ip
  );

  res.json(updated);
});

// ==========================================
// FOLLOW-UP CALENDAR ENDPOINTS
// ==========================================

// Get Follow-ups
app.get('/api/follow-ups', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patientId = req.query.patientId as string;
  const status = req.query.status as string;

  let list = db.getFollowUps();

  if (patientId) {
    list = list.filter(f => f.patientId === patientId);
  }

  if (status && status !== 'all') {
    list = list.filter(f => f.status === status);
  }

  // Sort chronologically
  list.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  res.json(list);
});

// Create Follow-up
app.post('/api/follow-ups', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const { patientId, treatmentId, date, time, type, reason, notes } = req.body;
  if (!patientId || !date || !reason) {
    return res.status(400).json({ error: 'Patient, date, and reason are required' });
  }

  const patient = db.getPatientById(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const newFollowUp = db.createFollowUp({
    patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    treatmentId,
    date,
    time: time || '09:00',
    type: type || 'in_person',
    reason,
    status: 'scheduled',
    notes: notes || ''
  });

  // Update patient's next follow-up date
  db.updatePatient(patientId, { nextFollowUp: date });

  recordAuditLog(
    req.user!,
    'CREATE',
    'FOLLOWUP',
    `Scheduled follow-up for patient ${patient.firstName} ${patient.lastName} on ${date}. Reason: ${reason}.`,
    newFollowUp.id,
    patient.lastName,
    req.ip
  );

  res.status(201).json(newFollowUp);
});

// Update Follow-up
app.patch('/api/follow-ups/:id', authMiddleware, requireRole('admin', 'doctor', 'assistant'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateFollowUp(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Follow-up not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'FOLLOWUP',
    `Updated follow-up ${updated.id} status to ${updated.status}.`,
    updated.id,
    updated.patientName,
    req.ip
  );

  res.json(updated);
});

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

app.get('/api/reports/summary', authMiddleware, (req: AuthenticatedRequest, res) => {
  const patients = db.getPatients();
  const treatments = db.getTreatments();
  const prescriptions = db.getPrescriptions();
  const followUps = db.getFollowUps();
  const medications = db.getMedications();

  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const archivedPatients = patients.filter(p => p.status === 'archived').length;

  const activeTreatments = treatments.filter(t => t.status === 'active').length;
  const needsReviewTreatments = treatments.filter(t => t.status === 'needs_review').length;
  const endingSoonTreatments = treatments.filter(t => t.status === 'ending_soon').length;
  const completedTreatments = treatments.filter(t => t.status === 'completed').length;

  // Prescriptions this month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prescriptionsThisMonth = prescriptions.filter(p => p.date.startsWith(currentMonthStr)).length;

  // Follow-ups breakdown
  const todayStr = now.toISOString().split('T')[0];
  const upcomingFollowUps = followUps.filter(f => f.status === 'scheduled' && f.date >= todayStr).length;
  const overdueFollowUps = followUps.filter(f => f.status === 'scheduled' && f.date < todayStr).length;
  const completedFollowUps = followUps.filter(f => f.status === 'completed').length;

  // Medication popularity
  const medCounts: Record<string, { name: string; category: string; count: number }> = {};
  prescriptions.forEach(p => {
    p.items.forEach(item => {
      const key = item.medicationName;
      if (!medCounts[key]) {
        medCounts[key] = {
          name: key,
          category: item.route || 'General',
          count: 0
        };
      }
      medCounts[key].count++;
    });
  });

  const topMedications = Object.values(medCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Adherence breakdown
  const adherenceOptimal = treatments.filter(t => t.adherence === 'optimal').length;
  const adherenceModerate = treatments.filter(t => t.adherence === 'moderate').length;
  const adherencePoor = treatments.filter(t => t.adherence === 'poor').length;

  res.json({
    metrics: {
      totalPatients,
      activePatients,
      archivedPatients,
      activeTreatments,
      needsReviewTreatments,
      endingSoonTreatments,
      completedTreatments,
      totalPrescriptions: prescriptions.length,
      prescriptionsThisMonth,
      upcomingFollowUps,
      overdueFollowUps,
      completedFollowUps,
      totalMedications: medications.length,
      favoriteMedications: medications.filter(m => m.isFavorite).length
    },
    topMedications,
    adherenceDistribution: {
      optimal: adherenceOptimal,
      moderate: adherenceModerate,
      poor: adherencePoor
    },
    recentPrescriptions: prescriptions.slice(0, 5),
    recentTreatments: treatments.slice(0, 5)
  });
});

// ==========================================
// CLINICAL & DOCTOR NOTES
// ==========================================

app.get('/api/notes', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json(db.getDoctorNotes());
});

app.get('/api/notes/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const note = db.getDoctorNoteById(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

app.post('/api/notes', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, content, category, patientId, patientName, isPinned, color, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newNote = db.createDoctorNote({
    title,
    content,
    category: category || 'clinical',
    patientId: patientId || undefined,
    patientName: patientName || undefined,
    isPinned: Boolean(isPinned),
    color: color || 'teal',
    tags: Array.isArray(tags) ? tags : [],
    authorName: req.user?.name || 'Dr. Oussama Belouar'
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'NOTE',
    `Created clinical note "${newNote.title}"`,
    newNote.id,
    newNote.title,
    req.ip
  );

  res.status(201).json(newNote);
});

app.put('/api/notes/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const existing = db.getDoctorNoteById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  const updated = db.updateDoctorNote(req.params.id, req.body);
  if (!updated) return res.status(500).json({ error: 'Failed to update note' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'NOTE',
    `Updated clinical note "${updated.title}"`,
    updated.id,
    updated.title,
    req.ip
  );

  res.json(updated);
});

app.delete('/api/notes/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const existing = db.getDoctorNoteById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  const ok = db.deleteDoctorNote(req.params.id);
  if (!ok) return res.status(500).json({ error: 'Failed to delete note' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'NOTE',
    `Deleted clinical note "${existing.title}"`,
    existing.id,
    existing.title,
    req.ip
  );

  res.json({ success: true, message: 'Note deleted successfully' });
});

// ==========================================
// GLOBAL SEARCH
// ==========================================

app.get('/api/search', authMiddleware, (req: AuthenticatedRequest, res) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) return res.json({ patients: [], prescriptions: [], medications: [], treatments: [] });

  const patients = db.getPatients().filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    p.diagnosis.toLowerCase().includes(q) ||
    p.phone.includes(q)
  ).slice(0, 5);

  const prescriptions = db.getPrescriptions().filter(p =>
    p.prescriptionNumber.toLowerCase().includes(q) ||
    p.patientName.toLowerCase().includes(q) ||
    p.items.some(i => i.medicationName.toLowerCase().includes(q))
  ).slice(0, 5);

  const medications = db.getMedications().filter(m =>
    m.genericName.toLowerCase().includes(q) ||
    m.brandName.toLowerCase().includes(q) ||
    m.activeIngredient.toLowerCase().includes(q)
  ).slice(0, 6);

  const treatments = db.getTreatments().filter(t =>
    t.patientName.toLowerCase().includes(q) ||
    t.medicationName.toLowerCase().includes(q)
  ).slice(0, 5);

  res.json({ patients, prescriptions, medications, treatments });
});

// ==========================================
// ADMIN-ONLY MANAGEMENT ENDPOINTS
// ==========================================

// Users list (Admin only)
app.get('/api/admin/users', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  res.json(db.getUsers());
});

// Create User (Admin only)
app.post('/api/admin/users', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { username, password, email, name, role, specialty, licenseNumber } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Username, password, name, and role are required' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = db.createUser({
    username,
    email: email || `${username}@ordocare.health`,
    name,
    role,
    specialty: specialty || '',
    licenseNumber: licenseNumber || '',
    status: 'active',
    passwordHash: hash,
    salt
  });

  const { passwordHash, salt: s, ...safe } = newUser;
  recordAuditLog(
    req.user!,
    'CREATE',
    'USER',
    `Created new staff account for ${name} with role ${role}.`,
    safe.id,
    safe.name,
    req.ip
  );

  res.status(201).json(safe);
});

// Update User status / role (Admin only)
app.patch('/api/admin/users/:id', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { role, status, name, specialty, licenseNumber, newPassword } = req.body;
  const updates: any = {};
  if (role) updates.role = role;
  if (status) updates.status = status;
  if (name) updates.name = name;
  if (specialty !== undefined) updates.specialty = specialty;
  if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
  if (newPassword) {
    const { hash, salt } = hashPassword(newPassword);
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  const updated = db.updateUser(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  recordAuditLog(
    req.user!,
    'UPDATE',
    'USER',
    `Updated staff user account ${updated.name} (${updated.id}).`,
    updated.id,
    updated.name,
    req.ip
  );

  res.json(updated);
});

// Delete User (Admin only)
app.delete('/api/admin/users/:id', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete own active administrator account' });
  }

  const target = db.getUserById(req.params.id);
  const ok = db.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'User not found' });

  recordAuditLog(
    req.user!,
    'DELETE',
    'USER',
    `Deleted staff account ${target?.name} (${req.params.id}).`,
    req.params.id,
    target?.name,
    req.ip
  );

  res.json({ success: true, message: 'User deleted' });
});

// Audit Logs (Admin only)
app.get('/api/admin/audit-logs', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;

  let logs = db.getAuditLogs();

  if (entityType && entityType !== 'all') {
    logs = logs.filter(l => l.entityType === entityType);
  }

  if (action && action !== 'all') {
    logs = logs.filter(l => l.action === action);
  }

  res.json(logs);
});

// Clinic Settings
app.get('/api/settings/clinic', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json(db.getClinicSettings());
});

app.put('/api/settings/clinic', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateClinicSettings(req.body);
  recordAuditLog(
    req.user!,
    'UPDATE',
    'SETTINGS',
    'Updated clinic branding, header notes, and disclaimer settings.',
    undefined,
    undefined,
    req.ip
  );
  res.json(updated);
});

// Doctor Profile Settings
app.get('/api/settings/doctor', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json(db.getDoctorProfile());
});

app.put('/api/settings/doctor', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const updated = db.updateDoctorProfile(req.body);
  recordAuditLog(
    req.user!,
    'UPDATE',
    'SETTINGS',
    `Updated doctor clinical credentials for ${updated.name}.`,
    undefined,
    undefined,
    req.ip
  );
  res.json(updated);
});

// Full Backup Export (Admin only)
app.get('/api/admin/backup-export', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  recordAuditLog(
    req.user!,
    'EXPORT',
    'SETTINGS',
    'Exported full encrypted clinical snapshot backup.',
    undefined,
    undefined,
    req.ip
  );

  res.json({
    exportDate: new Date().toISOString(),
    system: 'OrdoCare Clinical Suite',
    patients: db.getPatients(),
    medications: db.getMedications(),
    prescriptions: db.getPrescriptions(),
    treatments: db.getTreatments(),
    followUps: db.getFollowUps(),
    clinicSettings: db.getClinicSettings(),
    doctorProfile: db.getDoctorProfile()
  });
});

// Duplicate Prescription
app.post('/api/prescriptions/:id/duplicate', authMiddleware, requireRole('admin', 'doctor'), (req: AuthenticatedRequest, res) => {
  const original = db.getPrescriptionById(req.params.id);
  if (!original) return res.status(404).json({ error: 'Prescription not found' });

  const duplicated = db.createPrescription({
    patientId: original.patientId,
    patientName: original.patientName,
    patientDob: original.patientDob,
    patientAge: original.patientAge,
    patientSex: original.patientSex,
    patientInsurance: original.patientInsurance,
    patientDiagnosis: original.patientDiagnosis,
    doctorName: req.user!.name || original.doctorName,
    doctorSpecialty: req.user!.specialty || original.doctorSpecialty,
    doctorLicense: req.user!.licenseNumber || original.doctorLicense,
    clinicName: original.clinicName,
    clinicAddress: original.clinicAddress,
    clinicPhone: original.clinicPhone,
    clinicEmail: original.clinicEmail,
    date: new Date().toISOString().split('T')[0],
    status: 'active',
    items: [...original.items],
    additionalInstructions: original.additionalInstructions,
    doctorSignatureText: req.user!.name || original.doctorSignatureText,
    doctorSignatureDate: new Date().toISOString().split('T')[0]
  });

  recordAuditLog(
    req.user!,
    'CREATE',
    'PRESCRIPTION',
    `Reissued/duplicated prescription ${original.prescriptionNumber} as ${duplicated.prescriptionNumber}.`,
    duplicated.id,
    duplicated.prescriptionNumber,
    req.ip
  );

  res.status(201).json(duplicated);
});

// Change Admin Master Code (Admin only)
app.post('/api/admin/change-code', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { currentCode, newCode } = req.body;
  if (!currentCode || !newCode) {
    return res.status(400).json({ error: 'Current code and new code are required' });
  }

  if (!verifyAdminAccessCode(currentCode)) {
    return res.status(401).json({ error: 'Current administrator access code is incorrect' });
  }

  if (newCode.length < 6) {
    return res.status(400).json({ error: 'New access code must be at least 6 characters' });
  }

  updateAdminAccessCode(newCode);

  recordAuditLog(
    req.user!,
    'UPDATE',
    'AUTH',
    'Master administrator access code was updated.',
    undefined,
    undefined,
    req.ip
  );

  res.json({ success: true, message: 'Administrator access code updated successfully' });
});

// Change Password for Logged-In User
app.post('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  const user = db.getUserRawById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = verifyPassword(currentPassword, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: newHash, salt: newSalt } as any);

  recordAuditLog(
    req.user!,
    'UPDATE',
    'USER',
    `User ${user.username} updated their password.`,
    user.id,
    user.name,
    req.ip
  );

  res.json({ success: true, message: 'Password changed successfully' });
});

// Reset Staff Password (Admin only)
app.post('/api/admin/users/:id/reset-password', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const target = db.getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(target.id, { passwordHash: hash, salt } as any);

  recordAuditLog(
    req.user!,
    'UPDATE',
    'AUTH',
    `Admin reset password for user ${target.username} (${target.name}).`,
    target.id,
    target.name,
    req.ip
  );

  res.json({ success: true, message: `Password reset successfully for ${target.name}` });
});

// Serve public static assets (including ordonnance-template.png)
app.use(express.static(path.join(process.cwd(), 'public')));

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OrdoCare] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
