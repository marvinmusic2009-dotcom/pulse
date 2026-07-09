// Database Simulation Service for "Pulse" (School Sickbay Management System)
import { supabase } from './supabaseClient';

export interface School {
  id: string;
  name: string;
  logo_url: string; // Base64 or standard URL placeholder
  primary_color: string;
  secondary_color: string;
  created_at: string;
  theme_preset?: string;
  font_preset?: string;
  clinic_address?: string;
  clinic_email?: string;
  clinic_phone?: string;
  clinic_beds?: number;
  low_stock_limit?: number;
  custom_css?: string;
  cloud_sync_enabled?: boolean;
  cloud_sync_token?: string;
}

export interface User {
  id: string;
  school_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'Admin' | 'Nurse' | 'Doctor' | 'Clerk';
  status: 'approved' | 'pending';
  avatar_url?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  school_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
}

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Patient {
  id: string;
  school_id: string;
  student_id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string; // YYYY-MM-DD
  class_name: string;
  avatar_url?: string;
  allergies: Allergy[];
  ongoing_conditions: string[];
  regular_medications: string[];
  documents?: PatientDocument[];
  created_at: string;
}

export interface PatientDocument {
  id: string;
  name: string;
  file_type: string; // e.g., 'image/png', 'application/pdf'
  uploaded_at: string;
  file_size: string; // e.g., '1.2 MB'
  file_data: string; // base64 representation
}

export interface TreatmentItem {
  name: string;
  dosage: string;
  quantity: number; // For inventory deduction
}

export interface Visit {
  id: string;
  school_id: string;
  patient_id: string;
  visit_date: string; // ISO DateTime
  symptoms: string[];
  temperature: number; // Celsius
  observed_signs: string;
  treatments_medicines: TreatmentItem[];
  notes: string;
  created_by: string; // user_id (full_name saved)
  created_at: string;
}

export interface DrugSchedule {
  id: string;
  school_id: string;
  patient_id: string;
  drug_name: string;
  dosage: string;
  frequency: string; // e.g. "Once Daily", "Twice Daily"
  times: string[]; // e.g. ["08:00", "15:00"]
  start_date: string;
  end_date: string;
  active: boolean;
  is_prn?: boolean;
  special_instructions?: string;
}

export interface DrugLog {
  id: string;
  school_id: string;
  patient_id: string;
  schedule_id: string;
  drug_name: string;
  dose: string;
  time_administered: string; // HH:MM
  status: 'given' | 'missed' | 'refused' | 'na';
  administrator_id: string; // user_id
  administrator_name: string;
  notes: string;
  logged_date: string; // YYYY-MM-DD
  special_case?: 'none' | 'refused' | 'vomited' | 'adverse_reaction' | 'prn_emergency';
}

export interface InventoryItem {
  id: string;
  school_id: string;
  drug_name: string;
  quantity: number;
  unit: string; // e.g. "tabs", "ml", "bottles", "capsules"
  reorder_level: number;
  expiry_date: string; // YYYY-MM-DD
}

export interface Appointment {
  id: string;
  school_id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Vaccination {
  id: string;
  school_id: string;
  patient_id: string;
  vaccine_name: string;
  date_given?: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: 'completed' | 'scheduled' | 'overdue';
}

export interface LabResult {
  id: string;
  school_id: string;
  patient_id: string;
  test_name: string; // "Malaria RDT", "Hemoglobin", "Blood Pressure", "Temperature", "Blood Glucose"
  result_value: string;
  notes: string;
  date_recorded: string; // YYYY-MM-DD
}

export interface AuditLog {
  id: string;
  school_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  timestamp: string; // ISO
}

export interface Reminder {
  id: string;
  type: 'low_stock' | 'vaccination_overdue' | 'appointment_upcoming' | 'missed_dose';
  title: string;
  description: string;
  target_id: string; // associated record ID
  date: string;
}

export interface NurseReport {
  id: string;
  school_id: string;
  nurse_name: string;
  title: string;
  category: 'Shift Handover' | 'Incident' | 'Daily Summary' | 'Inventory Request';
  urgency: 'Low' | 'Medium' | 'High';
  content: string;
  created_at: string;
  status: 'pending' | 'acknowledged';
  acknowledged_by?: string;
  acknowledged_at?: string;
}

// Local Storage Keys
const KEYS = {
  SCHOOLS: 'pulse_schools',
  USERS: 'pulse_users',
  PATIENTS: 'pulse_patients',
  VISITS: 'pulse_visits',
  DRUG_SCHEDULES: 'pulse_drug_schedules',
  DRUG_LOGS: 'pulse_drug_logs',
  INVENTORY: 'pulse_inventory',
  APPOINTMENTS: 'pulse_appointments',
  VACCINATIONS: 'pulse_vaccinations',
  LAB_RESULTS: 'pulse_lab_results',
  AUDIT_LOGS: 'pulse_audit_logs',
  CURRENT_USER: 'pulse_current_user',
  REPORTS: 'pulse_reports',
  CHAT_MESSAGES: 'pulse_chat_messages',
};

// Seed Data
const SEED_SCHOOLS: School[] = [
  {
    id: 'school-greenwood',
    name: 'Greenwood Academy',
    logo_url: '',
    primary_color: '#0284c7',
    secondary_color: '#0f172a',
    created_at: new Date().toISOString(),
    theme_preset: 'modern',
    font_preset: 'inter',
    clinic_address: '100 School Lane, Greenwood',
    clinic_email: 'sickbay@greenwood.edu',
    clinic_phone: '+1 (555) 019-2834',
    clinic_beds: 4,
    low_stock_limit: 15,
  },
  {
    id: 'school-oakridge',
    name: 'Oakridge High School',
    logo_url: '',
    primary_color: '#16a34a',
    secondary_color: '#1e293b',
    created_at: new Date().toISOString(),
    theme_preset: 'friendly',
    font_preset: 'outfit',
    clinic_address: '400 Oakridge Parkway, Oakridge',
    clinic_email: 'clinic@oakridge.edu',
    clinic_phone: '+1 (555) 045-6789',
    clinic_beds: 6,
    low_stock_limit: 10,
  }
];

const SEED_USERS: User[] = [
  {
    id: 'user-gw-nurse',
    school_id: 'school-greenwood',
    email: 'nurse@greenwood.edu',
    password_hash: 'password123',
    full_name: 'Nurse Chen',
    role: 'Nurse',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-gw-admin',
    school_id: 'school-greenwood',
    email: 'admin@greenwood.edu',
    password_hash: 'password123',
    full_name: 'Admin Jenkins',
    role: 'Admin',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-gw-doctor',
    school_id: 'school-greenwood',
    email: 'doctor@greenwood.edu',
    password_hash: 'password123',
    full_name: 'Doctor Vance',
    role: 'Doctor',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-gw-clerk',
    school_id: 'school-greenwood',
    email: 'clerk@greenwood.edu',
    password_hash: 'password123',
    full_name: 'Clerk Patel',
    role: 'Clerk',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-or-admin',
    school_id: 'school-oakridge',
    email: 'admin@oakridge.edu',
    password_hash: 'password123',
    full_name: 'Admin Carter',
    role: 'Admin',
    status: 'approved',
    created_at: new Date().toISOString()
  }
];

const SEED_PATIENTS: Patient[] = [
  {
    id: 'pt-gw-liam',
    school_id: 'school-greenwood',
    student_id: 'GW-101',
    name: "Liam O'Connor",
    gender: 'Male',
    dob: '2012-05-14',
    class_name: 'Grade 7A',
    allergies: [
      { allergen: 'Penicillin', severity: 'severe' }
    ],
    ongoing_conditions: ['Asthma'],
    regular_medications: ['Salbutamol Inhaler (PRN)'],
    created_at: new Date().toISOString()
  },
  {
    id: 'pt-gw-emma',
    school_id: 'school-greenwood',
    student_id: 'GW-102',
    name: 'Emma Watson',
    gender: 'Female',
    dob: '2013-09-22',
    class_name: 'Grade 6B',
    allergies: [
      { allergen: 'Peanuts', severity: 'severe' }
    ],
    ongoing_conditions: [],
    regular_medications: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'pt-gw-noah',
    school_id: 'school-greenwood',
    student_id: 'GW-103',
    name: 'Noah Miller',
    gender: 'Male',
    dob: '2011-03-08',
    class_name: 'Grade 8A',
    allergies: [],
    ongoing_conditions: ['Type 1 Diabetes'],
    regular_medications: ['Insulin (Daily)'],
    created_at: new Date().toISOString()
  },
  {
    id: 'pt-gw-sophia',
    school_id: 'school-greenwood',
    student_id: 'GW-104',
    name: 'Sophia Davis',
    gender: 'Female',
    dob: '2012-11-05',
    class_name: 'Grade 7B',
    allergies: [
      { allergen: 'Aspirin', severity: 'moderate' }
    ],
    ongoing_conditions: [],
    regular_medications: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'pt-gw-mason',
    school_id: 'school-greenwood',
    student_id: 'GW-105',
    name: 'Mason Wilson',
    gender: 'Male',
    dob: '2014-07-19',
    class_name: 'Grade 5A',
    allergies: [],
    ongoing_conditions: [],
    regular_medications: [],
    created_at: new Date().toISOString()
  }
];

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-gw-para',
    school_id: 'school-greenwood',
    drug_name: 'Paracetamol 500mg',
    quantity: 120,
    unit: 'tabs',
    reorder_level: 30,
    expiry_date: '2027-12-01'
  },
  {
    id: 'inv-gw-ibu',
    school_id: 'school-greenwood',
    drug_name: 'Ibuprofen 200mg',
    quantity: 12,
    unit: 'tabs',
    reorder_level: 25,
    expiry_date: '2027-06-15'
  },
  {
    id: 'inv-gw-amox',
    school_id: 'school-greenwood',
    drug_name: 'Amoxicillin 250mg',
    quantity: 45,
    unit: 'capsules',
    reorder_level: 20,
    expiry_date: '2026-09-30'
  },
  {
    id: 'inv-gw-cet',
    school_id: 'school-greenwood',
    drug_name: 'Cetirizine 10mg',
    quantity: 80,
    unit: 'tabs',
    reorder_level: 20,
    expiry_date: '2028-01-10'
  },
  {
    id: 'inv-gw-salb',
    school_id: 'school-greenwood',
    drug_name: 'Salbutamol Inhaler',
    quantity: 3,
    unit: 'bottles',
    reorder_level: 5,
    expiry_date: '2027-10-05'
  }
];

