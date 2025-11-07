import { useState, useEffect, useMemo } from 'react';
import { getAssetPath } from './imageUtils';

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
  setResolvedPath(assetPath);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [assetPath]);

  return resolvedPath;
}

export function useAssetPaths(assetPaths: string[]): string[] {
  const [resolvedPaths, setResolvedPaths] = useState<string[]>(assetPaths);

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
          setResolvedPaths(assetPaths);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [serializedPaths, assetPaths]);

  return resolvedPaths;
}