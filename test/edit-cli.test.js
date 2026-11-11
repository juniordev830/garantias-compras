import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const executable = join(root, 'src', 'cli.js');

function cli(filename, ...args) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd: root,
    env: { ...process.env, GX_WARRANTY_CATALOG: filename },
    encoding: 'utf8',
    timeout: 10_000,
  });
}

test('edit atualiza campos suportados e o CSV reflete o catálogo', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gx-warranty-edit-'));
  const filename = join(directory, 'catalog.json');
  try {
    const created = cli(filename, 'add', 'monitor-1', 'Monitor', 'Loja A',
      '2026-10-01', '365', '199900', 'Comprovante privado');
    assert.equal(created.status, 0, created.stderr);

    for (const [field, value] of [
      ['product', 'Monitor 27 polegadas'],
      ['seller', 'Loja B'],
      ['purchaseDate', '2026-10-02'],
      ['warrantyDays', '180'],
      ['priceCents', '150000'],
      ['receiptNote', 'Nota guardada localmente'],
    ]) {
      const result = cli(filename, 'edit', 'monitor-1', field, value);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Compra atualizada/);
    }

    const catalog = JSON.parse(readFileSync(filename, 'utf8'));
    assert.equal(catalog.schemaVersion, 1);
    assert.deepEqual(catalog.purchases, [{
      id: 'monitor-1',
      product: 'Monitor 27 polegadas',
      seller: 'Loja B',
      purchaseDate: '2026-10-02',
      warrantyDays: 180,
      priceCents: 150000,
      receiptNote: 'Nota guardada localmente',
    }]);

    const exported = cli(filename, 'export-csv');
    assert.equal(exported.status, 0, exported.stderr);
    assert.match(exported.stdout, /Monitor 27 polegadas/);
    assert.match(exported.stdout, /150000/);
    assert.doesNotMatch(exported.stdout, /Nota guardada localmente/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('edit inválido preserva exatamente os dados persistidos', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gx-warranty-edit-'));
  const filename = join(directory, 'catalog.json');
  try {
    assert.equal(cli(filename, 'add', 'bike-1', 'Bicicleta', 'Loja X',
      '2026-11-01', '90', '110000').status, 0);
    const before = readFileSync(filename, 'utf8');
    const invalid = [
      ['edit', 'bike-1', 'id', 'novo-id'],
      ['edit', 'bike-1', 'product', '   '],
      ['edit', 'bike-1', 'purchaseDate', '2026-02-30'],
      ['edit', 'bike-1', 'warrantyDays', '-1'],
      ['edit', 'bike-1', 'warrantyDays', '3651'],
      ['edit', 'bike-1', 'priceCents', '1.25'],
      ['edit', 'bike-1', 'priceCents', '999999999999999999'],
      ['edit', 'nao-existe', 'seller', 'Loja'],
      ['edit', 'bike-1', 'seller'],
      ['edit', 'bike-1', 'seller', 'Loja', 'extra'],
    ];
    for (const args of invalid) {
      const result = cli(filename, ...args);
      assert.notEqual(result.status, 0, args.join(' '));
      assert.equal(readFileSync(filename, 'utf8'), before, args.join(' '));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
