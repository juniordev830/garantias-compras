#!/usr/bin/env node
import { addPurchase, listWarranties, removePurchase, summarizeWarranties } from './catalog.js';
import { loadCatalog, saveCatalog } from './storage.js';
import { exportWarrantiesCsv } from './export.js';

const HELP = [
  'Garantias e Compras — uso:',
  '  node src/cli.js add ID PRODUTO VENDEDOR AAAA-MM-DD DIAS PRECO-CENTAVOS [NOTA]',
  '  node src/cli.js list [all|valid|expiring|expired] [BUSCA]',
  '  node src/cli.js expiring [DIAS]',
  '  node src/cli.js summary',
  '  node src/cli.js export-csv  # CSV no terminal; redirecione para arquivo local',
  '  node src/cli.js remove ID',
  '',
  'Os dados são locais. Não cole dados reais ou pessoais em repositórios.',
].join('\n');

function parseInteger(value, label) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new RangeError(label + ' deve ser inteiro não negativo');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new RangeError(label + ' fora do limite');
  return parsed;
}

function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

function display(items) {
  if (!items.length) {
    console.log('Nenhuma compra encontrada.');
    return;
  }
  for (const entry of items) {
    console.log(
      [entry.id, entry.product, entry.seller,
        'vencimento=' + entry.expiresAt,
        'dias=' + entry.remainingDays,
        'status=' + entry.status,
        'R$=' + formatMoney(entry.priceCents)].join(' | '),
    );
  }
}

export async function run(args) {
  const [command, ...rest] = args;
  if (!command || command === 'help' || command === '--help') {
    console.log(HELP);
    return;
  }

  const catalog = await loadCatalog();
  switch (command) {
    case 'add': {
      if (rest.length < 6 || rest.length > 7) throw new RangeError('uso: add ' + HELP.split('\n')[1]);
      const [id, product, seller, purchaseDate, days, priceCents, receiptNote = ''] = rest;
      const next = addPurchase(catalog, {
        id, product, seller, purchaseDate, receiptNote,
        warrantyDays: parseInteger(days, 'dias'),
        priceCents: parseInteger(priceCents, 'preço'),
      });
      await saveCatalog(next);
      console.log('Compra cadastrada: ' + id);
      return;
    }
    case 'remove': {
      if (rest.length !== 1) throw new RangeError('uso: remove ID');
      await saveCatalog(removePurchase(catalog, rest[0]));
      console.log('Compra removida: ' + rest[0]);
      return;
    }
    case 'list': {
      if (rest.length > 2) throw new RangeError('uso: list [status] [busca]');
      display(listWarranties(catalog, {
        status: rest[0] || 'all',
        query: rest[1] || '',
      }));
      return;
    }
    case 'expiring': {
      if (rest.length > 1) throw new RangeError('uso: expiring [dias]');
      display(listWarranties(catalog, {
        status: 'expiring',
        withinDays: rest[0] ? parseInteger(rest[0], 'dias') : 30,
      }));
      return;
    }
    case 'export-csv': {
      if (rest.length) throw new RangeError('uso: export-csv');
      process.stdout.write(exportWarrantiesCsv(catalog));
      return;
    }
    case 'summary': {
      if (rest.length) throw new RangeError('uso: summary');
      const summary = summarizeWarranties(catalog);
      console.log('Compras: ' + summary.total);
      console.log('Ativas: ' + summary.active);
      console.log('Vencendo: ' + summary.expiring);
      console.log('Vencidas: ' + summary.expired);
      console.log('Investimento: R$ ' + formatMoney(summary.totalPriceCents));
      console.log('Próximo vencimento: ' + (summary.nextExpiration || 'nenhum'));
      return;
    }
    default:
      throw new RangeError('comando inválido. Consulte help.');
  }
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  run(process.argv.slice(2)).catch((error) => {
    console.error('Erro: ' + error.message);
    process.exitCode = 1;
  });
}
