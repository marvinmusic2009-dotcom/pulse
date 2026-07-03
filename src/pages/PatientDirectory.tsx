import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User, Patient } from '../services/db';
import { 
  Search, Plus, Filter, User as UserIcon, X, 
  ShieldAlert, FileText, ChevronRight, Activity, Trash2
} from 'lucide-react';

interface PatientDirectoryProps {
  user: User;
  onSelectPatient: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function PatientDirectory({ user, onSelectPatient, setActiveTab }: PatientDirectoryProps) {
  const schoolId = user.school_id;

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  // Selected patient for slide-out preview drawer
  const [previewPatientId, setPreviewPatientId] = useState<string | null>(null);

  // New Student modal form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newDob, setNewDob] = useState('');
  const [newClass, setNewClass] = useState('');
  
  // Allergy builder state
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [allergiesList, setAllergiesList] = useState<{ allergen: string; severity: 'mild' | 'moderate' | 'severe' }[]>([]);

  // Condition builder state
  const [newConditionText, setNewConditionText] = useState('');
  const [conditionsList, setConditionsList] = useState<string[]>([]);

  // Medication builder state
  const [newMedText, setNewMedText] = useState('');
  const [medsList, setMedsList] = useState<string[]>([]);

  const [modalError, setModalError] = useState('');

  // Load patients
  const loadPatients = () => {
    setPatients(dbService.getPatients(schoolId));
  };

  useEffect(() => {
    loadPatients();
  }, [schoolId]);

  // Unique lists for filtering dropdowns
  const availableClasses = Array.from(new Set(patients.map(p => p.class_name)));
  
  const allConditions = Array.from(new Set(patients.flatMap(p => p.ongoing_conditions || [])));

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.class_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass ? p.class_name === selectedClass : true;
    const matchesGender = selectedGender ? p.gender === selectedGender : true;
    const matchesCondition = selectedCondition ? p.ongoing_conditions?.includes(selectedCondition) : true;

    return matchesSearch && matchesClass && matchesGender && matchesCondition;
  });

  // Selected patient for drawer
  const previewPatient = patients.find(p => p.id === previewPatientId);

  // Quick Allergy additions
  const handleAddAllergy = () => {
    if (newAllergen.trim()) {
      setAllergiesList([...allergiesList, { allergen: newAllergen.trim(), severity: newAllergySeverity }]);
      setNewAllergen('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergiesList(allergiesList.filter((_, idx) => idx !== index));
  };

  // Quick Condition additions
  const handleAddCondition = () => {
    if (newConditionText.trim()) {
      setConditionsList([...conditionsList, newConditionText.trim()]);
      setNewConditionText('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setConditionsList(conditionsList.filter((_, idx) => idx !== index));
  };

  // Quick Med additions
  const handleAddMed = () => {
    if (newMedText.trim()) {
      setMedsList([...medsList, newMedText.trim()]);
      setNewMedText('');
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedsList(medsList.filter((_, idx) => idx !== index));
  };

  // Handle Add Student form submit
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newName || !newStudentId || !newDob || !newClass) {
      setModalError('Please fill in Name, Student ID, DOB, and Class.');
      return;
    }

    try {
      dbService.addPatient(schoolId, user.id, user.full_name, {
        name: newName,
        student_id: newStudentId,
        gender: newGender,
        dob: newDob,
        class_name: newClass,
        allergies: allergiesList,
        ongoing_conditions: conditionsList,
        regular_medications: medsList,
      });

      // Reset & Reload
      setShowAddModal(false);
      setNewName('');
      setNewStudentId('');
      setNewDob('');
      setNewClass('');
      setAllergiesList([]);
      setConditionsList([]);
      setMedsList([]);
      loadPatients();
    } catch(err: any) {
      setModalError(err.message || 'Error saving student file.');
    }
  };

  // Calculate age
  const getAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Delete student
  const handleDeleteStudent = (patientId: string) => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete this student file? All medical visits, daily drug schedules, logs, and uploaded documents will be deleted.')) {
      try {
        dbService.deletePatient(schoolId, user.id, user.full_name, patientId);
        setPreviewPatientId(null);
        loadPatients();
      } catch(e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              id="global-patient-search"
              type="text"
              placeholder="Search by student name, ID, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-sm font-medium"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-sm transition shadow-lg shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create Student File</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-primary"
          >
            <option value="">All Grades</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-primary"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          {/* Condition Filter */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-primary"
          >
            <option value="">All Chronic Conditions</option>
            {allConditions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Reset button */}
          {(selectedClass || selectedGender || selectedCondition || searchQuery) && (
            <button
              onClick={() => {
                setSelectedClass('');
                setSelectedGender('');
                setSelectedCondition('');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid: Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center border border-slate-200 rounded-2xl shadow-sm text-slate-400">
            No students match the current filters. Click "Create Student File" to add one.
          </div>
        ) : (
          filteredPatients.map(p => {
            const hasSevereAllergy = p.allergies?.some(a => a.severity === 'severe');
            return (
              <div 
                key={p.id}
                onClick={() => setPreviewPatientId(p.id)}
                className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition cursor-pointer flex flex-col justify-between ${
                  previewPatientId === p.id ? 'ring-2 ring-primary border-primary' : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm hover:text-primary transition">{p.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">{p.class_name} &bull; {p.student_id}</p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold border">
                      {p.gender} &bull; {getAge(p.dob)} yrs
                    </span>
                    
                    {/* Allergy badging */}
                    {p.allergies && p.allergies.length > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                        hasSevereAllergy 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                        <span>Allergies</span>
                      </span>
                    )}

                    {/* Conditions badging */}
                    {p.ongoing_conditions && p.ongoing_conditions.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-semibold">
                        {p.ongoing_conditions.length} Condition{p.ongoing_conditions.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Created: {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="text-primary hover:underline flex items-center gap-0.5">
                    <span>Quick view</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-out Preview Drawer */}
      {previewPatient && (
        <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs flex justify-end">
          {/* Backdrop closer click */}
          <div className="flex-1" onClick={() => setPreviewPatientId(null)} />
          
          <div className="w-full max-w-md bg-white h-screen shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slide-in relative">
            <div className="overflow-y-auto flex-1">
              
              {/* Drawer Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-bold">
                    {previewPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{previewPatient.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{previewPatient.student_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewPatientId(null)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Drawer Body content */}
              <div className="p-6 space-y-6">
                
                {/* Allergy alert banner */}
                {previewPatient.allergies && previewPatient.allergies.length > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 text-rose-800">
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="text-xs font-bold uppercase tracking-wider">Allergy Alert</strong>
                      <p className="text-xs mt-1 leading-relaxed">
                        Patient has active allergies. Please check cross-reactions before administering medications:
                      </p>
                      <ul className="list-disc list-inside text-xs font-semibold mt-1 space-y-0.5">
                        {previewPatient.allergies.map((a, idx) => (
                          <li key={idx} className="capitalize">
                            {a.allergen} &mdash; <span className="underline">{a.severity} severity</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Profile Grid */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Class/Grade</span>
                    <span className="text-slate-800 mt-0.5 block">{previewPatient.class_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Gender</span>
                    <span className="text-slate-800 mt-0.5 block">{previewPatient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Date of Birth</span>
                    <span className="text-slate-800 mt-0.5 block">{previewPatient.dob}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Age</span>
                    <span className="text-slate-800 mt-0.5 block">{getAge(previewPatient.dob)} years</span>
                  </div>
                </div>

                {/* Section: Chronic Conditions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Chronic Conditions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewPatient.ongoing_conditions && previewPatient.ongoing_conditions.length > 0 ? (
                      previewPatient.ongoing_conditions.map((c, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-100 border text-slate-700 rounded-lg text-xs font-medium capitalize">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No chronic conditions logged.</span>
                    )}
                  </div>
                </div>

                {/* Section: Regular Medications */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Regular Medications</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewPatient.regular_medications && previewPatient.regular_medications.length > 0 ? (
                      previewPatient.regular_medications.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-lg text-xs font-medium">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No regular daily medications.</span>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Drawer Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-2.5">
              <button
                onClick={() => {
                  onSelectPatient(previewPatient.id);
                  setActiveTab('patients');
                  setPreviewPatientId(null);
                }}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
              >
                <FileText className="w-4 h-4" />
                <span>Open Digital Medical File</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSelectPatient(previewPatient.id);
                    setActiveTab('patients');
                    setPreviewPatientId(null);
                    // Slight timeout to open Log Visit modal in patient file
                    setTimeout(() => {
                      const logVisitBtn = document.getElementById('log-visit-btn');
                      if (logVisitBtn) logVisitBtn.click();
                    }, 400);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Log Visit</span>
                </button>

                <button
                  onClick={() => handleDeleteStudent(previewPatient.id)}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition border border-rose-200 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete File</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-sky-400" />
                <span className="font-bold text-base">Create Student Medical File</span>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setModalError('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Student Name</label>
                  <input
                    type="text"
                    placeholder="Liam Carter"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Student Registration ID</label>
                  <input
                    type="text"
                    placeholder="STU-10293"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class / Grade</label>
                  <input
                    type="text"
                    placeholder="E.g., Grade 10-A"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Allergy Builder */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Allergies & Intolerances</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Allergen (e.g., Penicillin, Peanuts)"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={newAllergySeverity}
                    onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allergiesList.map((a, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold capitalize">
                      <span>{a.allergen} ({a.severity})</span>
                      <button type="button" onClick={() => handleRemoveAllergy(idx)} className="text-rose-500 hover:text-rose-700 ml-1">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Condition Builder */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Chronic/Ongoing Conditions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g., Asthma, Diabetes"
                    value={newConditionText}
                    onChange={(e) => setNewConditionText(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {conditionsList.map((c, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border rounded-full text-xs font-medium">
                      <span>{c}</span>
                      <button type="button" onClick={() => handleRemoveCondition(idx)} className="text-slate-500 hover:text-slate-700 ml-1">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Med Builder */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Regular/Daily Medications</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g., Albuterol Inhaler, Insulin"
                    value={newMedText}
                    onChange={(e) => setNewMedText(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {medsList.map((m, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-xs font-medium">
                      <span>{m}</span>
                      <button type="button" onClick={() => handleRemoveMed(idx)} className="text-sky-500 hover:text-sky-700 ml-1">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-primary/10"
                >
                  Save Student File
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
