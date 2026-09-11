import { useCallback, useState } from "react";

interface GeoState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ lat: null, lng: null, loading: false, error: null });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation is not supported by this browser" }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { ...state, locate, setManual: (lat: number, lng: number) => setState({ lat, lng, loading: false, error: null }) };
}
