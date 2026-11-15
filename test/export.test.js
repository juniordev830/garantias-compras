import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportWarrantiesCsv } from '../src/export.js';

const TODAY = new Date('2026-11-10T12:00:00Z');
const example = {
  id: 'exemplo-1',
  product: '=1+1',
  seller: 'Loja "Exemplo", Centro',
  purchaseDate: '2026-11-01',
  warrantyDays: 10,
  priceCents: 4990,
  receiptNote: 'Anotação que não deve ir para o CSV',
};

test('CSV mantém colunas, números e ordem com proteção contra fórmulas', () => {
  const csv = exportWarrantiesCsv([example], { today: TODAY });
  assert.ok(csv.startsWith('\uFEFF"id","produto","vendedor"'));
  assert.ok(csv.endsWith('\r\n'));
  assert.equal(csv.split('\r\n').length, 3);
  assert.match(csv, /"'=1\+1"/);
  assert.match(csv, /"Loja ""Exemplo"", Centro"/);
  assert.match(csv, /,10,4990,"2026-11-11",1,"expiring"/);
  assert.doesNotMatch(csv, /Anotação/);
  assert.equal(exportWarrantiesCsv([example], { today: TODAY }), csv);
  assert.equal(example.product, '=1+1');
});

test('CSV respeita filtros e não inventa itens quando catálogo é vazio', () => {
  const old = { ...example, id: 'antigo', product: 'Mouse', purchaseDate: '2026-01-01', warrantyDays: 30 };
  const filtered = exportWarrantiesCsv([example, old], { today: TODAY, status: 'expired' });
  assert.match(filtered, /"antigo","Mouse"/);
  assert.doesNotMatch(filtered, /"exemplo-1"/);
  assert.equal(exportWarrantiesCsv([], { today: TODAY }).split('\r\n').length, 2);
  assert.throws(() => exportWarrantiesCsv([example], { status: 'inexistente' }), RangeError);
});

test('comando export-csv usa saída padrão sem alterar arquivo local', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gx-warranty-csv-'));
  const file = join(dir, 'catalog.json');
  const cli = join(process.cwd(), 'src', 'cli.js');
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, GX_WARRANTY_CATALOG: file },
    timeout: 10_000,
  });
  try {
    const added = run('add', 'mouse-1', 'Mouse', 'Loja', '2026-11-01', '30', '12990');
    assert.equal(added.status, 0, added.stderr);
    const before = readFileSync(file, 'utf8');
    const exportResult = run('export-csv');
    assert.equal(exportResult.status, 0, exportResult.stderr);
    assert.match(exportResult.stdout, /"mouse-1","Mouse","Loja"/);
    assert.ok(exportResult.stdout.startsWith('\uFEFF'));
    assert.equal(readFileSync(file, 'utf8'), before);
    const invalid = run('export-csv', 'arquivo-indevido.csv');
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /uso: export-csv/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
