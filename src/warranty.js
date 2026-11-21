export function daysUntilWarrantyExpires(purchaseDate, warrantyDays, today = new Date()) {
  const purchased = new Date(purchaseDate);
  if (!Number.isFinite(purchased.getTime()) || !Number.isInteger(warrantyDays) ||
      warrantyDays < 0 || warrantyDays > 3650) {
    throw new RangeError('data ou prazo de garantia inválido');
  }
  if (!(today instanceof Date) || !Number.isFinite(today.getTime())) {
    throw new RangeError('data atual inválida');
  }
  const expiresAt = new Date(purchased.getTime() + warrantyDays * 86400000);
  if (!Number.isFinite(expiresAt.getTime())) {
    throw new RangeError('data de expiração fora dos limites');
  }
  const remaining = Math.ceil((expiresAt.getTime() - today.getTime()) / 86400000);
  return { expiresAt, remainingDays: remaining, expired: remaining < 0 };
}
