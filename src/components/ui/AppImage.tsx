"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK =
  "https://placehold.co/600x400/e2e8f0/1e3a8a?text=No+Image";

type AppImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export default function AppImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  ...props
}: AppImageProps) {
  const resolvedSrc = src && src.trim() ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      unoptimized
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
