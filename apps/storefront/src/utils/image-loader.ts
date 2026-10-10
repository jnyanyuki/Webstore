interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom Image Loader routing media assets through Cloudflare/Cloudinary CDN
 * Converts image formats to auto-format (WebP/AVIF) and optimizes for 3G/4G connectivity
 */
export default function cdnImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // If it's already a full CDN URL or data URI, return as-is
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_HOST || "https://res.cloudinary.com/naicbd/image/upload";
    // Append Cloudinary / Cloudflare image transformations for WebP/AVIF & responsive width
    return `${cdnBase}/w_${width},q_${quality || 75},f_auto/${encodeURIComponent(src)}`;
  }

  return `${src}?w=${width}&q=${quality || 75}`;
}
