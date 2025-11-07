interface ElectronAPI {
  store: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  basePath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function transformImagePath(imagePath: string | undefined | null): string | undefined {
  if (!imagePath) return undefined;

  return imagePath.replace('/vesple/optimalstocks/', '/common/');
}

export function getFallbackIcon(): string {
  return '/common/icons/icon-256.png';
}

export async function getAssetPath(assetPath: string): Promise<string> {
  if (!assetPath) return '';

  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (import.meta.env.DEV) {
    return `/${cleanPath}`;
  }

  if (typeof window !== 'undefined' && window.electronAPI?.basePath) {
    try {
      const basePath = await window.electronAPI.basePath();
      if (basePath) {
        return `file://${basePath}/${cleanPath}`.replace(/\\/g, '/');
      }
    } catch (error) {
      console.warn('Failed to get base path:', error);
    }
  }

  return `/${cleanPath}`;
}