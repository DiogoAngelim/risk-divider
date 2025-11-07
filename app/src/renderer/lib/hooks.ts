import { useState, useEffect, useMemo } from 'react';
import { getAssetPath } from './imageUtils';

/**
 * Hook to resolve asset paths for both development and production
 * @param assetPath - The asset path starting with /
 * @returns The resolved asset path
 */
export function useAssetPath(assetPath: string): string {
  const [resolvedPath, setResolvedPath] = useState<string>(assetPath);

  useEffect(() => {
    let isMounted = true;

    getAssetPath(assetPath).then((path) => {
      if (isMounted) {
        setResolvedPath(path);
      }
    }).catch((error) => {
      console.warn('Failed to resolve asset path:', error);
      if (isMounted) {
        setResolvedPath(assetPath); // Fallback to original path
      }
    });

    return () => {
      isMounted = false;
    };
  }, [assetPath]);

  return resolvedPath;
}

/**
 * Hook to resolve multiple asset paths at once
 * @param assetPaths - Array of asset paths starting with /
 * @returns Array of resolved asset paths in the same order
 */
export function useAssetPaths(assetPaths: string[]): string[] {
  const [resolvedPaths, setResolvedPaths] = useState<string[]>(assetPaths);

  // Memoize the serialized paths to avoid unnecessary re-renders
  const serializedPaths = useMemo(() => JSON.stringify(assetPaths), [assetPaths]);

  useEffect(() => {
    let isMounted = true;

    Promise.all(assetPaths.map(path => getAssetPath(path)))
      .then((paths) => {
        if (isMounted) {
          setResolvedPaths(paths);
        }
      })
      .catch((error) => {
        console.warn('Failed to resolve asset paths:', error);
        if (isMounted) {
          setResolvedPaths(assetPaths); // Fallback to original paths
        }
      });

    return () => {
      isMounted = false;
    };
  }, [serializedPaths, assetPaths]);

  return resolvedPaths;
}