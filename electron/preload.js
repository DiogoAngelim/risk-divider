import { contextBridge, ipcRenderer } from 'electron';
import { spawn } from 'child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const EXTERNAL_CACHE = join(homedir(), 'stock-data', 'data');

contextBridge.exposeInMainWorld('electronAPI', {
  readLocalFile: (relPath) => {
    const fullPath = join(EXTERNAL_CACHE, relPath);
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    return readFileSync(fullPath, 'utf-8');
  },

  writeLocalFile: (relPath, data) => {
    const fullPath = join(EXTERNAL_CACHE, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, data, 'utf-8');
  },

  getFileTimestamp: (relPath) => {
    const fullPath = join(EXTERNAL_CACHE, relPath);
    try {
      return statSync(fullPath).mtimeMs;
    } catch {
      return 0; 
    }
  },

  fetchRemoteText: async (url) => {
    const res = await fetch(url);
    return await res.text();
  },
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  },
  basePath: () => ipcRenderer.invoke('basePath'),
  runAI: (args) => {
    return new Promise(async (resolve, reject) => {
      const binaryBase = await ipcRenderer.invoke('binaryPath');
      const binaryPath = join(binaryBase, 'bin', 'ai');

      const proc = spawn(binaryPath, args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';

      proc.stdout.on('data', (data) => output += data.toString());
      proc.stderr.on('data', (data) => console.error(data.toString()));

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const match = output.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('No JSON found in output');

            const obj = JSON.parse(match[0]);
            resolve(obj);
          } catch (err) {
            reject(`Failed to parse JSON output: ${err.message}\nRaw output: ${output}`);
          }
        } else {
          reject(`AI binary exited with code ${code}`);
        }
      });

      proc.unref();
    });
  },
  quit: () => ipcRenderer.send('quit')
});

globalThis.readLocalFile = (relPath) => electronAPI.readLocalFile(relPath);
globalThis.writeLocalFile = (relPath, data) => electronAPI.writeLocalFile(relPath, data);
globalThis.getFileTimestamp = (relPath) => electronAPI.getFileTimestamp(relPath);
globalThis.fetchRemoteText = (url) => electronAPI.fetchRemoteText(url);