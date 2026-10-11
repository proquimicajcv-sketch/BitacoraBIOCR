export interface CostaRicaHotspot {
  id: string;
  name: string;
  subLocation: string;
  province: string;
  latitude: number;
  longitude: number;
  elevation: number;
  lifeZone: string;
  conservationArea: string;
  description: string;
}

export const COSTA_RICA_CENTER = {
  latitude: 9.7489,
  longitude: -83.7534,
  zoom: 8,
};

export const COSTA_RICA_BOUNDS = {
  north: 11.22,
  south: 8.03,
  west: -85.95,
  east: -82.55,
};

export const CONSERVATION_AREAS_CR = [
  { code: 'ACTo', name: 'Área de Conservación Tortuguero', region: 'Caribe Norte' },
  { code: 'ACAHN', name: 'Área de Conservación Arenal Huetar Norte', region: 'Norte' },
  { code: 'ACC', name: 'Área de Conservación Cordillera Central', region: 'Valle Central / Volcanes' },
  { code: 'ACAT', name: 'Área de Conservación Arenal Tempisque', region: 'Arenal / Guanacaste' },
  { code: 'ACOPAC', name: 'Área de Conservación Pacífico Central', region: 'Pacífico Central' },
  { code: 'ACOSA', name: 'Área de Conservación Osa', region: 'Pacífico Sur / Osa' },
  { code: 'ACLAC', name: 'Área de Conservación La Amistad Caribe', region: 'Talamanca / Limón' },
  { code: 'ACLAP', name: 'Área de Conservación La Amistad Pacífico', region: 'Talamanca / Buenos Aires' },
  { code: 'ACT', name: 'Área de Conservación Tempisque', region: 'Península de Nicoya' },
  { code: 'ACG', name: 'Área de Conservación Guanacaste', region: 'Santa Rosa / Rincón' },
];

