// src/components/rutas/rutaSegura.ts

// Calcula la ruta más corta (basado en el algoritmo del vecino más cercano)
export function calcularRutaMasCorta(puntos: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (puntos.length < 2) return puntos;

  const visitados: boolean[] = new Array(puntos.length).fill(false);
  const ruta: { lat: number; lng: number }[] = [];

  let actual = 0;
  ruta.push(puntos[actual]);
  visitados[actual] = true;

  for (let i = 1; i < puntos.length; i++) {
    let siguiente = -1;
    let distanciaMin = Infinity;

    for (let j = 0; j < puntos.length; j++) {
      if (!visitados[j]) {
        const dx = puntos[actual].lat - puntos[j].lat;
        const dy = puntos[actual].lng - puntos[j].lng;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < distanciaMin) {
          distanciaMin = distancia;
          siguiente = j;
        }
      }
    }

    if (siguiente !== -1) {
      actual = siguiente;
      visitados[actual] = true;
      ruta.push(puntos[actual]);
    }
  }

  return ruta;
}
