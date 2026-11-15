import { readFile, writeFile, rename, mkdir, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { validateCatalog } from './catalog.js';

const MAX_JSON_BYTES = 1_000_000;
const SCHEMA_VERSION = 1;

export function defaultCatalogPath() {
  return process.env.GX_WARRANTY_CATALOG ||
    join(homedir(), '.gx-garantias', 'compras.json');
}

export async function loadCatalog(filename = defaultCatalogPath()) {
  let size;
  try {
    size = (await stat(filename)).size;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (size > MAX_JSON_BYTES) throw new RangeError('arquivo do catálogo muito grande');
  const raw = await readFile(filename, 'utf8');
  let document;
  try {
    document = JSON.parse(raw);
  } catch {
    throw new SyntaxError('catálogo não contém JSON válido');
  }
  if (!document || document.schemaVersion !== SCHEMA_VERSION || !Array.isArray(document.purchases)) {
    throw new RangeError('versão ou estrutura do catálogo inválida');
  }
  return validateCatalog(document.purchases);
}

export async function saveCatalog(entries, filename = defaultCatalogPath()) {
  const purchases = validateCatalog(entries);
  const data = JSON.stringify({ schemaVersion: SCHEMA_VERSION, purchases }, null, 2) + '\n';
  if (Buffer.byteLength(data) > MAX_JSON_BYTES) {
    throw new RangeError('catálogo ultrapassa limite de 1 MB');
  }
  await mkdir(dirname(filename), { recursive: true, mode: 0o700 });
  const temp = join(dirname(filename), '.warranty-' + randomUUID() + '.tmp');
  try {
    await writeFile(temp, data, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temp, filename);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw error;
  }
  return purchases.length;
}
