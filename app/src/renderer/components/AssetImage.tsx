import { useAssetPath } from '../lib/hooks';
import { transformImagePath, getFallbackIcon } from '../lib/imageUtils';

interface AssetImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  isAssetImage?: boolean;
}

export default function AssetImage({
  src,
  alt,
  className,
  width,
  height,
  isAssetImage = true
}: AssetImageProps) {
  const dynamicImagePath = isAssetImage && src ? transformImagePath(src) : null;
  const resolvedDynamicPath = useAssetPath(dynamicImagePath || '');

  const fallbackPath = useAssetPath(getFallbackIcon());

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