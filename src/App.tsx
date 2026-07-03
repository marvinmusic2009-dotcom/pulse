import { useState, useEffect } from 'react';
import { dbService, initializeDB } from './services/db';
import type { User } from './services/db';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PatientDirectory from './pages/PatientDirectory';
import PatientProfile from './pages/PatientProfile';
import Inventory from './pages/Inventory';
import SchoolSettings from './pages/SchoolSettings';
import ApprovalDashboard from './pages/ApprovalDashboard';
import ChatRoom from './pages/ChatRoom';
import { ClipboardList } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Initialize simulated database and check session on mount
  useEffect(() => {
    initializeDB();
    const savedUser = localStorage.getItem('pulse_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('pulse_current_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pulse_current_user');
    setSelectedPatientId(null);
    setActiveTab('dashboard');
  };

  const handleSwitchUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('pulse_current_user', JSON.stringify(newUser));
    setSelectedPatientId(null);
    setActiveTab('dashboard');
  };

  // If user is not authenticated, render Auth screen
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Fetch Audit Logs for the Audit Tab
  const auditLogs = dbService.getAuditLogs(user.school_id);

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      onSwitchUser={handleSwitchUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Dashboard 
          user={user} 
          setActiveTab={setActiveTab} 
          setSelectedPatientId={setSelectedPatientId} 
        />
      )}

      {/* 2. Patient Directory & Profile Tab */}
      {activeTab === 'patients' && (
        selectedPatientId ? (
          <PatientProfile 
            user={user} 
            patientId={selectedPatientId} 
            onBack={() => setSelectedPatientId(null)} 
          />
        ) : (
          <PatientDirectory 
            user={user} 
            onSelectPatient={setSelectedPatientId} 
            setActiveTab={setActiveTab}
          />
        )
      )}

      {/* 3. Pharmacy & Inventory Tab */}
      {activeTab === 'inventory' && <Inventory user={user} />}

      {/* 4. Access Requests Tab (Admin Only) */}
      {activeTab === 'approvals' && <ApprovalDashboard user={user} />}

      {/* 5. School Customization Tab (Admin Only) */}
      {activeTab === 'settings' && <SchoolSettings user={user} />}

      {/* 6. Audit Logs Tab (Admin Only) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Security Audit Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Chronological trail of system events, actions, and stock changes</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b pb-3 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-500" />
              <span className="font-bold text-slate-800 text-sm">System Security History</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Timestamp</th>
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Action Event</th>
                    <th className="py-3 px-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 italic">No audit trail logged.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isAlert = log.action.includes('ALERT') || log.action.includes('LOW STOCK') || log.action.includes('CRITICAL');
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-2 text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-3.5 px-2 text-slate-800">{log.user_name}</td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                              isAlert 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-600 font-medium">{log.details}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'chat' && <ChatRoom user={user} />}
    </Layout>
  );
}

export default App;
