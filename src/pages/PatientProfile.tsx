import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User, Patient, Visit, DrugSchedule, DrugLog, Vaccination, LabResult, PatientDocument } from '../services/db';
import { pdfService } from '../services/pdf';
import { 
  ArrowLeft, ShieldAlert, Heart,
  Pill, Upload, FileText, Trash2, Download, 
  Plus, Eye, FileDown, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

interface PatientProfileProps {
  user: User;
  patientId: string;
  onBack: () => void;
}

export default function PatientProfile({ user, patientId, onBack }: PatientProfileProps) {
  const schoolId = user.school_id;

  // Data states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [schedules, setSchedules] = useState<DrugSchedule[]>([]);
  const [logsToday, setLogsToday] = useState<DrugLog[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  // Active Tab: 'overview' | 'visits' | 'drugs' | 'vaccines' | 'labs' | 'documents'
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'drugs' | 'vaccines' | 'labs' | 'documents'>('overview');

  // Modals visibility
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  
  // Allergy & Condition Adders
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [newCondition, setNewCondition] = useState('');
  const [newRegularMed, setNewRegularMed] = useState('');

  // 1. Visit Modal fields
  const [visitSymptoms, setVisitSymptoms] = useState<string[]>([]);
  const [visitTemp, setVisitTemp] = useState(36.6);
  const [visitSigns, setVisitSigns] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [dispensedMeds, setDispensedMeds] = useState<{ name: string; dosage: string; quantity: number }[]>([
    { name: '', dosage: '', quantity: 1 }
  ]);
  const [visitError, setVisitError] = useState('');
  const [allergyBlockMsg, setAllergyBlockMsg] = useState('');

  // 2. Schedule Modal fields
  const [schedDrug, setSchedDrug] = useState('');
  const [schedDosage, setSchedDosage] = useState('');
  const [schedFreq, setSchedFreq] = useState('Once Daily');
  const [schedTimes, setSchedTimes] = useState<string[]>(['08:00']);
  const [schedStartDate, setSchedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedEndDate, setSchedEndDate] = useState('');
  const [schedError, setSchedError] = useState('');
  const [schedIsPrn, setSchedIsPrn] = useState(false);
  const [schedSpecialInstructions, setSchedSpecialInstructions] = useState('');

  // Medication Logging Confirmation Modal fields
  const [showLogMedModal, setShowLogMedModal] = useState(false);
  const [activeDoseToLog, setActiveDoseToLog] = useState<{ schedule: DrugSchedule; time: string } | null>(null);
  const [logMedStatus, setLogMedStatus] = useState<'given' | 'missed' | 'refused'>('given');
  const [logSpecialCase, setLogSpecialCase] = useState<'none' | 'refused' | 'vomited' | 'adverse_reaction' | 'prn_emergency'>('none');
  const [logMedNotes, setLogMedNotes] = useState('');
  const [logMedError, setLogMedError] = useState('');

  // 3. Vaccine Modal fields
  const [vacName, setVacName] = useState('');
  const [vacDateGiven, setVacDateGiven] = useState('');
  const [vacDueDate, setVacDueDate] = useState('');
  const [vacStatus, setVacStatus] = useState<'completed' | 'scheduled' | 'overdue'>('scheduled');

  // 4. Lab Modal fields
  const [labName, setLabName] = useState('Malaria RDT');
  const [labVal, setLabVal] = useState('');
  const [labNotes, setLabNotes] = useState('');

  // 5. Document Upload fields
  const [uploadedFileBase64, setUploadedFileBase64] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileType, setUploadedFileType] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [docError, setDocError] = useState('');
  
  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);

  // Load all record data
  const loadData = () => {
    const pt = dbService.getPatient(schoolId, patientId);
    if (!pt) {
      onBack();
      return;
    }
    setPatient(pt);
    setVisits(dbService.getVisits(schoolId, patientId));
    setSchedules(dbService.getDrugSchedules(schoolId, patientId));
    setLogsToday(dbService.getDrugLogs(schoolId, new Date().toISOString().split('T')[0], patientId));
    setVaccinations(dbService.getVaccinations(schoolId, patientId));
    setLabResults(dbService.getLabResults(schoolId, patientId));
    setInventory(dbService.getInventory(schoolId));
  };

  useEffect(() => {
    loadData();
  }, [schoolId, patientId]);

  if (!patient) return null;

  // Age Calculator
  const getAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // --- ALLERGY ALERT CHECKER ---
  // Returns warning details if drugs are unsafe
  const checkDrugSafety = (drugName: string): { warning: string; level: 'warning' | 'critical' } | null => {
    const allergy = dbService.checkAllergyWarning(patient, drugName);
    if (allergy) {
      if (allergy.severity === 'severe') {
        return {
          warning: `CRITICAL ALLERGY BLOCK: Student has a SEVERE allergy to "${allergy.allergen}". Dispensing/Scheduling "${drugName}" is STRICTLY BLOCKED.`,
          level: 'critical'
        };
      }
      return {
        warning: `Allergy Alert: Student has a ${allergy.severity} allergy to "${allergy.allergen}". Double-check medical history before administering "${drugName}".`,
        level: 'warning'
      };
    }
    return null;
  };

  // --- TAB 1: OVERVIEW METADATA MODIFICATIONS ---
  const handleAddAllergyAction = () => {
    if (!newAllergen.trim()) return;
    const updatedAllergies = [...(patient.allergies || []), { allergen: newAllergen.trim(), severity: newAllergySeverity }];
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { allergies: updatedAllergies });
    setNewAllergen('');
    loadData();
  };

  const handleRemoveAllergyAction = (index: number) => {
    const updated = (patient.allergies || []).filter((_, idx) => idx !== index);
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { allergies: updated });
    loadData();
  };

  const handleAddConditionAction = () => {
    if (!newCondition.trim()) return;
    const updated = [...(patient.ongoing_conditions || []), newCondition.trim()];
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { ongoing_conditions: updated });
    setNewCondition('');
    loadData();
  };

  const handleRemoveConditionAction = (index: number) => {
    const updated = (patient.ongoing_conditions || []).filter((_, idx) => idx !== index);
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { ongoing_conditions: updated });
    loadData();
  };

  const handleAddRegMedAction = () => {
    if (!newRegularMed.trim()) return;
    const updated = [...(patient.regular_medications || []), newRegularMed.trim()];
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { regular_medications: updated });
    setNewRegularMed('');
    loadData();
  };

  const handleRemoveRegMedAction = (index: number) => {
    const updated = (patient.regular_medications || []).filter((_, idx) => idx !== index);
    dbService.updatePatient(schoolId, user.id, user.full_name, patient.id, { regular_medications: updated });
    loadData();
  };

  // --- TAB 2: VISIT LOGGING ---
  const symptomOptions = ['Fever', 'Cough', 'Headache', 'Stomachache', 'Sore Throat', 'Vomiting', 'Diarrhea', 'Skin Rash', 'Cuts / Bruises', 'Asthma Wheezing', 'Sprain / Injury'];

  const toggleSymptom = (symptom: string) => {
    if (visitSymptoms.includes(symptom)) {
      setVisitSymptoms(visitSymptoms.filter(s => s !== symptom));
    } else {
      setVisitSymptoms([...visitSymptoms, symptom]);
    }
  };

  const handleAddDispensedMedRow = () => {
    setDispensedMeds([...dispensedMeds, { name: '', dosage: '', quantity: 1 }]);
  };

  const handleRemoveDispensedMedRow = (index: number) => {
    setDispensedMeds(dispensedMeds.filter((_, idx) => idx !== index));
  };

  const handleDispensedMedChange = (index: number, field: string, val: any) => {
    const updated = [...dispensedMeds];
    updated[index] = { ...updated[index], [field]: val };
    setDispensedMeds(updated);

    // Dynamic Allergy blocker calculation inside visit log
    let hasCriticalBlock = false;
    let blockMessage = '';
    
    updated.forEach(med => {
      if (med.name) {
        const safetyCheck = checkDrugSafety(med.name);
        if (safetyCheck) {
          if (safetyCheck.level === 'critical') {
            hasCriticalBlock = true;
            blockMessage = safetyCheck.warning;
          } else {
            blockMessage = safetyCheck.warning;
          }
        }
      }
    });

    if (hasCriticalBlock) {
      setAllergyBlockMsg(blockMessage);
    } else {
      setAllergyBlockMsg('');
      if (blockMessage) {
        setVisitError(blockMessage); // show mild allergy as a standard alert warning
      } else {
        setVisitError('');
      }
    }
  };

  const handleAddVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitError('');

    if (allergyBlockMsg) {
      alert('CANNOT SAVE: Medical actions are blocked due to severe allergy warning.');
      return;
    }

    const validMeds = dispensedMeds.filter(m => m.name.trim() !== '');

    try {
      dbService.addVisit(schoolId, user.id, user.full_name, {
        patient_id: patient.id,
        visit_date: new Date().toISOString(),
        symptoms: visitSymptoms,
        temperature: visitTemp,
        observed_signs: visitSigns,
        treatments_medicines: validMeds,
        notes: visitNotes
      });

      // Clear Form & Close
      setShowVisitModal(false);
      setVisitSymptoms([]);
      setVisitTemp(36.6);
      setVisitSigns('');
      setVisitNotes('');
      setDispensedMeds([{ name: '', dosage: '', quantity: 1 }]);
      loadData();
    } catch(err: any) {
      setVisitError(err.message || 'Error logging visit.');
    }
  };

  // --- TAB 3: DAILY DRUGS & SCHEDULES ---
  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Map schedules to today logs
  const todayDoses = schedules.flatMap(sched => {
    return sched.times.map(time => {
      const log = logsToday.find(l => l.schedule_id === sched.id && l.time_administered === time);
      const scheduledHour = parseInt(time.split(':')[0]);
      
      // Missed dose detection
      const isPast = currentHour > scheduledHour;
      const isMissed = isPast && !log;

      return {
        schedule: sched,
        time,
        log,
        isMissed,
      };
    });
  });

  const handleOpenLogDoseModal = (sched: DrugSchedule, time: string, initialStatus: 'given' | 'missed' | 'refused') => {
    setActiveDoseToLog({ schedule: sched, time });
    setLogMedStatus(initialStatus);
    setLogSpecialCase(initialStatus === 'refused' ? 'refused' : 'none');
    setLogMedNotes('');
    setLogMedError('');
    setShowLogMedModal(true);
  };

  const handleLogDoseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogMedError('');

    if (!activeDoseToLog) return;

    // notes are mandatory if status !== 'given' or special_case !== 'none'
    const isSpecial = logSpecialCase !== 'none' || logMedStatus !== 'given';
    if (isSpecial && !logMedNotes.trim()) {
      setLogMedError('Notes are mandatory for special cases or non-standard administrations!');
      return;
    }

    try {
      dbService.logDrugAdministration(schoolId, user.id, user.full_name, {
        patient_id: patient.id,
        schedule_id: activeDoseToLog.schedule.id,
        drug_name: activeDoseToLog.schedule.drug_name,
        dose: activeDoseToLog.schedule.dosage,
        time_administered: activeDoseToLog.time,
        status: logMedStatus,
        notes: logMedNotes || `Logged standard take.`,
        logged_date: todayStr,
        special_case: logSpecialCase,
      });

      setShowLogMedModal(false);
      setActiveDoseToLog(null);
      setLogMedNotes('');
      loadData();
    } catch(err: any) {
      setLogMedError(err.message || 'Error logging medication administration.');
    }
  };

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSchedError('');

    if (!schedDrug || !schedDosage || !schedEndDate) {
      setSchedError('Please fill in drug name, dosage, and end date.');
      return;
    }

    // Strict Allergy check before scheduling
    const safetyCheck = checkDrugSafety(schedDrug);
    if (safetyCheck && safetyCheck.level === 'critical') {
      setSchedError(safetyCheck.warning);
      return;
    }

    try {
      dbService.addDrugSchedule(schoolId, user.id, user.full_name, {
        patient_id: patient.id,
        drug_name: schedDrug,
        dosage: schedDosage,
        frequency: schedFreq,
        times: schedTimes,
        start_date: schedStartDate,
        end_date: schedEndDate,
        is_prn: schedIsPrn,
        special_instructions: schedSpecialInstructions,
      });

      setShowScheduleModal(false);
      setSchedDrug('');
      setSchedDosage('');
      setSchedTimes(['08:00']);
      setSchedIsPrn(false);
      setSchedSpecialInstructions('');
      loadData();
    } catch(err: any) {
      setSchedError(err.message || 'Error adding schedule.');
    }
  };

  // --- TAB 4: VACCINATIONS ---
  const handleAddVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacName || !vacDueDate) {
      alert('Vaccine name and due date are required.');
      return;
    }

    dbService.addVaccination(schoolId, user.id, user.full_name, {
      patient_id: patient.id,
      vaccine_name: vacName,
      date_given: vacDateGiven || undefined,
      due_date: vacDueDate,
      status: vacStatus,
    });

    setShowVaccineModal(false);
    setVacName('');
    setVacDateGiven('');
    setVacDueDate('');
    loadData();
  };

  const handleCompleteVaccine = (vacId: string) => {
    dbService.updateVaccination(schoolId, user.id, user.full_name, vacId, {
      status: 'completed',
      date_given: new Date().toISOString().split('T')[0],
    });
    loadData();
  };

  // --- TAB 5: LAB RESULTS ---
  const handleAddLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labVal) return;

    dbService.addLabResult(schoolId, user.id, user.full_name, {
      patient_id: patient.id,
      test_name: labName,
      result_value: labVal,
      notes: labNotes,
      date_recorded: new Date().toISOString().split('T')[0],
    });

    setShowLabModal(false);
    setLabVal('');
    setLabNotes('');
    loadData();
  };

  // Process lab readings for charts
  const getLabChartData = (test: string) => {
    return labResults
      .filter(l => l.test_name === test)
      .map(l => {
        // Parse numerical values if possible
        const numVal = parseFloat(l.result_value.replace(/[^\d.]/g, ''));
        return {
          date: l.date_recorded,
          Value: isNaN(numVal) ? 0 : numVal,
          rawVal: l.result_value
        };
      })
      .reverse(); // chronological order
  };

  // --- TAB 6: DIGITAL DOCUMENTS folders ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocError('');

    if (file) {
      // Check file size (cap at 5MB for base64 storage)
      if (file.size > 5 * 1024 * 1024) {
        setDocError('File is too large. Limit is 5MB.');
        return;
      }

      setUploadedFileName(file.name);
      setUploadedFileType(file.type || 'application/octet-stream');
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileBase64 || !uploadedFileName) {
      setDocError('Please choose a file to upload.');
      return;
    }

    dbService.uploadDocument(schoolId, user.id, user.full_name, patient.id, {
      name: uploadedFileName,
      file_type: uploadedFileType,
      file_size: uploadedFileSize,
      file_data: uploadedFileBase64,
    });

    setShowDocModal(false);
    setUploadedFileName('');
    setUploadedFileBase64('');
    loadData();
  };

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm('Delete this uploaded document?')) {
      dbService.deleteDocument(schoolId, user.id, user.full_name, patient.id, docId);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Header & Navigation Back */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition border"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </button>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Summary Report download */}
          <button
            onClick={() => {
              const activeSchedules = schedules.filter(s => s.active);
              pdfService.generatePatientReportPDF(
                dbService.getSchool(schoolId)?.name || 'Pulse School',
                patient,
                visits,
                activeSchedules,
                vaccinations,
                labResults
              );
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Summary Report</span>
          </button>

          <button
            id="log-visit-btn"
            onClick={() => setShowVisitModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>Log Clinic Visit</span>
          </button>
        </div>
      </div>

      {/* Student Banner Overview Card */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-700 flex items-center justify-center rounded-2xl font-bold text-xl border">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Grade: <span className="text-slate-700">{patient.class_name}</span> &bull; 
              Student ID: <span className="text-slate-700">{patient.student_id}</span> &bull; 
              Age/DOB: <span className="text-slate-700">{patient.dob} ({getAge(patient.dob)} yrs)</span>
            </p>
          </div>
        </div>

        {/* Global Urgent Allergy Alerts Bar */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 max-w-md">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block text-[10px]">ALLERGY WARNING</span>
              <span className="font-medium text-slate-600 leading-relaxed">
                Allergic to: <strong className="text-rose-700">{patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Digital File Section Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview File' },
          { id: 'visits', label: 'Visits Timeline' },
          { id: 'drugs', label: 'Drug Consumption' },
          { id: 'vaccines', label: 'Immunization' },
          { id: 'labs', label: 'Lab Results' },
          { id: 'documents', label: 'Digital Documents' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-sm font-semibold border-b-2 transition px-4 whitespace-nowrap ${
              activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Pages content */}

      {/* 1. OVERVIEW FILE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Box 1: Allergies builder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Allergy Registry</span>
            </h4>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New allergen..."
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={newAllergySeverity}
                  onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Mod</option>
                  <option value="severe">Sev</option>
                </select>
                <button
                  onClick={handleAddAllergyAction}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-1.5 pt-2">
                {(!patient.allergies || patient.allergies.length === 0) ? (
                  <p className="text-slate-400 text-xs italic">No allergies registered.</p>
                ) : (
                  patient.allergies.map((a, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs capitalize">
                      <span className="font-bold text-rose-900">{a.allergen} ({a.severity})</span>
                      <button 
                        onClick={() => handleRemoveAllergyAction(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Box 2: Chronic conditions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-sky-500" />
              <span>Ongoing Conditions</span>
            </h4>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New condition (e.g. Asthma)..."
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleAddConditionAction}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-1.5 pt-2">
                {(!patient.ongoing_conditions || patient.ongoing_conditions.length === 0) ? (
                  <p className="text-slate-400 text-xs italic">No ongoing conditions logged.</p>
                ) : (
                  patient.ongoing_conditions.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border text-xs capitalize font-semibold text-slate-700">
                      <span>{c}</span>
                      <button 
                        onClick={() => handleRemoveConditionAction(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Box 3: regular medications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-500" />
              <span>Regular Medications</span>
            </h4>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Regular drug..."
                  value={newRegularMed}
                  onChange={(e) => setNewRegularMed(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleAddRegMedAction}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-1.5 pt-2">
                {(!patient.regular_medications || patient.regular_medications.length === 0) ? (
                  <p className="text-slate-400 text-xs italic">No regular daily medications registered.</p>
                ) : (
                  patient.regular_medications.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-emerald-50/30 border border-emerald-100 text-xs text-emerald-900 font-semibold">
                      <span>{m}</span>
                      <button 
                        onClick={() => handleRemoveRegMedAction(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. VISITS TIMELINE */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits.length === 0 ? (
            <div className="bg-white p-12 border border-slate-200 rounded-2xl shadow-sm text-center text-slate-400 text-sm">
              No clinic visits logged for this student. Click "Log Clinic Visit" above.
            </div>
          ) : (
            visits.map((v, index) => (
              <div key={v.id} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 hover:border-slate-300 transition">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">Clinic Visit &bull; Event #{visits.length - index}</span>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date(v.visit_date).toLocaleString()}</p>
                  </div>
                  
                  {/* Actions: Generate PDF Prescription / report */}
                  <div className="flex gap-2">
                    {v.treatments_medicines.length > 0 && (
                      <button
                        onClick={() => {
                          const med = v.treatments_medicines[0];
                          pdfService.generatePrescriptionPDF(
                            dbService.getSchool(schoolId)?.name || 'Pulse Clinic',
                            patient,
                            med.name,
                            med.dosage,
                            `Dispensed during clinic visit: ${v.notes}`,
                            v.created_by
                          );
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 transition"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Print Rx PDF</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-semibold leading-relaxed">
                  <div className="md:col-span-3 text-slate-400 uppercase tracking-wider">Symptoms & Temp</div>
                  <div className="md:col-span-9 text-slate-700 flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      {v.symptoms.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 border text-slate-600 rounded">{s}</span>
                      ))}
                    </div>
                    <p>Recorded temperature: <strong className="text-rose-600 font-bold">{v.temperature}°C</strong></p>
                  </div>

                  <div className="md:col-span-3 text-slate-400 uppercase tracking-wider pt-2 border-t md:border-t-0 md:pt-0">Observed Signs</div>
                  <div className="md:col-span-9 text-slate-700 font-medium pt-2 border-t md:border-t-0 md:pt-0">{v.observed_signs || 'No signs recorded.'}</div>

                  <div className="md:col-span-3 text-slate-400 uppercase tracking-wider pt-2 border-t md:border-t-0 md:pt-0">Dispensed Treatments</div>
                  <div className="md:col-span-9 text-slate-700 font-bold pt-2 border-t md:border-t-0 md:pt-0">
                    {v.treatments_medicines.length === 0 ? (
                      <span className="text-slate-400 font-normal italic">None dispensed.</span>
                    ) : (
                      v.treatments_medicines.map((m, i) => (
                        <div key={i} className="text-primary font-bold">• {m.name} ({m.dosage}) &times; {m.quantity}</div>
                      ))
                    )}
                  </div>

                  <div className="md:col-span-3 text-slate-400 uppercase tracking-wider pt-2 border-t md:border-t-0 md:pt-0">Clinical Notes</div>
                  <div className="md:col-span-9 text-slate-600 font-medium italic pt-2 border-t md:border-t-0 md:pt-0">"{v.notes || 'No notes added.'}"</div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Authorized Clinician: {v.created_by}</span>
                  <span>Record Scoped to School Isolation</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. DAILY DRUG CONSUMPTION & SCHEDULES */}
      {activeTab === 'drugs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column A: Active Schedules & Today Logs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Today's doses checklist */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-base">Today's Medication Schedule</h4>
                <p className="text-xs text-slate-400 mt-0.5">Check off scheduled drug doses administered today</p>
              </div>

              {/* Missed Doses Alert Warning */}
              {todayDoses.some(d => d.isMissed) && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Missed Doses Detected!</strong>
                    <p className="text-slate-600 mt-0.5">
                      The following doses scheduled in the past were not logged today. Please record their status:
                    </p>
                    <ul className="list-disc list-inside mt-1 font-bold text-amber-900">
                      {todayDoses.filter(d => d.isMissed).map((d, idx) => (
                        <li key={idx} className="capitalize">
                          {d.schedule.drug_name} ({d.schedule.dosage}) scheduled at {d.time}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {todayDoses.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-4 text-center">No active medication schedules mapped for today.</p>
                ) : (
                  todayDoses.map((dose, idx) => {
                    const isLogged = !!dose.log;
                    return (
                      <div key={idx} className="flex justify-between items-start p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                        <div>
                          <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                            <span>{dose.schedule.drug_name}</span>
                            {dose.schedule.is_prn && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded uppercase">
                                PRN / Emergency
                              </span>
                            )}
                          </span>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span>Dose: {dose.schedule.dosage}</span>
                              <span>&bull;</span>
                              <span className="text-slate-700 font-bold">Scheduled: {dose.time}</span>
                            </div>
                            {dose.schedule.special_instructions && (
                              <span className="text-[10px] text-amber-600 font-semibold italic">
                                Special Instructions: {dose.schedule.special_instructions}
                              </span>
                            )}
                            {dose.log?.notes && (
                              <span className="text-[10px] text-slate-500 italic">
                                Notes: "{dose.log.notes}"
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {isLogged ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize border ${
                                dose.log!.status === 'given' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                dose.log!.status === 'missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {dose.log!.status}
                              </span>
                              {dose.log!.special_case && dose.log!.special_case !== 'none' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded border border-rose-300 animate-pulse uppercase">
                                  {dose.log!.special_case.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenLogDoseModal(dose.schedule, dose.time, 'given')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition"
                              >
                                Given
                              </button>
                              <button
                                onClick={() => handleOpenLogDoseModal(dose.schedule, dose.time, 'missed')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium transition"
                              >
                                Miss
                              </button>
                              <button
                                onClick={() => handleOpenLogDoseModal(dose.schedule, dose.time, 'refused')}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition"
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

            {/* List of active schedules */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-bold text-slate-800 text-base">Long-term Medication Schedules</h4>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Prescribe Medication</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {schedules.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-4 text-center">No regular long-term medications prescribed.</p>
                ) : (
                  schedules.map((s) => (
                    <div key={s.id} className="py-3.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-sm text-slate-800">{s.drug_name}</span>
                        <div className="text-slate-400 font-medium mt-1 flex flex-wrap gap-y-1 gap-x-3">
                          <span>Dosage: <strong className="text-slate-700">{s.dosage}</strong></span>
                          <span>Frequency: <strong className="text-slate-700">{s.frequency}</strong></span>
                          <span>Times: <strong className="text-slate-700">{s.times.join(', ')}</strong></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Duration: {s.start_date} to {s.end_date}</p>
                      </div>

                      <button
                        onClick={() => {
                          dbService.updateDrugSchedule(schoolId, user.id, user.full_name, s.id, !s.active);
                          loadData();
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                          s.active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {s.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Column B: compliance logs registry */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2">Recent Log History</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {logsToday.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No actions logged today.</p>
              ) : (
                logsToday.map((log) => (
                  <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-800">{log.drug_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.status === 'given' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>{log.status}</span>
                    </div>
                    <p className="text-slate-400 font-medium mt-1">Dose: {log.dose} @ {log.time_administered}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Logged by: {log.administrator_name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. IMMUNIZATION TRACKER */}
      {activeTab === 'vaccines' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Vaccination / Immunization Card</h4>
              <p className="text-xs text-slate-400 mt-0.5">Track vaccine dosages, due dates, and clinic history</p>
            </div>
            <button
              onClick={() => setShowVaccineModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Vaccination</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Vaccine Name</th>
                  <th className="py-3 px-2">Date Given</th>
                  <th className="py-3 px-2">Due Date</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vaccinations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No vaccine records saved.</td>
                  </tr>
                ) : (
                  vaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-2 font-bold text-slate-800">{v.vaccine_name}</td>
                      <td className="py-3.5 px-2 text-slate-500">{v.date_given || 'Pending'}</td>
                      <td className="py-3.5 px-2 text-slate-500">{v.due_date}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          v.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {v.status !== 'completed' && (
                          <button
                            onClick={() => handleCompleteVaccine(v.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LAB RESULTS */}
      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column A: log list & charts */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Temperature chart (dynamically computed if records exist) */}
            {labResults.filter(l => l.test_name === 'Temperature').length >= 2 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-64 flex flex-col">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 block">Temperature Trend Log</span>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getLabChartData('Temperature')} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#94a3b8" fontSize={9} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="Value" stroke="var(--color-primary)" strokeWidth={2} name="Temp (°C)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Recorded Lab & Vitals Log</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Blood Pressure, Hemoglobin, Blood Glucose, Temperature tests</p>
                </div>
                <button
                  onClick={() => setShowLabModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Lab Reading</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {labResults.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-6 text-center">No lab readings logged for this student.</p>
                ) : (
                  labResults.map((l) => (
                    <div key={l.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">{l.test_name}</span>
                        <p className="text-slate-400 font-medium mt-0.5">Date: {l.date_recorded}</p>
                        {l.notes && <span className="text-[10px] text-slate-400 italic block mt-1">Notes: {l.notes}</span>}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 border text-slate-800 rounded-lg font-bold text-sm">
                        {l.result_value}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Column B: rapid reference values */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold text-slate-600">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2">Clinical Reference Guide</h4>
            
            <div className="space-y-3 pt-2">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-bold text-slate-800 block">Temperature Range</span>
                <p className="text-slate-400 text-[10px] mt-0.5">Normal: 36.5°C &mdash; 37.2°C</p>
                <p className="text-slate-400 text-[10px]">Fever trigger: &ge; 38.0°C</p>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-bold text-slate-800 block">Blood Pressure (BP)</span>
                <p className="text-slate-400 text-[10px] mt-0.5">Normal pediatric BP varies by age.</p>
                <p className="text-slate-400 text-[10px]">Typical: 110/70 mmHg</p>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-bold text-slate-800 block">Hemoglobin (Hb)</span>
                <p className="text-slate-400 text-[10px] mt-0.5">Male adolescent: 13.0 &mdash; 16.0 g/dL</p>
                <p className="text-slate-400 text-[10px]">Female adolescent: 12.0 &mdash; 15.0 g/dL</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 6. DIGITAL DOCUMENTS FOLDER */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Digital Medical Document Storage</h4>
              <p className="text-xs text-slate-400 mt-0.5">Store medical reports, lab PDF files, prescriptions, and consent forms</p>
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {(!patient.documents || patient.documents.length === 0) ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs italic">
                No documents uploaded. Click "Upload Document" to store student records.
              </div>
            ) : (
              patient.documents.map((doc) => (
                <div key={doc.id} className="p-4 border border-slate-200 hover:border-slate-300 rounded-2xl bg-slate-50/20 shadow-sm transition flex flex-col justify-between h-40">
                  <div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-800 block truncate" title={doc.name}>
                          {doc.name}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{doc.file_size} &bull; {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 border-t border-slate-100 pt-3 mt-3">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    
                    <a
                      href={doc.file_data}
                      download={doc.name}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL POPUPS FOR EACH CLINIC ACTION     */}
      {/* ======================================= */}

      {/* 1. Log Clinic Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Record Sickbay Visit Event</span>
              <button onClick={() => setShowVisitModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddVisitSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Allergy Blocks dynamic banner */}
              {allergyBlockMsg && (
                <div className="p-4 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs flex gap-2.5 items-start font-bold">
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span>{allergyBlockMsg}</span>
                  </div>
                </div>
              )}

              {visitError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                  {visitError}
                </div>
              )}

              {/* Symptoms tag selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Symptoms</label>
                <div className="flex flex-wrap gap-1.5">
                  {symptomOptions.map(symp => {
                    const isSelected = visitSymptoms.includes(symp);
                    return (
                      <button
                        key={symp}
                        type="button"
                        onClick={() => toggleSymptom(symp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSelected 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {symp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Temperature & Signs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={visitTemp}
                    onChange={(e) => setVisitTemp(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Observed Signs / Physical Inspection</label>
                  <input
                    type="text"
                    placeholder="Hot forehead, throat redness, wheezing..."
                    value={visitSigns}
                    onChange={(e) => setVisitSigns(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Treatments / Inventory Dispensing Rows */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispense Medication from Stock</label>
                  <button
                    type="button"
                    onClick={handleAddDispensedMedRow}
                    className="text-xs text-sky-600 font-bold hover:underline"
                  >
                    + Add Drug Row
                  </button>
                </div>

                {dispensedMeds.map((medRow, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={medRow.name}
                      onChange={(e) => handleDispensedMedChange(idx, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">-- Choose Stock Medication --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.drug_name}>
                          {item.drug_name} (Stock: {item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Dose instructions (e.g. 1 tab)"
                      value={medRow.dosage}
                      onChange={(e) => handleDispensedMedChange(idx, 'dosage', e.target.value)}
                      className="w-36 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />

                    <input
                      type="number"
                      min="1"
                      value={medRow.quantity}
                      onChange={(e) => handleDispensedMedChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                    />

                    {dispensedMeds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDispensedMedRow(idx)}
                        className="text-rose-500 font-bold text-base px-2"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Clinical Treatment Notes</label>
                <textarea
                  rows={3}
                  placeholder="Rested in sickbay for 20 mins. Instructed to drink fluids..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!allergyBlockMsg}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                    allergyBlockMsg 
                      ? 'bg-slate-300 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/10'
                  }`}
                >
                  Save Sickbay Visit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Prescribe Medication Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Schedule Daily Medication</span>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddScheduleSubmit} className="p-6 space-y-4">
              
              {schedError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {schedError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Drug</label>
                <select
                  value={schedDrug}
                  onChange={(e) => setSchedDrug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">-- Choose Stock Medication --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.drug_name}>{item.drug_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dosage</label>
                <input
                  type="text"
                  placeholder="E.g., 2 puffs, 1 tablet"
                  value={schedDosage}
                  onChange={(e) => setSchedDosage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Frequency</label>
                  <select
                    value={schedFreq}
                    onChange={(e) => setSchedFreq(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Three Times Daily">Three Times Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Schedule Hours (comma-split)</label>
                  <input
                    type="text"
                    placeholder="08:00, 15:00"
                    value={schedTimes.join(', ')}
                    onChange={(e) => setSchedTimes(e.target.value.split(',').map(t => t.trim()))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="sched-prn-checkbox"
                  checked={schedIsPrn}
                  onChange={(e) => setSchedIsPrn(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="sched-prn-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  This is an Emergency / PRN (as-needed) Medication
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Special Instructions</label>
                <input
                  type="text"
                  placeholder="E.g., take with food, crush tablet, half dose"
                  value={schedSpecialInstructions}
                  onChange={(e) => setSchedSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={schedStartDate}
                    onChange={(e) => setSchedStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={schedEndDate}
                    onChange={(e) => setSchedEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold"
                >
                  Activate Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Log Medication Confirmation Modal with Special Cases */}
      {showLogMedModal && activeDoseToLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Log Medication Administration</span>
              <button 
                onClick={() => {
                  setShowLogMedModal(false);
                  setActiveDoseToLog(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogDoseSubmit} className="p-6 space-y-4">
              
              {logMedError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {logMedError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                <div>Medication: <strong className="text-slate-900">{activeDoseToLog.schedule.drug_name}</strong></div>
                <div className="mt-1">Dose quantity: <span className="font-semibold">{activeDoseToLog.schedule.dosage}</span></div>
                <div className="mt-1">Time Scheduled: <span className="font-semibold text-primary">{activeDoseToLog.time}</span></div>
                {activeDoseToLog.schedule.special_instructions && (
                  <div className="mt-1.5 text-amber-600 font-semibold italic">
                    Special instructions: {activeDoseToLog.schedule.special_instructions}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Administration Status</label>
                <select
                  value={logMedStatus}
                  onChange={(e) => {
                    const statusVal = e.target.value as any;
                    setLogMedStatus(statusVal);
                    if (statusVal === 'refused') {
                      setLogSpecialCase('refused');
                    } else if (logSpecialCase === 'refused') {
                      setLogSpecialCase('none');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="given">Given / Administered</option>
                  <option value="missed">Missed Dose</option>
                  <option value="refused">Refused Dose</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Special Case Flag</label>
                <select
                  value={logSpecialCase}
                  onChange={(e) => {
                    const caseVal = e.target.value as any;
                    setLogSpecialCase(caseVal);
                    if (caseVal === 'refused') {
                      setLogMedStatus('refused');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="none">None (Standard Administration)</option>
                  <option value="refused">Medication Refusal</option>
                  <option value="vomited">Vomited after dose</option>
                  <option value="adverse_reaction">Adverse allergy reaction</option>
                  <option value="prn_emergency">Emergency or PRN (as-needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
                  Nurse Logging Notes {(logSpecialCase !== 'none' || logMedStatus !== 'given') && <span className="text-rose-500 font-bold">* (Mandatory)</span>}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    logSpecialCase !== 'none' || logMedStatus !== 'given'
                      ? "Enter mandatory observations (e.g. reasons, symptoms, follow-up actions)..."
                      : "Enter routine administration observations..."
                  }
                  value={logMedNotes}
                  onChange={(e) => setLogMedNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required={logSpecialCase !== 'none' || logMedStatus !== 'given'}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogMedModal(false);
                    setActiveDoseToLog(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/10"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Record Vaccination Modal */}
      {showVaccineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Record Immunization Card</span>
              <button onClick={() => setShowVaccineModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddVaccineSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vaccine Name</label>
                <input
                  type="text"
                  placeholder="MMR booster, Meningococcal..."
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Administered</label>
                  <input
                    type="date"
                    value={vacDateGiven}
                    onChange={(e) => setVacDateGiven(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Due Date</label>
                  <input
                    type="date"
                    value={vacDueDate}
                    onChange={(e) => setVacDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vaccine Schedule Status</label>
                <select
                  value={vacStatus}
                  onChange={(e) => setVacStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVaccineModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold"
                >
                  Save to Immunization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log Lab Reading Modal */}
      {showLabModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Record Clinic Lab Measurement</span>
              <button onClick={() => setShowLabModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddLabSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lab Test Type</label>
                <select
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Malaria RDT">Malaria RDT</option>
                  <option value="Hemoglobin">Hemoglobin (Hb)</option>
                  <option value="Blood Pressure">Blood Pressure (BP)</option>
                  <option value="Temperature">Temperature</option>
                  <option value="Blood Glucose">Blood Glucose</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Result Reading Value</label>
                <input
                  type="text"
                  placeholder="E.g., 37.1 C, Positive, 12 g/dL, 120/80 mmHg"
                  value={labVal}
                  onChange={(e) => setLabVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lab Notes / Reference</label>
                <input
                  type="text"
                  placeholder="Fast check pre-lunch, fingertip prick..."
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Upload Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Store Digital Attachment</span>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="p-6 space-y-4">
              
              {docError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {docError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Document File</label>
                <label className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/50 cursor-pointer text-slate-500 transition">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-medium">Click to select files (Max 5MB)</span>
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {uploadedFileName && (
                <div className="p-3 border rounded-xl bg-sky-50/50 text-xs">
                  <strong className="text-slate-800 block truncate">{uploadedFileName}</strong>
                  <span className="text-slate-400 block mt-0.5">{uploadedFileSize} &bull; {uploadedFileType}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFileBase64}
                  className={`px-4 py-2 text-white font-semibold rounded-xl text-xs transition ${
                    uploadedFileBase64 
                      ? 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/10' 
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm truncate max-w-xl">{previewDoc.name}</span>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white font-bold text-lg">
                &times;
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-center items-center min-h-[300px] max-h-[60vh] overflow-y-auto">
              {previewDoc.file_type.startsWith('image/') ? (
                <img 
                  src={previewDoc.file_data} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-[50vh] object-contain rounded-lg border shadow"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <span className="font-semibold block text-slate-700">Digital Document Preview Not Available</span>
                  <span className="text-xs mt-1 block">Please download the file below to view it locally on your computer.</span>
                  
                  <a
                    href={previewDoc.file_data}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition mt-6"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({previewDoc.file_size})</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 text-right">
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
