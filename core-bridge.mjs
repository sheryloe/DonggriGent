import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createCoreHost } from './core-host.mjs';

class InProcessTransport {
  constructor(host) {
    this.host = host;
  }

  async request(name, payload = {}) {
    return await this.host.request(name, payload);
  }

  async close() {}
}

class ChildProcessTransport {
  constructor({ command, args = [], cwd, env }) {
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.env = env;
    this.pending = new Map();
    this.buffer = '';
    this.seq = 0;
    this.child = null;
  }

  start() {
    if (this.child) return;
    const child = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: this.env,
      stdio: ['pipe', 'pipe', 'inherit']
    });
    this.child = child;

    child.stdout.on('data', (chunk) => {
      this.buffer += String(chunk || '');
      let idx = this.buffer.indexOf('\n');
      while (idx >= 0) {
        const line = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (line) this.#handleLine(line);
        idx = this.buffer.indexOf('\n');
      }
    });
    child.on('error', (error) => {
      const transportError = new Error('core_transport_start_failed');
      transportError.data = { code: 'core_transport_start_failed', cause: String(error?.message || 'spawn_failed') };
      for (const deferred of this.pending.values()) deferred.reject(transportError);
      this.pending.clear();
      this.child = null;
    });
    child.on('exit', (exitCode, signal) => {
      const transportError = new Error('core_transport_closed');
      transportError.data = { code: 'core_transport_closed', exitCode, signal: signal || null };
      for (const deferred of this.pending.values()) deferred.reject(transportError);
      this.pending.clear();
      this.child = null;
    });
  }

  #handleLine(line) {
    let message = null;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message?.type !== 'response' || !message?.id) return;
    const deferred = this.pending.get(message.id);
    if (!deferred) return;
    this.pending.delete(message.id);
    if (message.ok === false) {
      const error = new Error(message?.error?.message || 'core_request_failed');
      error.data = message.error || null;
      deferred.reject(error);
      return;
    }
    deferred.resolve(message.result || {});
  }

  async request(name, payload = {}) {
    this.start();
    if (!this.child?.stdin || this.child.killed || this.child.exitCode != null) {
      const error = new Error('core_transport_closed');
      error.data = { code: 'core_transport_closed' };
      throw error;
    }
    const id = `req-${++this.seq}`;
    const envelope = {
      id,
      type: 'command',
      name,
      payload
    };
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.child.stdin.write(`${JSON.stringify(envelope)}\n`, (error) => {
      if (!error) return;
      const deferred = this.pending.get(id);
      if (!deferred) return;
      this.pending.delete(id);
      const transportError = new Error('core_transport_io_failed');
      transportError.data = { code: 'core_transport_io_failed', cause: String(error?.message || 'stdin_write_failed') };
      deferred.reject(transportError);
    });
    return await promise;
  }

  async close() {
    try {
      this.child?.kill?.('SIGTERM');
    } catch {}
  }
}

class HybridTransport {
  constructor(primary, fallback) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async request(name, payload = {}) {
    try {
      return await this.primary.request(name, payload);
    } catch (error) {
      const code = error?.data?.code || null;
      const message = String(error?.message || '');
      if (
        code === 'unsupported_core_command' ||
        code === 'core_transport_start_failed' ||
        code === 'core_transport_closed' ||
        code === 'core_transport_io_failed' ||
        message.startsWith('unsupported_core_command') ||
        message.startsWith('core_transport_')
      ) {
        return await this.fallback.request(name, payload);
      }
      throw error;
    }
  }

  async close() {
    await Promise.allSettled([this.primary.close?.(), this.fallback.close?.()]);
  }
}

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function createCoreBridge({
  stateDir,
  agentsDir,
  workflowsPath,
  watchFolders,
  openWatchFolder,
  scanWatchFolder,
  executeWorkflowStep,
  runQuery,
  stopQuery,
  getRuntimeStatus
} = {}) {
  const explicitBin = String(process.env.KGENTOOL_CORE_BIN || '').trim();
  const defaultBin = path.join(process.cwd(), 'core', 'build', 'kgentool-core');
  const binary = explicitBin || defaultBin;

  if (await fileExists(binary)) {
    const fallback = new InProcessTransport(
      createCoreHost({
        stateDir,
        agentsDir,
        workflowsPath,
        watchFolders,
        openWatchFolder,
        scanWatchFolder,
        executeWorkflowStep,
        runQuery,
        stopQuery,
        getRuntimeStatus
      })
    );

    const primary = new ChildProcessTransport({
      command: binary,
      cwd: process.cwd(),
      env: { ...process.env, KGENTOOL_STATE_DIR: stateDir }
    });

    return new HybridTransport(primary, fallback);
  }

  return new InProcessTransport(
    createCoreHost({
      stateDir,
      agentsDir,
      workflowsPath,
      watchFolders,
      openWatchFolder,
      scanWatchFolder,
      executeWorkflowStep,
      runQuery,
      stopQuery,
      getRuntimeStatus
    })
  );
}
