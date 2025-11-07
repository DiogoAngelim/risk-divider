import { useAssetPath } from '../lib/hooks';
import { transformImagePath, getFallbackIcon } from '../lib/imageUtils';

interface AssetImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  isAssetImage?: boolean; // true for dynamic API images, false for static assets
}

/**
 * Enhanced image component that handles both static assets and dynamic images
 * in both development and production environments
 */
export default function AssetImage({
  src,
  alt,
  className,
  width,
  height,
  isAssetImage = true
}: AssetImageProps) {
  // For dynamic asset images (from API), use transformImagePath then resolve
  const dynamicImagePath = isAssetImage && src ? transformImagePath(src) : null;
  const resolvedDynamicPath = useAssetPath(dynamicImagePath || '');

  // For static fallback icon, resolve the path
  const fallbackPath = useAssetPath(getFallbackIcon());

  // Determine which path to use
  const imageSrc = dynamicImagePath && src ? resolvedDynamicPath : fallbackPath;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}

interface StaticImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Component for static images that need path resolution
 */
export function StaticImage({ src, alt, className, width, height }: StaticImageProps) {
  const resolvedPath = useAssetPath(src);

  return (
    <img
      src={resolvedPath}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}