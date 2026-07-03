import { jsPDF } from 'jspdf';
import type { Patient, Visit, DrugSchedule, Vaccination, LabResult } from './db';

export const pdfService = {
  generatePrescriptionPDF(
    schoolName: string,
    patient: Patient,
    drugName: string,
    dosage: string,
    notes: string,
    doctorName: string
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5', // A5 is perfect for medical prescription slips
    });

    // 1. Decorative Border
    doc.setDrawColor(2, 132, 199); // Sky Blue (Primary color default)
    doc.setLineWidth(1.5);
    doc.rect(5, 5, 138, 200);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(7, 7, 134, 196);

    // 2. Header
    doc.setFillColor(248, 250, 252);
    doc.rect(8, 8, 132, 28, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(schoolName.toUpperCase(), 12, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('SCHOOL SICKBAY & CLINIC SERVICES', 12, 23);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 108, 18);

    // 3. Rx Symbol
    doc.setTextColor(2, 132, 199);
    doc.setFont('times', 'italic');
    doc.setFontSize(26);
    doc.text('Rx', 12, 52);

    // 4. Patient Information
    doc.setDrawColor(226, 232, 240);
    doc.line(8, 36, 140, 36);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PATIENT DETAILS', 12, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${patient.name}`, 12, 49);
    doc.text(`Student ID: ${patient.student_id}`, 12, 54);
    doc.text(`Class: ${patient.class_name}`, 80, 49);
    doc.text(`Age/DOB: ${patient.dob} (${calculateAge(patient.dob)} yrs)`, 80, 54);

    // Allergy Alerts
    if (patient.allergies && patient.allergies.length > 0) {
      doc.setTextColor(220, 38, 38); // Red
      doc.setFont('helvetica', 'bold');
      const allergiesStr = patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ');
      doc.text(`ALLERGIES: ${allergiesStr}`, 12, 60);
      doc.setTextColor(15, 23, 42);
    }

    doc.line(8, 64, 140, 64);

    // 5. Prescription Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MEDICATION PRESCRIBED:', 12, 73);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(2, 132, 199);
    doc.text(drugName, 15, 83);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Dosage / Instructions: ${dosage}`, 15, 90);

    if (notes) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Clinician Notes:', 12, 105);
      const splitNotes = doc.splitTextToSize(notes, 115);
      doc.text(splitNotes, 12, 110);
    }

    // 6. Signatures
    doc.setDrawColor(203, 213, 225);
    doc.line(80, 175, 132, 175);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Clinician Signature', 94, 179);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(doctorName, 80, 171);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a simulated digital prescription from Pulse School Clinic.', 12, 195);

    // Save
    doc.save(`Prescription_${patient.name.replace(/\s+/g, '_')}.pdf`);
  },

  generatePatientReportPDF(
    schoolName: string,
    patient: Patient,
    visits: Visit[],
    schedules: DrugSchedule[],
    vaccinations: Vaccination[],
    labResults: LabResult[]
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [2, 132, 199];

    // Decorative lines
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.line(10, 10, 200, 10);

    // Header
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('STUDENT SICKBAY RECORD SUMMARY', 12, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${schoolName.toUpperCase()} SICKBAY SERVICES`, 12, 27);
    doc.text(`Report Generated On: ${new Date().toLocaleDateString()}`, 145, 27);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(10, 31, 200, 31);

    // Section: Student Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('I. STUDENT PROFILE', 12, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Full Name: ${patient.name}`, 12, 46);
    doc.text(`Student ID: ${patient.student_id}`, 12, 52);
    doc.text(`Gender: ${patient.gender}`, 12, 58);
    doc.text(`Date of Birth: ${patient.dob} (${calculateAge(patient.dob)} years old)`, 105, 46);
    doc.text(`Class/Grade: ${patient.class_name}`, 105, 52);

    // Allergies block in profile
    doc.setFont('helvetica', 'bold');
    if (patient.allergies && patient.allergies.length > 0) {
      doc.setTextColor(220, 38, 38);
      const allergiesStr = patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ');
      doc.text(`Known Allergies: ${allergiesStr}`, 12, 66);
    } else {
      doc.setTextColor(71, 85, 105);
      doc.text('Known Allergies: No Known Allergies (NKA)', 12, 66);
    }

    if (patient.ongoing_conditions && patient.ongoing_conditions.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.text(`Chronic Conditions: ${patient.ongoing_conditions.join(', ')}`, 12, 72);
    }

    doc.line(10, 78, 200, 78);

    // Section: Active Medication Schedules
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('II. SCHEDULED DAILY MEDICATIONS', 12, 86);

    let y = 93;
    if (schedules.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('No active regular medications scheduled.', 15, y);
      y += 8;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Drug Name', 15, y);
      doc.text('Dosage', 70, y);
      doc.text('Frequency', 105, y);
      doc.text('Schedule Times', 145, y);
      doc.line(10, y + 2, 200, y + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      schedules.forEach(s => {
        y += 8;
        doc.text(s.drug_name, 15, y);
        doc.text(s.dosage, 70, y);
        doc.text(s.frequency, 105, y);
        doc.text(s.times.join(', '), 145, y);
      });
      y += 10;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(10, y, 200, y);
    y += 8;

    // Section: Vaccination Record
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('III. VACCINATION & IMMUNIZATION STATUS', 12, y);
    y += 7;

    if (vaccinations.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('No immunization records stored.', 15, y);
      y += 8;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Vaccine Name', 15, y);
      doc.text('Date Administered', 80, y);
      doc.text('Due Date', 130, y);
      doc.text('Status', 170, y);
      doc.line(10, y + 2, 200, y + 2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      vaccinations.forEach(v => {
        y += 8;
        doc.text(v.vaccine_name, 15, y);
        doc.text(v.date_given || 'Not Administered', 80, y);
        doc.text(v.due_date, 130, y);
        
        if (v.status === 'overdue') {
          doc.setTextColor(220, 38, 38);
        } else if (v.status === 'completed') {
          doc.setTextColor(22, 163, 74);
        } else {
          doc.setTextColor(71, 85, 105);
        }
        doc.text(v.status.toUpperCase(), 170, y);
        doc.setTextColor(51, 65, 85);
      });
      y += 10;
    }

    doc.line(10, y, 200, y);
    y += 8;

    // Check for page overflow before lab section
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    // Section: Lab Measurements & Readings
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('IV. CLINICAL LAB MEASUREMENTS', 12, y);
    y += 7;

    if (labResults.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('No lab measurement records logged.', 15, y);
      y += 8;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Lab test / Measurement', 15, y);
      doc.text('Date Taken', 80, y);
      doc.text('Reading Value', 130, y);
      doc.text('Clinician Notes', 160, y);
      doc.line(10, y + 2, 200, y + 2);
      y += 2;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      labResults.forEach(l => {
        y += 8;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(l.test_name, 15, y);
        doc.text(new Date(l.date_recorded).toLocaleDateString(), 80, y);
        doc.text(l.result_value, 130, y);
        doc.text(l.notes ? (l.notes.length > 20 ? l.notes.substring(0, 18) + '..' : l.notes) : '', 160, y);
      });
      y += 10;
    }

    doc.line(10, y, 200, y);
    y += 8;

    // Check for page overflow before visits section
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // Section: Visit History
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('V. SICKBAY VISIT JOURNAL & CLINIC EVENTS', 12, y);
    y += 7;

    if (visits.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('No clinic visit records found.', 15, y);
    } else {
      visits.forEach((v, index) => {
        // Page break check per visit
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Event #${visits.length - index}: ${new Date(v.visit_date).toLocaleString()}`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Logged By: ${v.created_by}`, 130, y);
        y += 5;

        doc.setTextColor(71, 85, 105);
        doc.text(`Symptoms: ${v.symptoms.join(', ')} (Temp: ${v.temperature}°C)`, 18, y);
        y += 5;

        doc.text(`Observed Signs: ${v.observed_signs}`, 18, y);
        y += 5;

        const meds = v.treatments_medicines.map(t => `${t.name} (${t.dosage})`).join(', ');
        doc.text(`Treatments & Meds: ${meds || 'None dispensed'}`, 18, y);
        y += 5;

        if (v.notes) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Clinical Notes: ${v.notes}`, 18, y);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }
        
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y, 195, y);
        y += 6;
      });
    }

    // Save
    doc.save(`Sickbay_Report_${patient.name.replace(/\s+/g, '_')}.pdf`);
  },
};

// Age calculator helper
function calculateAge(dobString: string): number {
  const birthday = new Date(dobString);
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
