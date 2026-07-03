import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User, Patient, Visit, DrugSchedule, DrugLog, InventoryItem, Reminder, NurseReport } from '../services/db';
import { 
  Users, AlertTriangle, Activity, CheckCircle, 
  XCircle, HelpCircle, ShieldAlert, ArrowRight, Pill, UserPlus,
  Send, FileText, TrendingUp, Check, FileSignature
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie 
} from 'recharts';

interface DashboardProps {
  user: User;
  setActiveTab: (tab: string) => void;
  setSelectedPatientId: (id: string) => void;
}

export default function Dashboard({ user, setActiveTab, setSelectedPatientId }: DashboardProps) {
  const schoolId = user.school_id;
  const todayStr = new Date().toISOString().split('T')[0];

  // Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [schedules, setSchedules] = useState<DrugSchedule[]>([]);
  const [todayLogs, setTodayLogs] = useState<DrugLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reports, setReports] = useState<NurseReport[]>([]);

  // Top Statistics
  const [topDispensedDrugs, setTopDispensedDrugs] = useState<{ name: string; count: number }[]>([]);
  const [topCommonSymptoms, setTopCommonSymptoms] = useState<{ name: string; count: number }[]>([]);

  // Analytics structures
  const [symptomChartData, setSymptomChartData] = useState<any[]>([]);
  const [complianceChartData, setComplianceChartData] = useState<any[]>([]);
  const [inventoryChartData, setInventoryChartData] = useState<any[]>([]);
  const [specialCaseChartData, setSpecialCaseChartData] = useState<any[]>([]);

  // Compose Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<NurseReport['category']>('Daily Summary');
  const [reportUrgency, setReportUrgency] = useState<NurseReport['urgency']>('Medium');
  const [reportContent, setReportContent] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  useEffect(() => {
    const loadDashboardData = () => {
      // Fetch datasets
      const pts = dbService.getPatients(schoolId);
      const vsts = dbService.getVisits(schoolId);
      const inv = dbService.getInventory(schoolId);
      const scheds = dbService.getDrugSchedules(schoolId).filter(s => s.active);
      const logs = dbService.getDrugLogs(schoolId, todayStr);
      const rems = dbService.getReminders(schoolId);
      const reps = dbService.getReports(schoolId);

      setPatients(pts);
      setVisits(vsts);
      setInventory(inv);
      setSchedules(scheds);
      setTodayLogs(logs);
      setReminders(rems);
      setReports(reps);

      // --- CALCULATE MOST DISPENSED DRUGS ---
      const drugDispenseCounts: { [key: string]: number } = {};
      vsts.forEach(v => {
        if (v.treatments_medicines) {
          v.treatments_medicines.forEach(t => {
            drugDispenseCounts[t.name] = (drugDispenseCounts[t.name] || 0) + t.quantity;
          });
        }
      });
      logs.forEach(l => {
        if (l.status === 'given') {
          drugDispenseCounts[l.drug_name] = (drugDispenseCounts[l.drug_name] || 0) + 1;
        }
      });
      const topDrugs = Object.entries(drugDispenseCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Set calculated results
      setTopDispensedDrugs(topDrugs);

      // --- CALCULATE COMMON SYMPTOMS ---
      const symptomFreq: { [key: string]: number } = {};
      vsts.forEach(v => {
        if (v.symptoms) {
          v.symptoms.forEach(s => {
            symptomFreq[s] = (symptomFreq[s] || 0) + 1;
          });
        }
      });
      const topSymps = Object.entries(symptomFreq)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setTopCommonSymptoms(topSymps);

      // 1. Process Symptom Chart Data (Past 30 days)
      const symptomCounts: { [key: string]: number } = {};
      vsts.forEach(v => {
        if (v.symptoms) {
          v.symptoms.forEach(symp => {
            symptomCounts[symp] = (symptomCounts[symp] || 0) + 1;
          });
        }
      });
      const symptomData = Object.keys(symptomCounts).map(name => ({
        name,
        Count: symptomCounts[name]
      })).sort((a, b) => b.Count - a.Count).slice(0, 5);
      setSymptomChartData(symptomData);

      // 2. Process Daily Compliance Chart Data (Past 7 Days)
      const complianceData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLogs = dbService.getDrugLogs(schoolId, dateStr);
        
        const given = dayLogs.filter(l => l.status === 'given').length;
        const missed = dayLogs.filter(l => l.status === 'missed').length;
        
        complianceData.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          Given: given,
          Missed: missed,
        });
      }
      setComplianceChartData(complianceData);

      // 3. Process Inventory levels
      const invData = inv.map(item => ({
        name: item.drug_name.split(' ')[0], // short name
        Qty: item.quantity,
        Reorder: item.reorder_level,
      })).slice(0, 6);
      setInventoryChartData(invData);

      // 4. Special Case Frequency Analysis
      let refused = 0;
      let vomited = 0;
      let adverse = 0;
      let standard = 0;

      const allLogsStr = localStorage.getItem('pulse_drug_logs');
      if (allLogsStr) {
        const allLogs: DrugLog[] = JSON.parse(allLogsStr);
        const schoolLogs = allLogs.filter(l => l.school_id === schoolId);
        
        schoolLogs.forEach(l => {
          if (l.status === 'refused') refused++;
          else if (l.notes.toLowerCase().includes('vomit')) vomited++;
          else if (l.notes.toLowerCase().includes('allergy') || l.notes.toLowerCase().includes('reaction')) adverse++;
          else if (l.status === 'given') standard++;
        });
      }

      setSpecialCaseChartData([
        { name: 'Medication Refused', value: refused, color: '#f59e0b' },
        { name: 'Vomiting Case', value: vomited, color: '#ef4444' },
        { name: 'Adverse Reaction', value: adverse, color: '#b91c1c' },
        { name: 'Standard Take', value: standard, color: '#10b981' }
      ]);
    };

    loadDashboardData();

    // Listen to cloud sync refresh events
    window.addEventListener('pulse-db-synced', loadDashboardData);
    return () => window.removeEventListener('pulse-db-synced', loadDashboardData);
  }, [schoolId, todayStr]);

  // Today's Drug logs matching schedules
  const scheduledDosesToday: { schedule: DrugSchedule; log?: DrugLog; time: string }[] = [];
  schedules.forEach(sched => {
    sched.times.forEach(time => {
      const log = todayLogs.find(l => l.schedule_id === sched.id && l.time_administered === time);
      scheduledDosesToday.push({
        schedule: sched,
        log,
        time
      });
    });
  });

  const totalDoses = scheduledDosesToday.length;
  const givenDoses = scheduledDosesToday.filter(d => d.log?.status === 'given').length;
  const missedDoses = scheduledDosesToday.filter(d => d.log?.status === 'missed').length;
  const refusedDoses = scheduledDosesToday.filter(d => d.log?.status === 'refused').length;
  const pendingDoses = totalDoses - givenDoses - missedDoses - refusedDoses;

  const complianceRate = totalDoses > 0 ? Math.round((givenDoses / totalDoses) * 100) : 100;

  // Active missed doses list
  const activeMissedDoses = scheduledDosesToday.filter(d => d.log?.status === 'missed');

  // High Risk Patients list
  const highRiskPatients = patients.filter(p => 
    p.ongoing_conditions.length > 0 || 
    (p.allergies && p.allergies.some(a => a.severity === 'severe'))
  );

  // Quick Action: log medication status for today
  const handleLogMedication = (sched: DrugSchedule, time: string, status: 'given' | 'missed' | 'refused') => {
    const notesStr = status === 'refused' 
      ? prompt('Mandatory Nurse Notes for special case Medication Refused:', 'Student refused medication.') 
      : `Logged from main dashboard widget.`;

    if (status === 'refused' && !notesStr) {
      alert('Action cancelled: Notes are mandatory for refusing medication!');
      return;
    }

    try {
      dbService.logDrugAdministration(schoolId, user.id, user.full_name, {
        patient_id: sched.patient_id,
        schedule_id: sched.id,
        drug_name: sched.drug_name,
        dose: sched.dosage,
        time_administered: time,
        status,
        notes: notesStr || '',
        logged_date: todayStr
      });
      
      const logs = dbService.getDrugLogs(schoolId, todayStr);
      setTodayLogs(logs);
      
      const inv = dbService.getInventory(schoolId);
      setInventory(inv);
    } catch(err: any) {
      alert(err.message);
    }
  };

  // Submit report to admin
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess('');
    if (!reportTitle || !reportContent) {
      alert('Please fill in report title and content.');
      return;
    }
    
    dbService.createReport(schoolId, user.full_name, reportTitle, reportCategory, reportUrgency, reportContent);
    setReportSuccess('Report successfully submitted to School Admin logs!');
    setReportTitle('');
    setReportContent('');
    
    // Refresh report lists
    setReports(dbService.getReports(schoolId));
    setTimeout(() => {
      setReportSuccess('');
      setShowReportModal(false);
    }, 2000);
  };

  // Acknowledge report
  const handleAcknowledgeReport = (id: string) => {
    dbService.acknowledgeReport(schoolId, id, user.full_name);
    setReports(dbService.getReports(schoolId));
  };

  // Stats Counters
  const visitsTodayCount = visits.filter(v => v.visit_date.startsWith(todayStr)).length;
  const stockReorderCount = inventory.filter(item => item.quantity <= item.reorder_level).length;
  const activeRemindersCount = reminders.length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-hover p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clinic Overview</h2>
          <p className="text-white/80 text-sm mt-1">
            School Health Sickbay Dashboard &bull; {dbService.getSchool(schoolId)?.name || 'Pulse System'}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === 'Nurse' && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition shadow-md shadow-emerald-700/20"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Submit Report to Admin</span>
            </button>
          )}
          <button 
            onClick={() => setActiveTab('patients')}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary font-bold rounded-xl text-xs hover:bg-slate-50 transition shadow-md shadow-sky-900/10"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Search Students</span>
          </button>
        </div>
      </div>

      {/* Warning Alert Banner for Missed Doses */}
      {activeMissedDoses.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">Urgent: Missed Doses Identified!</span>
              <p className="font-normal text-rose-600 mt-0.5">
                There are {activeMissedDoses.length} scheduled medication dose{activeMissedDoses.length > 1 ? 's' : ''} logged as missed for today. Please review patient files immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('daily-medication-monitoring');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500 transition text-[10px]"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Grid: Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{patients.length}</p>
          </div>
        </div>

        {/* Card 2: Visits Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visits Today</span>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{visitsTodayCount}</p>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</span>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{stockReorderCount}</p>
          </div>
        </div>

        {/* Card 4: Reminders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Reminders</span>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{activeRemindersCount}</p>
          </div>
        </div>

      </div>

      {/* Row: Most Used Drugs, Common Symptoms, Adherence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Most Dispensed Drugs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Pill className="w-5 h-5 text-sky-500" />
            <span className="font-bold text-sm text-slate-800">Top Dispensed Medicines</span>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {topDispensedDrugs.length === 0 ? (
              <span className="text-slate-400 text-xs italic text-center py-4 block">No medicines dispensed yet.</span>
            ) : (
              topDispensedDrugs.map((drug, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100 animate-fade-slide-up">
                  <span className="font-bold text-slate-700">{drug.name}</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-lg">{drug.count} doses</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Common Symptoms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-sm text-slate-800">Top Diagnosed Symptoms</span>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {topCommonSymptoms.length === 0 ? (
              <span className="text-slate-400 text-xs italic text-center py-4 block">No symptoms diagnosed yet.</span>
            ) : (
              topCommonSymptoms.map((symp, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100 animate-fade-slide-up">
                  <span className="font-bold text-slate-700">{symp.name}</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-lg">{symp.count} cases</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Health Adherence Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 border-b pb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-sm text-slate-800">Medication Adherence Trend</span>
          </div>
          <div className="text-center py-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overall Rate</span>
            <span className="text-4xl font-extrabold text-slate-800 block mt-1">{complianceRate}%</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-400 leading-normal">
            Adherence logs measure standard dose takes vs refusal/vomited cases.
          </div>
        </div>

      </div>

      {/* Main Grid: Drug Widget & High Risk Panel */}
      <div id="daily-medication-monitoring" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Drug Consumption Monitoring Widget */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Daily Drug Consumption Monitoring</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track today's student medications administration and adherence</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Adherence Rate:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                complianceRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>{complianceRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 border rounded-xl text-center">
              <span className="text-slate-400 text-xs font-semibold">Scheduled Doses</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{totalDoses}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
              <span className="text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Given
              </span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{givenDoses}</p>
            </div>
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-center">
              <span className="text-rose-700 text-xs font-semibold flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Missed
              </span>
              <p className="text-xl font-bold text-rose-800 mt-1">{missedDoses}</p>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
              <span className="text-amber-700 text-xs font-semibold flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Pending Doses
              </span>
              <p className="text-xl font-bold text-amber-800 mt-1">{pendingDoses}</p>
            </div>
          </div>

          {/* Doses List with quick administration actions */}
          <div className="flex-1 overflow-y-auto max-h-64 space-y-2">
            {scheduledDosesToday.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">No student medication doses scheduled for today.</div>
            ) : (
              scheduledDosesToday.map((doseItem, idx) => {
                const patient = patients.find(p => p.id === doseItem.schedule.patient_id);
                const isLogged = !!doseItem.log;
                const status = doseItem.log?.status;

                return (
                  <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/40 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                        {patient?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                          <span>{patient?.name}</span>
                          <span className="text-slate-400 font-normal text-xs">({patient?.class_name})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <strong className="text-primary">{doseItem.schedule.drug_name}</strong> - {doseItem.schedule.dosage} @ <span className="font-bold text-slate-600">{doseItem.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLogged ? (
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize border ${
                          status === 'given' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === 'missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {status}
                        </span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleLogMedication(doseItem.schedule, doseItem.time, 'given')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition animate-fade-slide-up"
                          >
                            Given
                          </button>
                          <button
                            onClick={() => handleLogMedication(doseItem.schedule, doseItem.time, 'missed')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium transition animate-fade-slide-up"
                          >
                            Miss
                          </button>
                          <button
                            onClick={() => handleLogMedication(doseItem.schedule, doseItem.time, 'refused')}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition animate-fade-slide-up"
                          >
                            Refuse
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* High Risk Patients / Severe Allergy Tracker Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="border-b pb-4 mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>High-Risk Patients</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Students with severe allergies or chronic conditions</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 space-y-3">
            {highRiskPatients.length === 0 ? (
              <div className="text-center p-6 text-slate-400 text-xs">No high risk patients registered.</div>
            ) : (
              highRiskPatients.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setActiveTab('patients');
                  }}
                  className="p-3 border border-rose-100 bg-rose-50/20 hover:bg-rose-50/40 rounded-xl transition cursor-pointer flex justify-between items-start"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800 hover:text-primary transition">{p.name}</span>
                    <p className="text-[10px] text-slate-400">{p.class_name} &bull; {p.student_id}</p>
                    
                    {/* Allergies tags */}
                    {p.allergies && p.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.allergies.map((a, idx) => (
                          <span key={idx} className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${
                            a.severity === 'severe' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-orange-100 text-orange-800 border-orange-200'
                          }`}>
                            {a.allergen} ({a.severity})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Conditions tags */}
                    {p.ongoing_conditions && p.ongoing_conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.ongoing_conditions.map((c, idx) => (
                          <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase border border-slate-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Admin Incident Reports Box (Only visible for School Admin role) */}
      {user.role === 'Admin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-slide-up">
          <div className="border-b pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>Inbox: Nurse Shift & Incident Reports</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Review shift submissions, stock request notes, and medical logs</p>
            </div>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs font-bold">
              {reports.filter(r => r.status === 'pending').length} Pending
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {reports.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No reports submitted yet.</div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="p-4 border rounded-xl bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{report.title}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[9px] font-bold uppercase">
                        {report.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        report.urgency === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        report.urgency === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {report.urgency} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">{report.content}</p>
                    <div className="text-[10px] text-slate-400">
                      Logged by: <strong className="text-slate-600">{report.nurse_name}</strong> &bull; {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {report.status === 'pending' ? (
                      <button
                        onClick={() => handleAcknowledgeReport(report.id)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Ack: {report.acknowledged_by}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Symptom Trends Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80 animate-fade-slide-up">
          <span className="font-bold text-sm text-slate-800 mb-4 block">Symptom Distribution (Last 30 days)</span>
          <div className="flex-1 min-h-0">
            {symptomChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs italic bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <span>No symptoms logged in the past 30 days.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                    {symptomChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daily Drug Compliance Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
          <span className="font-bold text-sm text-slate-800 mb-4 block">Drug Log Trends (Last 7 days)</span>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="Given" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Missed" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Special Case Frequency Analysis Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80 animate-fade-slide-up">
          <span className="font-bold text-sm text-slate-800 mb-4 block">Special Cases & Compliance Analysis</span>
          <div className="flex-1 min-h-0">
            {specialCaseChartData.every(c => c.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs italic bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <span>No medication administration logs recorded yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialCaseChartData.filter(c => c.value > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {specialCaseChartData.filter(c => c.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '9px', bottom: 0 }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pharmacy Inventory Levels Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80 animate-fade-slide-up">
          <span className="font-bold text-sm text-slate-800 mb-4 block">Pharmacy Inventory Levels</span>
          <div className="flex-1 min-h-0">
            {inventoryChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs italic bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <span>No pharmacy stock items registered yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Qty" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Stock Level" />
                  <Bar dataKey="Reorder" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Reorder Alert" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Nurse Report Compose Modal Dialog */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-slide-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="font-bold text-slate-800 text-sm">Compose Log Report to Admin</span>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {reportSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{reportSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Report Title / Subject</label>
                <input
                  type="text"
                  placeholder="E.g., Daily Shift Handover, Adverse Drug Incident"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Daily Summary">Daily Summary</option>
                    <option value="Shift Handover">Shift Handover</option>
                    <option value="Incident">Incident Report</option>
                    <option value="Inventory Request">Inventory Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Urgency Level</label>
                  <select
                    value={reportUrgency}
                    onChange={(e) => setReportUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High (Immediate Action)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Detailed Content</label>
                <textarea
                  rows={5}
                  placeholder="Describe your clinic summary, incidents, low stock items, or other updates..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="pt-2 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
