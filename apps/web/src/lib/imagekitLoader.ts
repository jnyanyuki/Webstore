import { ImageLoaderProps } from "next/image";

const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "") ||
  "https://ik.imagekit.io/njndeveloper";

export default function imagekitLoader({ src, width, quality }: ImageLoaderProps): string {
  // Return the original src directly if no endpoint is configured or if using SVG/data URLs
  if (!IMAGEKIT_ENDPOINT || src.startsWith("data:") || src.endsWith(".svg")) {
    return src;
  }

  // Sanitize path (strip leading slash)
  const cleanSrc = src.startsWith("/") ? src.slice(1) : src;

  // Build the transformation parameters
  // w: width, q: quality (fallback to NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY or 85), f-auto: auto WebP/AVIF, c-at_max: maintain aspect ratio
  const defaultQuality = Number(process.env.NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY) || 85;
  const params = [`w-${width}`, `q-${quality || defaultQuality}`, "f-auto", "c-at_max"];

  const transformationString = `tr=${params.join(",")}`;

  // Case 1: Image path is already hosted directly on ImageKit (or an external proxy source via ImageKit)
  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    const url = new URL(cleanSrc);
    // If it's already an ImageKit URL, insert the transform query parameter
    if (url.origin === IMAGEKIT_ENDPOINT) {
      url.searchParams.set("tr", params.join(","));
      return url.toString();
    }
    // External URL routed through ImageKit URL proxy
    return `${IMAGEKIT_ENDPOINT}/${cleanSrc}?${transformationString}`;
  }

  // Case 2: Relative path pointing to ImageKit media library or connected origin bucket (e.g. S3 / Supabase)
  return `${IMAGEKIT_ENDPOINT}/${transformationString}/${cleanSrc}`;
}
