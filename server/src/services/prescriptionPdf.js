import PDFDocument from 'pdfkit';

const GREEN = '#17623f';
const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

/**
 * Renders an e-prescription to a Buffer.
 * Uses the built-in Helvetica font, which has no rupee glyph, so amounts use "Rs.".
 */
export function renderPrescription({ clinic, doctor, doctorProfile, patient, appointment, consultation }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Prescription ${consultation.rxNumber}`, Author: clinic.name } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;
    const rule = () => doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#d6e4dc').lineWidth(1).stroke().moveDown(0.6);
    const heading = (t) => doc.moveDown(0.6).fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text(t.toUpperCase(), { characterSpacing: 1 }).moveDown(0.2);
    const body = (t) => doc.fillColor('#20332b').font('Helvetica').fontSize(11).text(t || '-', { width });

    // Letterhead
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(20).text(clinic.name);
    doc.fillColor('#5b6f65').font('Helvetica').fontSize(9).text(clinic.address).moveDown(0.5);
    rule();

    // Doctor / Rx meta
    const top = doc.y;
    doc.fillColor('#20332b').font('Helvetica-Bold').fontSize(12).text(`Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}`, left, top);
    doc.font('Helvetica').fontSize(9.5).fillColor('#5b6f65');
    if (doctorProfile?.qualifications) doc.text(doctorProfile.qualifications);
    if (doctorProfile?.specialty?.length) doc.text(doctorProfile.specialty.join(', '));
    if (doctorProfile?.registrationNumber) doc.text(`Reg. No: ${doctorProfile.registrationNumber}`);
    const afterDoctor = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#20332b').text(`Rx No: ${consultation.rxNumber}`, left, top, { width, align: 'right' });
    doc.font('Helvetica').fontSize(9.5).fillColor('#5b6f65')
      .text(`Date: ${fmtDate(consultation.finalizedAt || new Date())}`, left, doc.y, { width, align: 'right' })
      .text(`Mode: ${appointment.mode === 'ONLINE' ? 'Video consultation' : 'In-clinic'}`, left, doc.y, { width, align: 'right' });
    doc.y = Math.max(afterDoctor, doc.y) + 8;
    rule();

    // Patient
    heading('Patient');
    body(`${patient.name}${patient.phone ? `  |  ${patient.phone}` : ''}`);

    heading('Diagnosis');
    body(consultation.diagnosis);

    heading('Medicines');
    if (!consultation.medicines.length) {
      body('No medicines prescribed.');
    } else {
      consultation.medicines.forEach((m, i) => {
        const line = [m.dosage, m.frequency, m.duration].filter(Boolean).join('  |  ');
        doc.fillColor('#20332b').font('Helvetica-Bold').fontSize(11).text(`${i + 1}. ${m.name}`, { width });
        if (line) doc.font('Helvetica').fontSize(10).fillColor('#20332b').text(line, left + 16, doc.y, { width: width - 16 });
        if (m.instructions) doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#5b6f65').text(m.instructions, left + 16, doc.y, { width: width - 16 });
        doc.x = left;
        doc.moveDown(0.4);
      });
    }

    heading('Advice');
    body(consultation.advice);

    if (consultation.followUpDate) {
      heading('Follow-up');
      body(`Please review on or around ${fmtDate(consultation.followUpDate)}.`);
    }

    // Signature + footer
    doc.moveDown(2);
    doc.fillColor('#20332b').font('Helvetica-Bold').fontSize(10).text(`Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}`, left, doc.y, { width, align: 'right' });
    doc.font('Helvetica').fontSize(8.5).fillColor('#5b6f65').text('Electronically signed', left, doc.y, { width, align: 'right' });

    const footerY = doc.page.height - 70;
    doc.moveTo(left, footerY).lineTo(left + width, footerY).strokeColor('#d6e4dc').stroke();
    doc.fontSize(8).fillColor('#8a9a92').text(
      'This is a computer-generated prescription issued after a consultation on Tulasi HealthConnect. ' +
        'Take medicines only as directed. In a mental-health emergency, call 112 or Tele-MANAS 14416.',
      left, footerY + 8, { width, align: 'center' }
    );
    doc.end();
  });
}
