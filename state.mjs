import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import os from 'node:os';
import {
  PRODUCT_STATE_ENV,
  LEGACY_STATE_ENV,
  PRODUCT_TOKEN_ENV,
  LEGACY_TOKEN_ENV,
  productStateDir,
  legacyStateDir
} from './product.mjs';

const TOKEN_ENVELOPE_PREFIX = 'enc-token:v1:';

async function atomicWriteFile(filePath, data, { mode } = {}) {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.${crypto.randomBytes(8).toString('hex')}.tmp`);
  await fs.writeFile(tmp, data, mode ? { encoding: 'utf8', mode } : { encoding: 'utf8' });
  await fs.rename(tmp, filePath);
}

export function defaultStateDir() {
  return process.env[PRODUCT_STATE_ENV] || process.env[LEGACY_STATE_ENV] || productStateDir();
}

export function tokenPath(stateDir = defaultStateDir()) {
  return path.join(stateDir, 'token.txt');
}

export function statePath(stateDir = defaultStateDir()) {
  return path.join(stateDir, 'state.json');
}

export function settingsPath(stateDir = defaultStateDir()) {
  return path.join(stateDir, 'settings.json');
}

export function defaultSettings() {
  return {
    browserBackend: 'electron',
    chromeDebugPort: 9222,
    chromeExecutablePath: null,
    chromeProfileMode: 'isolated',
    chromeProfileName: 'Default',

    // Governor defaults (intentionally conservative).
    maxInflightQueries: 2,
    maxQueriesPerMinute: 12,
    minTabGapMs: 1200,
    minGlobalGapMs: 200,

    // UX defaults.
    showTabsByDefault: false,
    allowAuthPopups: true,

    // Acknowledgment for changing settings (UX only; not required for operation).
    acknowledgedAt: null
  };
}

export function normalizeSettings(input) {
  const d = defaultSettings();
  const s = input && typeof input === 'object' ? input : {};

  const clampInt = (v, { min, max, fallback }) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    return Math.max(min, Math.min(max, i));
  };

  const clampMs = (v, { min, max, fallback }) => clampInt(v, { min, max, fallback });

  const out = {
    browserBackend: ['electron', 'chrome-cdp'].includes(String(s.browserBackend || '').trim().toLowerCase())
      ? String(s.browserBackend || '').trim().toLowerCase()
      : d.browserBackend,
    chromeDebugPort: clampInt(s.chromeDebugPort, { min: 1024, max: 65535, fallback: d.chromeDebugPort }),
    chromeExecutablePath:
      typeof s.chromeExecutablePath === 'string' && s.chromeExecutablePath.trim() ? s.chromeExecutablePath.trim() : null,
    chromeProfileMode: ['isolated', 'existing'].includes(String(s.chromeProfileMode || '').trim().toLowerCase())
      ? String(s.chromeProfileMode || '').trim().toLowerCase()
      : d.chromeProfileMode,
    chromeProfileName:
      typeof s.chromeProfileName === 'string' && s.chromeProfileName.trim() ? s.chromeProfileName.trim() : d.chromeProfileName,
    maxInflightQueries: clampInt(s.maxInflightQueries, { min: 1, max: 12, fallback: d.maxInflightQueries }),
    maxQueriesPerMinute: clampInt(s.maxQueriesPerMinute, { min: 1, max: 600, fallback: d.maxQueriesPerMinute }),
    minTabGapMs: clampMs(s.minTabGapMs, { min: 0, max: 60_000, fallback: d.minTabGapMs }),
    minGlobalGapMs: clampMs(s.minGlobalGapMs, { min: 0, max: 10_000, fallback: d.minGlobalGapMs }),
    showTabsByDefault: !!s.showTabsByDefault,
    allowAuthPopups: typeof s.allowAuthPopups === 'boolean' ? s.allowAuthPopups : d.allowAuthPopups,
    acknowledgedAt: typeof s.acknowledgedAt === 'string' && s.acknowledgedAt.trim() ? s.acknowledgedAt.trim() : null
  };
  return out;
}

export async function ensureStateDir(stateDir = defaultStateDir()) {
  await migrateLegacyStateDir(stateDir);
  await fs.mkdir(stateDir, { recursive: true });
}

export async function readToken(stateDir = defaultStateDir()) {
  const tokenFromEnv = (process.env[PRODUCT_TOKEN_ENV] || process.env[LEGACY_TOKEN_ENV] || '').trim();
  if (tokenFromEnv) return tokenFromEnv;
  try {
    const raw = (await fs.readFile(tokenPath(stateDir), 'utf8')).trim();
    if (!raw) return null;
    return decodeTokenEnvelope(raw, stateDir);
  } catch {
    return null;
  }
}

export async function writeToken(token, stateDir = defaultStateDir()) {
  await ensureStateDir(stateDir);
  const envelope = encodeTokenEnvelope(String(token || '').trim(), stateDir);
  await atomicWriteFile(tokenPath(stateDir), `${envelope}\n`, { mode: 0o600 });
}

export async function ensureToken(stateDir = defaultStateDir()) {
  const existing = await readToken(stateDir);
  if (existing) return existing;
  const token = crypto.randomBytes(24).toString('hex');
  await writeToken(token, stateDir);
  return token;
}

export async function readState(stateDir = defaultStateDir()) {
  try {
    return JSON.parse(await fs.readFile(statePath(stateDir), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeState(state, stateDir = defaultStateDir()) {
  await ensureStateDir(stateDir);
  await atomicWriteFile(statePath(stateDir), `${JSON.stringify(state, null, 2)}\n`);
}

export async function readSettings(stateDir = defaultStateDir()) {
  try {
    const raw = await fs.readFile(settingsPath(stateDir), 'utf8');
    return normalizeSettings(JSON.parse(raw || '{}'));
  } catch {
    return defaultSettings();
  }
}

export async function writeSettings(settings, stateDir = defaultStateDir()) {
  await ensureStateDir(stateDir);
  const normalized = normalizeSettings(settings);
  await atomicWriteFile(settingsPath(stateDir), `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 });
  return normalized;
}

