import { ImageLoaderProps } from "next/image";

const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "") ||
  "https://ik.imagekit.io/njndeveloper";

export default function imagekitLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return "";

  // Return data URLs or SVGs directly
  if (src.startsWith("data:") || src.endsWith(".svg")) {
    return src;
  }

  // Handle absolute URLs
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const url = new URL(src);

      // If it's an ImageKit URL, apply ImageKit transformation query
      if (url.origin.includes("ik.imagekit.io")) {
        const defaultQuality = Number(process.env.NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY) || 85;
        const params = [`w-${width}`, `q-${quality || defaultQuality}`, "f-auto", "c-at_max"];
        url.searchParams.set("tr", params.join(","));
        return url.toString();
      }

      // If it's an Unsplash image, use Unsplash's native dynamic CDN parameters directly
      if (url.hostname.includes("unsplash.com")) {
        url.searchParams.set("w", String(width));
        url.searchParams.set("q", String(quality || 80));
        url.searchParams.set("auto", "format");
        return url.toString();
      }

      // Other external CDN or supplier images: return directly
      return src;
    } catch {
      return src;
    }
  }

  if (!IMAGEKIT_ENDPOINT) {
    return src;
  }

  // Relative path pointing to ImageKit media library
  const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
  const defaultQuality = Number(process.env.NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY) || 85;
  const params = [`w-${width}`, `q-${quality || defaultQuality}`, "f-auto", "c-at_max"];
  return `${IMAGEKIT_ENDPOINT}/tr:${params.join(",")}/${cleanSrc}`;
}
