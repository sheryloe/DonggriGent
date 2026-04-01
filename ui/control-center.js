/* global window */

function el(id) {
  const n = document.getElementById(id);
  if (!n) throw new Error(`missing_element:${id}`);
  return n;
}

function fmtTime(ms) {
  try {
    const d = new Date(ms);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

function fmtDuration(ms) {
  const totalSec = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

function fmtSource(source) {
  const key = String(source || '').trim().toLowerCase();
  if (key === 'mcp') return 'MCP';
  if (key === 'ui') return '화면';
  return 'HTTP';
}

function fmtPhase(phase) {
  const key = String(phase || '').trim().toLowerCase();
  if (key === 'resolving_tab') return '탭 준비';
  if (key === 'preparing_context') return '컨텍스트 준비';
  if (key === 'waiting_for_ready') return '페이지 확인';
  if (key === 'uploading_files') return '파일 업로드';
  if (key === 'typing_prompt') return '프롬프트 입력';
  if (key === 'sending_prompt') return '전송 중';
  if (key === 'waiting_for_response') return '응답 대기';
  if (key === 'awaiting_user') return '사용자 확인 대기';
  return key ? key.replace(/_/g, ' ') : '작업 중';
}

function fmtOutcomeStatus(status) {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'success') return '마지막 성공';
  if (key === 'stopped') return '마지막 중지';
  if (key === 'blocked') return '마지막 차단';
  if (key === 'error') return '마지막 오류';
  return '마지막 실행';
}

function num(id, fallback) {
  const v = Number(el(id).value);
  return Number.isFinite(v) ? v : fallback;
}

function setNum(id, value) {
  el(id).value = String(Number(value));
}

function setChecked(id, value) {
  el(id).checked = !!value;
}

function setHidden(id, hidden) {
  el(id).classList.toggle('isHidden', !!hidden);
}

function getBridge() {
  return window?.kgentoolDesktop || window?.agentifyDesktop || null;
}

let catalog = {};
const fallbackVendors = [
  { id: 'chatgpt', name: 'ChatGPT', status: 'supported' },
  { id: 'perplexity', name: 'Perplexity', status: 'supported' },
  { id: 'claude', name: 'Claude', status: 'supported' },
  { id: 'grok', name: 'Grok', status: 'supported' },
  { id: 'aistudio', name: 'Google AI Studio', status: 'supported' },
  { id: 'gemini', name: 'Gemini', status: 'supported' }
];

function hasApi(name) {
  const b = getBridge();
  return typeof b?.[name] === 'function';
}

async function callApi(name, args, { fallback = null, required = false } = {}) {
  const b = getBridge();
  if (typeof b?.[name] !== 'function') {
    if (required) throw new Error(`missing_desktop_api:${name} (KGentool 안에서 제어 센터를 열고 다시 시작하세요)`);
    return fallback;
  }
  try {
    if (typeof args === 'undefined') return await b[name]();
    return await b[name](args);
  } catch (e) {
    if (required) throw e;
    return fallback;
  }
}

function defaultState() {
  return {
    ok: false,
    vendors: [...fallbackVendors],
    tabs: [],
    defaultTabId: null,
    stateDir: '',
    browserBackend: 'electron',
    browser: null,
    runtime: { inflightQueries: 0, activeQueries: [], lastOutcomes: [] }
  };
}

function defaultSettings() {
  return {
    browserBackend: 'electron',
    chromeDebugPort: 9222,
    chromeExecutablePath: null,
    chromeProfileMode: 'isolated',
    chromeProfileName: 'Default',
    maxInflightQueries: 2,
    maxQueriesPerMinute: 12,
    minTabGapMs: 0,
    minGlobalGapMs: 0,
    showTabsByDefault: false,
    allowAuthPopups: true,
    acknowledgedAt: null
  };
}

function statusText(msg) {
  el('statusLine').textContent = msg;
}

function isChromeCdpSelected() {
  return String(el('setBrowserBackend').value || '').trim() === 'chrome-cdp';
}

function syncChromeProfileFields() {
  const hidden = !isChromeCdpSelected();
  setHidden('chromeProfileModeField', hidden);
  setHidden('chromeProfileNameField', hidden);
}

let lastState = defaultState();
let refreshInFlight = null;
let lastRefreshAt = 0;
let hasLiveUpdates = false;

function tabSortWeight(tab, active, outcome) {
  if (active?.blocked) return 0;
  if (active) return 1;
  if (outcome?.status === 'blocked') return 2;
  if (outcome?.status === 'error') return 3;
  if (outcome?.status === 'stopped') return 4;
  if (outcome?.status === 'success') return 5;
  return tab?.protectedTab ? 7 : 6;
}

async function refresh() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const state = (await callApi('getState', undefined, { fallback: lastState })) || lastState;
    const settings = (await callApi('getSettings', undefined, { fallback: defaultSettings() })) || defaultSettings();
    const watchFoldersData = (await callApi('listWatchFolders', undefined, { fallback: { folders: [] } })) || { folders: [] };
    lastState = { ...defaultState(), ...state };

    const vendorSelect = el('vendorSelect');
    const prev = String(vendorSelect.value || '').trim();
    vendorSelect.innerHTML = '';
    const vendors = Array.isArray(lastState.vendors) && lastState.vendors.length ? lastState.vendors : fallbackVendors;
    for (const v of vendors) {
    const opt = document.createElement('option');
      opt.value = String(v.id || '').trim();
    opt.textContent = `${v.name}${v.status && v.status !== 'supported' ? ` (${v.status})` : ''}`;
      if (prev && prev === opt.value) opt.selected = true;
      else if (!prev && v.id === 'chatgpt') opt.selected = true;
    vendorSelect.appendChild(opt);
  }
    if (!vendorSelect.value && vendorSelect.options.length > 0) {
      vendorSelect.value = vendorSelect.options[0].value;
    }

    const tabs = Array.isArray(lastState.tabs) ? lastState.tabs : [];
    const runtime = lastState.runtime || { inflightQueries: 0, activeQueries: [], lastOutcomes: [] };
    const activeQueries = Array.isArray(runtime.activeQueries) ? runtime.activeQueries : [];
    const lastOutcomes = Array.isArray(runtime.lastOutcomes) ? runtime.lastOutcomes : [];
    const activeByTab = new Map(activeQueries.map((item) => [item.tabId, item]));
    const outcomeByTab = new Map(lastOutcomes.map((item) => [item.tabId, item]));
    const sortedTabs = [...tabs].sort((a, b) => {
      const aActive = activeByTab.get(a.id) || null;
      const bActive = activeByTab.get(b.id) || null;
      const aOutcome = outcomeByTab.get(a.id) || null;
      const bOutcome = outcomeByTab.get(b.id) || null;
      const weightDelta = tabSortWeight(a, aActive, aOutcome) - tabSortWeight(b, bActive, bOutcome);
      if (weightDelta !== 0) return weightDelta;
      return Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0);
    });
    const list = el('tabsList');
    const empty = el('tabsEmpty');
    list.innerHTML = '';
    const nonDefaultTabs = tabs.filter((item) => !item.protectedTab);
    if (!tabs.length) {
      empty.textContent = '아직 열린 탭이 없습니다. 기본 탭을 열거나 새 벤더 탭을 생성해 시작하세요.';
      empty.style.display = 'block';
    } else if (!nonDefaultTabs.length) {
      empty.textContent = '고정된 기본 탭만 열려 있습니다. 전용 워크플로나 병렬 작업이 필요하면 키가 있는 벤더 탭을 생성하세요.';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
    }

    for (const t of sortedTabs) {
      const row = document.createElement('div');
      row.className = 'tab';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = t.name || t.key || t.id;

      const sub = document.createElement('div');
      sub.className = 'sub';
      const vendorLabel = t.vendorName ? `${t.vendorName}` : '알 수 없는 벤더';
      const keyLabel = t.key ? `key=${t.key}` : '키 없음';
      const used = t.lastUsedAt ? fmtTime(t.lastUsedAt) : '';
      const active = activeByTab.get(t.id) || null;
      const outcome = outcomeByTab.get(t.id) || null;
      sub.textContent = `${vendorLabel} • ${keyLabel}${used ? ` • 사용 ${used}` : ''}`;
      meta.appendChild(title);
      meta.appendChild(sub);

      const statusRow = document.createElement('div');
      statusRow.className = 'statusRow';
      const addBadge = (label, className = 'dim') => {
        const badge = document.createElement('span');
        badge.className = `badge ${className}`.trim();
        badge.textContent = label;
        statusRow.appendChild(badge);
      };
      if (t.protectedTab) addBadge('고정', 'info');
      if (active) {
        addBadge(active.stopRequested ? '중지 중' : '실행 중', active.stopRequested ? 'warn' : 'ok');
        if (active.source) addBadge(fmtSource(active.source), 'info');
        addBadge(fmtPhase(active.phase), active.blocked ? 'warn' : 'dim');
        if (active.blocked) addBadge(active.blockedTitle || '사용자 확인 필요', 'warn');
        if (active.startedAt) addBadge(`시작 후 ${fmtDuration(Date.now() - active.startedAt)}`, 'dim');
      } else {
        addBadge('대기', 'dim');
        if (outcome?.status) addBadge(fmtOutcomeStatus(outcome.status), outcome.status === 'success' ? 'ok' : outcome.status === 'stopped' ? 'info' : 'warn');
        if (outcome?.source) addBadge(fmtSource(outcome.source), 'dim');
      }
      meta.appendChild(statusRow);

      if (active?.promptPreview) {
        const activity = document.createElement('div');
        activity.className = 'sub';
        activity.textContent = `현재 작업: ${active.promptPreview}`;
        meta.appendChild(activity);
      }
      if (active?.blockedTitle) {
        const blocked = document.createElement('div');
        blocked.className = 'sub';
        blocked.textContent = active.blockedTitle;
        meta.appendChild(blocked);
      } else if (outcome?.detail) {
        const last = document.createElement('div');
        last.className = 'sub';
        last.textContent = `${outcome.label || fmtOutcomeStatus(outcome.status)}: ${outcome.detail}`;
        meta.appendChild(last);
      }

      const controls = document.createElement('div');
      controls.className = 'controls';

      if (active) {
        const btnStop = document.createElement('button');
        btnStop.className = 'btn secondary tabActionBtn';
        btnStop.textContent = active.stopRequested ? '중지 중…' : '중지';
        btnStop.title = '현재 실행 중인 요청을 강제 중지합니다';
        btnStop.setAttribute('aria-label', '실행 중인 요청 중지');
        btnStop.disabled = !!active.stopRequested;
        btnStop.onclick = async () => {
          try {
            const out = await callApi('stopQuery', { tabId: t.id }, { required: true });
            statusText(out?.requested ? `${t.name || t.key || t.id} 요청 중지를 전송했습니다` : `${t.name || t.key || t.id}에는 실행 중인 요청이 없습니다`);
          } catch (e) {
            statusText(`중지 실패: ${e?.message || String(e)}`);
          } finally {
            await refresh();
          }
        };
        controls.appendChild(btnStop);
      }

      const btnShow = document.createElement('button');
      btnShow.className = 'btn secondary tabActionBtn';
      btnShow.textContent = '표시';
      btnShow.title = '탭 표시';
      btnShow.setAttribute('aria-label', '탭 표시');
      btnShow.onclick = async () => {
        try {
          await callApi('showTab', { tabId: t.id }, { required: true });
        } finally {
          await refresh();
        }
      };

      const btnHide = document.createElement('button');
      btnHide.className = 'btn secondary tabActionBtn';
      btnHide.textContent = '숨기기';
      btnHide.title = '탭 숨기기';
      btnHide.setAttribute('aria-label', '탭 숨기기');
      btnHide.onclick = async () => {
        try {
          await callApi('hideTab', { tabId: t.id }, { required: true });
        } finally {
          await refresh();
        }
      };

      const btnClose = document.createElement('button');
      btnClose.className = 'btn secondary tabActionBtn destructive';
      btnClose.textContent = t.protectedTab ? '고정' : '닫기';
      btnClose.title = t.protectedTab
        ? '기본 탭은 항상 남아 있도록 고정됩니다.'
        : '탭 닫기';
      btnClose.setAttribute('aria-label', t.protectedTab ? '고정된 탭' : '탭 닫기');
      btnClose.disabled = !!t.protectedTab;
      btnClose.onclick = async () => {
        if (t.protectedTab) return;
        try {
          await callApi('closeTab', { tabId: t.id }, { required: true });
        } finally {
          await refresh();
        }
      };

      controls.appendChild(btnShow);
      controls.appendChild(btnHide);
      controls.appendChild(btnClose);

      row.appendChild(meta);
      row.appendChild(controls);
      list.appendChild(row);
    }

    const watchFolders = Array.isArray(watchFoldersData.folders) ? watchFoldersData.folders : [];
    const watchList = el('watchFoldersList');
    const watchEmpty = el('watchFoldersEmpty');
    watchList.innerHTML = '';
    watchEmpty.style.display = watchFolders.length ? 'none' : 'block';
    for (const folder of watchFolders) {
      const row = document.createElement('div');
      row.className = 'tab';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = folder.name || folder.path;
      const sub = document.createElement('div');
      sub.className = 'sub';
      sub.textContent = `${folder.path}${folder.isDefault ? ' • default' : ''}`;
      meta.appendChild(title);
      meta.appendChild(sub);

      const controls = document.createElement('div');
      controls.className = 'controls';

      const btnOpen = document.createElement('button');
      btnOpen.className = 'btn secondary tabActionBtn';
      btnOpen.textContent = '열기';
      btnOpen.title = '폴더 열기';
      btnOpen.setAttribute('aria-label', '폴더 열기');
      btnOpen.onclick = async () => {
        try {
          await callApi('openWatchFolder', { name: folder.name }, { required: true });
          statusText(`워치 폴더를 열었습니다: ${folder.path}`);
        } catch (e) {
          statusText(`워치 폴더 열기 실패: ${e?.message || String(e)}`);
        }
      };

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn secondary tabActionBtn destructive';
      btnRemove.textContent = folder.isDefault ? '기본' : '제거';
      btnRemove.title = '워치 폴더 제거';
      btnRemove.setAttribute('aria-label', '워치 폴더 제거');
      btnRemove.disabled = !!folder.isDefault;
      btnRemove.onclick = async () => {
        try {
          const out = await callApi('removeWatchFolder', { name: folder.name }, { required: true });
          el('watchFoldersHint').textContent = out?.deleted ? `${folder.name} 폴더를 제거했습니다.` : `${folder.name} 폴더를 찾지 못했습니다.`;
          await refresh();
        } catch (e) {
          el('watchFoldersHint').textContent = `제거 실패: ${e?.message || String(e)}`;
        }
      };

      controls.appendChild(btnOpen);
      controls.appendChild(btnRemove);
      row.appendChild(meta);
      row.appendChild(controls);
      watchList.appendChild(row);
    }

    lastRefreshAt = Date.now();
    const browserSummary =
      lastState.browserBackend === 'chrome-cdp'
        ? `Chrome CDP${lastState.browser?.profileMode === 'existing' ? ' (existing profile)' : ''}${lastState.browser?.debugPort ? `:${lastState.browser.debugPort}` : ''}`
        : 'Electron';
    const runningSummary = ` • 실행 중: ${activeQueries.length}`;
    const liveSummary = hasLiveUpdates ? '실시간 업데이트 사용' : '3초 간격 폴링';
    const refreshedSummary = lastRefreshAt ? ` • 마지막 갱신 ${new Date(lastRefreshAt).toLocaleTimeString()}` : '';
    statusText(`백엔드: ${browserSummary} • 탭: ${tabs.length}${runningSummary} • ${liveSummary}${refreshedSummary} • 상태 경로: ${lastState.stateDir || ''}`);

  // Settings UI.
    el('setBrowserBackend').value = settings.browserBackend || 'electron';
    el('setChromeProfileMode').value = settings.chromeProfileMode || 'isolated';
    el('setChromeProfileName').value = settings.chromeProfileName || 'Default';
    setNum('setMaxInflight', settings.maxInflightQueries);
    setNum('setQpm', settings.maxQueriesPerMinute);
    setNum('setTabGap', settings.minTabGapMs);
    setNum('setGlobalGap', settings.minGlobalGapMs);
    setChecked('setShowTabsDefault', settings.showTabsByDefault);
    setChecked('setAllowAuthPopups', settings.allowAuthPopups !== false);
    setChecked('setAcknowledge', false);
    el('btnSaveSettings').disabled = true;
    el('settingsHint').textContent = settings.acknowledgedAt ? `마지막 확인 시각: ${settings.acknowledgedAt}` : '아직 확인되지 않았습니다.';
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function main() {
  const localeData = await callApi('getLocaleCatalog', undefined, { fallback: { locale: 'ko-KR', catalog: {} } });
  catalog = localeData?.catalog || {};
  const productInfo = await callApi('getProductInfo', undefined, { fallback: { productName: 'KGentool' } });
  try {
    document.title = `${productInfo?.productName || 'KGentool'} 제어 센터`;
  } catch {}
  if (!getBridge()) {
    statusText('제어 센터를 시작하는 중입니다 (데스크톱 브리지를 기다리는 중)…');
  }

  el('btnRefresh').onclick = () => refresh().catch((e) => statusText(`새로고침 실패: ${e?.message || String(e)}`));
  el('btnOpenState').onclick = async () => {
    try {
      await callApi('openStateDir', undefined, { required: true });
      statusText(`상태 디렉터리를 열었습니다: ${lastState.stateDir || ''}`);
    } catch (e) {
      statusText(`상태 폴더 열기 실패: ${e?.message || String(e)}`);
    }
  };
  el('btnOpenArtifacts').onclick = async () => {
    try {
      await callApi('openArtifactsDir', undefined, { required: true });
      statusText(`산출물 디렉터리를 열었습니다: ${lastState.stateDir || ''}`);
    } catch (e) {
      statusText(`산출물 폴더 열기 실패: ${e?.message || String(e)}`);
    }
  };
  el('btnOpenWatch').onclick = async () => {
    try {
      const out = await callApi('openWatchFolder', { name: 'inbox' }, { required: true });
      statusText(`워치 폴더를 열었습니다: ${out?.folderPath || ''}`);
    } catch (e) {
      statusText(`워치 폴더 열기 실패: ${e?.message || String(e)}`);
    }
  };
  el('btnPickWatchFolder').onclick = async () => {
    try {
      const out = await callApi('pickWatchFolder', undefined, { required: true });
      if (out?.path) el('watchFolderPath').value = out.path;
    } catch (e) {
      el('watchFoldersHint').textContent = `폴더 선택 실패: ${e?.message || String(e)}`;
    }
  };
  el('btnAddWatchFolder').onclick = async () => {
    const name = String(el('watchFolderName').value || '').trim();
    const folderPath = String(el('watchFolderPath').value || '').trim();
    el('watchFoldersHint').textContent = '';
    try {
      const out = await callApi('addWatchFolder', { name, path: folderPath }, { required: true });
      el('watchFoldersHint').textContent = `워치 폴더 ${out?.folder?.name || ''}를 추가했습니다.`;
      el('watchFolderName').value = '';
      el('watchFolderPath').value = '';
      await refresh();
    } catch (e) {
      el('watchFoldersHint').textContent = `추가 실패: ${e?.message || String(e)}`;
    }
  };
  el('btnScanWatchFolders').onclick = async () => {
    try {
      const out = await callApi('scanWatchFolders', undefined, { required: true });
      const ingested = Array.isArray(out?.ingested) ? out.ingested.length : 0;
      el('watchFoldersHint').textContent = ingested ? `${ingested}개의 새 파일을 인덱싱했습니다.` : '새 파일이 없습니다.';
    } catch (e) {
      el('watchFoldersHint').textContent = `스캔 실패: ${e?.message || String(e)}`;
    }
  };
  el('btnShowDefault').onclick = async () => {
    try {
      const st = await callApi('getState', undefined, { fallback: lastState, required: true });
      const target = st?.defaultTabId || lastState.defaultTabId || null;
      if (!target) throw new Error('missing_default_tab');
      await callApi('showTab', { tabId: target }, { required: true });
      statusText(`기본 탭을 열었습니다: ${target}`);
    } catch (e) {
      statusText(`기본 탭 열기 실패: ${e?.message || String(e)}`);
    }
  };

  el('btnCreate').onclick = async () => {
    const vendorId = String(el('vendorSelect').value || '').trim() || 'chatgpt';
    const key = String(el('tabKey').value || '').trim() || null;
    const name = String(el('tabName').value || '').trim() || null;
    const show = !!el('tabShow').checked;
    el('createHint').textContent = '';
    try {
      const out = await callApi('createTab', { vendorId, key, name, show }, { required: true });
      el('createHint').textContent = `탭을 생성했습니다: ${out.tabId || ''}`;
      await refresh();
    } catch (e) {
      el('createHint').textContent = `생성 실패: ${e?.message || String(e)}`;
    }
  };

  el('setBrowserBackend').onchange = () => {
    syncChromeProfileFields();
  };

  const updateSaveEnabled = () => {
    el('btnSaveSettings').disabled = !el('setAcknowledge').checked;
  };
  el('setAcknowledge').onchange = updateSaveEnabled;
  syncChromeProfileFields();

  el('btnResetSettings').onclick = async () => {
    el('settingsHint').textContent = '';
    try {
      await callApi('setSettings', { reset: true }, { required: true });
      el('settingsHint').textContent = '기본값으로 초기화했습니다.';
      await refresh();
    } catch (e) {
      el('settingsHint').textContent = `초기화 실패: ${e?.message || String(e)}`;
    }
  };

  el('btnSaveSettings').onclick = async () => {
    if (!el('setAcknowledge').checked) return;
    el('settingsHint').textContent = '';
    try {
      const saved = await callApi(
        'setSettings',
        {
          browserBackend: String(el('setBrowserBackend').value || 'electron').trim() || 'electron',
          chromeProfileMode: String(el('setChromeProfileMode').value || 'isolated').trim() || 'isolated',
          chromeProfileName: String(el('setChromeProfileName').value || 'Default').trim() || 'Default',
          maxInflightQueries: num('setMaxInflight', 2),
          maxQueriesPerMinute: num('setQpm', 12),
          minTabGapMs: num('setTabGap', 0),
          minGlobalGapMs: num('setGlobalGap', 0),
          showTabsByDefault: !!el('setShowTabsDefault').checked,
          allowAuthPopups: !!el('setAllowAuthPopups').checked,
          acknowledge: true
        },
        { required: true }
      );
      const backendChanged = String(saved?.browserBackend || 'electron') !== String(lastState.browserBackend || 'electron');
      el('settingsHint').textContent = `저장했습니다.${saved?.acknowledgedAt ? ` ${saved.acknowledgedAt}` : ''}${backendChanged ? ' 브라우저 백엔드 변경을 적용하려면 KGentool을 재시작하세요.' : ''}`;
      setChecked('setAcknowledge', false);
      el('btnSaveSettings').disabled = true;
    } catch (e) {
      el('settingsHint').textContent = `저장 실패: ${e?.message || String(e)}`;
    }
  };

  if (hasApi('onTabsChanged')) {
    try {
      const b = getBridge();
      hasLiveUpdates = true;
      b?.onTabsChanged?.(() => refresh().catch(() => {}));
    } catch (e) {
      hasLiveUpdates = false;
      statusText(`탭 이벤트 리스너를 사용할 수 없습니다: ${e?.message || String(e)}`);
      setInterval(() => refresh().catch(() => {}), 3000);
    }
  } else {
    hasLiveUpdates = false;
    statusText('탭 이벤트 리스너를 사용할 수 없습니다. 3초마다 자동 새로고침합니다.');
    setInterval(() => refresh().catch(() => {}), 3000);
  }

  await refresh();
}

main().catch((e) => {
  const st = el('statusLine');
  st.textContent = `제어 센터 오류: ${e?.message || String(e)}`;
});
