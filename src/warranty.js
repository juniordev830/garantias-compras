const DAY_MS = 86_400_000;

function utcCalendarDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Warranty periods are calendar days in UTC, not elapsed 24-hour blocks from now. */
export function daysUntilWarrantyExpires(purchaseDate, warrantyDays, today = new Date()) {
  const purchased = new Date(purchaseDate);
  if (Number.isNaN(purchased.getTime()) || !Number.isInteger(warrantyDays) ||
      warrantyDays < 0 || warrantyDays > 3650 ||
      !(today instanceof Date) || Number.isNaN(today.getTime())) {
    throw new RangeError('data ou prazo de garantia inválido');
  }
  const expiresAt = new Date(purchased.getTime() + warrantyDays * DAY_MS);
  if (Number.isNaN(expiresAt.getTime())) {
    throw new RangeError('data de expiração inválida');
  }
  const remainingDays = (utcCalendarDay(expiresAt) - utcCalendarDay(today)) / DAY_MS;
  return { expiresAt, remainingDays, expired: remainingDays < 0 };
}

/**
 * Read-only, ordered view of warranties expiring in the next N UTC calendar days.
 * Validates all purchases before applying the filter; never mutates caller objects.
 */
export function upcomingWarrantyExpirations(purchases, today = new Date(), withinDays = 30) {
  if (!Array.isArray(purchases) || purchases.length > 10_000 ||
      !Number.isInteger(withinDays) || withinDays < 0 || withinDays > 3650) {
    throw new RangeError('lista ou janela de consulta inválida');
  }
  const knownIds = new Set();
  const entries = purchases.map((purchase) => {
    if (!purchase || typeof purchase !== 'object' || Array.isArray(purchase) ||
        typeof purchase.id !== 'string' || !purchase.id.trim() ||
        purchase.id.length > 120 || knownIds.has(purchase.id)) {
      throw new RangeError('compra inválida ou ID duplicado');
    }
    knownIds.add(purchase.id);
    return {
      id: purchase.id,
      ...daysUntilWarrantyExpires(purchase.purchaseDate, purchase.warrantyDays, today),
    };
  });
  return entries.filter((item) => item.remainingDays >= 0 && item.remainingDays <= withinDays)
    .sort((a, b) => a.remainingDays - b.remainingDays || a.id.localeCompare(b.id, 'pt-BR'));
}
