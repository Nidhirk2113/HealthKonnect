import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSlots, weekdayOf, istDate, isValidDateString } from '../src/utils/slots.js';

const profile = { slotDurationMinutes: 20, workingHours: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }] };
const MONDAY = '2030-01-07';
const longAgo = new Date('2020-01-01T00:00:00Z');

test('weekday is computed in IST', () => {
  assert.equal(weekdayOf(MONDAY), 1);
  assert.equal(weekdayOf('2030-01-06'), 0);
});

test('generates back-to-back slots inside working hours', () => {
  const slots = generateSlots(profile, MONDAY, [], longAgo);
  assert.equal(slots.length, 3);
  assert.equal(slots[0].startIso, '2030-01-07T04:30:00.000Z'); // 10:00 IST
  assert.equal(slots[2].endIso, '2030-01-07T05:30:00.000Z'); // 11:00 IST
  assert.ok(slots.every((s) => s.isAvailable));
});

test('no slots on a non-working day', () => {
  assert.equal(generateSlots(profile, '2030-01-08', [], longAgo).length, 0);
});

test('a slot that does not fit before closing is dropped', () => {
  const p = { slotDurationMinutes: 45, workingHours: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:30' }] };
  assert.equal(generateSlots(p, MONDAY, [], longAgo).length, 2);
});

test('busy appointments and past slots are unavailable', () => {
  const busy = [{ slotStart: new Date('2030-01-07T04:50:00Z'), slotEnd: new Date('2030-01-07T05:10:00Z') }];
  const slots = generateSlots(profile, MONDAY, busy, longAgo);
  assert.deepEqual(slots.map((s) => s.isAvailable), [true, false, true]);
  const now = new Date('2030-01-07T04:40:00Z'); // 10:10 IST: first slot started, lead time hides the second
  assert.deepEqual(generateSlots(profile, MONDAY, [], now).map((s) => s.isAvailable), [false, false, true]);
});

test('date helpers', () => {
  assert.equal(istDate(new Date('2030-01-06T20:00:00Z')), '2030-01-07'); // 01:30 IST next day
  assert.ok(isValidDateString('2030-01-07'));
  assert.ok(!isValidDateString('2030-13-45'));
  assert.ok(!isValidDateString('tomorrow'));
});
