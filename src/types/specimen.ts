export type TaxonGroup = 'Amphibia' | 'Aves' | 'Reptilia' | 'Mammalia' | 'Insecta' | 'Plantae';

export interface TaxonomicHierarchy {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  taxonId?: string;
}

export interface Georeference {
  latitude: number;
  longitude: number;
  latitudeDMS: string;
  longitudeDMS: string;
  datum: 'WGS84';
  accuracyMeters: number;
  elevationMeters: number;
  locality: string;
  canton?: string;
  province: string;
  conservationArea: string; // SINAC: e.g. Área de Conservación Huetar Norte
  lifeZone: string; // Holdridge: e.g. Bosque Tropical Húmedo (bmh-T)
  microhabitat: string;
}

export interface SympatricSpecies {
  scientificName: string;
  commonName: string;
  count: number;
}

export interface Morphometrics {
  snoutVentLengthMm?: number; // LHC
  totalLengthMm?: number;
  weightGrams?: number;
  colorationAndAnatomy: string;
  ethologyAndReproduction: string;
  courtshipAndMating?: string; // Cortejo, rituales nupciales y selección sexual
  interspecificRelations?: string; // Relaciones intra/interespecíficas, territorialidad, depredación, defensas/toxinas
  confirmedScientificData?: string; // Datos de investigación científica confirmada (UCR/OET/SINAC/literatura)
  sympatricSpecies: SympatricSpecies[];
}

export interface BioacousticRecord {
  title: string;
  callType: string;
  dominantFrequencyRange: string;
  durationSeconds: number;
  audioPatternDescription: string;
  audioFileUrl?: string;
  audioDataUrl?: string; // Base64 data URL for recorded microphone audio or uploaded MP3/WAV
}

export interface PhotoRecord {
  id: string;
  url: string;
  label: string;
  description: string;
}

export interface SightingEntry {
  id: string;
  timestamp: string; // e.g. 2026-10-10 21:15 CST
  date: string;
  observer: string;
  locality: string;
  coordinates?: string;
  count: number;
  microhabitat?: string;
  weather?: string;
  temperatureC?: number;
  behaviorObserved: string;
  photoUrls?: string[];
  notes?: string;
}

export interface SpecimenRecord {
  id: string;
  catalogNumber: string; // e.g. CAT. CR-BIO-2024-8842
  scientificName: string;
  commonName: string;
  taxonGroup: TaxonGroup;
  realm: string; // e.g. Neotropical
  collector: string;
  collectionDate: string; // e.g. 2024-10-24
  collectionTime: string; // e.g. 21:14 CST
  institutionCode: string; // e.g. UCR-MZ
  curationStatus: 'Verificada' | 'Pendiente' | 'En Revisión';
  darwinCoreSync: boolean;
  
  iucnStatus: {
    code: 'LC' | 'NT' | 'VU' | 'EN' | 'CR';
    label: string;
    trend: string;
  };
  citesStatus: {
    appendix: string; // e.g. Apéndice II
    distribution: string; // e.g. Nativa Mesoamericana
  };

  taxonomy: TaxonomicHierarchy;
  heroImage: string;
  heroImageDescription: string;
  bioacoustics?: BioacousticRecord;
  georeference: Georeference;
  morphometrics: Morphometrics;
  additionalPhotos: PhotoRecord[];
  sightings?: SightingEntry[];
  fieldFolio: string;
  notes?: string;
}
