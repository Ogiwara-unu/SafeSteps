import { useState, useEffect, useRef } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface LocationState {
  location: Position | null;
  loading: boolean;
  error: string | null;
  countdown: number | null;
}

export const useLocationTracker = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: true,
    error: null,
    countdown: null,
  });
  
  const intervalRef = useRef<number | null>(null);

  const clearIntervals = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getCurrentPosition = async () => {
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
    }
  };

  const startTracking = () => {
    // Limpia intervalos previos
    clearIntervals();
    
    // Obtener posición inicial inmediatamente
    getCurrentPosition();
    
    // Configurar intervalo recurrente cada 5 segundos
    intervalRef.current = window.setInterval(() => {
      getCurrentPosition();
    }, 5000); // 5000 ms = 5 segundos
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
      clearIntervals(); // Limpieza al desmontar
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