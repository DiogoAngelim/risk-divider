// Type for ElectronAPI
interface ElectronAPI {
  store: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  basePath: () => Promise<string>;
}

// Extend window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Transforms image paths for proper loading in both development and production
 * @param imagePath - The original image path from the API
 * @returns The corrected path for use in the application, or undefined if no path provided
 */
export function transformImagePath(imagePath: string | undefined | null): string | undefined {
  if (!imagePath) return undefined;

  // Replace API paths with local public folder paths
  return imagePath.replace('/vesple/optimalstocks/', '/common/');
}

/**
 * Gets a fallback icon path for use when no image is available
 * @returns The path to the default icon
 */
export function getFallbackIcon(): string {
  return '/common/icons/icon-256.png';
}

/**
 * Enhanced asset path resolver that works in both dev and production
 * @param assetPath - The asset path starting with /
 * @returns Promise that resolves to the correct path
 */
export async function getAssetPath(assetPath: string): Promise<string> {
  if (!assetPath) return '';

  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  // In development, use the path as is
  if (import.meta.env.DEV) {
    return `/${cleanPath}`;
  }

  // In production (Electron environment), get the base path and construct proper file URL
  if (typeof window !== 'undefined' && window.electronAPI?.basePath) {
    try {
      const basePath = await window.electronAPI.basePath();
      if (basePath) {
        // For Electron in production, use file:// protocol
        return `file://${basePath}/${cleanPath}`.replace(/\\/g, '/');
      }
    } catch (error) {
      console.warn('Failed to get base path:', error);
    }
  }

  // Fallback to relative path
  return `/${cleanPath}`;
}