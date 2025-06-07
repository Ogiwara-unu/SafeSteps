import { useState, useEffect, useRef } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface LocationState {
  location: Position | null;
  loading: boolean;
  error: string | null;
}

export const useLocationTracker = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: true,
    error: null,
  });

  const intervalRef = useRef<number | null>(null);
  const isFetching = useRef(false);

  const clearIntervals = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getCurrentPosition = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setState(prev => ({
        ...prev,
        loading: false,
        location: position
      }));

      return position;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Error getting location: ${error instanceof Error ? error.message : String(error)}`
      }));
      throw error;
    } finally {
      isFetching.current = false;
    }
  };

  const startTracking = () => {
    clearIntervals();
    getCurrentPosition();
    intervalRef.current = window.setInterval(() => {
      getCurrentPosition();
    }, 5000);
  };

  const stopTracking = () => {
    clearIntervals();
  };

  const requestPermissions = async () => {
    try {
      const permissionStatus = await Geolocation.requestPermissions();
      return permissionStatus;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Error requesting permissions: ${error instanceof Error ? error.message : String(error)}`
      }));
      return null;
    }
  };

  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPermissions,
    getCurrentPosition,
  };
};