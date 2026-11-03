import test from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilWarrantyExpires } from '../src/warranty.js';

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
