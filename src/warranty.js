export function daysUntilWarrantyExpires(purchaseDate, warrantyDays, today = new Date()) {
  const purchased = new Date(purchaseDate);
  if (Number.isNaN(purchased.getTime()) || !Number.isInteger(warrantyDays) || warrantyDays < 0 || warrantyDays > 3650) {
    throw new RangeError('data ou prazo de garantia inválido');
  }
  const expiresAt = new Date(purchased.getTime() + warrantyDays * 86400000);
  const remaining = Math.ceil((expiresAt.getTime() - today.getTime()) / 86400000);
  return { expiresAt, remainingDays: remaining, expired: remaining < 0 };
}
