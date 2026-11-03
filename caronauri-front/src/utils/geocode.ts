export const KNOWN_LOCATIONS: Record<string, { latitude: number; longitude: number }> = {
  'URI — Erechim': { latitude: -27.6344, longitude: -52.2682 },
  'Centro — Erechim': { latitude: -27.6390, longitude: -52.2700 },
  'Bela Vista — Erechim': { latitude: -27.6375, longitude: -52.2655 },
  'Rodoviária — Erechim': { latitude: -27.6330, longitude: -52.2750 },
  'Praça da Bandeira — Erechim': { latitude: -27.6360, longitude: -52.2690 },
  'Jardim América — Erechim': { latitude: -27.6315, longitude: -52.2665 },
  'Santo Antônio — Erechim': { latitude: -27.6385, longitude: -52.2670 },
};

export function lookupCoords(query: string) {
  if (!query) return null;
  const q = query.toLowerCase();
  // exact match
  for (const key of Object.keys(KNOWN_LOCATIONS)) {
    if (key.toLowerCase() === q) return KNOWN_LOCATIONS[key];
  }
  // contains match
  for (const key of Object.keys(KNOWN_LOCATIONS)) {
    if (q.includes(key.toLowerCase()) || key.toLowerCase().includes(q)) return KNOWN_LOCATIONS[key];
  }
  // fallback: look for known name tokens
  for (const key of Object.keys(KNOWN_LOCATIONS)) {
    const token = key.split(' — ')[0].toLowerCase();
    if (q.includes(token)) return KNOWN_LOCATIONS[key];
  }
  return null;
}

  // Tentativa simples de reverse-geocoding usando pontos conhecidos.
export async function reverseLookupCoords(
  latitude: number,
  longitude: number
): Promise<{
  name?: string;
  street?: string;
  address?: string;
  formattedAddress?: string;
}> {
  try {
    const response = await fetch(
      `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ${response.status}`
      );
    }

    const data = await response.json();

    const place =
      data?.features?.[0]?.properties;

    if (!place) {
      return {
        formattedAddress:
          'Local selecionado',
      };
    }

    const road =
      place.street ||
      place.name;

    const neighbourhood =
      place.district ||
      place.suburb;

    const city =
      place.city ||
      place.county ||
      place.state;

    const formattedAddress = [
      road,
      neighbourhood,
      city,
    ]
      .filter(Boolean)
      .join(' - ');

    return {
      name: place.name,
      street: road,
      address: neighbourhood,
      formattedAddress:
        formattedAddress ||
        'Local selecionado',
    };
  } catch (error) {
    console.error(
      'Erro no reverse geocode:',
      error
    );

    return {
      formattedAddress:
        'Local selecionado',
    };
  }
}
// Pontos de interesse (POIs) mock para seleção no mapa
export const POIS: Array<{
  id: string;
  name: string;
  category: string;
  address?: string;
  latitude: number;
  longitude: number;
}> = [
  { id: 'p1', name: 'Mercado Central', category: 'Mercado', address: 'R. 7 de Setembro, 123', latitude: -27.6350, longitude: -52.2688 },
  { id: 'p2', name: 'Supermercado Erechim', category: 'Mercado', address: 'Av. Sete de Setembro, 45', latitude: -27.6340, longitude: -52.2692 },
  { id: 'p3', name: 'Farmácia Popular', category: 'Loja', address: 'R. Bento Gonçalves, 200', latitude: -27.6362, longitude: -52.2695 },
  { id: 'p4', name: 'Loja do Bairro', category: 'Loja', address: 'R. Benjamin Constant, 88', latitude: -27.6335, longitude: -52.2668 },
  { id: 'p5', name: 'Hospital Municipal', category: 'Hospital', address: 'Av. dos Municípios, 10', latitude: -27.6380, longitude: -52.2710 },
];

export function findNearbyPOIs(center: { latitude: number; longitude: number }, radiusKm = 5) {
  if (!center) return [];
  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  return POIS.filter((p) => haversine(center.latitude, center.longitude, p.latitude, p.longitude) <= radiusKm);
}

export async function searchPlaces(
  query: string
) {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        query
      )}&limit=8`
    );

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return (
      data?.features?.map(
        (
          item: any,
          index: number
        ) => ({
          id:
            item.properties.osm_id ??
            index,

          name:
            item.properties.name ||
            item.properties.street ||
            'Local',

          address: [
            item.properties.street,
            item.properties.city,
            item.properties.state,
          ]
            .filter(Boolean)
            .join(' - '),

          category:
            item.properties.osm_value ||
            'place',

          latitude:
            item.geometry.coordinates[1],

          longitude:
            item.geometry.coordinates[0],
        })
      ) || []
    );
  } catch (err) {
    console.log(
      'Erro ao buscar local:',
      err
    );

    return [];
  }
}