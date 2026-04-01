const SUPPORTED_VENDOR_IDS = ['chatgpt', 'perplexity', 'claude', 'aistudio', 'gemini', 'grok'];
const VENDOR_HOST_ALLOWLIST = [
  'chatgpt.com',
  '.chatgpt.com',
  'claude.ai',
  '.claude.ai',
  'gemini.google.com',
  '.gemini.google.com',
  'aistudio.google.com',
  '.aistudio.google.com',
  'perplexity.ai',
  '.perplexity.ai',
  'grok.com',
  '.grok.com'
];

const VENDOR_AUTH_HOST_ALLOWLIST = {
  chatgpt: [
    'chatgpt.com',
    '.chatgpt.com',
    'openai.com',
    '.openai.com',
    'accounts.google.com',
    'accounts.youtube.com',
    'myaccount.google.com',
    'ogs.google.com',
    '.google.com',
    '.googleusercontent.com',
    'login.live.com',
    '.live.com',
    '.microsoft.com',
    '.microsoftonline.com',
    'appleid.apple.com',
    '.apple.com'
  ],
  perplexity: [
    'perplexity.ai',
    '.perplexity.ai',
    'accounts.google.com',
    'accounts.youtube.com',
    'myaccount.google.com',
    'ogs.google.com',
    '.google.com',
    '.googleusercontent.com',
    'appleid.apple.com',
    '.apple.com'
  ],
  claude: [
    'claude.ai',
    '.claude.ai',
    'accounts.google.com',
    'accounts.youtube.com',
    'myaccount.google.com',
    'ogs.google.com',
    '.google.com',
    '.googleusercontent.com'
  ],
  aistudio: [
    'aistudio.google.com',
    '.aistudio.google.com',
    'accounts.google.com',
    'accounts.youtube.com',
    'myaccount.google.com',
    'ogs.google.com',
    '.google.com',
    '.googleusercontent.com'
  ],
  gemini: [
    'gemini.google.com',
    '.gemini.google.com',
    'accounts.google.com',
    'accounts.youtube.com',
    'myaccount.google.com',
    'ogs.google.com',
    '.google.com',
    '.googleusercontent.com'
  ],
  grok: [
    'grok.com',
    '.grok.com',
    'x.com',
    '.x.com',
    'twitter.com',
    '.twitter.com'
  ]
};

const AUTH_HINT_TOKENS = ['oauth', 'auth', 'signin', 'login', 'callback', 'consent'];
const AUTH_POPUP_DISPOSITIONS = new Set(['new-window', 'foreground-tab', 'background-tab']);

function normalizeHostname(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/\.+$/, '');
}

function hostMatchesPattern(hostname, pattern) {
  const h = normalizeHostname(hostname);
  const p = normalizeHostname(pattern);
  if (!h || !p) return false;
  if (p.startsWith('.')) return h === p.slice(1) || h.endsWith(p);
  return h === p;
}

export function isAllowedAuthPopupUrl(url, { vendorId = 'chatgpt' } = {}) {
  let u;
  try {
    u = new URL(String(url || ''));
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;

  const host = normalizeHostname(u.hostname);
  if (!host) return false;

  // Keep behavior conservative: only explicitly allow supported vendor auth flows.
  const vendor = String(vendorId || 'chatgpt').trim().toLowerCase();
  if (!SUPPORTED_VENDOR_IDS.includes(vendor)) return false;
  const hostAllowlist = Array.isArray(VENDOR_AUTH_HOST_ALLOWLIST[vendor]) ? VENDOR_AUTH_HOST_ALLOWLIST[vendor] : [];
  if (!hostAllowlist.length) return false;

  return hostAllowlist.some((pattern) => hostMatchesPattern(host, pattern));
}

function isAllowedBlankAuthPopup({
  url,
  vendorId = 'chatgpt',
  openerUrl = '',
  frameName = '',
  disposition = ''
} = {}) {
  const vendor = String(vendorId || 'chatgpt').trim().toLowerCase();
  if (!SUPPORTED_VENDOR_IDS.includes(vendor)) return false;

  const popupUrl = String(url || '').trim().toLowerCase();
  if (popupUrl !== 'about:blank') return false;

  const disp = String(disposition || '').trim().toLowerCase();
  const frame = String(frameName || '').trim().toLowerCase();
  const frameHasAuthHint = AUTH_HINT_TOKENS.some((token) => frame.includes(token));

  let openerPath = '';
  let openerHost = '';
  try {
    const opener = new URL(String(openerUrl || ''));
    openerHost = normalizeHostname(opener.hostname);
    openerPath = String(opener.pathname || '').toLowerCase();
  } catch {
    return false;
  }
  if (!openerHost) return false;

  const isVendorHost = VENDOR_HOST_ALLOWLIST.some((pattern) => hostMatchesPattern(openerHost, pattern));
  if (!isVendorHost) return false;

  const openerHasAuthHint = AUTH_HINT_TOKENS.some((token) => openerPath.includes(token));
  const hasKnownDisposition = AUTH_POPUP_DISPOSITIONS.has(disp);
  const looksLikeAuthPopup = frameHasAuthHint || openerHasAuthHint || hasKnownDisposition;
  return looksLikeAuthPopup;
}

export function shouldAllowPopup({
  url,
  vendorId = 'chatgpt',
  allowAuthPopups = true,
  openerUrl = '',
  frameName = '',
  disposition = ''
} = {}) {
  if (!allowAuthPopups) return false;
  if (isAllowedAuthPopupUrl(url, { vendorId })) return true;
  return isAllowedBlankAuthPopup({ url, vendorId, openerUrl, frameName, disposition });
}
