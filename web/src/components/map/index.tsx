"use client";

import dynamic from "next/dynamic";

const Loading = () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" />;

export const PickerMap = dynamic(() => import("./leaflet-map").then((m) => m.PickerMap), {
  ssr: false,
  loading: Loading,
});
export const MarkersMap = dynamic(() => import("./leaflet-map").then((m) => m.MarkersMap), {
  ssr: false,
  loading: Loading,
});
export type { MapMarker } from "./leaflet-map";
