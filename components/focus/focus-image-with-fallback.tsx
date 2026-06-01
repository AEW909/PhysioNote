"use client";

import { useState } from "react";

type FocusImageWithFallbackProps = {
  alt: string;
  className?: string;
  fallbackSrc?: string | null;
  src: string;
};

export function FocusImageWithFallback({
  alt,
  className,
  fallbackSrc,
  src,
}: FocusImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      alt={alt}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      src={currentSrc}
    />
  );
}
