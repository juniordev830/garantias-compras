import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cliPath = join(root, 'src', 'cli.js');

function runCli(file, args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: root,
    env: { ...process.env, GX_WARRANTY_CATALOG: file },
    encoding: 'utf8',
    timeout: 10_000,
  });
}

test('CLI supports help, adding, listing, summary and deleting', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gx-warranty-cli-'));
  const file = join(folder, 'storage.json');
  try {
    assert.equal(runCli(file, ['help']).status, 0);
    const add = runCli(file, [
      'add', 'item-1', 'Teclado', 'Loja A',
      '2026-11-02', '180', '15990', 'Recibo guardado',
    ]);
    assert.equal(add.status, 0, add.stderr);
    assert.match(add.stdout, /Compra cadastrada/);
    const list = runCli(file, ['list']);
    assert.equal(list.status, 0);
    assert.match(list.stdout, /Teclado/);
    const summary = runCli(file, ['summary']);
    assert.equal(summary.status, 0);
    assert.match(summary.stdout, /Investimento: R\$ 159\.90/);
    const duplicate = runCli(file, [
      'add', 'item-1', 'Teclado', 'Loja A', '2026-11-02', '180', '15990',
    ]);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /cadastrada/);
    const removed = runCli(file, ['remove', 'item-1']);
    assert.equal(removed.status, 0);
    assert.match(runCli(file, ['list']).stdout, /Nenhuma compra/);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('CLI rejects invalid arguments without writing a catalog', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gx-warranty-cli-'));
  const file = join(folder, 'storage.json');
  try {
    const invalid = runCli(file, [
      'add', 'id', 'Produto', 'Loja', '2026-02-30', '40', '10000',
    ]);
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /data de calendário/);
    assert.notEqual(runCli(file, ['expiring', 'not-a-number']).status, 0);
    assert.notEqual(runCli(file, ['not-a-command']).status, 0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