export const COSTA_RICA_HOTSPOTS: CostaRicaHotspot[] = [
  {
    id: 'la-selva',
    name: 'Estación Biológica La Selva',
    subLocation: 'Sarapiquí, Heredia',
    province: 'Heredia',
    latitude: 10.4304,
    longitude: -84.0095,
    elevation: 68,
    lifeZone: 'Bosque Tropical Húmedo (bmh-T)',
    conservationArea: 'Área de Conservación Arenal Huetar Norte (ACAHN)',
    description: 'Estación de la OET líder mundial en investigación de ecología tropical de tierras bajas del Caribe.',
  },
  {
    id: 'monteverde',
    name: 'Reserva Biológica Bosque Nuboso Monteverde',
    subLocation: 'Sierra de Tilarán, Puntarenas',
    province: 'Puntarenas',
    latitude: 10.3025,
    longitude: -84.7958,
    elevation: 1440,
    lifeZone: 'Bosque Nuboso Premontano Muy Húmedo (bp-PM)',
    conservationArea: 'Área de Conservación Arenal Tempisque (ACAT)',
    description: 'Santuario de epífitas, anfibios de montaña y hábitat primordial del Quetzal resplandeciente.',
  },
  {
    id: 'corcovado-sirena',
    name: 'Estación Sirena, Parque Nacional Corcovado',
    subLocation: 'Península de Osa, Puntarenas',
    province: 'Puntarenas',
    latitude: 8.4809,
    longitude: -83.5901,
    elevation: 12,
    lifeZone: 'Bosque Tropical Muy Húmedo (bmh-T)',
    conservationArea: 'Área de Conservación Osa (ACOSA)',
    description: 'Considerado el lugar biológicamente más intenso del planeta según National Geographic.',
  },
  {
    id: 'tortuguero',
    name: 'Parque Nacional Tortuguero',
    subLocation: 'Canales de Tortuguero, Limón',
    province: 'Limón',
    latitude: 10.5414,
    longitude: -83.5042,
    elevation: 5,
    lifeZone: 'Bosque Húmedo Tropical / Humedales Costeros',
    conservationArea: 'Área de Conservación Tortuguero (ACTo)',
    description: 'Sistema laberíntico de canales fluviales y sitio primario de anidación de tortugas verdes.',
  },
  {
    id: 'san-gerardo-dota',
    name: 'Valle de San Gerardo de Dota / Los Quetzales',
    subLocation: 'Cordillera de Talamanca, San José',
    province: 'San José',
    latitude: 9.5532,
    longitude: -83.8051,
    elevation: 2200,
    lifeZone: 'Bosque Pluvial Montano Bajo (bp-MB)',
    conservationArea: 'Área de Conservación Pacífico Central (ACOPAC)',
    description: 'Valle de robledales de alta montaña cubierto de musgos y bromelias.',
  },
  {
    id: 'manuel-antonio',
    name: 'Parque Nacional Manuel Antonio',
    subLocation: 'Quepos, Puntarenas',
    province: 'Puntarenas',
    latitude: 9.3892,
    longitude: -84.1432,
    elevation: 25,
    lifeZone: 'Bosque Tropical Húmedo Transición a Seco',
    conservationArea: 'Área de Conservación Pacífico Central (ACOPAC)',
    description: 'Interfase bosque lluvioso y arrecifes costeros con alta densidad de monos y perezosos.',
  },
  {
    id: 'cahuita',
    name: 'Parque Nacional Cahuita',
    subLocation: 'Talamanca, Limón',
    province: 'Limón',
    latitude: 9.7368,
    longitude: -82.8427,
    elevation: 4,
    lifeZone: 'Bosque Costero Tropical Húmedo',
    conservationArea: 'Área de Conservación La Amistad Caribe (ACLAC)',
    description: 'Pantano de manglar y arrecifes coralinos vivos en el Caribe Sur.',
  },
  {
    id: 'volcan-poas',
    name: 'Parque Nacional Volcán Poás',
    subLocation: 'Alajuela, Cordillera Volcánica Central',
    province: 'Alajuela',
    latitude: 10.1983,
    longitude: -84.2306,
    elevation: 2708,
    lifeZone: 'Bosque Muy Húmedo Montano (bmh-M)',
    conservationArea: 'Área de Conservación Cordillera Central (ACC)',
    description: 'Bosque achaparrado enano y cráter activo con fumarolas de azufre.',
  },
  {
    id: 'palo-verde',
    name: 'Parque Nacional Palo Verde',
    subLocation: 'Cuenca Baja Río Tempisque, Guanacaste',
    province: 'Guanacaste',
    latitude: 10.3541,
    longitude: -85.3488,
    elevation: 10,
    lifeZone: 'Bosque Tropical Seco (bs-T)',
    conservationArea: 'Área de Conservación Arenal Tempisque (ACAT)',
    description: 'Humedal de importancia Ramsar vital para cientos de especies de aves migratorias y acuáticas.',
  },
];

/**
 * Converts decimal coordinates to scientific Degrees Minutes Seconds (DMS) string
 */
export function formatCoordinatesDMS(lat: number, lng: number): { latDMS: string; lngDMS: string; combined: string } {
  const formatDMS = (value: number, isLat: boolean): string => {
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    const direction = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
  };

  const latDMS = formatDMS(lat, true);
  const lngDMS = formatDMS(lng, false);

  return {
    latDMS,
    lngDMS,
    combined: `${latDMS}, ${lngDMS}`,
  };
}

/**
 * Checks if a coordinate is within Costa Rica geographical bounds
 */
export function isWithinCostaRica(lat: number, lng: number): boolean {
  return (
    lat >= COSTA_RICA_BOUNDS.south &&
    lat <= COSTA_RICA_BOUNDS.north &&
    lng >= COSTA_RICA_BOUNDS.west &&
    lng <= COSTA_RICA_BOUNDS.east
  );
}

/**
 * Finds the nearest Costa Rican biological station / hotspot for a coordinate
 */
export function findNearestHotspot(lat: number, lng: number): CostaRicaHotspot {
  let minDistance = Infinity;
  let nearest = COSTA_RICA_HOTSPOTS[0];

  for (const hotspot of COSTA_RICA_HOTSPOTS) {
    const dLat = hotspot.latitude - lat;
    const dLng = hotspot.longitude - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = hotspot;
    }
  }

  return nearest;
}
