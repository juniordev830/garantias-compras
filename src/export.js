import { listWarranties } from './catalog.js';

// CSV para consulta local. Nunca exportar arquivos reais para um repositório público.
const COLUMNS = [
  'id', 'produto', 'vendedor', 'data_compra', 'garantia_dias',
  'valor_centavos', 'vencimento', 'dias_restantes', 'status',
];

function csvField(value) {
  if (typeof value === 'number') return String(value);
  // Desarma fórmulas em Excel/LibreOffice sem alterar o catálogo original.
  const safe = String(value).replace(/[\r\n\t]/g, ' ');
  const escaped = /^\s*[=+\-@]/u.test(safe) ? "'" + safe : safe;
  return '"' + escaped.replace(/"/g, '""') + '"';
}

/**
 * Exporta dados reais do catálogo como CSV com BOM UTF-8 e linhas CRLF.
 * Usa o mesmo filtro e ordenação de listWarranties; não grava arquivos.
 */
export function exportWarrantiesCsv(entries, options = {}) {
  const items = listWarranties(entries, options);
  const rows = [
    COLUMNS,
    ...items.map((entry) => [
      entry.id, entry.product, entry.seller, entry.purchaseDate,
      entry.warrantyDays, entry.priceCents, entry.expiresAt,
      entry.remainingDays, entry.status,
    ]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}
