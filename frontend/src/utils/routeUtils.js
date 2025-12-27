import axios from 'axios';

export const vehicleColors = [
  'oklch(0.6 0.2 20)',   // Kırmızımsı
  'oklch(0.6 0.2 260)',  // Mavimsi
  'oklch(0.6 0.2 140)',  // Yeşilimsi
  'oklch(0.7 0.18 60)',  // Turuncumsu
  'oklch(0.5 0.2 300)'   // Morumsu
];

/**
 * Encoded Polyline string'ini koordinat dizisine çevirir.
 * ES6+ standartlarına göre refactor edilmiştir.
 */
export const decodePolyline = (str, precision) => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  let shift = 0;
  let result = 0;
  let byte = null;
  let latitude_change;
  let longitude_change;
  const factor = Math.pow(10, precision || 5);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = result & 1 ? ~(result >> 1) : result >> 1;

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};

/**
 * OSRM API kullanarak iki nokta veya bir rota dizisi için gerçek yol geometrisini çeker.
 */
export const fetchRealRoute = async (waypoints) => {
  // Waypoints: [[lat, lng], [lat, lng], ...]
  // OSRM formatı: lon,lat;lon,lat
  if (!waypoints || waypoints.length === 0) return [];

  const coordinates = waypoints.map((pt) => `${pt[1]},${pt[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  try {
    const response = await axios.get(url);
    if (response.data.routes && response.data.routes.length > 0) {
      return decodePolyline(response.data.routes[0].geometry);
    }
  } catch (error) {
    console.warn('OSRM Rota alınamadı, düz çizgi kullanılacak.', error);
  }
  return waypoints; // Hata olursa veya sonuç dönmezse düz çizgi (kuş uçuşu) dön
};
