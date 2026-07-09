import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User, School } from '../services/db';
import { Mail, Lock, User as UserIcon, Search, CheckCircle, Clock, ArrowRight, ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  // Mode: 'login' | 'register_school' | 'join_school' | 'verification' | 'pending'
  const [mode, setMode] = useState<'login' | 'register_school' | 'join_school' | 'verification' | 'pending'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Common Register/Join fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Nurse' | 'Doctor' | 'Clerk'>('Nurse');
  
  // Register School fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');

  // Join School fields
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Current session pending user
  const [currentPendingUser, setCurrentPendingUser] = useState<User | null>(null);

  // Schools list state
  const [schools, setSchools] = useState<School[]>([]);

  // Load remember me email and schools list on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pulse_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Load local schools first
    const localSchools = dbService.getSchools();
    setSchools(localSchools);

    // Fetch from Supabase online
    const fetchSchools = async () => {
      try {
        const remoteSchools = await dbService.getSchoolsOnline();
        setSchools(remoteSchools);
      } catch (err) {
        console.error('Failed to load schools online:', err);
      }
    };
    fetchSchools();
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const user = await dbService.login(email, password);
      
      if (user.status === 'pending') {
        setCurrentPendingUser(user);
        setMode('pending');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('pulse_remember_email', email);
      } else {
        localStorage.removeItem('pulse_remember_email');
      }

      setSuccess('Logged in successfully!');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  // Handle School Admin Registration Submit
  const handleRegisterSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!schoolName || !fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const { admin } = await dbService.registerSchoolAdmin(
        schoolName,
        schoolLogo,
        fullName,
        email,
        password
      );
      setSuccess(`School Registered successfully! Logging in as School Admin...`);
      setTimeout(() => {
        onLoginSuccess(admin);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  // Handle Join School Submit
  const handleJoinSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSchoolId || !fullName || !email || !password) {
      setError('Please fill in all fields and select a school.');
      return;
    }

    try {
      const pendingUser = await dbService.submitJoinRequest(
        selectedSchoolId,
        fullName,
        email,
        password,
        role
      );
      setCurrentPendingUser(pendingUser);
      setMode('pending');
    } catch (err: any) {
      setError(err.message || 'Request submission failed.');
    }
  };

  // Reset forms
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setSchoolName('');
    setSchoolLogo('');
    setSelectedSchoolId('');
    setError('');
    setSuccess('');
  };

  // Filter schools for join query
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  // Logo file upload helper (simulates base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Render Pending View
  if (mode === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Scoped & Pending</h2>
          <p className="text-slate-500 mb-6">
            Welcome, <span className="font-semibold text-slate-700">{currentPendingUser?.full_name}</span>. 
            Your request to join <span className="font-semibold text-slate-700">
              {dbService.getSchool(currentPendingUser?.school_id || '')?.name}
            </span> as a <span className="font-semibold text-slate-700">{currentPendingUser?.role}</span> has been logged.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800 text-left">
            <strong>What happens next?</strong>
            <p className="mt-1">
              Your School Admin must log in to their dashboard and approve your access request before you can access school clinic records.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentPendingUser(null);
              setMode('login');
              resetForm();
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 md:grid-cols-12">
      {/* Brand panel */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-12 flex flex-col justify-between text-white relative overflow-hidden animate-fade-in-left">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl animate-float-glow-slow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-float-glow-slower" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">Pulse</span>
          <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full">v2.0</span>
        </div>

        <div className="my-auto max-w-sm space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            School Sickbay <br/>Management System
          </h1>
          <p className="text-slate-400 text-sm">
            Secure, multi-tenant digital health clinic. Fully isolated school workspaces, RLS-style records filtering, vaccination tracker, and automated drug logs.
          </p>
          
          {/* Animated illustration picture */}
          <div className="pt-2 animate-float-image">
            <img 
              src="/clinic_illustration.jpg" 
              alt="Medical Illustration" 
              className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl opacity-90 object-cover" 
            />
          </div>
        </div>

        <div className="text-xs text-slate-500">
          &copy; 2026 Pulse Clinic Tech. All rights reserved.
        </div>
      </div>

      {/* Auth panel */}
      <div className="md:col-span-7 flex items-center justify-center p-8 bg-white animate-fade-in-right">
        <div className="max-w-md w-full">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-100 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`pb-3 text-sm font-semibold border-b-2 transition px-4 ${
                mode === 'login' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register_school'); setError(''); }}
              className={`pb-3 text-sm font-semibold border-b-2 transition px-4 ${
                mode === 'register_school' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Register School
            </button>
            <button
              onClick={() => { setMode('join_school'); setError(''); }}
              className={`pb-3 text-sm font-semibold border-b-2 transition px-4 ${
                mode === 'join_school' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Join School
            </button>
          </div>

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <form key="login" onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 animate-stagger-1">
                <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                <p className="text-slate-500 text-sm">Sign in to your isolated school workspace</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="animate-stagger-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="nurse@greenwood.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => alert('For testing, please use default passwords: "password123".')}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 animate-stagger-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <div className="animate-stagger-5 space-y-4 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
                  >
                    Sign In to School Portal
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* REGISTER SCHOOL ADMIN MODE */}
          {mode === 'register_school' && (
            <form key="register" onSubmit={handleRegisterSchoolSubmit} className="space-y-4">
              <div className="space-y-1 animate-stagger-1">
                <h2 className="text-2xl font-bold text-slate-800">Register New School</h2>
                <p className="text-slate-500 text-sm">Create an isolated workspace & admin account</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="animate-stagger-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Name</label>
                  <input
                    type="text"
                    placeholder="E.g., St. Mary's High School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                    required
                  />
                </div>

                <div className="animate-stagger-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Logo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-100 transition">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {schoolLogo && (
                      <img src={schoolLogo} alt="Preview Logo" className="w-10 h-10 object-contain rounded border" />
                    )}
                  </div>
                </div>

                <div className="animate-stagger-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admin Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admin Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="admin@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-5 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
                  >
                    Register School Admin & Verify
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* JOIN SCHOOL MODE */}
          {mode === 'join_school' && (
            <form key="join" onSubmit={handleJoinSchoolSubmit} className="space-y-4">
              <div className="space-y-1 animate-stagger-1">
                <h2 className="text-2xl font-bold text-slate-800">Join Existing School</h2>
                <p className="text-slate-500 text-sm">Request access to an existing school sickbay</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="animate-stagger-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search School Directory</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search school by name..."
                      value={schoolSearchQuery}
                      onChange={(e) => setSchoolSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                    />
                  </div>
                  
                  {/* School List Dropdown */}
                  <div className="mt-2 max-h-36 overflow-y-auto border border-slate-100 rounded-lg divide-y bg-slate-50">
                    {filteredSchools.length === 0 ? (
                      <div className="p-3 text-slate-400 text-xs text-center">No schools found</div>
                    ) : (
                      filteredSchools.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSchoolId(s.id);
                            setSchoolSearchQuery(s.name);
                          }}
                          className={`w-full text-left p-3 text-sm flex items-center justify-between hover:bg-slate-100 transition ${
                            selectedSchoolId === s.id ? 'bg-sky-50/50 text-sky-700 font-medium' : 'text-slate-700'
                          }`}
                        >
                          <span>{s.name}</span>
                          {selectedSchoolId === s.id && <CheckCircle className="w-4 h-4 text-sky-600" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="animate-stagger-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Requested Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Clerk">Clerk</option>
                  </select>
                </div>

                <div className="animate-stagger-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="john.smith@greenwood.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="animate-stagger-5 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
                  >
                    Submit Access Request & Verify
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
