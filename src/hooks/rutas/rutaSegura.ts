import polyline from "polyline";

// crearRutaSegura.ts
import { Http } from '@capacitor-community/http';



export async function crearRutaSegura(puntos: { lat: number; lng: number }[]): Promise<string | null> {
 
 
 params: undefined 
 
  if (puntos.length < 2) return null;


  // Construye la URL manualmente para evitar el bug
  const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  const params  = new URLSearchParams({
    origin: `${puntos[0].lat},${puntos[0].lng}`,
    destination: `${puntos[puntos.length-1].lat},${puntos[puntos.length-1].lng}`,
    mode: 'walking',
    key: 'AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM'
  });



  
  if (puntos.length > 2) {
    params.append('waypoints', puntos.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|'));
  }

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await Http.request({
      method: 'GET',
      url: url,
      headers: {
        'Accept': 'application/json'
      },
      params: {}
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    
    const data = response.data;

    
    if (data.status !== 'OK') {
  console.error('API Error:', data.error_message || data.status);
  return null;
}
    
    if (data.status !== 'OK') {
      console.error('API Error:', data.error_message || data.status);
      return null;
    }

    return data.routes[0]?.overview_polyline?.points || null;
  } catch (error) {
    console.error('Full error:', error);
    return null;
  }
}
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const puntos = polyline.decode(encoded);
  return puntos.map(([lat, lng]) => ({ lat, lng }));
}
