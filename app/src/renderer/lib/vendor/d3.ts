/* eslint-disable @typescript-eslint/no-explicit-any */
export type D3Global = ({ select: (...args: any[]) => any } & Record<string, any>);

let d3Promise: Promise<D3Global> | null = null;

export function ensureD3(): Promise<D3Global> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('D3 can only load in a browser context'));
  }
  const w = window as unknown as { d3?: D3Global; d3v3?: D3Global };
  const existing = w.d3 || w.d3v3;
  if (existing) return Promise.resolve(existing);
  if (d3Promise) return d3Promise;

  d3Promise = new Promise<D3Global>((resolve, reject) => {
    try {
      const tryLoad = (src: string, onFail?: () => void) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
          const g = (window as unknown as { d3?: D3Global; d3v3?: D3Global });
          const loaded = g.d3 || g.d3v3;
          if (loaded) {
            resolve(loaded);
          } else if (onFail) {
            onFail();
          } else {
            reject(new Error('D3 script loaded but no global found (d3/d3v3)'));
          }
        };
        script.onerror = () => {
          if (onFail) onFail(); else reject(new Error('Failed to load D3 from local vendor file: ' + src));
        };
        document.head.appendChild(script);
      };

      const fallbackUrl = new URL('./d3.v3.min.js', import.meta.url).toString();
      tryLoad(fallbackUrl);
    } catch (err) {
      reject(err as Error);
    }
  });
  return d3Promise;
}

const d3Global = (typeof window !== 'undefined' ? ((window as unknown as { d3?: D3Global; d3v3?: D3Global }).d3 || (window as unknown as { d3?: D3Global; d3v3?: D3Global }).d3v3) : undefined);
export default d3Global;
