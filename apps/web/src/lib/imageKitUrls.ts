/**
 * ImageKit High-Quality URL Builder for E-Commerce
 * Provides dynamic, responsive, and retina-ready image URL generation
 * without hardcoding rigid limits.
 */

const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "") ||
  "https://ik.imagekit.io/njndeveloper";

export type ImageVariant =
  | "thumb"
  | "card"
  | "gallery"
  | "zoom"
  | "banner"
  | "hero"
  | "avatar";

export type ImageCropMode =
  | "c-at_max"
  | "c-maintain_ratio"
  | "cm-pad_resize"
  | "fo-auto"
  | "c-force";

export interface ImageKitUrlOptions {
  /** Relative path (e.g. "products/sneakers.jpg") or external source URL */
  path: string;
  /** Named layout preset for standard e-commerce UI contexts */
  variant?: ImageVariant;
  /** Explicit width override (takes precedence over preset) */
  customWidth?: number;
  width?: number;
  /** Explicit height override */
  customHeight?: number;
  height?: number;
  /** Compression quality (1-100). Defaults to NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY or 85 */
  quality?: number;
  /** High-DPI / Retina optimization (dpr-2). Defaults to NEXT_PUBLIC_ENABLE_HIGH_DPI */
  highDpi?: boolean;
  /** Custom DPR multiplier (e.g., 1, 2, 3) */
  dpr?: number | string;
  /** ImageKit cropping / fit mode. Defaults to "c-at_max" to preserve aspect ratio without distortion */
  cropMode?: ImageCropMode | string;
  /** Format selection. Defaults to "auto" (WebP / AVIF) */
  format?: "auto" | "webp" | "avif" | "jpeg" | "png" | "origin";
  /** Additional raw ImageKit transformation directives */
  additionalTransforms?: string[];
}

/**
 * Default preset dimensions for e-commerce layouts.
 * Highly configurable and not restrictive.
 */
export const DEFAULT_PRESET_WIDTHS: Record<ImageVariant, number> = {
  thumb: 150,     // Mini-carts, checkout lists, order history items
  card: 500,      // Catalog product cards, collection grids
  gallery: 900,   // Main PDP gallery/carousel hero views
  zoom: 1600,     // Click-to-zoom modals, hover lens inspection
  banner: 1200,   // Category promotion banners
  hero: 1920,     // Storefront homepage hero sections
  avatar: 100,    // Merchant badges, user profile thumbnails
};

/**
 * Builds an optimized ImageKit transformation string based on parameters.
 */
export function buildImageKitTransforms(options: Omit<ImageKitUrlOptions, "path">): string {
  const {
    variant = "card",
    customWidth,
    width,
    customHeight,
    height,
    quality = Number(process.env.NEXT_PUBLIC_DEFAULT_IMAGE_QUALITY) || 85,
    highDpi = process.env.NEXT_PUBLIC_ENABLE_HIGH_DPI !== "false",
    dpr,
    cropMode = "c-at_max",
    format = "auto",
    additionalTransforms = [],
  } = options;

  const targetWidth = width ?? customWidth ?? DEFAULT_PRESET_WIDTHS[variant];
  const targetHeight = height ?? customHeight;

  const transforms: string[] = [];

  if (targetWidth) {
    transforms.push(`w-${targetWidth}`);
  }

  if (targetHeight) {
    transforms.push(`h-${targetHeight}`);
  }

  if (quality) {
    transforms.push(`q-${quality}`);
  }

  if (format && format !== "origin") {
    transforms.push(`f-${format}`);
  }

  if (cropMode) {
    transforms.push(cropMode);
  }

  if (dpr) {
    transforms.push(`dpr-${dpr}`);
  } else if (highDpi) {
    transforms.push("dpr-2");
  }

  if (additionalTransforms.length > 0) {
    transforms.push(...additionalTransforms);
  }

  return `tr=${transforms.join(",")}`;
}

/**
 * Generates an optimized, edge-cached ImageKit URL for any e-commerce asset.
 */
export function getProductImageUrl(options: ImageKitUrlOptions): string {
  const { path } = options;

  if (!path) return "";

  // Bypass inline SVGs and base64 data URLs
  if (path.startsWith("data:") || path.endsWith(".svg")) {
    return path;
  }

  const transformParam = buildImageKitTransforms(options);

  // If no endpoint is configured, return the path as-is
  if (!IMAGEKIT_ENDPOINT) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Case 1: External URL (e.g. Unsplash, S3, Supabase)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    const url = new URL(cleanPath);

    // If it's already an ImageKit URL on this endpoint
    if (url.origin === IMAGEKIT_ENDPOINT) {
      url.searchParams.set("tr", transformParam.replace(/^tr=/, ""));
      return url.toString();
    }

    // Proxy external image via ImageKit
    return `${IMAGEKIT_ENDPOINT}/${cleanPath}?${transformParam}`;
  }

  // Case 2: Relative asset path (stored in database)
  return `${IMAGEKIT_ENDPOINT}/${transformParam}/${cleanPath}`;
}