async function copyIfMissing(sourcePath, targetPath) {
  try {
    await fs.stat(targetPath);
    return false;
  } catch {}
  try {
    const sourceStat = await fs.stat(sourcePath);
    if (sourceStat.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });
      for (const entry of entries) {
        const src = path.join(sourcePath, entry.name);
        const dst = path.join(targetPath, entry.name);
        if (entry.isDirectory()) await copyIfMissing(src, dst);
        else if (entry.isFile()) await fs.copyFile(src, dst);
      }
      return true;
    }
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
    return true;
  } catch {
    return false;
  }
}

async function migrateLegacyStateDir(stateDir) {
  const target = path.resolve(stateDir || defaultStateDir());
  const legacy = legacyStateDir();
  if (!target || target === legacy) return;
  const files = [
    ['token.txt', 'token.txt'],
    ['settings.json', 'settings.json'],
    ['bundles.json', 'bundles.json'],
    ['selectors.override.json', 'selectors.override.json'],
    [path.join('watch-folders', 'state.json'), path.join('watch-folders', 'state.json')]
  ];
  for (const [from, to] of files) {
    await copyIfMissing(path.join(legacy, from), path.join(target, to));
  }
}

function tokenSecretMaterial(stateDir) {
  const explicit = String(process.env.KGENTOOL_TOKEN_SECRET || '').trim();
  if (explicit) return explicit;
  const user = String(os.userInfo?.().username || 'unknown-user').trim() || 'unknown-user';
  const host = String(os.hostname?.() || 'unknown-host').trim() || 'unknown-host';
  return `${host}:${user}:${process.platform}:${process.arch}:${path.resolve(String(stateDir || ''))}`;
}

function encodeTokenEnvelope(token, stateDir) {
  const plain = String(token || '').trim();
  if (!plain) return plain;
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(tokenSecretMaterial(stateDir), salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = `${salt.toString('base64')}.${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  return `${TOKEN_ENVELOPE_PREFIX}${payload}`;
}

function decodeTokenEnvelope(raw, stateDir) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (!text.startsWith(TOKEN_ENVELOPE_PREFIX)) return text;

  const payload = text.slice(TOKEN_ENVELOPE_PREFIX.length);
  const [saltB64, ivB64, tagB64, cipherB64] = payload.split('.');
  if (!saltB64 || !ivB64 || !tagB64 || !cipherB64) return null;

  try {
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(cipherB64, 'base64');
    const key = crypto.scryptSync(tokenSecretMaterial(stateDir), salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8').trim();
    return plain || null;
  } catch {
    return null;
  }
}
