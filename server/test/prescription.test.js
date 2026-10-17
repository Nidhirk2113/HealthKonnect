import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { renderPrescription } = await import('../src/services/prescriptionPdf.js');

test('renders a valid multi-field prescription PDF', async () => {
  const pdf = await renderPrescription({
    clinic: { name: 'Tulasi Healthcare', address: 'Bengaluru' },
    doctor: { name: 'Dr. Anita Rao' },
    doctorProfile: { qualifications: 'MBBS, MD', specialty: ['General Psychiatry'], registrationNumber: 'KMC-1' },
    patient: { name: 'Asha K', phone: '+919876543210' },
    appointment: { mode: 'ONLINE' },
    consultation: {
      rxNumber: 'TH-20300107-ABC123', finalizedAt: new Date('2030-01-07T05:00:00Z'), diagnosis: 'Generalised anxiety',
      advice: 'Sleep hygiene.\nReduce caffeine.', followUpDate: new Date('2030-02-07T00:00:00Z'),
      medicines: [{ name: 'Escitalopram 10mg', dosage: '1 tablet', frequency: 'Once daily, morning', duration: '4 weeks', instructions: 'After food' }],
    },
  });
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 1500);
});

test('handles an empty medicine list', async () => {
  const pdf = await renderPrescription({
    clinic: { name: 'T', address: 'B' }, doctor: { name: 'Dr X' }, patient: { name: 'P' }, appointment: { mode: 'IN_CLINIC' },
    consultation: { rxNumber: 'TH-1', diagnosis: '', advice: 'Rest', medicines: [] },
  });
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});
