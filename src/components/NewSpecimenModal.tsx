import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SpecimenRecord, TaxonGroup } from '../types/specimen';
import { CostaRicaMap } from './CostaRicaMap';
import {
  COSTA_RICA_HOTSPOTS,
  formatCoordinatesDMS,
  findNearestHotspot,
} from '../data/costaRicaData';

interface NewSpecimenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (specimen: SpecimenRecord) => void;
  initialCoords?: { lat: number; lng: number; locality?: string; lifeZone?: string };
  editingSpecimen?: SpecimenRecord | null;
}

const SAMPLE_FIELD_IMAGES = [
  {
    name: 'Rana Ojos Rojos (Sarapiquí)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvI7_6fTqgfYbPLKbGn0dFeW7hmnuRolqzd7Q_i2tcUFhIQO5UPw2MQBrfoR_PjDM-c7sqT6CdtQVsyoIP_fnDU9RXrw8NvRVtpA7JOiYHRcmwErrYso4uiDIH7IO1HdniMZq4nm1LM36RywajGzBnMXJI6ZBv8MEGSO_anGlnFjpGLL2LtKkDeBkJ6bAZ8qKDSvDv2NczPj54ygoDcje8UU6V8oi7EG7ddl-wRYqrXNZecg1XCf3y',
  },
  {
    name: 'Ranita Blue Jeans (La Selva)',
    url: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Quetzal (Talamanca)',
    url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Mariposa Morfo (Monteverde)',
    url: 'https://images.unsplash.com/photo-1551085254-e96b210df58a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Terciopelo (Caribe)',
    url: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Danta / Tapir (Corcovado)',
    url: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1000&q=80',
  },
];

