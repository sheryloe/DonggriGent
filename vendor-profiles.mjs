import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTomlFile } from './simple-toml.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(base, extra) {
  if (!isObject(base) || !isObject(extra)) return extra;
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isObject(value) && isObject(base[key])) out[key] = mergeDeep(base[key], value);
    else out[key] = value;
  }
  return out;
}

function normalizeString(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeProfile(profile, { base = {} } = {}) {
  const merged = mergeDeep(base, profile || {});
  const id = normalizeString(merged.id);
  if (!id || id === 'base') return null;
  const name = normalizeString(merged.name, id);
  const startUrl = normalizeString(merged.start_url || merged.url);
  const status = normalizeString(merged.status, 'supported');
  const selectors = isObject(merged.selectors) ? merged.selectors : {};
  const readyRules = isObject(merged.ready_rules) ? merged.ready_rules : {};
  const artifactRules = isObject(merged.artifact_rules) ? merged.artifact_rules : {};
  const popupRules = isObject(merged.popup_rules) ? merged.popup_rules : {};
  if (!startUrl) return null;
  return {
    id,
    name,
    url: startUrl,
    startUrl,
    status,
    selectors,
    readyRules,
    artifactRules,
    popupRules,
    labels: isObject(merged.labels) ? merged.labels : {}
  };
}

export function defaultVendorProfilesDir() {
  return path.join(__dirname, 'vendor-profiles');
}

export async function loadVendorProfiles({ stateDir, dir = defaultVendorProfilesDir() } = {}) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.toml')))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  let base = {};
  const profiles = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw =
      file.endsWith('.toml')
        ? await parseTomlFile(filePath)
        : JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (path.basename(file, path.extname(file)) === 'base') {
      base = isObject(raw) ? raw : {};
      continue;
    }
    const normalized = normalizeProfile(raw, { base });
    if (normalized) profiles.push(normalized);
  }

  // Backward-compatible single override file for prompt/send selectors.
  if (stateDir) {
    const overridePath = path.join(stateDir, 'selectors.override.json');
    try {
      const override = JSON.parse(await fs.readFile(overridePath, 'utf8'));
      if (isObject(override)) {
        for (const profile of profiles) {
          profile.selectors = mergeDeep(profile.selectors, override);
        }
      }
    } catch {}
  }
  return profiles;
}

export function listVendorsFromProfiles(profiles = []) {
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    url: profile.startUrl || profile.url,
    status: profile.status
  }));
}

export function profileByVendorId(profiles = [], vendorId) {
  const token = normalizeString(vendorId).toLowerCase();
  if (!token) return profiles.find((profile) => profile.id === 'chatgpt') || profiles[0] || null;
  return (
    profiles.find((profile) => String(profile.id || '').trim().toLowerCase() === token) ||
    profiles.find((profile) => String(profile.name || '').trim().toLowerCase() === token) ||
    profiles.find((profile) => profile.id === 'chatgpt') ||
    profiles[0] ||
    null
  );
}
