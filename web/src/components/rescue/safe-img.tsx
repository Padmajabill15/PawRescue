"use client";

import { useState, type ReactNode } from "react";

/** <img> that swaps to a fallback when the file is missing (e.g. photos stored on another machine). */
export function SafeImg({ src, alt = "", className, fallback = null }: { src: string; alt?: string; className?: string; fallback?: ReactNode }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}
