interface ElectronStore {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: <T = unknown>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface ElectronAPI {
  readLocalFile: (relPath: string) => Promise<string>;
  writeLocalFile: (relPath: string, data: string) => Promise<void>;
  getFileTimestamp: (relPath: string) => Promise<number>;
  fetchRemoteText: (url: string) => Promise<string>;
  store: ElectronStore;
  runAI: <T = unknown>(args: string[]) => Promise<T>;
  quit: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
  var getFileTimestamp: (relPath: string) => Promise<number>;
  var readLocalFile: (relPath: string) => Promise<string>;
  var writeLocalFile: (relPath: string, data: string) => Promise<void>;
  var fetchRemoteText: (url: string) => Promise<string>;
}

export { }
