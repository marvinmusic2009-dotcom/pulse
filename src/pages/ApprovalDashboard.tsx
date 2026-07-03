import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User } from '../services/db';
import { UserCheck, UserX, Users, Clock } from 'lucide-react';

interface ApprovalDashboardProps {
  user: User;
}

export default function ApprovalDashboard({ user }: ApprovalDashboardProps) {
  const schoolId = user.school_id;

  // Data states
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allSchoolStaff, setAllSchoolStaff] = useState<User[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Load staff records
  const loadStaffData = () => {
    // 1. Fetch pending
    setPendingUsers(dbService.getPendingUsers(schoolId));
    
    // 2. Fetch all approved/active staff for directory
    const allUsers = localStorage.getItem('pulse_users');
    if (allUsers) {
      const parsed: User[] = JSON.parse(allUsers);
      const schoolStaff = parsed.filter(u => u.school_id === schoolId && u.status === 'approved');
      setAllSchoolStaff(schoolStaff);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [schoolId]);

  // Handle Approval
  const handleApprove = (targetUserId: string) => {
    try {
      dbService.approveUser(schoolId, user.id, user.full_name, targetUserId);
      setSuccessMsg('Staff member successfully approved! They can now log in.');
      setTimeout(() => setSuccessMsg(''), 4500);
      loadStaffData();
    } catch(e: any) {
      alert('Approval failed: ' + e.message);
    }
  };

  // Handle Reject
  const handleReject = (targetUserId: string) => {
    if (window.confirm('Are you sure you want to decline this access request? Their login credentials will be removed.')) {
      try {
        dbService.rejectUser(schoolId, user.id, user.full_name, targetUserId);
        setSuccessMsg('Access request rejected and credentials removed.');
        setTimeout(() => setSuccessMsg(''), 4500);
        loadStaffData();
      } catch(e: any) {
        alert('Decline failed: ' + e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-bold text-slate-800">Clinic Staff Approval & Access</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage role permissions and approve pending access requests for your school clinic</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <UserCheck className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pending Requests Column */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
              <span>Pending Access Requests</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
              {pendingUsers.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No pending staff access requests at this time.
              </div>
            ) : (
              pendingUsers.map((p) => (
                <div key={p.id} className="p-4 border border-amber-100 bg-amber-50/15 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-slate-800">{p.full_name}</span>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{p.email}</p>
                    <div className="flex gap-2 items-center mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                        Role: {p.role}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Requested: {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                    >
                      <UserCheck className="w-4.5 h-4.5" />
                      <span>Approve Access</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(p.id)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition flex items-center gap-1"
                    >
                      <UserX className="w-4.5 h-4.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* School Directory Column (All Approved Staff) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
            <Users className="w-4.5 h-4.5 text-slate-500" />
            <span>Approved Staff Directory</span>
          </h4>
          
          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {allSchoolStaff.map((staff) => (
              <div key={staff.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{staff.full_name}</span>
                  <p className="text-slate-400 font-medium text-[10px] mt-0.5">{staff.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border uppercase">
                  {staff.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
