import { ensureD3 } from './d3';

export type RickshawNamespace = unknown;

let rickshawPromise: Promise<RickshawNamespace> | null = null;

export async function ensureRickshaw(): Promise<RickshawNamespace> {
  if (typeof window === 'undefined') throw new Error('Rickshaw can only load in a browser context');
  await ensureD3();
  const existing = (window as unknown as { Rickshaw?: RickshawNamespace }).Rickshaw;
  if (existing) return existing;
  if (rickshawPromise) return rickshawPromise;

  rickshawPromise = new Promise<RickshawNamespace>((resolve, reject) => {
    try {
      const url = new URL('./rickshaw.min.js', import.meta.url).toString();
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve((window as unknown as { Rickshaw: RickshawNamespace }).Rickshaw);
      script.onerror = () => reject(new Error('Failed to load Rickshaw from local vendor file'));
      document.head.appendChild(script);
    } catch (err) {
      reject(err as Error);
    }
  });

  return rickshawPromise;
}

const RickshawGlobal = (typeof window !== 'undefined' ? (window as unknown as { Rickshaw?: RickshawNamespace }).Rickshaw : undefined);
export default RickshawGlobal;
