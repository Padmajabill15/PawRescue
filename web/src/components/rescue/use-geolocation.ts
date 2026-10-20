"use client";

import { useCallback, useEffect, useState } from "react";

export function useGeolocation(auto = true) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setError("Your browser doesn't support location access");
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("Location blocked. Allow location access, or tap the map to set the spot.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (auto) locate();
  }, [auto, locate]);

  return { coords, setCoords, error, loading, locate };
}
