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
};

export const electronAPI: ElectronAPI = (() => {
  const isElectronAPI = (val: unknown): val is ElectronAPI =>
    typeof val === 'object' && val !== null && 'store' in val;

  if (typeof window !== "undefined") {
    const w = window as unknown as { electronAPI?: unknown };
    if (isElectronAPI(w.electronAPI)) {
      return w.electronAPI;
    }
  }

  console.warn("Running in non-Electron environment: electronAPI is mocked");

  const mock: ElectronAPI = {
    readLocalFile: async (relPath: string) => {
      console.warn(`readLocalFile called with ${relPath}`);
      return "";
    },
    writeLocalFile: async (relPath: string) => {
      console.warn(`writeLocalFile called with ${relPath}`);
    },
    getFileTimestamp: async (relPath: string) => {
      console.warn(`getFileTimestamp called with ${relPath}`);
      return Date.now();
    },
    fetchRemoteText: async (url: string) => {
      const res = await fetch(url);
      return await res.text();
    },
    store: {
      get: async <T = unknown>(key: string): Promise<T | null> => {
        console.warn(`store.get called with ${key}`);
        return null;
      },
      set: async <T = unknown>(key: string, value: T): Promise<void> => {
        console.warn(`store.set called with ${key}, value:`, value);
      },
      delete: async (key: string) => {
        console.warn(`store.delete called with ${key}`);
      }
    },
    runAI: async <T>(args: string[]): Promise<T> => {
      console.warn(`runAI called with args: ${args.join(" ")}`);
      return {} as T;
    },
    quit: () => console.warn("quit called")
  } satisfies ElectronAPI;

  return mock;
})();
