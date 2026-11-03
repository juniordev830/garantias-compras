import test from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilWarrantyExpires, upcomingWarrantyExpirations } from '../src/warranty.js';

test('calculates warranty expiration and remaining days', () => {
  const today = new Date('2026-11-03T00:00:00.000Z');
  const result = daysUntilWarrantyExpires('2026-10-04T00:00:00.000Z', 30, today);
  assert.equal(result.expiresAt.toISOString(), '2026-11-03T00:00:00.000Z');
  assert.equal(result.remainingDays, 0);
  assert.equal(result.expired, false);
});

test('rejects invalid warranty input', () => {
  assert.throws(() => daysUntilWarrantyExpires('not-a-date', 30), RangeError);
  assert.throws(() => daysUntilWarrantyExpires('2026-01-01', -1), RangeError);
});

test('lists upcoming warranties by remaining days without mutating input', () => {
  const today = new Date('2026-11-03T18:00:00.000Z');
  const purchases = [
    { id: 'later', purchaseDate: '2026-10-30T00:00:00.000Z', warrantyDays: 10 },
    { id: 'overdue', purchaseDate: '2026-10-01T00:00:00.000Z', warrantyDays: 30 },
    { id: 'today', purchaseDate: '2026-10-04T00:00:00.000Z', warrantyDays: 30 },
    { id: 'future', purchaseDate: '2026-11-03T00:00:00.000Z', warrantyDays: 365 },
  ];
  const before = JSON.stringify(purchases);
  const upcoming = upcomingWarrantyExpirations(purchases, today, 7);
  assert.deepEqual(upcoming.map(({ id, remainingDays }) => ({ id, remainingDays })), [
    { id: 'today', remainingDays: 0 }, { id: 'later', remainingDays: 6 },
  ]);
  assert.equal(JSON.stringify(purchases), before);
  assert.equal(upcoming[0].expiresAt.toISOString(), '2026-11-03T00:00:00.000Z');
  assert.deepEqual(upcomingWarrantyExpirations(purchases, today, 0).map(x => x.id), ['today']);
});

test('computes integer UTC calendar days independent of time of day', () => {
  const a = daysUntilWarrantyExpires('2026-10-04T00:00:00Z', 30, new Date('2026-11-03T23:59:59Z'));
  assert.equal(a.remainingDays, 0);
  assert.equal(a.expired, false);
  const b = daysUntilWarrantyExpires('2026-10-04T00:00:00Z', 30, new Date('2026-11-04T00:00:00Z'));
  assert.equal(b.remainingDays, -1);
  assert.equal(b.expired, true);
  assert.throws(() => daysUntilWarrantyExpires('2026-01-01', 10, new Date('invalid')), RangeError);
});

test('rejects duplicate IDs, bad entries and invalid window', () => {
  const now = new Date('2026-11-03T00:00:00Z');
  const purchase = { id: 'same', purchaseDate: '2026-10-04', warrantyDays: 30 };
  assert.throws(() => upcomingWarrantyExpirations([purchase, purchase], now), RangeError);
  assert.throws(() => upcomingWarrantyExpirations([{ ...purchase, id: '' }], now), RangeError);
  assert.throws(() => upcomingWarrantyExpirations([{ ...purchase, warrantyDays: -1 }], now), RangeError);
  assert.throws(() => upcomingWarrantyExpirations([purchase], now, -1), RangeError);
  assert.throws(() => upcomingWarrantyExpirations([purchase], now, 3651), RangeError);
  assert.throws(() => upcomingWarrantyExpirations([], new Date('invalid')), RangeError);
  assert.throws(() => daysUntilWarrantyExpires(null, 30, now), RangeError);
});
