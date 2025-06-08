// src/components/mapa/DibujarRuta.ts
import { useRef } from "react";
import { calcularRutaMasCorta } from "../rutaSegura/rutaSegu";

export function useDibujarRuta(mapInstance: React.MutableRefObject<any>, markers: { lat: number, lng: number }[]) {
  const trazoIdRef = useRef<string | null>(null);

  const dibujarRuta = async () => {
    if (!mapInstance.current || markers.length < 2) return;

    const puntosOrdenados = calcularRutaMasCorta(markers);

    if (trazoIdRef.current) {
      await mapInstance.current.removePolylines([trazoIdRef.current]);
      trazoIdRef.current = null;
    }

    const polylineId = await mapInstance.current.addPolylines([{
      path: puntosOrdenados.map(p => ({ lat: p.lat, lng: p.lng })),
      color: "#2E86DE",
      width: 4
    }]);

    trazoIdRef.current = polylineId[0];
  };

  return { dibujarRuta };
}
