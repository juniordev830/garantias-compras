import { daysUntilWarrantyExpires } from './warranty.js';

const MAX_ITEMS = 5000;
const MAX_PRICE_CENTS = 1_000_000_000_00;
const DAY_MS = 86_400_000;

export function parseCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError('data deve estar no formato AAAA-MM-DD');
  }
  const date = new Date(value + 'T00:00:00.000Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError('data de calendário inexistente');
  }
  return date;
}

export function validatePurchase(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('compra deve ser um objeto');
  }

  const id = String(input.id ?? '').trim();
  const product = String(input.product ?? '').trim();
  const seller = String(input.seller ?? '').trim();
  const purchaseDate = input.purchaseDate;
  const warrantyDays = input.warrantyDays;
  const priceCents = input.priceCents;
  const receiptNote = String(input.receiptNote ?? '').trim();

  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(id)) {
    throw new RangeError('id deve conter 1 a 50 caracteres alfanuméricos, _ ou -');
  }
  if (!product || product.length > 120) {
    throw new RangeError('produto deve conter 1 a 120 caracteres');
  }
  if (!seller || seller.length > 120) {
    throw new RangeError('vendedor deve conter 1 a 120 caracteres');
  }
  parseCalendarDate(purchaseDate);
  if (!Number.isInteger(warrantyDays) || warrantyDays < 0 || warrantyDays > 3650) {
    throw new RangeError('garantia deve ter de 0 a 3650 dias');
  }
  if (!Number.isSafeInteger(priceCents) || priceCents < 0 || priceCents > MAX_PRICE_CENTS) {
    throw new RangeError('preço deve ser em centavos, sem valores negativos');
  }
  if (receiptNote.length > 250 || /[\u0000-\u001F]/.test(receiptNote)) {
    throw new RangeError('nota de comprovante inválida');
  }
  return Object.freeze({
    id, product, seller, purchaseDate, warrantyDays, priceCents, receiptNote,
  });
}

export function validateCatalog(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_ITEMS) {
    throw new RangeError('catálogo deve ser uma lista com até 5000 itens');
  }
  const seen = new Set();
  return entries.map((entry) => {
    const item = validatePurchase(entry);
    if (seen.has(item.id)) throw new RangeError('id de compra duplicado: ' + item.id);
    seen.add(item.id);
    return item;
  });
}

export function addPurchase(entries, input) {
  const catalog = validateCatalog(entries);
  if (catalog.length >= MAX_ITEMS) throw new RangeError('limite de compras atingido');
  const item = validatePurchase(input);
  if (catalog.some((entry) => entry.id === item.id)) {
    throw new RangeError('compra já cadastrada: ' + item.id);
  }
  return [...catalog, item];
}

export function updatePurchase(entries, id, changes) {
  const catalog = validateCatalog(entries);
  const index = catalog.findIndex((item) => item.id === id);
  if (index < 0) throw new RangeError('compra não encontrada: ' + id);
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('alterações devem ser um objeto');
  }
  if ('id' in changes && changes.id !== id) {
    throw new RangeError('id não pode ser modificado');
  }
  const item = validatePurchase({ ...catalog[index], ...changes });
  return catalog.map((entry, position) => position === index ? item : entry);
}

export function removePurchase(entries, id) {
  const catalog = validateCatalog(entries);
  if (!catalog.some((entry) => entry.id === id)) {
    throw new RangeError('compra não encontrada: ' + id);
  }
  return catalog.filter((entry) => entry.id !== id);
}

export function getWarranty(item, today = new Date()) {
  const validated = validatePurchase(item);
  if (!(today instanceof Date) || !Number.isFinite(today.getTime())) {
    throw new RangeError('data de referência inválida');
  }
  // Normalize dates to UTC calendar days to avoid timezone/DST surprises.
  const currentDay = Date.UTC(
    today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(),
  );
  const purchaseTime = parseCalendarDate(validated.purchaseDate).getTime();
  const expiresTime = purchaseTime + validated.warrantyDays * DAY_MS;
  const remainingDays = Math.round((expiresTime - currentDay) / DAY_MS);
  const legacy = daysUntilWarrantyExpires(
    new Date(purchaseTime), validated.warrantyDays, new Date(currentDay),
  );
  return {
    ...validated,
    expiresAt: legacy.expiresAt.toISOString().slice(0, 10),
    remainingDays,
    status: remainingDays < 0 ? 'expired' : remainingDays <= 30 ? 'expiring' : 'valid',
  };
}

export function listWarranties(entries, options = {}) {
  const { today = new Date(), status = 'all', query = '', withinDays = 30 } = options;
  if (!['all', 'expired', 'expiring', 'valid'].includes(status)) {
    throw new RangeError('filtro de status inválido');
  }
  if (typeof query !== 'string' || query.length > 120) {
    throw new RangeError('consulta de busca inválida');
  }
  if (!Number.isInteger(withinDays) || withinDays < 0 || withinDays > 3650) {
    throw new RangeError('janela de vencimento inválida');
  }
  const search = query.toLocaleLowerCase('pt-BR').trim();
  return validateCatalog(entries)
    .map((item) => {
      const result = getWarranty(item, today);
      return {
        ...result,
        status: result.remainingDays < 0
          ? 'expired'
          : result.remainingDays <= withinDays ? 'expiring' : 'valid',
      };
    })
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => !search || [item.product, item.seller, item.id]
      .some((field) => field.toLocaleLowerCase('pt-BR').includes(search)))
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.id.localeCompare(b.id));
}

export function summarizeWarranties(entries, today = new Date()) {
  const items = listWarranties(entries, { today });
  const count = (status) => items.filter((item) => item.status === status).length;
  return {
    total: items.length,
    active: items.length - count('expired'),
    expiring: count('expiring'),
    expired: count('expired'),
    totalPriceCents: items.reduce((sum, item) => sum + item.priceCents, 0),
    nextExpiration: items.find((item) => item.remainingDays >= 0)?.expiresAt ?? null,
  };
}