const SEED_DRUG_SCHEDULES: DrugSchedule[] = [
  {
    id: 'sched-gw-noah-insulin',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-noah',
    drug_name: 'Insulin',
    dosage: '5 units',
    frequency: 'Twice Daily',
    times: ['08:00', '18:00'],
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    active: true,
    special_instructions: 'Administer subcutaneously before meals. Monitor blood sugar.'
  }
];

const SEED_VACCINATIONS: Vaccination[] = [
  {
    id: 'vac-gw-emma-dtap',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-emma',
    vaccine_name: 'DTaP Booster',
    due_date: '2026-06-01',
    status: 'overdue'
  },
  {
    id: 'vac-gw-liam-flu',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-liam',
    vaccine_name: 'Influenza Vaccine',
    due_date: '2026-10-15',
    status: 'scheduled'
  }
];

const SEED_VISITS: Visit[] = [
  {
    id: 'visit-gw-liam-asthma',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-liam',
    visit_date: '2026-06-30T10:15:00.000Z',
    symptoms: ['Coughing', 'Shortness of breath'],
    temperature: 36.8,
    observed_signs: 'Wheezing heard on chest auscultation. Moderate distress.',
    treatments_medicines: [
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', quantity: 1 }
    ],
    notes: 'Student came in complaining of difficulty breathing after gym class. Administered Salbutamol. Symptoms resolved after 15 minutes rest.',
    created_by: 'Nurse Chen',
    created_at: '2026-06-30T10:30:00.000Z'
  },
  {
    id: 'visit-gw-emma-headache',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-emma',
    visit_date: '2026-07-01T14:20:00.000Z',
    symptoms: ['Headache'],
    temperature: 37.1,
    observed_signs: 'Slight fatigue, no fever.',
    treatments_medicines: [
      { name: 'Paracetamol 500mg', dosage: '1 tablet', quantity: 1 }
    ],
    notes: 'Student reported mild headache. Given water and Paracetamol. Returned to class after 20 minutes.',
    created_by: 'Nurse Chen',
    created_at: '2026-07-01T14:45:00.000Z'
  },
  {
    id: 'visit-gw-mason-fever',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-mason',
    visit_date: '2026-07-02T09:00:00.000Z',
    symptoms: ['Fever', 'Fatigue'],
    temperature: 38.5,
    observed_signs: 'Warm to touch, sluggish movement.',
    treatments_medicines: [
      { name: 'Paracetamol 500mg', dosage: '1 tablet', quantity: 1 }
    ],
    notes: 'High fever recorded. Parents contacted for pick-up. Rested in sickbay bed 2.',
    created_by: 'Nurse Chen',
    created_at: '2026-07-02T09:15:00.000Z'
  }
];

const SEED_LAB_RESULTS: LabResult[] = [
  {
    id: 'lab-gw-mason-malaria',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-mason',
    test_name: 'Malaria RDT',
    result_value: 'Negative',
    notes: 'Rapid Diagnostic Test for malaria performed due to high fever. Result negative.',
    date_recorded: '2026-07-02'
  }
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-gw-noah-checkup',
    school_id: 'school-greenwood',
    patient_id: 'pt-gw-noah',
    date: '2026-07-05',
    time: '10:00',
    reason: 'Monthly blood glucose monitoring check-in and log review.',
    status: 'scheduled'
  }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-gw-init',
    school_id: 'school-greenwood',
    user_id: 'user-gw-admin',
    user_name: 'Admin Jenkins',
    action: 'System Initialized',
    details: 'Initial database seeding completed successfully.',
    timestamp: '2026-06-01T08:00:00.000Z'
  }
];

