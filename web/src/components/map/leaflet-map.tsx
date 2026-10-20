"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  tone?: "primary" | "danger" | "ngo";
  href?: string;
}

const COLORS = { primary: "#16786d", danger: "#e5482f", ngo: "#ea7c28" };

const pin = (tone: keyof typeof COLORS = "primary") =>
  L.divIcon({
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 40 14 40s14-15.7 14-26.1C28 6.2 21.7 0 14 0z" fill="${COLORS[tone]}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`,
  });

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 1) map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40], maxZoom: 15 });
  }, [markers, map]);
  return null;
}

function ClickToMove({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

const TILE = (
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
);

export function PickerMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full" scrollWheelZoom>
      {TILE}
      <Recenter lat={lat} lng={lng} />
      <ClickToMove onPick={onChange} />
      <Marker
        position={[lat, lng]}
        icon={pin("danger")}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const p = (e.target as L.Marker).getLatLng();
            onChange(p.lat, p.lng);
          },
        }}
      />
    </MapContainer>
  );
}

export function MarkersMap({ markers, center }: { markers: MapMarker[]; center?: [number, number] }) {
  const c = center ?? (markers[0] ? ([markers[0].lat, markers[0].lng] as [number, number]) : [20.59, 78.96]);
  return (
    <MapContainer center={c} zoom={markers.length ? 13 : 5} className="h-full w-full" scrollWheelZoom={false}>
      {TILE}
      <FitBounds markers={markers} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={pin(m.tone)}>
          {m.label && (
            <Popup>
              {m.href ? (
                <a href={m.href} className="font-medium">
                  {m.label}
                </a>
              ) : (
                m.label
              )}
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  href?: string;
}

/** Many small dots (analytics). Colors come from CSS vars resolved by the caller. */
export function PointsMap({ points }: { points: MapPoint[] }) {
  const c: [number, number] = points[0] ? [points[0].lat, points[0].lng] : [14.5, 76.0];
  return (
    <MapContainer center={c} zoom={7} className="h-full w-full" scrollWheelZoom={false} preferCanvas>
      {TILE}
      <FitBounds markers={points.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng }))} />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={6}
          pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: p.color, fillOpacity: 0.85 }}
        >
          <Popup>{p.href ? <a href={p.href}>{p.label}</a> : p.label}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