export const NewSpecimenModal: React.FC<NewSpecimenModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCoords,
  editingSpecimen,
}) => {
  if (!isOpen) return null;

  // Online / Offline GPS Mode State
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(true);

  // Initial Coordinates
  const defaultLat = initialCoords?.lat || editingSpecimen?.georeference.latitude || 10.4304;
  const defaultLng = initialCoords?.lng || editingSpecimen?.georeference.longitude || -84.0095;

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [locality, setLocality] = useState(
    initialCoords?.locality || editingSpecimen?.georeference.locality || 'Estación Biológica La Selva, Sarapiquí'
  );
  const [province, setProvince] = useState(
    editingSpecimen?.georeference.province || 'Heredia, Costa Rica'
  );
  const [elevation, setElevation] = useState<number>(
    editingSpecimen?.georeference.elevationMeters || 68
  );
  const [lifeZone, setLifeZone] = useState(
    initialCoords?.lifeZone ||
      editingSpecimen?.georeference.lifeZone ||
      'Bosque Tropical Húmedo (bmh-T)'
  );
  const [microhabitat, setMicrohabitat] = useState(
    editingSpecimen?.georeference.microhabitat || 'Estrato arbustivo / Arroyo de aguas lénticas'
  );

  // Scientific taxonomy form state
  const [scientificName, setScientificName] = useState(
    editingSpecimen?.scientificName || 'Agalychnis callidryas'
  );
  const [commonName, setCommonName] = useState(
    editingSpecimen?.commonName || 'Rana arborícola de ojos rojos'
  );
  const [taxonGroup, setTaxonGroup] = useState<TaxonGroup>(
    editingSpecimen?.taxonGroup || 'Amphibia'
  );
  const [genus, setGenus] = useState(editingSpecimen?.taxonomy.genus || 'Agalychnis');
  const [family, setFamily] = useState(editingSpecimen?.taxonomy.family || 'Hylidae');
  const [collector, setCollector] = useState(
    editingSpecimen?.collector || 'Biol. M. Cordero (UCR-MZ)'
  );
  const [heroImage, setHeroImage] = useState(
    editingSpecimen?.heroImage ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvI7_6fTqgfYbPLKbGn0dFeW7hmnuRolqzd7Q_i2tcUFhIQO5UPw2MQBrfoR_PjDM-c7sqT6CdtQVsyoIP_fnDU9RXrw8NvRVtpA7JOiYHRcmwErrYso4uiDIH7IO1HdniMZq4nm1LM36RywajGzBnMXJI6ZBv8MEGSO_anGlnFjpGLL2LtKkDeBkJ6bAZ8qKDSvDv2NczPj54ygoDcje8UU6V8oi7EG7ddl-wRYqrXNZecg1XCf3y'
  );
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [lhcMm, setLhcMm] = useState<number>(
    editingSpecimen?.morphometrics.snoutVentLengthMm || 58.0
  );
  const [colorationNotes, setColorationNotes] = useState(
    editingSpecimen?.morphometrics.colorationAndAnatomy ||
      'Coloración dorsal verde esmeralda con flancos azul cobalto y barras crema. Discos dactilares naranja.'
  );
  const [ethologyNotes, setEthologyNotes] = useState(
    editingSpecimen?.morphometrics.ethologyAndReproduction ||
      'Vocalizando en envés de hoja de Heliconia sobre charca temporal. Masa de huevos observada.'
  );

  // AI Recognition State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiSuccessFeedback, setAiSuccessFeedback] = useState<{
    confidence: number;
    rationale: string;
    species: string;
    common: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Coords change handler from the interactive map
  const handleCoordsChange = (newCoords: { lat: number; lng: number; dms: string }) => {
    setCoords({ lat: newCoords.lat, lng: newCoords.lng });
    const nearest = findNearestHotspot(newCoords.lat, newCoords.lng);
    setLocality(nearest.name);
    setProvince(`${nearest.province}, Costa Rica`);
    setElevation(nearest.elevation);
    setLifeZone(nearest.lifeZone);
  };

  // File Upload Handler (camera / gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedBase64(result);
      setHeroImage(result);
      setAiSuccessFeedback(null);
      setAiError(null);
    };
    reader.readAsDataURL(file);
  };

  // AI SPECIES RECOGNITION AND SCIENTIFIC AUTO-FILL
  const handleIdentifyWithAI = async () => {
    if (!heroImage && !uploadedBase64) {
      setAiError('Por favor seleccione o cargue una fotografía primero.');
      return;
    }

    setIsAnalyzingAI(true);
    setAiError(null);
    setAiSuccessFeedback(null);

    try {
      const response = await fetch('/api/ai/identify-specimen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedBase64 ? undefined : heroImage,
          imageBase64: uploadedBase64 || undefined,
          locationHint: `${locality}, ${province}`,
          userNotes: `${colorationNotes} ${ethologyNotes}`,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'No se pudo identificar la especie en la fotografía.');
      }

      const data = result.data;

      // Populate scientific fields
      if (data.scientificName) setScientificName(data.scientificName);
      if (data.commonName) setCommonName(data.commonName);
      if (data.taxonGroup) setTaxonGroup(data.taxonGroup as TaxonGroup);
      if (data.taxonomy?.genus) setGenus(data.taxonomy.genus);
      if (data.taxonomy?.family) setFamily(data.taxonomy.family);

      // Morphometrics
      if (data.morphometrics?.snoutVentLengthMm) {
        setLhcMm(data.morphometrics.snoutVentLengthMm);
      } else if (data.morphometrics?.totalLengthMm) {
        setLhcMm(data.morphometrics.totalLengthMm);
      }

      if (data.morphometrics?.colorationAndAnatomy) {
        setColorationNotes(data.morphometrics.colorationAndAnatomy);
      }

      if (data.morphometrics?.ethologyAndReproduction) {
        setEthologyNotes(data.morphometrics.ethologyAndReproduction);
      }

      // Ecological Habitat
      if (data.suggestedHabitat?.lifeZone) {
        setLifeZone(data.suggestedHabitat.lifeZone);
      }
      if (data.suggestedHabitat?.microhabitat) {
        setMicrohabitat(data.suggestedHabitat.microhabitat);
      }
      if (data.suggestedHabitat?.elevationMeters) {
        setElevation(data.suggestedHabitat.elevationMeters);
      }

      setAiSuccessFeedback({
        confidence: data.confidenceScore || 0.95,
        rationale: data.identificationRationale || 'Identificación validada taxonómicamente por morfología foliar/cutánea.',
        species: data.scientificName,
        common: data.commonName,
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#006c49', '#6cf8bb', '#002217', '#e48015'],
        });
      } catch {
        // Ignore if confetti not supported
      }
    } catch (err: any) {
      console.error('Error en reconocimiento IA:', err);
      setAiError(err.message || 'Error al comunicarse con el servicio de IA taxonómica.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dms = formatCoordinatesDMS(coords.lat, coords.lng);
    const nearest = findNearestHotspot(coords.lat, coords.lng);

    const newRecord: SpecimenRecord = {
      id: editingSpecimen?.id || `cr-bio-${Date.now().toString().slice(-4)}`,
      catalogNumber:
        editingSpecimen?.catalogNumber ||
        `CAT. CR-BIO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      scientificName,
      commonName,
      taxonGroup,
      realm: 'Neotropical',
      collector,
      collectionDate:
        editingSpecimen?.collectionDate ||
        new Date().toLocaleDateString('es-CR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      collectionTime:
        editingSpecimen?.collectionTime ||
        `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} CST`,
      institutionCode: 'UCR-MZ',
      curationStatus: 'Verificada',
      darwinCoreSync: true,
      fieldFolio: editingSpecimen?.fieldFolio || `Ficha Folio #${Math.floor(10 + Math.random() * 90)}`,

      iucnStatus: editingSpecimen?.iucnStatus || {
        code: 'LC',
        label: 'Preocupación Menor',
        trend: 'Población Estable',
      },
      citesStatus: editingSpecimen?.citesStatus || {
        appendix: 'Apéndice II',
        distribution: 'Nativa Mesoamericana',
      },

      taxonomy: {
        kingdom: 'Animalia',
        phylum: 'Chordata',
        class: taxonGroup,
        order: 'Anura',
        family,
        genus,
        species: scientificName.split(' ')[1] || 'sp.',
        taxonId: editingSpecimen?.taxonomy.taxonId || '8408',
      },

      heroImage,
      heroImageDescription: `Espécimen de campo de ${scientificName} registrado en ${locality}.`,

      bioacoustics: {
        title: 'Canto de Anuncio',
        callType: 'Vocalización Territorial',
        dominantFrequencyRange: '1.8 - 2.4 kHz',
        durationSeconds: 24,
        audioPatternDescription: '"Chack-chack" gutural monotonal',
      },

      georeference: {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDMS: dms.latDMS,
        longitudeDMS: dms.lngDMS,
        datum: 'WGS84',
        accuracyMeters: isOnlineMode ? 3.2 : 12.0,
        elevationMeters: elevation,
        locality,
        province,
        conservationArea: nearest.conservationArea,
        lifeZone,
        microhabitat,
      },

      morphometrics: {
        snoutVentLengthMm: Number(lhcMm) || 58.0,
        colorationAndAnatomy: colorationNotes,
        ethologyAndReproduction: ethologyNotes,
        sympatricSpecies: editingSpecimen?.morphometrics.sympatricSpecies || [
          { scientificName: 'Dendropsophus ebraccatus', commonName: 'Ranita reloj de arena', count: 3 },
        ],
      },

      additionalPhotos: editingSpecimen?.additionalPhotos || [
        {
          id: 'p1',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmGUVTb0cZNrQIy7d2kzAqkjo8reoJH1-m7Jq1KGQViK-JC4o4iBAgurcuMq32V-vTc_Tkm78xKpt_mBTogei0s7FFYCFaWYqs6URyffV2JUPVqp5EKLtRssA_cFs7gAn9UVpmWNnc2KlDkfxv-MF0jCFqXgfwKwt2GsYbhVuOuE9i0rTCa1a9JNYOxgjjbUHiEU9KMNZ0pRDAe7RB90yjf9U8diZY8agcW98GU6r_61NmLaCpSiAP',
          label: 'Ojo / Membrana',
          description: 'Detalle de la membrana nictitante dorada.',
        },
      ],
    };

    onSave(newRecord);
    onClose();
  };

  const coordsDMS = formatCoordinatesDMS(coords.lat, coords.lng);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-[#f8faf4] rounded-2xl shadow-2xl border border-[#c1c8c3] overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#002217] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6cf8bb] text-[24px]">edit_note</span>
            <div>
              <h2 className="font-bold text-[17px] leading-tight">
                {editingSpecimen ? 'Editar Registro Científico' : 'Nuevo Registro de Espécimen'}
              </h2>
              <p className="text-[11px] text-[#79a28f] font-mono">
                BioBitácora CR • Reconocimiento Asistido por IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-5">
          {/* FOTOGRAFÍA & MÓDULO AYUDA IA */}
          <div className="p-4 rounded-2xl bg-white border border-[#c1c8c3]/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[20px]">photo_camera</span>
                Fotografía del Espécimen &amp; Reconocimiento IA
              </label>
              <span className="text-[11px] font-mono text-[#006c49] font-bold bg-[#6cf8bb]/20 px-2 py-0.5 rounded">
                Gemini Vision Multimodal
              </span>
            </div>

            {/* Photo Preview & Upload Controls */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              {/* Image Preview Box */}
              <div className="relative w-full sm:w-40 h-36 rounded-xl bg-[#0f382a] overflow-hidden border border-[#c1c8c3] flex-shrink-0">
                {heroImage ? (
                  <img src={heroImage} alt="Espécimen preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#79a28f] gap-1 p-2 text-center text-xs">
                    <span className="material-symbols-outlined text-3xl">image</span>
                    <span>Sin foto</span>
                  </div>
                )}
                {isAnalyzingAI && (
                  <div className="absolute inset-0 bg-[#002217]/85 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2 p-2 text-center">
                    <span className="material-symbols-outlined text-3xl text-[#6cf8bb] animate-spin">
                      psychology
                    </span>
                    <span className="text-[11px] font-mono text-[#6cf8bb] font-bold animate-pulse">
                      Identificando...
                    </span>
                  </div>
                )}
              </div>

              {/* Upload & AI Actions Column */}
              <div className="flex flex-col gap-2 flex-1 justify-between">
                {/* Upload or URL Row */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-[#edefe9] hover:bg-[#e1e3dd] text-[#002217] text-xs font-bold flex items-center gap-1.5 border border-[#c1c8c3]/60 cursor-pointer transition-colors">
                      <span className="material-symbols-outlined text-[17px] text-[#006c49]">upload_file</span>
                      <span>Subir Foto de Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-[#717974]">o ingresar URL abajo</span>
                  </div>

                  <input
                    type="url"
                    value={heroImage}
                    onChange={(e) => {
                      setHeroImage(e.target.value);
                      setUploadedBase64(null);
                      setAiSuccessFeedback(null);
                    }}
                    placeholder="https://ejemplo.com/rana.jpg"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#c1c8c3] text-xs font-mono text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                  />
                </div>

                {/* THE CORE REQUEST: "AYUDA IA" BUTTON */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleIdentifyWithAI}
                    disabled={isAnalyzingAI || !heroImage}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                      isAnalyzingAI
                        ? 'bg-[#0f382a] text-[#79a28f] cursor-wait'
                        : 'bg-gradient-to-r from-[#002217] via-[#0f382a] to-[#006c49] hover:brightness-110 text-white active:scale-[0.98]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] text-[#6cf8bb] ${isAnalyzingAI ? 'animate-spin' : ''}`}>
                      {isAnalyzingAI ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    <span className="tracking-wide">
                      {isAnalyzingAI
                        ? 'Analizando Rasgos y Especie con IA...'
                        : 'AYUDA IA: Reconocer Especie y Rellenar Datos'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Test Sample Images */}
            <div className="flex flex-col gap-1 pt-1 border-t border-[#e1e3dd]">
              <span className="text-[11px] font-mono text-[#414844] flex items-center gap-1">
                <span>Fotografías de muestra en Costa Rica para probar el reconocimiento IA:</span>
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SAMPLE_FIELD_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setHeroImage(sample.url);
                      setUploadedBase64(null);
                      setAiSuccessFeedback(null);
                      setAiError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                      heroImage === sample.url
                        ? 'bg-[#002217] text-white border-[#002217]'
                        : 'bg-[#f2f4ee] hover:bg-[#e7e9e3] text-[#191c19] border-[#c1c8c3]/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#006c49]">photo</span>
                    <span>{sample.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Success Feedback & Diagnostic Banner */}
            {aiSuccessFeedback && (
              <div className="p-3.5 rounded-xl bg-[#c1ecd7]/30 border border-[#006c49]/40 flex flex-col gap-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#006c49] text-[20px]">verified</span>
                    <span className="font-bold text-xs text-[#002116]">
                      Especie Reconocida: <em className="italic">{aiSuccessFeedback.species}</em>
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#006c49] bg-white px-2 py-0.5 rounded shadow-sm">
                    Confianza: {Math.round(aiSuccessFeedback.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-[#191c19] leading-relaxed">
                  <strong className="text-[#002217]">Diagnóstico taxonómico IA: </strong>
                  {aiSuccessFeedback.rationale}
                </p>
                <div className="text-[11px] text-[#006c49] font-medium flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Los campos de taxonomía, morfometría, hábitat y etología han sido autocompletados.</span>
                </div>
              </div>
            )}

            {/* AI Error Banner */}
            {aiError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Section: Mode Selector (Online GPS vs Offline Map) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">satellite_alt</span>
                Método de Georreferenciación (Costa Rica)
              </label>
              <span className="text-[11px] font-mono text-[#414844]">Datum WGS84</span>
            </div>

            {/* Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#edefe9] rounded-xl">
              <button
                type="button"
                onClick={() => setIsOnlineMode(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isOnlineMode
                    ? 'bg-[#002217] text-white shadow-sm'
                    : 'text-[#414844] hover:text-[#191c19]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">my_location</span>
                <span>Registro En Línea (GPS Zoom)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOnlineMode(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isOnlineMode
                    ? 'bg-[#002217] text-white shadow-sm'
                    : 'text-[#414844] hover:text-[#191c19]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#e48015]">public</span>
                <span>Colocación Manual (Offline CR)</span>
              </button>
            </div>
          </div>

          {/* Map Preview & Pin Dropper */}
          <div className="rounded-xl overflow-hidden border border-[#c1c8c3] h-60 relative shadow-sm">
            <CostaRicaMap
              pickerMode={true}
              initialCoords={coords}
              onCoordsChange={handleCoordsChange}
              isOnlineMode={isOnlineMode}
            />
          </div>

          {/* Coordinate Readout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-[#c1c8c3]/60 font-mono text-xs">
            <div>
              <span className="text-[#414844] block text-[10px] uppercase">Coordenadas DMS:</span>
              <span className="font-bold text-[#002217] text-[13px]">{coordsDMS.combined}</span>
            </div>
            <div>
              <span className="text-[#414844] block text-[10px] uppercase">Localidad detectada:</span>
              <span className="font-semibold text-[#006c49] truncate block">
                {locality} ({elevation} msnm)
              </span>
            </div>
          </div>

          {/* Taxonomy & Identification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Nombre Científico <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="p. ej. Agalychnis callidryas"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm italic font-semibold text-[#002217] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Nombre Común / Vernáculo
              </label>
              <input
                type="text"
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                placeholder="Rana arborícola de ojos rojos"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Grupo Taxonómico
              </label>
              <select
                value={taxonGroup}
                onChange={(e) => setTaxonGroup(e.target.value as TaxonGroup)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              >
                <option value="Amphibia">Anfibio (Amphibia)</option>
                <option value="Aves">Ave (Aves)</option>
                <option value="Mammalia">Mamífero (Mammalia)</option>
                <option value="Insecta">Insecto / Artrópodo (Insecta)</option>
                <option value="Reptilia">Reptil (Reptilia)</option>
                <option value="Plantae">Flora (Plantae)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Colector / Curador
              </label>
              <input
                type="text"
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                placeholder="Biol. M. Cordero (UCR-MZ)"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Longitud Hocico-Cloaca LHC (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={lhcMm}
                onChange={(e) => setLhcMm(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm font-mono text-[#002217] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Zona de Vida (Holdridge)
              </label>
              <input
                type="text"
                value={lifeZone}
                onChange={(e) => setLifeZone(e.target.value)}
                placeholder="Bosque Tropical Húmedo (bmh-T)"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs font-medium text-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>
          </div>

          {/* Morphometrics & Field Observations */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Cromática y Anatomía del Espécimen
              </label>
              <textarea
                rows={2}
                value={colorationNotes}
                onChange={(e) => setColorationNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Etología y Reproducción en Sitio
              </label>
              <textarea
                rows={2}
                value={ethologyNotes}
                onChange={(e) => setEthologyNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#c1c8c3] text-[#414844] hover:bg-[#f2f4ee] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#002217] hover:bg-[#0f382a] text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#6cf8bb]">save</span>
              <span>Guardar en Bitácora Científica</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