// Helper to generate UUID
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Database initializer
export function initializeDB(): void {
  const getOrSet = (key: string, seed: any) => {
    const existing = localStorage.getItem(key);
    if (!existing || existing === '[]') {
      localStorage.setItem(key, JSON.stringify(seed));
    }
  };

  getOrSet(KEYS.SCHOOLS, SEED_SCHOOLS);
  getOrSet(KEYS.USERS, SEED_USERS);
  getOrSet(KEYS.PATIENTS, SEED_PATIENTS);
  getOrSet(KEYS.VISITS, SEED_VISITS);
  getOrSet(KEYS.DRUG_SCHEDULES, SEED_DRUG_SCHEDULES);
  getOrSet(KEYS.DRUG_LOGS, []);
  getOrSet(KEYS.INVENTORY, SEED_INVENTORY);
  getOrSet(KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  getOrSet(KEYS.VACCINATIONS, SEED_VACCINATIONS);
  getOrSet(KEYS.LAB_RESULTS, SEED_LAB_RESULTS);
  getOrSet(KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  getOrSet(KEYS.REPORTS, []);
  getOrSet(KEYS.CHAT_MESSAGES, []);
}

// Generic Getter
function getTable<T>(key: string): T[] {
  initializeDB();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Generic Setter
function setTable<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  
  // Background push if cloud sync is enabled
  try {
    const userJson = localStorage.getItem(KEYS.CURRENT_USER);
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      const schoolListJson = localStorage.getItem(KEYS.SCHOOLS);
      if (schoolListJson && user.school_id) {
        const schools = JSON.parse(schoolListJson) as School[];
        const activeSchool = schools.find(s => s.id === user.school_id);
        if (activeSchool && activeSchool.cloud_sync_enabled && activeSchool.cloud_sync_token) {
          dbService.pushSchoolCloudState(activeSchool.id).catch(err => {
            console.error('Background cloud sync push error:', err);
          });
        }
      }
    }
  } catch (e) {
    console.error('Error triggering background sync:', e);
  }
}

// Audit logger helper
export function addAuditLog(schoolId: string, userId: string, userName: string, action: string, details: string): void {
  const logs = getTable<AuditLog>(KEYS.AUDIT_LOGS);
  const newLog: AuditLog = {
    id: uuidv4(),
    school_id: schoolId,
    user_id: userId,
    user_name: userName,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  setTable(KEYS.AUDIT_LOGS, logs);
}

// Dynamic theme color applier
export function applySchoolBranding(school: School): void {
  const root = document.documentElement;
  
  // Set primary colors
  root.style.setProperty('--color-primary', school.primary_color);
  // Calculate primary-hover (slightly darker) and primary-light (tint)
  root.style.setProperty('--color-primary-hover', adjustColorBrightness(school.primary_color, -15));
  root.style.setProperty('--color-primary-light', hexToRgba(school.primary_color, 0.1));

  // Set secondary colors
  root.style.setProperty('--color-secondary', school.secondary_color);
  root.style.setProperty('--color-secondary-hover', adjustColorBrightness(school.secondary_color, -15));
  root.style.setProperty('--color-secondary-light', hexToRgba(school.secondary_color, 0.1));

  // Font typography custom rules
  if (school.font_preset) {
    const fontFamilies: { [key: string]: string } = {
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      outfit: "'Outfit', sans-serif",
      poppins: "'Poppins', sans-serif",
      lexend: "'Lexend', sans-serif"
    };
    const family = fontFamilies[school.font_preset.toLowerCase()] || fontFamilies.inter;
    root.style.setProperty('--font-family', family);
    document.body.style.fontFamily = family;

    // Dynamically insert google fonts if not loaded
    const fontId = `google-font-${school.font_preset.toLowerCase()}`;
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${school.font_preset.charAt(0).toUpperCase() + school.font_preset.slice(1)}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }

  // Custom Override CSS Injection
  const customCssId = 'pulse-custom-css';
  let styleTag = document.getElementById(customCssId) as HTMLStyleElement | null;
  if (school.custom_css) {
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = customCssId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = school.custom_css;
  } else if (styleTag) {
    styleTag.textContent = '';
  }
}

// Utility to lighten/darken a hex color
function adjustColorBrightness(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(((R * (100 + percent)) / 100).toString());
  G = parseInt(((G * (100 + percent)) / 100).toString());
  B = parseInt(((B * (100 + percent)) / 100).toString());

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==========================================
// DB SERVICE METHODS (Multi-tenant scoped)
// ==========================================

export const dbService = {
  // --- AUTH & SCHOOLS ---
  getSchools(): School[] {
    return getTable<School>(KEYS.SCHOOLS);
  },

  getSchool(id: string): School | undefined {
    return this.getSchools().find(s => s.id === id);
  },

  updateSchool(schoolId: string, updates: Partial<School>): School {
    const schools = getTable<School>(KEYS.SCHOOLS);
    const index = schools.findIndex(s => s.id === schoolId);
    if (index === -1) throw new Error('School not found');

    const updatedSchool = { ...schools[index], ...updates };
    schools[index] = updatedSchool;
    setTable(KEYS.SCHOOLS, schools);

    // Apply updated colors immediately
    applySchoolBranding(updatedSchool);
    return updatedSchool;
  },

  async registerSchoolAdmin(schoolName: string, logoUrl: string, adminName: string, email: string, password_hash: string): Promise<{ school: School; admin: User }> {
    const schools = getTable<School>(KEYS.SCHOOLS);
    const users = getTable<User>(KEYS.USERS);

    // Verify unique email in local/Supabase
    try {
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
      if (existingUser || users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email is already registered.');
      }
    } catch (e: any) {
      if (e.message === 'Email is already registered.') throw e;
    }

    const schoolId = uuidv4();
    const newSchool: School = {
      id: schoolId,
      name: schoolName,
      logo_url: logoUrl || '',
      primary_color: '#0284c7', // Default sky blue
      secondary_color: '#0f172a', // Default slate
      created_at: new Date().toISOString(),
      cloud_sync_enabled: true,
      cloud_sync_token: schoolId,
    };

    const adminId = uuidv4();
    const newAdmin: User = {
      id: adminId,
      school_id: schoolId,
      email: email.toLowerCase(),
      password_hash,
      full_name: adminName,
      role: 'Admin',
      status: 'approved', // Auto-approved on creation
      created_at: new Date().toISOString(),
    };

    // Attempt Supabase insert
    try {
      const { error: schoolError } = await supabase.from('schools').insert(newSchool);
      if (schoolError) throw new Error(`School registration failed on server: ${schoolError.message}`);

      const { error: userError } = await supabase.from('users').insert(newAdmin);
      if (userError) throw new Error(`Admin user registration failed on server: ${userError.message}`);
    } catch (err: any) {
      console.error('Supabase registration error, saving locally only:', err);
    }

    schools.push(newSchool);
    users.push(newAdmin);

    setTable(KEYS.SCHOOLS, schools);
    setTable(KEYS.USERS, users);

    addAuditLog(schoolId, adminId, adminName, 'School Registered', `Registered school: ${schoolName} with admin: ${adminName}`);

    return { school: newSchool, admin: newAdmin };
  },

  async submitJoinRequest(schoolId: string, fullName: string, email: string, password_hash: string, role: User['role']): Promise<User> {
    const users = getTable<User>(KEYS.USERS);

    try {
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
      if (existingUser || users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email is already registered.');
      }
    } catch (e: any) {
      if (e.message === 'Email is already registered.') throw e;
    }

    const userId = uuidv4();
    const newUser: User = {
      id: userId,
      school_id: schoolId,
      email: email.toLowerCase(),
      password_hash,
      full_name: fullName,
      role,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('users').insert(newUser);
      if (error) throw new Error(`Join request failed on server: ${error.message}`);
    } catch (err) {
      console.error('Supabase join request error, saving locally only:', err);
    }

    users.push(newUser);
    setTable(KEYS.USERS, users);

    addAuditLog(schoolId, userId, fullName, 'Join School Request', `User ${fullName} requested access to join as ${role}.`);

    return newUser;
  },

  getPendingUsers(schoolId: string): User[] {
    return getTable<User>(KEYS.USERS).filter(u => u.school_id === schoolId && u.status === 'pending');
  },

  approveUser(schoolId: string, adminId: string, adminName: string, userId: string): void {
    const users = getTable<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === userId && u.school_id === schoolId);
    if (index === -1) throw new Error('User not found in this school');

    users[index].status = 'approved';
    setTable(KEYS.USERS, users);

    addAuditLog(schoolId, adminId, adminName, 'User Approved', `Approved user: ${users[index].full_name} (${users[index].role})`);
  },

  async rejectUser(schoolId: string, adminId: string, adminName: string, userId: string): Promise<void> {
    const users = getTable<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === userId && u.school_id === schoolId);
    if (index === -1) throw new Error('User not found in this school');

    const name = users[index].full_name;
    const role = users[index].role;
    users.splice(index, 1);
    setTable(KEYS.USERS, users);

    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (err) {
      console.error('Supabase rejectUser error:', err);
    }

    addAuditLog(schoolId, adminId, adminName, 'User Rejected', `Rejected and deleted join request for: ${name} (${role})`);
  },

  getUsers(schoolId: string): User[] {
    return getTable<User>(KEYS.USERS).filter(u => u.school_id === schoolId && u.status === 'approved');
  },

  async login(email: string, password_hash: string): Promise<User> {
    let user: User | null = null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password_hash', password_hash)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        user = data as User;
      }
    } catch (err) {
      console.warn('Supabase login failed, using local storage fallback...', err);
    }

    if (!user) {
      const users = getTable<User>(KEYS.USERS);
      const localUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password_hash === password_hash);
      if (!localUser) {
        throw new Error('Invalid email or password.');
      }
      user = localUser;
    }

    if (user && user.status === 'approved') {
      try {
        await this.pullSchoolCloudState(user.school_id);
      } catch (err) {
        console.error('Failed to sync school state on login:', err);
      }
    }

    return user;
  },

  async getSchoolsOnline(): Promise<School[]> {
    try {
      const { data, error } = await supabase.from('schools').select('*');
      if (error) throw error;
      if (data) {
        const localSchools = getTable<School>(KEYS.SCHOOLS);
        const mergedMap = new Map<string, School>();
        localSchools.forEach(s => mergedMap.set(s.id, s));
        data.forEach((s: any) => mergedMap.set(s.id, s));
        const merged = Array.from(mergedMap.values());
        localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load schools from Supabase, using local:', e);
    }
    return getTable<School>(KEYS.SCHOOLS);
  },

  // --- PATIENTS ---
  getPatients(schoolId: string): Patient[] {
    return getTable<Patient>(KEYS.PATIENTS).filter(p => p.school_id === schoolId);
  },

  getPatient(schoolId: string, patientId: string): Patient | undefined {
    return this.getPatients(schoolId).find(p => p.id === patientId);
  },

  addPatient(schoolId: string, adminId: string, adminName: string, patientData: Omit<Patient, 'id' | 'school_id' | 'created_at' | 'documents'>): Patient {
    const patients = getTable<Patient>(KEYS.PATIENTS);
    
    // Check Unique Student ID within the school
    if (patients.some(p => p.school_id === schoolId && p.student_id.toLowerCase() === patientData.student_id.toLowerCase())) {
      throw new Error(`Student ID ${patientData.student_id} already exists in this school.`);
    }

    const newPatient: Patient = {
      ...patientData,
      id: uuidv4(),
      school_id: schoolId,
      documents: [],
      created_at: new Date().toISOString(),
    };

    patients.push(newPatient);
    setTable(KEYS.PATIENTS, patients);

    addAuditLog(schoolId, adminId, adminName, 'Patient Added', `Added student: ${newPatient.name} (${newPatient.student_id})`);
    return newPatient;
  },

  updatePatient(schoolId: string, adminId: string, adminName: string, patientId: string, updates: Partial<Patient>): Patient {
    const patients = getTable<Patient>(KEYS.PATIENTS);
    const index = patients.findIndex(p => p.id === patientId && p.school_id === schoolId);
    if (index === -1) throw new Error('Patient not found');

    const updated = { ...patients[index], ...updates };
    patients[index] = updated;
    setTable(KEYS.PATIENTS, patients);

    addAuditLog(schoolId, adminId, adminName, 'Patient Updated', `Updated profile details for: ${updated.name}`);
    return updated;
  },

  async deletePatient(schoolId: string, adminId: string, adminName: string, patientId: string): Promise<void> {
    const patients = getTable<Patient>(KEYS.PATIENTS);
    const index = patients.findIndex(p => p.id === patientId && p.school_id === schoolId);
    if (index === -1) throw new Error('Patient not found');

    const name = patients[index].name;
    patients.splice(index, 1);
    setTable(KEYS.PATIENTS, patients);

    // Clean up associated records (visits, schedules, logs, etc.)
    const visits = getTable<Visit>(KEYS.VISITS).filter(v => v.patient_id !== patientId);
    setTable(KEYS.VISITS, visits);

    const schedules = getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES).filter(s => s.patient_id !== patientId);
    setTable(KEYS.DRUG_SCHEDULES, schedules);

    const logs = getTable<DrugLog>(KEYS.DRUG_LOGS).filter(l => l.patient_id !== patientId);
    setTable(KEYS.DRUG_LOGS, logs);

    try {
      await Promise.all([
        supabase.from('patients').delete().eq('id', patientId),
        supabase.from('visits').delete().eq('patient_id', patientId),
        supabase.from('drug_schedules').delete().eq('patient_id', patientId),
        supabase.from('drug_logs').delete().eq('patient_id', patientId),
      ]);
    } catch (err) {
      console.error('Supabase deletePatient error:', err);
    }

    addAuditLog(schoolId, adminId, adminName, 'Patient Deleted', `Deleted student record and files for: ${name}`);
  },

  // Document management (Simulated local base64 upload)
  uploadDocument(schoolId: string, userId: string, userName: string, patientId: string, doc: Omit<PatientDocument, 'id' | 'uploaded_at'>): PatientDocument {
    const patients = getTable<Patient>(KEYS.PATIENTS);
    const index = patients.findIndex(p => p.id === patientId && p.school_id === schoolId);
    if (index === -1) throw new Error('Patient not found');

    const newDoc: PatientDocument = {
      ...doc,
      id: uuidv4(),
      uploaded_at: new Date().toISOString(),
    };

    if (!patients[index].documents) {
      patients[index].documents = [];
    }
    patients[index].documents!.push(newDoc);
    setTable(KEYS.PATIENTS, patients);

    addAuditLog(schoolId, userId, userName, 'File Uploaded', `Uploaded document "${doc.name}" to patient file of ${patients[index].name}`);
    return newDoc;
  },

  deleteDocument(schoolId: string, userId: string, userName: string, patientId: string, docId: string): void {
    const patients = getTable<Patient>(KEYS.PATIENTS);
    const index = patients.findIndex(p => p.id === patientId && p.school_id === schoolId);
    if (index === -1) throw new Error('Patient not found');

    const docIndex = patients[index].documents?.findIndex(d => d.id === docId) ?? -1;
    if (docIndex === -1) throw new Error('Document not found');

    const docName = patients[index].documents![docIndex].name;
    patients[index].documents!.splice(docIndex, 1);
    setTable(KEYS.PATIENTS, patients);

    addAuditLog(schoolId, userId, userName, 'File Deleted', `Deleted document "${docName}" from patient file of ${patients[index].name}`);
  },

  // --- VISITS ---
  getVisits(schoolId: string, patientId?: string): Visit[] {
    let visits = getTable<Visit>(KEYS.VISITS).filter(v => v.school_id === schoolId);
    if (patientId) {
      visits = visits.filter(v => v.patient_id === patientId);
    }
    // Sort descending by date
    return visits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  },

  addVisit(schoolId: string, userId: string, userName: string, visitData: Omit<Visit, 'id' | 'school_id' | 'created_by' | 'created_at'>): Visit {
    // 1. Check Allergy Warnings first
    const patient = this.getPatient(schoolId, visitData.patient_id);
    if (!patient) throw new Error('Patient not found');

    for (const treatment of visitData.treatments_medicines) {
      const allergyWarning = this.checkAllergyWarning(patient, treatment.name);
      if (allergyWarning && allergyWarning.severity === 'severe') {
        throw new Error(`CRITICAL BLOCKED: Unsafe Action! Student ${patient.name} has a SEVERE allergy to "${allergyWarning.allergen}". Cannot administer/prescribe "${treatment.name}".`);
      }
    }

    // 2. Add Visit
    const visits = getTable<Visit>(KEYS.VISITS);
    const newVisit: Visit = {
      ...visitData,
      id: uuidv4(),
      school_id: schoolId,
      created_by: userName,
      created_at: new Date().toISOString(),
    };
    visits.push(newVisit);
    setTable(KEYS.VISITS, visits);

    // 3. Deduct Inventory & Add Dispensing Log
    for (const treatment of visitData.treatments_medicines) {
      if (treatment.quantity > 0) {
        try {
          this.updateInventoryQuantity(schoolId, userId, userName, treatment.name, -treatment.quantity, `${patient.name} (Visit: ${newVisit.id.substring(0,8)})`);
        } catch (e) {
          console.warn(`Could not deduct inventory for ${treatment.name}:`, e);
        }
      }
    }

    addAuditLog(schoolId, userId, userName, 'Visit Logged', `Logged sickbay visit for student: ${patient.name}`);
    return newVisit;
  },

  // Allergy warning checker helper
  checkAllergyWarning(patient: Patient, drugName: string): Allergy | null {
    if (!patient.allergies || patient.allergies.length === 0) return null;
    const normalizedDrug = drugName.toLowerCase();
    
    // Check penicillin family
    const penicillinDrugs = ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'cloxacillin'];
    const hasPenicillinAllergy = patient.allergies.find(a => a.allergen.toLowerCase() === 'penicillin');
    if (hasPenicillinAllergy && penicillinDrugs.some(d => normalizedDrug.includes(d))) {
      return hasPenicillinAllergy;
    }

    // Check NSAIDs / Aspirin family
    const aspirinDrugs = ['aspirin', 'ibuprofen', 'advil', 'nurofen', 'naproxen', 'diclofenac', 'voltaren'];
    const hasAspirinAllergy = patient.allergies.find(a => a.allergen.toLowerCase() === 'aspirin' || a.allergen.toLowerCase() === 'nsaid');
    if (hasAspirinAllergy && aspirinDrugs.some(d => normalizedDrug.includes(d))) {
      return hasAspirinAllergy;
    }

    // General string containment match
    for (const allergy of patient.allergies) {
      const allergen = allergy.allergen.toLowerCase();
      if (normalizedDrug.includes(allergen) || allergen.includes(normalizedDrug)) {
        return allergy;
      }
    }

    return null;
  },

  // --- INVENTORY / PHARMACY ---
  getInventory(schoolId: string): InventoryItem[] {
    return getTable<InventoryItem>(KEYS.INVENTORY).filter(i => i.school_id === schoolId);
  },

  addInventoryItem(schoolId: string, userId: string, userName: string, itemData: Omit<InventoryItem, 'id' | 'school_id'>): InventoryItem {
    const items = getTable<InventoryItem>(KEYS.INVENTORY);
    
    // Duplicate check
    const existingIndex = items.findIndex(i => i.school_id === schoolId && i.drug_name.toLowerCase() === itemData.drug_name.toLowerCase());
    if (existingIndex !== -1) {
      throw new Error(`Medication "${itemData.drug_name}" already exists in the inventory.`);
    }

    const newItem: InventoryItem = {
      ...itemData,
      id: uuidv4(),
      school_id: schoolId,
    };
    items.push(newItem);
    setTable(KEYS.INVENTORY, items);

    addAuditLog(schoolId, userId, userName, 'Inventory Item Added', `Added new stock item: ${newItem.drug_name} (${newItem.quantity} ${newItem.unit})`);
    return newItem;
  },

  updateInventoryItem(schoolId: string, userId: string, userName: string, itemId: string, updates: Partial<InventoryItem>): InventoryItem {
    const items = getTable<InventoryItem>(KEYS.INVENTORY);
    const index = items.findIndex(i => i.id === itemId && i.school_id === schoolId);
    if (index === -1) throw new Error('Inventory item not found');

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    setTable(KEYS.INVENTORY, items);

    addAuditLog(schoolId, userId, userName, 'Inventory Item Updated', `Updated stock details for: ${updated.drug_name}`);
    return updated;
  },

  updateInventoryQuantity(schoolId: string, userId: string, userName: string, drugName: string, delta: number, description: string): void {
    const items = getTable<InventoryItem>(KEYS.INVENTORY);
    // Find case-insensitively or by prefix
    const index = items.findIndex(i => i.school_id === schoolId && 
      (i.drug_name.toLowerCase() === drugName.toLowerCase() || 
       i.drug_name.toLowerCase().startsWith(drugName.toLowerCase()) ||
       drugName.toLowerCase().startsWith(i.drug_name.toLowerCase()))
    );

    if (index === -1) {
      console.warn(`Medication "${drugName}" not found in inventory to adjust quantity by ${delta}.`);
      return;
    }

    const item = items[index];
    const oldQty = item.quantity;
    item.quantity = Math.max(0, item.quantity + delta);
    setTable(KEYS.INVENTORY, items);

    addAuditLog(schoolId, userId, userName, 'Stock Adjusted', `Adjusted ${item.drug_name} stock: ${oldQty} -> ${item.quantity} (Reason: ${description})`);

    // Check low stock triggers
    if (item.quantity <= item.reorder_level && oldQty > item.reorder_level) {
      addAuditLog(schoolId, userId, userName, 'LOW STOCK ALERT', `${item.drug_name} is running low! Current stock: ${item.quantity} ${item.unit} (Reorder level: ${item.reorder_level})`);
    }
  },

  // --- DAILY DRUG MONITORING & SCHEDULES ---
  getDrugSchedules(schoolId: string, patientId?: string): DrugSchedule[] {
    let schedules = getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES).filter(s => s.school_id === schoolId);
    if (patientId) {
      schedules = schedules.filter(s => s.patient_id === patientId);
    }
    return schedules;
  },

  addDrugSchedule(schoolId: string, userId: string, userName: string, schedData: Omit<DrugSchedule, 'id' | 'school_id' | 'active'>): DrugSchedule {
    const schedules = getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES);
    const patient = this.getPatient(schoolId, schedData.patient_id);
    if (!patient) throw new Error('Patient not found');

    // Check allergy block
    const allergyWarning = this.checkAllergyWarning(patient, schedData.drug_name);
    if (allergyWarning && allergyWarning.severity === 'severe') {
      throw new Error(`CRITICAL ALLERGY ALERT: Student ${patient.name} has a SEVERE allergy to "${allergyWarning.allergen}". Prescribing "${schedData.drug_name}" is BLOCKED.`);
    }

    const newSched: DrugSchedule = {
      ...schedData,
      id: uuidv4(),
      school_id: schoolId,
      active: true,
    };
    schedules.push(newSched);
    setTable(KEYS.DRUG_SCHEDULES, schedules);

    addAuditLog(schoolId, userId, userName, 'Medication Scheduled', `Prescribed daily medication "${schedData.drug_name}" (${schedData.dosage}) for: ${patient.name}`);
    return newSched;
  },

  updateDrugSchedule(schoolId: string, userId: string, userName: string, id: string, active: boolean): void {
    const schedules = getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES);
    const index = schedules.findIndex(s => s.id === id && s.school_id === schoolId);
    if (index === -1) throw new Error('Schedule not found');

    schedules[index].active = active;
    setTable(KEYS.DRUG_SCHEDULES, schedules);

    const patient = this.getPatient(schoolId, schedules[index].patient_id);
    const patientName = patient ? patient.name : 'Unknown';
    addAuditLog(schoolId, userId, userName, active ? 'Schedule Activated' : 'Schedule Deactivated', `Medication schedule for ${schedules[index].drug_name} for ${patientName} set to ${active ? 'Active' : 'Inactive'}`);
  },

  getDrugLogs(schoolId: string, date: string, patientId?: string): DrugLog[] {
    let logs = getTable<DrugLog>(KEYS.DRUG_LOGS).filter(l => l.school_id === schoolId && l.logged_date === date);
    if (patientId) {
      logs = logs.filter(l => l.patient_id === patientId);
    }
    return logs;
  },

  logDrugAdministration(schoolId: string, userId: string, userName: string, logData: Omit<DrugLog, 'id' | 'school_id' | 'administrator_id' | 'administrator_name'>): DrugLog {
    const patient = this.getPatient(schoolId, logData.patient_id);
    if (!patient) throw new Error('Patient not found');

    // If "given", check allergy severe warning (double defense)
    if (logData.status === 'given') {
      const allergyWarning = this.checkAllergyWarning(patient, logData.drug_name);
      if (allergyWarning && allergyWarning.severity === 'severe') {
        throw new Error(`CRITICAL BLOCKED: Student ${patient.name} has a SEVERE allergy to "${allergyWarning.allergen}". Cannot administer "${logData.drug_name}".`);
      }
    }

    const logs = getTable<DrugLog>(KEYS.DRUG_LOGS);
    const newLog: DrugLog = {
      ...logData,
      id: uuidv4(),
      school_id: schoolId,
      administrator_id: userId,
      administrator_name: userName,
    };

    logs.push(newLog);
    setTable(KEYS.DRUG_LOGS, logs);

    // If status is 'given', automatically deduct stock (approximate quantity to 1 unit if not specified)
    if (logData.status === 'given') {
      this.updateInventoryQuantity(schoolId, userId, userName, logData.drug_name, -1, `${patient.name} (Daily Admin: ${newLog.id.substring(0, 8)})`);
    }

    addAuditLog(schoolId, userId, userName, 'Drug Admin Logged', `Logged daily dose of "${logData.drug_name}" for ${patient.name} as [${logData.status.toUpperCase()}]`);
    return newLog;
  },

  // --- APPOINTMENTS ---
  getAppointments(schoolId: string): Appointment[] {
    return getTable<Appointment>(KEYS.APPOINTMENTS).filter(a => a.school_id === schoolId);
  },

  addAppointment(schoolId: string, userId: string, userName: string, data: Omit<Appointment, 'id' | 'school_id' | 'status'>): Appointment {
    const apps = getTable<Appointment>(KEYS.APPOINTMENTS);
    const patient = this.getPatient(schoolId, data.patient_id);
    const patientName = patient ? patient.name : 'Student';

    const newApp: Appointment = {
      ...data,
      id: uuidv4(),
      school_id: schoolId,
      status: 'scheduled',
    };
    apps.push(newApp);
    setTable(KEYS.APPOINTMENTS, apps);

    addAuditLog(schoolId, userId, userName, 'Appointment Scheduled', `Scheduled follow-up for: ${patientName} on ${data.date} at ${data.time}`);
    return newApp;
  },

  updateAppointmentStatus(schoolId: string, userId: string, userName: string, id: string, status: Appointment['status']): void {
    const apps = getTable<Appointment>(KEYS.APPOINTMENTS);
    const index = apps.findIndex(a => a.id === id && a.school_id === schoolId);
    if (index === -1) throw new Error('Appointment not found');

    apps[index].status = status;
    setTable(KEYS.APPOINTMENTS, apps);

    const patient = this.getPatient(schoolId, apps[index].patient_id);
    const name = patient ? patient.name : 'Student';
    addAuditLog(schoolId, userId, userName, 'Appointment Updated', `Appointment for ${name} updated to [${status.toUpperCase()}]`);
  },

  // --- VACCINATIONS ---
  getVaccinations(schoolId: string, patientId?: string): Vaccination[] {
    let vacs = getTable<Vaccination>(KEYS.VACCINATIONS).filter(v => v.school_id === schoolId);
    if (patientId) {
      vacs = vacs.filter(v => v.patient_id === patientId);
    }
    return vacs;
  },

  addVaccination(schoolId: string, userId: string, userName: string, data: Omit<Vaccination, 'id' | 'school_id'>): Vaccination {
    const vacs = getTable<Vaccination>(KEYS.VACCINATIONS);
    const patient = this.getPatient(schoolId, data.patient_id);
    const name = patient ? patient.name : 'Student';

    const newVac: Vaccination = {
      ...data,
      id: uuidv4(),
      school_id: schoolId,
    };
    vacs.push(newVac);
    setTable(KEYS.VACCINATIONS, vacs);

    addAuditLog(schoolId, userId, userName, 'Vaccination Recorded', `Recorded vaccination task (${data.vaccine_name}) for ${name}`);
    return newVac;
  },

  updateVaccination(schoolId: string, userId: string, userName: string, id: string, updates: Partial<Vaccination>): void {
    const vacs = getTable<Vaccination>(KEYS.VACCINATIONS);
    const index = vacs.findIndex(v => v.id === id && v.school_id === schoolId);
    if (index === -1) throw new Error('Vaccination record not found');

    vacs[index] = { ...vacs[index], ...updates };
    setTable(KEYS.VACCINATIONS, vacs);

    const patient = this.getPatient(schoolId, vacs[index].patient_id);
    const name = patient ? patient.name : 'Student';
    addAuditLog(schoolId, userId, userName, 'Vaccination Updated', `Updated vaccination record ${vacs[index].vaccine_name} for ${name}`);
  },

  // --- LAB RESULTS ---
  getLabResults(schoolId: string, patientId?: string): LabResult[] {
    let labs = getTable<LabResult>(KEYS.LAB_RESULTS).filter(l => l.school_id === schoolId);
    if (patientId) {
      labs = labs.filter(l => l.patient_id === patientId);
    }
    return labs.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
  },

  addLabResult(schoolId: string, userId: string, userName: string, data: Omit<LabResult, 'id' | 'school_id'>): LabResult {
    const labs = getTable<LabResult>(KEYS.LAB_RESULTS);
    const patient = this.getPatient(schoolId, data.patient_id);
    const name = patient ? patient.name : 'Student';

    const newLab: LabResult = {
      ...data,
      id: uuidv4(),
      school_id: schoolId,
    };
    labs.push(newLab);
    setTable(KEYS.LAB_RESULTS, labs);

    addAuditLog(schoolId, userId, userName, 'Lab Logged', `Recorded lab result: ${data.test_name} = ${data.result_value} for ${name}`);
    return newLab;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(schoolId: string): AuditLog[] {
    return getTable<AuditLog>(KEYS.AUDIT_LOGS)
      .filter(a => a.school_id === schoolId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // --- REMINDERS GENERATOR ---
  getReminders(schoolId: string): Reminder[] {
    const reminders: Reminder[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Low stock alerts
    const inventory = this.getInventory(schoolId);
    inventory.forEach(item => {
      if (item.quantity <= item.reorder_level) {
        reminders.push({
          id: `rem-stock-${item.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          description: `"${item.drug_name}" is running low (${item.quantity} remaining). Reorder level: ${item.reorder_level}.`,
          target_id: item.id,
          date: todayStr,
        });
      }
    });

    // 2. Overdue vaccinations
    const vacs = getTable<Vaccination>(KEYS.VACCINATIONS).filter(v => v.school_id === schoolId);
    vacs.forEach(v => {
      if (v.status === 'overdue' || (v.status === 'scheduled' && new Date(v.due_date) < new Date())) {
        const patient = this.getPatient(schoolId, v.patient_id);
        const pName = patient ? patient.name : 'Student';
        reminders.push({
          id: `rem-vac-${v.id}`,
          type: 'vaccination_overdue',
          title: 'Vaccination Overdue',
          description: `${v.vaccine_name} is overdue for ${pName} (due: ${v.due_date}).`,
          target_id: v.patient_id,
          date: v.due_date,
        });
      }
    });

    // 3. Upcoming appointments
    const apps = this.getAppointments(schoolId).filter(a => a.status === 'scheduled');
    apps.forEach(a => {
      const daysDiff = Math.ceil((new Date(a.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff <= 2) {
        const patient = this.getPatient(schoolId, a.patient_id);
        const pName = patient ? patient.name : 'Student';
        reminders.push({
          id: `rem-app-${a.id}`,
          type: 'appointment_upcoming',
          title: 'Upcoming Appointment',
          description: `Appointment for ${pName} scheduled on ${a.date} at ${a.time} (Reason: ${a.reason}).`,
          target_id: a.patient_id,
          date: a.date,
        });
      }
    });

    // 4. Missed Drug Doses for today
    const schedules = this.getDrugSchedules(schoolId).filter(s => s.active);
    const logsToday = this.getDrugLogs(schoolId, todayStr);
    
    // Simple mock current time check (assume current hour is checked in dashboard)
    const currentHour = new Date().getHours();
    
    schedules.forEach(s => {
      const patient = this.getPatient(schoolId, s.patient_id);
      const pName = patient ? patient.name : 'Student';

      s.times.forEach(timeStr => {
        const timeHour = parseInt(timeStr.split(':')[0]);
        // If the scheduled hour is past, check if there's a log recorded for this schedule and time
        if (currentHour > timeHour) {
          const hasLog = logsToday.some(l => l.schedule_id === s.id && parseInt(l.time_administered.split(':')[0]) === timeHour);
          if (!hasLog) {
            reminders.push({
              id: `rem-miss-${s.id}-${timeStr}`,
              type: 'missed_dose',
              title: 'Missed Medication Dose',
              description: `Medication "${s.drug_name}" dosage of ${s.dosage} for ${pName} was scheduled at ${timeStr} and was not logged.`,
              target_id: s.patient_id,
              date: todayStr,
            });
          }
        }
      });
    });

    return reminders;
  },

  // --- REPORTS MODULE ---
  getReports(schoolId: string): NurseReport[] {
    return getTable<NurseReport>(KEYS.REPORTS).filter(r => r.school_id === schoolId);
  },

  createReport(schoolId: string, nurseName: string, title: string, category: NurseReport['category'], urgency: NurseReport['urgency'], content: string): void {
    const reports = getTable<NurseReport>(KEYS.REPORTS);
    const newReport: NurseReport = {
      id: uuidv4(),
      school_id: schoolId,
      nurse_name: nurseName,
      title,
      category,
      urgency,
      content,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    reports.unshift(newReport);
    setTable(KEYS.REPORTS, reports);
  },

  acknowledgeReport(schoolId: string, reportId: string, adminName: string): void {
    const reports = getTable<NurseReport>(KEYS.REPORTS);
    const reportIndex = reports.findIndex(r => r.id === reportId && r.school_id === schoolId);
    if (reportIndex !== -1) {
      reports[reportIndex].status = 'acknowledged';
      reports[reportIndex].acknowledged_by = adminName;
      reports[reportIndex].acknowledged_at = new Date().toISOString();
      setTable(KEYS.REPORTS, reports);
    }
  },

  // --- CHAT SYSTEM ---
  getChatMessages(schoolId: string): ChatMessage[] {
    const messages = getTable<ChatMessage>(KEYS.CHAT_MESSAGES);
    return messages.filter(m => m.school_id === schoolId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  sendChatMessage(schoolId: string, senderId: string, senderName: string, senderRole: string, content: string, senderAvatar?: string): ChatMessage {
    const messages = getTable<ChatMessage>(KEYS.CHAT_MESSAGES);
    const newMessage: ChatMessage = {
      id: `chat-${Math.random().toString(36).substr(2, 9)}`,
      school_id: schoolId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_avatar: senderAvatar,
      content,
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);
    setTable(KEYS.CHAT_MESSAGES, messages);
    return newMessage;
  },

  updateUserAvatar(userId: string, avatarUrl: string): User {
    const users = getTable<User>(KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    users[userIndex].avatar_url = avatarUrl;
    setTable(KEYS.USERS, users);

    // Update current session cache if active
    const curUserStr = localStorage.getItem(KEYS.CURRENT_USER);
    if (curUserStr) {
      const curUser = JSON.parse(curUserStr) as User;
      if (curUser.id === userId) {
        curUser.avatar_url = avatarUrl;
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(curUser));
        window.dispatchEvent(new Event('pulse-user-updated'));
      }
    }
    return users[userIndex];
  },

  // --- ONLINE SYNC ENGINE ---
  async pushSchoolCloudState(schoolId: string): Promise<void> {
    const school = this.getSchool(schoolId);
    if (!school) return;

    try {
      // 1. Push school
      await supabase.from('schools').upsert(school);

      // 2. Push users
      const users = getTable<User>(KEYS.USERS).filter(u => u.school_id === schoolId);
      if (users.length > 0) await supabase.from('users').upsert(users);

      // 3. Push patients
      const patients = getTable<Patient>(KEYS.PATIENTS).filter(p => p.school_id === schoolId);
      if (patients.length > 0) await supabase.from('patients').upsert(patients);

      // 4. Push visits
      const visits = getTable<Visit>(KEYS.VISITS).filter(v => v.school_id === schoolId);
      if (visits.length > 0) await supabase.from('visits').upsert(visits);

      // 5. Push schedules
      const schedules = getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES).filter(s => s.school_id === schoolId);
      if (schedules.length > 0) await supabase.from('drug_schedules').upsert(schedules);

      // 6. Push logs
      const logs = getTable<DrugLog>(KEYS.DRUG_LOGS).filter(l => l.school_id === schoolId);
      if (logs.length > 0) await supabase.from('drug_logs').upsert(logs);

      // 7. Push inventory
      const inventory = getTable<InventoryItem>(KEYS.INVENTORY).filter(i => i.school_id === schoolId);
      if (inventory.length > 0) await supabase.from('inventory').upsert(inventory);

      // 8. Push appointments
      const appointments = getTable<Appointment>(KEYS.APPOINTMENTS).filter(a => a.school_id === schoolId);
      if (appointments.length > 0) await supabase.from('appointments').upsert(appointments);

      // 9. Push vaccinations
      const vaccinations = getTable<Vaccination>(KEYS.VACCINATIONS).filter(v => v.school_id === schoolId);
      if (vaccinations.length > 0) await supabase.from('vaccinations').upsert(vaccinations);

      // 10. Push labs
      const labs = getTable<LabResult>(KEYS.LAB_RESULTS).filter(l => l.school_id === schoolId);
      if (labs.length > 0) await supabase.from('lab_results').upsert(labs);

      // 11. Push reports
      const reports = getTable<NurseReport>(KEYS.REPORTS).filter(r => r.school_id === schoolId);
      if (reports.length > 0) await supabase.from('reports').upsert(reports);

      // 12. Push chat messages
      const chat_messages = getTable<ChatMessage>(KEYS.CHAT_MESSAGES).filter(m => m.school_id === schoolId);
      if (chat_messages.length > 0) await supabase.from('chat_messages').upsert(chat_messages);

      // 13. Push audit logs
      const audit_logs = getTable<AuditLog>(KEYS.AUDIT_LOGS).filter(a => a.school_id === schoolId);
      if (audit_logs.length > 0) await supabase.from('audit_logs').upsert(audit_logs);

    } catch (err) {
      console.error('Supabase pushSchoolCloudState failed:', err);
      throw err;
    }
  },

  async pullSchoolCloudState(schoolId: string): Promise<void> {
    const school = this.getSchool(schoolId);
    if (!school) return;

    try {
      // Fetch all tables concurrently
      const [
        { data: remoteSchools, error: schoolErr },
        { data: users, error: userErr },
        { data: patients, error: patientErr },
        { data: visits, error: visitErr },
        { data: schedules, error: scheduleErr },
        { data: logs, error: logErr },
        { data: inventory, error: inventoryErr },
        { data: appointments, error: appErr },
        { data: vaccinations, error: vacErr },
        { data: labs, error: labErr },
        { data: reports, error: reportErr },
        { data: chat_messages, error: chatErr },
        { data: audit_logs, error: auditErr }
      ] = await Promise.all([
        supabase.from('schools').select('*').eq('id', schoolId),
        supabase.from('users').select('*').eq('school_id', schoolId),
        supabase.from('patients').select('*').eq('school_id', schoolId),
        supabase.from('visits').select('*').eq('school_id', schoolId),
        supabase.from('drug_schedules').select('*').eq('school_id', schoolId),
        supabase.from('drug_logs').select('*').eq('school_id', schoolId),
        supabase.from('inventory').select('*').eq('school_id', schoolId),
        supabase.from('appointments').select('*').eq('school_id', schoolId),
        supabase.from('vaccinations').select('*').eq('school_id', schoolId),
        supabase.from('lab_results').select('*').eq('school_id', schoolId),
        supabase.from('reports').select('*').eq('school_id', schoolId),
        supabase.from('chat_messages').select('*').eq('school_id', schoolId),
        supabase.from('audit_logs').select('*').eq('school_id', schoolId)
      ]);

      if (schoolErr) throw schoolErr;
      if (userErr) throw userErr;
      if (patientErr) throw patientErr;
      if (visitErr) throw visitErr;
      if (scheduleErr) throw scheduleErr;
      if (logErr) throw logErr;
      if (inventoryErr) throw inventoryErr;
      if (appErr) throw appErr;
      if (vacErr) throw vacErr;
      if (labErr) throw labErr;
      if (reportErr) throw reportErr;
      if (chatErr) throw chatErr;
      if (auditErr) throw auditErr;

      const remoteSchool = remoteSchools?.[0];
      if (!remoteSchool) {
        // If school is not found on server, push our local state to populate it
        await this.pushSchoolCloudState(schoolId);
        return;
      }

      const mergeLists = <T extends { id: string }>(localList: T[], cloudList: T[] | null, filterFn: (item: T) => boolean): T[] => {
        const otherSchoolsData = localList.filter(item => !filterFn(item));
        const activeSchoolLocal = localList.filter(filterFn);
        
        const mergedMap = new Map<string, T>();
        activeSchoolLocal.forEach(item => mergedMap.set(item.id, item));
        if (cloudList) {
          cloudList.forEach(item => mergedMap.set(item.id, item));
        }
        
        return [...otherSchoolsData, ...mergedMap.values()];
      };

      // Update local storage tables
      const schools = getTable<School>(KEYS.SCHOOLS);
      const otherSchools = schools.filter(s => s.id !== schoolId);
      setTable(KEYS.SCHOOLS, [...otherSchools, remoteSchool]);

      if (users) setTable(KEYS.USERS, mergeLists(getTable<User>(KEYS.USERS), users, u => u.school_id === schoolId));
      if (patients) setTable(KEYS.PATIENTS, mergeLists(getTable<Patient>(KEYS.PATIENTS), patients, p => p.school_id === schoolId));
      if (visits) setTable(KEYS.VISITS, mergeLists(getTable<Visit>(KEYS.VISITS), visits, v => v.school_id === schoolId));
      if (schedules) setTable(KEYS.DRUG_SCHEDULES, mergeLists(getTable<DrugSchedule>(KEYS.DRUG_SCHEDULES), schedules, s => s.school_id === schoolId));
      if (logs) setTable(KEYS.DRUG_LOGS, mergeLists(getTable<DrugLog>(KEYS.DRUG_LOGS), logs, l => l.school_id === schoolId));
      if (inventory) setTable(KEYS.INVENTORY, mergeLists(getTable<InventoryItem>(KEYS.INVENTORY), inventory, i => i.school_id === schoolId));
      if (appointments) setTable(KEYS.APPOINTMENTS, mergeLists(getTable<Appointment>(KEYS.APPOINTMENTS), appointments, a => a.school_id === schoolId));
      if (vaccinations) setTable(KEYS.VACCINATIONS, mergeLists(getTable<Vaccination>(KEYS.VACCINATIONS), vaccinations, v => v.school_id === schoolId));
      if (labs) setTable(KEYS.LAB_RESULTS, mergeLists(getTable<LabResult>(KEYS.LAB_RESULTS), labs, l => l.school_id === schoolId));
      if (reports) setTable(KEYS.REPORTS, mergeLists(getTable<NurseReport>(KEYS.REPORTS), reports, r => r.school_id === schoolId));
      if (chat_messages) setTable(KEYS.CHAT_MESSAGES, mergeLists(getTable<ChatMessage>(KEYS.CHAT_MESSAGES), chat_messages, m => m.school_id === schoolId));
      if (audit_logs) setTable(KEYS.AUDIT_LOGS, mergeLists(getTable<AuditLog>(KEYS.AUDIT_LOGS), audit_logs, a => a.school_id === schoolId));

      window.dispatchEvent(new Event('pulse-db-synced'));
    } catch (err) {
      console.warn('Sync pull failed or server offline - operating offline.', err);
    }
  },
};
