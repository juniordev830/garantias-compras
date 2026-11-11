import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCalendarDate, validatePurchase, validateCatalog,
  addPurchase, updatePurchase, removePurchase, getWarranty,
  listWarranties, summarizeWarranties,
} from '../src/catalog.js';

const TODAY = new Date('2026-11-07T18:00:00.000Z');
const base = {
  id: 'bike_01',
  product: 'Bicicleta MTB 29',
  seller: 'Loja Central',
  purchaseDate: '2026-10-20',
  warrantyDays: 30,
  priceCents: 175000,
  receiptNote: 'Arquivo guardado em casa',
};

function item(overrides = {}) {
  return { ...base, ...overrides };
}

test('validates real calendar dates including leap years', () => {
  assert.equal(parseCalendarDate('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  for (const input of ['2026-02-29', '2026-04-31', '2026-2-1', 'bogus', 77]) {
    assert.throws(() => parseCalendarDate(input), RangeError);
  }
});

test('normalizes records without mutating input', () => {
  const purchase = item({ product: '  Bicicleta  ', seller: '  Loja X ' });
  const clean = validatePurchase(purchase);
  assert.equal(clean.product, 'Bicicleta');
  assert.equal(clean.seller, 'Loja X');
  assert.equal(purchase.product, '  Bicicleta  ');
  assert.equal(Object.isFrozen(clean), true);
});

test('rejects invalid purchases and duplicate identifiers', () => {
  const invalid = [
    item({ id: 'not valid!' }),
    item({ product: '   ' }),
    item({ seller: '' }),
    item({ warrantyDays: 3651 }),
    item({ warrantyDays: 0.2 }),
    item({ priceCents: -1 }),
    item({ priceCents: 1.5 }),
    item({ purchaseDate: '2026-02-30' }),
    item({ receiptNote: 'bad\nnote' }),
  ];
  for (const entry of invalid) {
    assert.throws(() => validatePurchase(entry), RangeError);
  }
  assert.throws(() => validateCatalog([base, base]), /duplicado/);
  assert.throws(() => validateCatalog({ purchases: [base] }), RangeError);
});

test('adding, editing and removing purchases is immutable', () => {
  const original = [];
  const added = addPurchase(original, base);
  assert.equal(original.length, 0);
  assert.equal(added.length, 1);
  assert.throws(() => addPurchase(added, base), /cadastrada/);
  const changed = updatePurchase(added, base.id, { priceCents: 165000 });
  assert.equal(changed[0].priceCents, 165000);
  assert.equal(added[0].priceCents, 175000);
  assert.throws(() => updatePurchase(changed, 'missing', {}), /não encontrada/);
  assert.throws(() => updatePurchase(changed, base.id, { id: 'other' }), /id não pode/);
  assert.deepEqual(removePurchase(changed, base.id), []);
  assert.throws(() => removePurchase(changed, 'other'), /não encontrada/);
});

test('calculates day-boundary expiration in UTC', () => {
  const purchased = item({ purchaseDate: '2026-10-01', warrantyDays: 37 });
  const result = getWarranty(purchased, TODAY);
  assert.equal(result.expiresAt, '2026-11-07');
  assert.equal(result.remainingDays, 0);
  assert.equal(result.status, 'expiring');
  assert.equal(getWarranty(purchased, new Date('2026-11-08T00:00:00Z')).status, 'expired');
  assert.throws(() => getWarranty(purchased, new Date(NaN)), /inválida/);
});

test('filters by status and search, with deterministic expiry ordering', () => {
  const entries = [
    item({ id: 'future', product: 'Monitor', purchaseDate: '2026-11-01', warrantyDays: 100 }),
    item({ id: 'old', product: 'Notebook', purchaseDate: '2026-01-01', warrantyDays: 10 }),
    item({ id: 'soon', product: 'Smartphone', purchaseDate: '2026-11-01', warrantyDays: 12 }),
  ];
  assert.deepEqual(listWarranties(entries, { today: TODAY }).map(x => x.id), ['old', 'soon', 'future']);
  assert.deepEqual(listWarranties(entries, { today: TODAY, status: 'expired' }).map(x => x.id), ['old']);
  assert.deepEqual(listWarranties(entries, { today: TODAY, status: 'expiring' }).map(x => x.id), ['soon']);
  assert.deepEqual(listWarranties(entries, { today: TODAY, status: 'valid' }).map(x => x.id), ['future']);
  assert.deepEqual(listWarranties(entries, { today: TODAY, query: 'NOTE' }).map(x => x.id), ['old']);
  assert.deepEqual(listWarranties(entries, { today: TODAY, status: 'expiring', withinDays: 2 }), []);
  assert.throws(() => listWarranties(entries, { status: 'unknown' }), RangeError);
  assert.throws(() => listWarranties(entries, { withinDays: -1 }), RangeError);
});

test('summarizes purchases, invested value and upcoming warranties', () => {
  const entries = [
    item({ id: 'first', purchaseDate: '2026-11-01', warrantyDays: 10 }),
    item({ id: 'second', purchaseDate: '2026-01-01', warrantyDays: 30, priceCents: 125000 }),
    item({ id: 'third', purchaseDate: '2026-11-02', warrantyDays: 180, priceCents: 80000 }),
  ];
  const s = summarizeWarranties(entries, TODAY);
  assert.deepEqual(
    [s.total, s.active, s.expiring, s.expired, s.totalPriceCents],
    [3, 2, 1, 1, 380000],
  );
  assert.equal(s.nextExpiration, '2026-11-11');
  assert.deepEqual(summarizeWarranties([], TODAY), {
    total: 0, active: 0, expiring: 0, expired: 0,
    totalPriceCents: 0, nextExpiration: null,
  });
});
