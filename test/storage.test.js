import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { loadCatalog, saveCatalog } from '../src/storage.js';

const example = {
  id: 'monitor-1', product: 'Monitor', seller: 'Loja A',
  purchaseDate: '2026-11-01', warrantyDays: 365,
  priceCents: 129900, receiptNote: '',
};

async function withTempFile(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'gx-warranty-test-'));
  try {
    await fn(join(dir, 'private', 'catalog.json'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('new catalog loads as empty list', async () => {
  await withTempFile(async (file) => {
    assert.deepEqual(await loadCatalog(file), []);
  });
});

test('writes and reloads a versioned catalog', async () => {
  await withTempFile(async (file) => {
    assert.equal(await saveCatalog([example], file), 1);
    const data = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(data.schemaVersion, 1);
    assert.equal(data.purchases[0].id, example.id);
    assert.deepEqual((await loadCatalog(file)).map(item => item.id), [example.id]);
    await saveCatalog([], file);
    assert.deepEqual(await loadCatalog(file), []);
  });
});

test('does not overwrite valid data when proposed entries are invalid', async () => {
  await withTempFile(async (file) => {
    await saveCatalog([example], file);
    const before = await readFile(file, 'utf8');
    await assert.rejects(saveCatalog([{ ...example, priceCents: -3 }], file), RangeError);
    assert.equal(await readFile(file, 'utf8'), before);
  });
});

test('rejects malformed or unsupported JSON', async () => {
  await withTempFile(async (file) => {
    await saveCatalog([], file);
    await writeFile(file, '{invalid json}', 'utf8');
    await assert.rejects(loadCatalog(file), SyntaxError);
    await writeFile(file, '{"schemaVersion":2,"purchases":[]}', 'utf8');
    await assert.rejects(loadCatalog(file), RangeError);
    await writeFile(file, '{"schemaVersion":1,"purchases":"bad"}', 'utf8');
    await assert.rejects(loadCatalog(file), RangeError);
  });
});
