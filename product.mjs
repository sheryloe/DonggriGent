import os from 'node:os';
import path from 'node:path';

export const PRODUCT_NAME = 'KGentool';
export const LEGACY_PRODUCT_NAME = 'Agentify Desktop';
export const PRODUCT_SERVER_NAME = 'kgentool-desktop';
export const LEGACY_SERVER_NAME = 'agentify-desktop';
export const PRODUCT_STATE_ENV = 'KGENTOOL_STATE_DIR';
export const LEGACY_STATE_ENV = 'AGENTIFY_DESKTOP_STATE_DIR';
export const PRODUCT_TOKEN_ENV = 'KGENTOOL_TOKEN';
export const LEGACY_TOKEN_ENV = 'AGENTIFY_DESKTOP_TOKEN';
export const PRODUCT_SHOW_TABS_ENV = 'KGENTOOL_SHOW_TABS';
export const LEGACY_SHOW_TABS_ENV = 'AGENTIFY_DESKTOP_SHOW_TABS';
export const PRODUCT_BROWSER_BACKEND_ENV = 'KGENTOOL_BROWSER_BACKEND';
export const PRODUCT_CHROME_BIN_ENV = 'KGENTOOL_CHROME_BIN';
export const PRODUCT_CHROME_DEBUG_PORT_ENV = 'KGENTOOL_CHROME_DEBUG_PORT';
export const PRODUCT_CHROME_PROFILE_MODE_ENV = 'KGENTOOL_CHROME_PROFILE_MODE';
export const PRODUCT_CHROME_PROFILE_NAME_ENV = 'KGENTOOL_CHROME_PROFILE_NAME';
export const LEGACY_BROWSER_BACKEND_ENV = 'AGENTIFY_DESKTOP_BROWSER_BACKEND';
export const LEGACY_CHROME_BIN_ENV = 'AGENTIFY_DESKTOP_CHROME_BIN';
export const LEGACY_CHROME_DEBUG_PORT_ENV = 'AGENTIFY_DESKTOP_CHROME_DEBUG_PORT';
export const LEGACY_CHROME_PROFILE_MODE_ENV = 'AGENTIFY_DESKTOP_CHROME_PROFILE_MODE';
export const LEGACY_CHROME_PROFILE_NAME_ENV = 'AGENTIFY_DESKTOP_CHROME_PROFILE_NAME';
export const PRODUCT_MAX_TABS_ENV = 'KGENTOOL_MAX_TABS';
export const LEGACY_MAX_TABS_ENV = 'AGENTIFY_DESKTOP_MAX_TABS';
export const PRODUCT_ELECTRON_BIN_ENV = 'KGENTOOL_ELECTRON_BIN';
export const LEGACY_ELECTRON_BIN_ENV = 'AGENTIFY_DESKTOP_ELECTRON_BIN';

export function productStateDir() {
  return path.join(os.homedir(), '.kgentool');
}

export function legacyStateDir() {
  return path.join(os.homedir(), '.agentify-desktop');
}

export function envFirst(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

