import React, { useState, useEffect } from 'react';
import { dbService, applySchoolBranding } from '../services/db';
import type { School, User, Reminder } from '../services/db';
import { 
  LayoutDashboard, Users, Pill, Settings, 
  UserCheck, ClipboardList, LogOut, Bell, ChevronRight, Menu, X, ArrowLeftRight, MessageSquare
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function Layout({ 
  user, 
  onLogout, 
  onSwitchUser, 
  activeTab, 
  setActiveTab, 
  children 
}: LayoutProps) {
  const [school, setSchool] = useState<School | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [currentUser, setCurrentUser] = useState<User>(user);

  // Sync state and listen for updates
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = () => {
      const savedUser = localStorage.getItem('pulse_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    };
    window.addEventListener('pulse-user-updated', handleUserUpdate);
    return () => window.removeEventListener('pulse-user-updated', handleUserUpdate);
  }, []);

  // Fetch school settings and apply branding on mount or when user school changes
  useEffect(() => {
    const sc = dbService.getSchool(user.school_id);
    if (sc) {
      setSchool(sc);
      applySchoolBranding(sc);
    }
    
    // Load reminders
    const rems = dbService.getReminders(user.school_id);
    setReminders(rems);

    // Set interval to simulate background check
    const interval = setInterval(() => {
      setReminders(dbService.getReminders(user.school_id));
    }, 15000);

    // Sync Pull trigger
    const triggerPull = async () => {
      const activeSchool = dbService.getSchool(user.school_id);
      if (activeSchool && activeSchool.cloud_sync_enabled && activeSchool.cloud_sync_token) {
        setSyncStatus('syncing');
        try {
          await dbService.pullSchoolCloudState(user.school_id);
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
          console.error('Cloud pull failed:', e);
          setSyncStatus('error');
        }
      }
    };

    triggerPull();

    const syncInterval = setInterval(() => {
      triggerPull();
    }, 20000);

    const handleDbSynced = () => {
      const updatedSchool = dbService.getSchool(user.school_id);
      if (updatedSchool) {
        setSchool(updatedSchool);
        applySchoolBranding(updatedSchool);
      }
      setReminders(dbService.getReminders(user.school_id));
    };

    window.addEventListener('pulse-db-synced', handleDbSynced);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      window.removeEventListener('pulse-db-synced', handleDbSynced);
    };
  }, [user]);

  // Handle reminder click
  const handleReminderClick = (rem: Reminder) => {
    setShowNotifications(false);
    if (rem.type === 'low_stock') {
      setActiveTab('inventory');
    } else {
      // Go to patient search or dashboard
      setActiveTab('patients');
      // For testing, alert the user about navigation
      setTimeout(() => {
        const patientSearchInput = document.getElementById('global-patient-search') as HTMLInputElement;
        if (patientSearchInput) {
          const patient = dbService.getPatient(user.school_id, rem.target_id);
          if (patient) {
            patientSearchInput.value = patient.name;
            patientSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }, 300);
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Nurse', 'Doctor', 'Clerk'] },
    { id: 'patients', name: 'Student Files', icon: Users, roles: ['Admin', 'Nurse', 'Doctor', 'Clerk'] },
    { id: 'chat', name: 'Clinic Chat', icon: MessageSquare, roles: ['Admin', 'Nurse', 'Doctor', 'Clerk'] },
    { id: 'inventory', name: 'Pharmacy & Stock', icon: Pill, roles: ['Admin', 'Nurse', 'Doctor'] },
    { id: 'approvals', name: 'Access Requests', icon: UserCheck, roles: ['Admin'] },
    { id: 'audit', name: 'Audit Logs', icon: ClipboardList, roles: ['Admin'] },
    { id: 'settings', name: 'Settings', icon: Settings, roles: ['Admin', 'Nurse', 'Doctor', 'Clerk'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  // Switch user tester list (convenient mock utility)
  const allUsers = [
    { email: 'nurse@greenwood.edu', name: 'Nurse Chen (Greenwood)', role: 'Nurse' },
    { email: 'admin@greenwood.edu', name: 'Admin Jenkins (Greenwood)', role: 'Admin' },
    { email: 'doctor@greenwood.edu', name: 'Doctor Vance (Greenwood)', role: 'Doctor' },
    { email: 'clerk@greenwood.edu', name: 'Clerk Patel (Greenwood)', role: 'Clerk' },
    { email: 'admin@oakridge.edu', name: 'Admin Carter (Oakridge)', role: 'Admin' },
  ];

  const handleQuickSwitch = async (email: string) => {
    try {
      const u = await dbService.login(email, 'password123');
      onSwitchUser(u);
      setShowUserSwitcher(false);
      setActiveTab('dashboard');
    } catch(e) {
      alert('Error switching user: ' + e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Dynamic Style injection for custom school colors */}
      {school && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --color-primary: ${school.primary_color};
            --color-primary-hover: ${school.primary_color}dd;
            --color-primary-light: ${school.primary_color}1a;
            --color-secondary: ${school.secondary_color};
          }
        `}} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800 flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="Logo" className="w-9 h-9 object-contain bg-white rounded-lg p-0.5" />
            ) : (
              <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center font-bold shadow-lg shadow-primary/20">
                {school?.name.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold tracking-tight line-clamp-1 text-slate-100">
                {school?.name || 'Pulse System'}
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Clinic Portal</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-3">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm">
                {currentUser.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">{currentUser.full_name}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary/15 text-primary border border-primary/20 mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>
          
          <div className="pt-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 rounded-xl text-xs font-semibold transition border border-rose-900/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout School Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          {school?.logo_url ? (
            <img src={school.logo_url} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" />
          ) : (
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">
              {school?.name.charAt(0)}
            </div>
          )}
          <span className="font-bold text-sm truncate max-w-[150px]">{school?.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            {reminders.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-white p-4 border-b border-slate-800 space-y-2 z-50">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Logged in: <strong className="text-slate-200">{currentUser.full_name}</strong> ({currentUser.role})
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-950/40 text-rose-300 rounded-lg text-xs font-semibold border border-rose-900/30"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Main Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (Desktop only) */}
        <header className="hidden md:flex bg-white h-16 border-b border-slate-200 px-8 items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="font-semibold text-slate-700 capitalize">{activeTab} Dashboard</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-medium text-slate-400">Role: {currentUser.role}</span>
            {school?.cloud_sync_enabled && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition border ${
                  syncStatus === 'syncing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  syncStatus === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'syncing' ? 'bg-amber-500 animate-spin' :
                    syncStatus === 'synced' ? 'bg-emerald-500' :
                    syncStatus === 'error' ? 'bg-rose-500' :
                    'bg-sky-500 animate-pulse'
                  }`} />
                  <span>
                    {syncStatus === 'syncing' ? 'Syncing...' :
                     syncStatus === 'synced' ? 'Synced Cloud' :
                     syncStatus === 'error' ? 'Sync Offline' :
                     'Cloud Connected'}
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            
            {/* Notification Center Trigger */}
            <div className="relative flex items-center gap-3">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition border text-slate-600 relative"
              >
                <Bell className="w-5 h-5" />
                {reminders.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Profile Avatar Link */}
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition"
                title="View Profile Settings"
              >
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                    {currentUser.full_name.charAt(0)}
                  </div>
                )}
                <span className="hidden lg:block text-xs font-semibold text-slate-700">{currentUser.full_name}</span>
              </button>

              {/* Reminders dropdown drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y">
                  <div className="p-4 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Sickbay Reminders & Alerts</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold">
                      {reminders.length} Active
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {reminders.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No active warnings or stock alerts</div>
                    ) : (
                      reminders.map((rem) => (
                        <button
                          key={rem.id}
                          onClick={() => handleReminderClick(rem)}
                          className="w-full text-left p-3.5 hover:bg-slate-50/80 transition flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className={`capitalize ${
                              rem.type === 'low_stock' ? 'text-amber-700' : 'text-rose-700'
                            }`}>{rem.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{rem.date}</span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed">{rem.description}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 text-center bg-slate-50">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-sky-600 hover:underline font-semibold"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* QUICK TESTING USER SWITCHER DIALOG */}
      {showUserSwitcher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-sky-400" />
                <span className="font-bold">Test Workspace Isolation</span>
              </div>
              <button onClick={() => setShowUserSwitcher(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-500 text-sm leading-relaxed">
                Pulse provides **strict row level security (RLS)** style tenant isolation. Switch between accounts below to test school data visibility and role permissions:
              </p>
              
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {allUsers.map((switcher) => (
                  <button
                    key={switcher.email}
                    onClick={() => handleQuickSwitch(switcher.email)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-sm hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{switcher.name}</div>
                      <span className="text-xs text-slate-400">{switcher.email}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border">
                      {switcher.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
