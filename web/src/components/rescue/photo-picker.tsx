"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useMemo } from "react";

export function PhotoPicker({
  files,
  onChange,
  max = 5,
  required = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
  required?: boolean;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {previews.map((src, i) => (
        <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => onChange(files.filter((_, j) => j !== i))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {files.length < max && (
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Camera className="h-6 w-6" />
          {files.length ? "Add more" : required ? "Add photo *" : "Add photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            className="sr-only"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              onChange([...files, ...picked].slice(0, max));
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
