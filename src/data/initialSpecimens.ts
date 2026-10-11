import { SpecimenRecord } from '../types/specimen';

export const INITIAL_SPECIMENS: SpecimenRecord[] = [
  {
    id: 'cr-bio-2024-8842',
    catalogNumber: 'CAT. CR-BIO-2024-8842',
    scientificName: 'Agalychnis callidryas',
    commonName: 'Rana arborícola de ojos rojos / Red-eyed Treefrog',
    taxonGroup: 'Amphibia',
    realm: 'Neotropical',
    collector: 'Biol. M. Cordero (UCR-MZ)',
    collectionDate: '24 Octubre 2024',
    collectionTime: '21:14 CST',
    institutionCode: 'UCR-MZ',
    curationStatus: 'Verificada',
    darwinCoreSync: true,
    fieldFolio: 'Ficha Folio #42',

    iucnStatus: {
      code: 'LC',
      label: 'Preocupación Menor',
      trend: 'Población Estable',
    },
    citesStatus: {
      appendix: 'Apéndice II',
      distribution: 'Nativa Mesoamericana',
    },

    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Amphibia',
      order: 'Anura',
      family: 'Hylidae',
      genus: 'Agalychnis',
      species: 'callidryas',
      taxonId: '8408',
    },

    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvI7_6fTqgfYbPLKbGn0dFeW7hmnuRolqzd7Q_i2tcUFhIQO5UPw2MQBrfoR_PjDM-c7sqT6CdtQVsyoIP_fnDU9RXrw8NvRVtpA7JOiYHRcmwErrYso4uiDIH7IO1HdniMZq4nm1LM36RywajGzBnMXJI6ZBv8MEGSO_anGlnFjpGLL2LtKkDeBkJ6bAZ8qKDSvDv2NczPj54ygoDcje8UU6V8oi7EG7ddl-wRYqrXNZecg1XCf3y',
    heroImageDescription: 'Scientific macro photograph of a vivid red-eyed treefrog Agalychnis callidryas perched alertly on a dew-covered broad tropical rainforest leaf in Costa Rica at night.',

    bioacoustics: {
      title: 'Canto de Anuncio',
      callType: 'Vocalización Territorial / Reproductiva',
      dominantFrequencyRange: '1.8 - 2.4 kHz',
      durationSeconds: 24,
      audioPatternDescription: '"Chack-chack" gutural monotonal',
    },

    georeference: {
      latitude: 10.47011,
      longitude: -84.01003,
      latitudeDMS: '10°28\'12.4" N',
      longitudeDMS: '84°00\'36.1" W',
      datum: 'WGS84',
      accuracyMeters: 3.2,
      elevationMeters: 68,
      locality: 'Estación La Selva, Sarapiquí',
      province: 'Heredia, Costa Rica',
      conservationArea: 'Área de Conservación Arenal Huetar Norte (ACAHN)',
      lifeZone: 'Bosque Tropical Húmedo (Clasificación bmh-T)',
      microhabitat: 'Estrato arbustivo / Arroyo de aguas lénticas',
    },

    morphometrics: {
      snoutVentLengthMm: 58.0,
      colorationAndAnatomy: 'Coloración dorsal verde esmeralda uniforme con flancos laterales azul cobalto intenso intercalados con barras transversales crema. Discos dactilares ensanchados de color naranja encendido. Pupilas verticales con membrana nictitante dorada finamente reticulada.',
      ethologyAndReproduction: 'Ejemplar macho adulto vocalizando activamente desde el envés de hojas de Heliconia latispatha a una altura de 1.5 m directamente sobre charca temporal de lluvia. Se observó una masa gelatinosa adyacente conteniendo aproximadamente 40 huevos en fase de clivaje temprano, libre de depredación por hormigas o avispas.',
      sympatricSpecies: [
        { scientificName: 'Dendropsophus ebraccatus', commonName: 'Ranita de reloj de arena', count: 4 },
        { scientificName: 'Smilisca phaeota', commonName: 'Rana enmascarada', count: 2 },
      ],
    },

    additionalPhotos: [
      {
        id: 'photo-1',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmGUVTb0cZNrQIy7d2kzAqkjo8reoJH1-m7Jq1KGQViK-JC4o4iBAgurcuMq32V-vTc_Tkm78xKpt_mBTogei0s7FFYCFaWYqs6URyffV2JUPVqp5EKLtRssA_cFs7gAn9UVpmWNnc2KlDkfxv-MF0jCFqXgfwKwt2GsYbhVuOuE9i0rTCa1a9JNYOxgjjbUHiEU9KMNZ0pRDAe7RB90yjf9U8diZY8agcW98GU6r_61NmLaCpSiAP',
        label: 'Ojo / Membrana',
        description: 'Detalle de la membrana nictitante dorada reticulada y pupila vertical.',
      },
      {
        id: 'photo-2',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWYPEJP21tn3z-18PH5l-lWwWdlOM__nDvermYjEeFLEhcol6qtZvDdeMiYtCfXQt8NZtW656h5dpgvF2K2jbHxOGIJ_vLSV--ULUQ3e0AHELKgD-fi6t_k9ELPUpZ1UmNzT-admi_dUeF0QGgw376JnsiQZkE4ON9_xiJ8XcShZZpaKj6FR9k3m_mmBx2hG70MIphlXU5Jjf7W_IUnl6d485BHsD0holxiXCPzFaPOckytC2To3Ni',
        label: 'Puesta de huevos',
        description: 'Masa gelatinosa suspendida sobre charca en envés de Heliconia.',
      },
      {
        id: 'photo-3',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPevRRhkwmXtIv-ZR8N1CwuijTTICb8McP6iwupUax-MB1ufAK9yw3N2-yeVkkfa4QfIzyIDZobiKJ9Jh7ixmmgVXAfNDaVKjcBaM-viuFWCRbQ4KM3WDevfTYCOj2QrUqblhkvw6bO8XlfFvC_kI_oTfL9QgB2N4XCXbPz4r5tIhfblINxiKTPnBWm5F8ye1Qd5sKQ27LWHEXqmB8wfdoxKELv5RnmYXnjoiWixc6sbZghBzdkNeb',
        label: 'Flanco & Patas',
        description: 'Patrones azulados de flanco y discos suctorios anaranjados.',
      },
    ],
  },
  {
    id: 'cr-bio-2024-9104',
    catalogNumber: 'CAT. CR-BIO-2024-9104',
    scientificName: 'Oophaga pumilio',
    commonName: 'Ranita roja y azul / Strawberry Poison Dart Frog (Blue Jeans)',
    taxonGroup: 'Amphibia',
    realm: 'Neotropical',
    collector: 'Dra. K. Solano (INBio-CR)',
    collectionDate: '18 Noviembre 2024',
    collectionTime: '09:45 CST',
    institutionCode: 'INBio-CR',
    curationStatus: 'Verificada',
    darwinCoreSync: true,
    fieldFolio: 'Ficha Folio #58',

    iucnStatus: {
      code: 'LC',
      label: 'Preocupación Menor',
      trend: 'Población Estable',
    },
    citesStatus: {
      appendix: 'Apéndice II',
      distribution: 'Nativa Centroamericana',
    },

    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Amphibia',
      order: 'Anura',
      family: 'Dendrobatidae',
      genus: 'Oophaga',
      species: 'pumilio',
      taxonId: '7753',
    },

    heroImage: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1000&q=80',
    heroImageDescription: 'Morfotipo "Blue Jeans" con cabeza y dorso rojo escarlata vivo y miembros posteriores azul cobalto.',

    bioacoustics: {
      title: 'Canto Territorial Diurno',
      callType: 'Zumbido Estridulante Monótono',
      dominantFrequencyRange: '4.2 - 5.1 kHz',
      durationSeconds: 15,
      audioPatternDescription: 'Chirridos rápidos repetidos "buzz-buzz" de alta frecuencia',
    },

    georeference: {
      latitude: 10.4285,
      longitude: -84.0042,
      latitudeDMS: '10°25\'42.6" N',
      longitudeDMS: '84°00\'15.1" W',
      datum: 'WGS84',
      accuracyMeters: 2.1,
      elevationMeters: 75,
      locality: 'Sendero Cantarrana, Estación La Selva',
      province: 'Heredia, Costa Rica',
      conservationArea: 'Área de Conservación Arenal Huetar Norte (ACAHN)',
      lifeZone: 'Bosque Tropical Lluvioso Primario',
      microhabitat: 'Hojarasca del sotobosque sobre raíces de Ficus',
    },

    morphometrics: {
      snoutVentLengthMm: 22.4,
      colorationAndAnatomy: 'Dorso rojo cinabrio brillante, extremidades azul marino índigo uniforme. Glándulas de secreción cutánea alcaloide (pumiliotoxinas) activas.',
      ethologyAndReproduction: 'Hembra transportando un renacuajo sobre el dorso hacia fitotelmata de bromelia epífita para alimentación ovovivípara.',
      sympatricSpecies: [
        { scientificName: 'Craugastor fitzingeri', commonName: 'Ranita de hojarasca común', count: 3 },
      ],
    },

    additionalPhotos: [],
  },
  {
    id: 'cr-bio-2024-7731',
    catalogNumber: 'CAT. CR-BIO-2024-7731',
    scientificName: 'Pharomachrus mocinno',
    commonName: 'Quetzal resplandeciente / Resplendent Quetzal',
    taxonGroup: 'Aves',
    realm: 'Neotropical',
    collector: 'M.Sc. R. Quesada (UCR-SBO)',
    collectionDate: '05 Diciembre 2024',
    collectionTime: '06:30 CST',
    institutionCode: 'UCR-SBO',
    curationStatus: 'Verificada',
    darwinCoreSync: true,
    fieldFolio: 'Ficha Folio #91',

    iucnStatus: {
      code: 'NT',
      label: 'Casi Amenazado',
      trend: 'Población Decreciente',
    },
    citesStatus: {
      appendix: 'Apéndice I',
      distribution: 'Bosques Nubosos Mesoamericanos',
    },

    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Aves',
      order: 'Trogoniformes',
      family: 'Trogonidae',
      genus: 'Pharomachrus',
      species: 'mocinno',
      taxonId: '554477',
    },

    heroImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1000&q=80',
    heroImageDescription: 'Macho adulto con plumaje dorsal verde iridiscente esmeralda y timoneras caudales supracaudales de 70 cm.',

    bioacoustics: {
      title: 'Vocalización Territorial Matutina',
      callType: 'Silbido Ascendente Melancólico',
      dominantFrequencyRange: '1.2 - 1.8 kHz',
      durationSeconds: 18,
      audioPatternDescription: 'Silbido suave y plañidero "k\'yow-k\'yow" resonando en el dosel',
    },

    georeference: {
      latitude: 9.5532,
      longitude: -83.8051,
      latitudeDMS: '9°33\'11.5" N',
      longitudeDMS: '83°48\'18.4" W',
      datum: 'WGS84',
      accuracyMeters: 4.8,
      elevationMeters: 2210,
      locality: 'Valle de San Gerardo de Dota, Cordillera de Talamanca',
      province: 'San José, Costa Rica',
      conservationArea: 'Área de Conservación Pacífico Central (ACOPAC)',
      lifeZone: 'Bosque Pluvial Montano Bajo (bp-MB)',
      microhabitat: 'Dosel de roble centenario (Quercus costaricensis) con aguacatillos silvestres',
    },

    morphometrics: {
      totalLengthMm: 380,
      weightGrams: 210,
      colorationAndAnatomy: 'Cabeza y pecho verde dorado con destellos turquesa según la incidencia solar. Vientre carmesí escarlata.',
      ethologyAndReproduction: 'Alimentándose de frutos de lauráceas silvestres (Ocotea) y expulsando semillas intactas.',
      sympatricSpecies: [
        { scientificName: 'Aulacorhynchus prasinus', commonName: 'Tucancillo verde montano', count: 2 },
      ],
    },

    additionalPhotos: [],
  },
  {
    id: 'cr-bio-2024-6420',
    catalogNumber: 'CAT. CR-BIO-2024-6420',
    scientificName: 'Morpho peleides',
    commonName: 'Mariposa Morfo azul / Common Morpho',
    taxonGroup: 'Insecta',
    realm: 'Neotropical',
    collector: 'Ing. T. Montero (ACAT-SINAC)',
    collectionDate: '12 Enero 2025',
    collectionTime: '11:15 CST',
    institutionCode: 'SINAC-INV',
    curationStatus: 'Verificada',
    darwinCoreSync: true,
    fieldFolio: 'Ficha Folio #112',

    iucnStatus: {
      code: 'LC',
      label: 'Preocupación Menor',
      trend: 'Población Estable',
    },
    citesStatus: {
      appendix: 'No clasificado',
      distribution: 'Ampliamente distribuida Neotrópico',
    },

    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Arthropoda',
      class: 'Insecta',
      order: 'Lepidoptera',
      family: 'Nymphalidae',
      genus: 'Morpho',
      species: 'peleides',
      taxonId: '12984',
    },

    heroImage: 'https://images.unsplash.com/photo-1551085254-e96b210df58a?auto=format&fit=crop&w=1000&q=80',
    heroImageDescription: 'Macho exhibiendo iridiscencia alar estructural de color azul metálico con rebordes marrón oscuro.',

    georeference: {
      latitude: 10.3025,
      longitude: -84.7958,
      latitudeDMS: '10°18\'09.0" N',
      longitudeDMS: '84°47\'44.9" W',
      datum: 'WGS84',
      accuracyMeters: 5.0,
      elevationMeters: 1440,
      locality: 'Reserva Monteverde, Quebrada Máquina',
      province: 'Puntarenas, Costa Rica',
      conservationArea: 'Área de Conservación Arenal Tempisque (ACAT)',
      lifeZone: 'Bosque Nuboso Premontano Muy Húmedo (bp-PM)',
      microhabitat: 'Borde de sendero soleado con sotobosque denso',
    },

    morphometrics: {
      totalLengthMm: 125,
      colorationAndAnatomy: 'Envergadura de 130 mm. Coloración estructural resultante de interferencia lumínica en nanoescamas alares.',
      ethologyAndReproduction: 'Patrullaje territorial de claros de bosque en busca de frutos en descomposición.',
      sympatricSpecies: [
        { scientificName: 'Heliconius cydno', commonName: 'Mariposa de alas largas', count: 5 },
      ],
    },

    additionalPhotos: [],
  },
  {
    id: 'cr-bio-2025-0199',
    catalogNumber: 'CAT. CR-BIO-2025-0199',
    scientificName: 'Tapirus bairdii',
    commonName: 'Danta centroamericana / Baird\'s Tapir',
    taxonGroup: 'Mammalia',
    realm: 'Neotropical',
    collector: 'Guardaparques ACOSA / SINAC',
    collectionDate: '02 Febrero 2025',
    collectionTime: '17:20 CST',
    institutionCode: 'ACOSA-INV',
    curationStatus: 'Verificada',
    darwinCoreSync: true,
    fieldFolio: 'Ficha Folio #145',

    iucnStatus: {
      code: 'EN',
      label: 'En Peligro de Extinción',
      trend: 'Población Decreciente',
    },
    citesStatus: {
      appendix: 'Apéndice I',
      distribution: 'Bosques Tropicales Mesoamericanos',
    },

    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Mammalia',
      order: 'Perissodactyla',
      family: 'Tapiridae',
      genus: 'Tapirus',
      species: 'bairdii',
      taxonId: '21471',
    },

    heroImage: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1000&q=80',
    heroImageDescription: 'Ejemplar adulto vadeando la desembocadura de Río Claro hacia el estero.',

    georeference: {
      latitude: 8.4809,
      longitude: -83.5901,
      latitudeDMS: '8°28\'51.2" N',
      longitudeDMS: '83°35\'24.4" W',
      datum: 'WGS84',
      accuracyMeters: 6.5,
      elevationMeters: 14,
      locality: 'Estación Sirena, Parque Nacional Corcovado',
      province: 'Puntarenas, Costa Rica',
      conservationArea: 'Área de Conservación Osa (ACOSA)',
      lifeZone: 'Bosque Muy Húmedo Tropical (bmh-T)',
      microhabitat: 'Lecho aluvial de río y bosque costero de cativo',
    },

    morphometrics: {
      weightGrams: 245000,
      totalLengthMm: 1950,
      colorationAndAnatomy: 'Pelaje corto pardo oscuro con garganta y mejillas blanco crema amarillento. Trompa probóscide prensil móvil.',
      ethologyAndReproduction: 'Comportamiento de forrajeo en vegetación ribereña secundaria y baño termorregulador en charca.',
      sympatricSpecies: [
        { scientificName: 'Tayassu pecari', commonName: 'Chancho de monte', count: 18 },
      ],
    },

    additionalPhotos: [],
  },
];
