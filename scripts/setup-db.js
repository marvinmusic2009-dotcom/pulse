import dns from 'dns';
dns.setDefaultResultOrder('verbatim');
import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Perseverance25%232026@[2a05:d019:df3:bd01:755d:4596:8c1:7106]:5432/postgres';

const schemaSql = `
-- 1. Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0284c7',
  secondary_color TEXT NOT NULL DEFAULT '#0f172a',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  theme_preset TEXT,
  font_preset TEXT,
  clinic_address TEXT,
  clinic_email TEXT,
  clinic_phone TEXT,
  clinic_beds INTEGER,
  low_stock_limit INTEGER,
  custom_css TEXT,
  cloud_sync_enabled BOOLEAN DEFAULT true,
  cloud_sync_token TEXT
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Nurse', 'Doctor', 'Clerk')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'pending')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  dob TEXT NOT NULL,
  class_name TEXT NOT NULL,
  avatar_url TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,
  ongoing_conditions JSONB DEFAULT '[]'::jsonb,
  regular_medications JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  symptoms JSONB DEFAULT '[]'::jsonb,
  temperature NUMERIC,
  observed_signs TEXT,
  treatments_medicines JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create drug_schedules table
CREATE TABLE IF NOT EXISTS drug_schedules (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times JSONB DEFAULT '[]'::jsonb,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  is_prn BOOLEAN DEFAULT false,
  special_instructions TEXT
);

-- 6. Create drug_logs
CREATE TABLE IF NOT EXISTS drug_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  schedule_id TEXT REFERENCES drug_schedules(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  time_administered TEXT NOT NULL,
  status TEXT NOT NULL,
  administrator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  administrator_name TEXT NOT NULL,
  notes TEXT,
  logged_date TEXT NOT NULL,
  special_case TEXT
);

-- 7. Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  reorder_level INTEGER NOT NULL,
  expiry_date TEXT NOT NULL
);

-- 8. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 9. Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  date_given TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 10. Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  result_value TEXT NOT NULL,
  notes TEXT,
  date_recorded TEXT NOT NULL
);

-- 11. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  nurse_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- 13. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
`;

async function run() {
  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Successfully connected!');

    console.log('Creating database tables...');
    await client.query(schemaSql);
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
