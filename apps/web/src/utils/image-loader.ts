interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cdnImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_HOST || "https://res.cloudinary.com/naicbd/image/upload";
    return `${cdnBase}/w_${width},q_${quality || 75},f_auto/${encodeURIComponent(src)}`;
  }

  return `${src}?w=${width}&q=${quality || 75}`;
}
