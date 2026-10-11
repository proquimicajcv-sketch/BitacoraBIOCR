import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpecimenRecord, TaxonGroup, BioacousticRecord, PhotoRecord, SightingEntry } from '../types/specimen';
import { CostaRicaMap } from './CostaRicaMap';
import {
  COSTA_RICA_HOTSPOTS,
  HOLDRIDGE_LIFE_ZONES_CR,
  estimateHoldridgeZone,
  formatCoordinatesDMS,
  findNearestHotspot,
} from '../data/costaRicaData';

interface NewSpecimenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (specimen: SpecimenRecord) => void;
  onDelete?: (id: string) => void;
  initialCoords?: { lat: number; lng: number; locality?: string; lifeZone?: string };
  editingSpecimen?: SpecimenRecord | null;
  defaultCollector?: string;
}

const SAMPLE_FIELD_IMAGES = [
  {
    name: 'Rana de las Nacientes (Los Santos)',
    url: '/isthmohyla_nacientes.jpg',
  },
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
  onDelete,
  initialCoords,
  editingSpecimen,
  defaultCollector,
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
      'Bosque Muy Húmedo Tropical (bmh-T)'
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
    editingSpecimen?.collector || defaultCollector || 'Ing. Jorge Carvajal V.'
  );
  const [heroImage, setHeroImage] = useState(
    editingSpecimen?.heroImage ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvI7_6fTqgfYbPLKbGn0dFeW7hmnuRolqzd7Q_i2tcUFhIQO5UPw2MQBrfoR_PjDM-c7sqT6CdtQVsyoIP_fnDU9RXrw8NvRVtpA7JOiYHRcmwErrYso4uiDIH7IO1HdniMZq4nm1LM36RywajGzBnMXJI6ZBv8MEGSO_anGlnFjpGLL2LtKkDeBkJ6bAZ8qKDSvDv2NczPj54ygoDcje8UU6V8oi7EG7ddl-wRYqrXNZecg1XCf3y'
  );
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [lhcMm, setLhcMm] = useState<number>(
    editingSpecimen?.morphometrics.snoutVentLengthMm || 58.0
  );

  // Deep Scientific Fields Requested by User
  const [colorationNotes, setColorationNotes] = useState(
    editingSpecimen?.morphometrics.colorationAndAnatomy ||
      'Coloración dorsal verde esmeralda uniforme con flancos laterales azul cobalto intenso intercalados con barras transversales crema. Discos dactilares naranja encendido. Pupilas verticales con membrana nictitante dorada finamente reticulada.'
  );
  const [ethologyNotes, setEthologyNotes] = useState(
    editingSpecimen?.morphometrics.ethologyAndReproduction ||
      'Vocalizando activamente desde el envés de hojas de Heliconia latispatha a una altura de 1.5 m directamente sobre charca temporal de lluvia. Masa gelatinosa conteniendo aproximadamente 40 huevos en fase de clivaje temprano.'
  );
  const [courtshipNotes, setCourtshipNotes] = useState(
    editingSpecimen?.morphometrics.courtshipAndMating ||
      'Despliegue nupcial nocturno con vocalizaciones guturales "chack" y sacudidas corporales para delimitar percha. Amplexo axilar prolongado; la hembra realiza inmersiones previas para absorción de agua antes de ovopositar en follaje suspendido.'
  );
  const [interspecificNotes, setInterspecificNotes] = useState(
    editingSpecimen?.morphometrics.interspecificRelations ||
      'Compite por sitios de canto con Dendropsophus ebraccatus. Depredada activamente en fase de huevo por serpientes Leptodeira septentrionalis y avispas Polybia. Exhibe aposematismo y coloración de sobresalto para desorientar aves.'
  );
  const [confirmedScienceNotes, setConfirmedScienceNotes] = useState(
    editingSpecimen?.morphometrics.confirmedScientificData ||
      'Investigaciones en la Estación Biológica La Selva (OET/UCR) demostraron que los embriones presentan mecanorrecepción temprana que les permite distinguir vibraciones de lluvia de ataques de depredadores, eclosionando hasta un 30% antes para escapar a la charca.'
  );

  // BIOACOUSTICS MANAGEMENT
  const [hasBioacoustics, setHasBioacoustics] = useState<boolean>(
    editingSpecimen ? !!editingSpecimen.bioacoustics : true
  );
  const [audioTitle, setAudioTitle] = useState(
    editingSpecimen?.bioacoustics?.title || 'Canto de Anuncio'
  );
  const [audioCallType, setAudioCallType] = useState(
    editingSpecimen?.bioacoustics?.callType || 'Vocalización Territorial / Canto'
  );
  const [audioFrequency, setAudioFrequency] = useState(
    editingSpecimen?.bioacoustics?.dominantFrequencyRange || '1.8 - 2.4 kHz'
  );
  const [audioPattern, setAudioPattern] = useState(
    editingSpecimen?.bioacoustics?.audioPatternDescription || '"Chack-chack" gutural monotonal'
  );
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(
    editingSpecimen?.bioacoustics?.audioDataUrl || null
  );

  // Live recording in form
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micSeconds, setMicSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // AI Recognition & Enrichment State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isEnrichingAI, setIsEnrichingAI] = useState(false);
  const [activeEnrichingField, setActiveEnrichingField] = useState<string | null>(null);
  const [aiSuccessFeedback, setAiSuccessFeedback] = useState<{
    confidence: number;
    rationale: string;
    species: string;
    common: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Additional Photos by URL & Local Capture
  const [additionalPhotosList, setAdditionalPhotosList] = useState<PhotoRecord[]>(
    editingSpecimen?.additionalPhotos || [
      {
        id: 'p1',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmGUVTb0cZNrQIy7d2kzAqkjo8reoJH1-m7Jq1KGQViK-JC4o4iBAgurcuMq32V-vTc_Tkm78xKpt_mBTogei0s7FFYCFaWYqs6URyffV2JUPVqp5EKLtRssA_cFs7gAn9UVpmWNnc2KlDkfxv-MF0jCFqXgfwKwt2GsYbhVuOuE9i0rTCa1a9JNYOxgjjbUHiEU9KMNZ0pRDAe7RB90yjf9U8diZY8agcW98GU6r_61NmLaCpSiAP',
        label: 'Ojo / Membrana',
        description: 'Detalle de la membrana nictitante dorada.',
      },
    ]
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');

  // Sightings / Entradas de Vistas
  const [sightingsList, setSightingsList] = useState<SightingEntry[]>(
    editingSpecimen?.sightings || [
      {
        id: 's-init',
        timestamp: new Date().toLocaleString('es-CR'),
        date: new Date().toISOString().slice(0, 10),
        observer: editingSpecimen?.collector || 'Biol. M. Cordero (UCR-MZ)',
        locality: locality,
        count: 1,
        behaviorObserved: 'Ejemplar en actividad sobre follaje.',
        microhabitat: microhabitat,
      },
    ]
  );
  const [newSightingLocality, setNewSightingLocality] = useState('');
  const [newSightingCount, setNewSightingCount] = useState(1);
  const [newSightingBehavior, setNewSightingBehavior] = useState('');
  const [newSightingNotes, setNewSightingNotes] = useState('');
  const [showAddSighting, setShowAddSighting] = useState(false);

  // Delete confirmation modal state
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  // Synchronize modal state whenever opened with an existing specimen or new coords
  useEffect(() => {
    if (isOpen) {
      if (editingSpecimen) {
        setCoords({
          lat: editingSpecimen.georeference.latitude,
          lng: editingSpecimen.georeference.longitude,
        });
        setLocality(editingSpecimen.georeference.locality);
        setProvince(editingSpecimen.georeference.province);
        setElevation(editingSpecimen.georeference.elevationMeters);
        setLifeZone(editingSpecimen.georeference.lifeZone);
        setMicrohabitat(editingSpecimen.georeference.microhabitat);
        setScientificName(editingSpecimen.scientificName);
        setCommonName(editingSpecimen.commonName);
        setTaxonGroup(editingSpecimen.taxonGroup);
        setGenus(editingSpecimen.taxonomy.genus);
        setFamily(editingSpecimen.taxonomy.family);
        setCollector(editingSpecimen.collector);
        setHeroImage(editingSpecimen.heroImage);
        setUploadedBase64(null);
        setLhcMm(editingSpecimen.morphometrics.snoutVentLengthMm || 50.0);
        setColorationNotes(editingSpecimen.morphometrics.colorationAndAnatomy || '');
        setEthologyNotes(editingSpecimen.morphometrics.ethologyAndReproduction || '');
        setCourtshipNotes(editingSpecimen.morphometrics.courtshipAndMating || '');
        setInterspecificNotes(editingSpecimen.morphometrics.interspecificRelations || '');
        setConfirmedScienceNotes(editingSpecimen.morphometrics.confirmedScientificData || '');
        setHasBioacoustics(!!editingSpecimen.bioacoustics);
        setAudioTitle(editingSpecimen.bioacoustics?.title || 'Canto de Anuncio');
        setAudioCallType(editingSpecimen.bioacoustics?.callType || 'Vocalización Territorial');
        setAudioFrequency(editingSpecimen.bioacoustics?.dominantFrequencyRange || '1.8 - 2.4 kHz');
        setAudioPattern(editingSpecimen.bioacoustics?.audioPatternDescription || '');
        setAudioDataUrl(editingSpecimen.bioacoustics?.audioDataUrl || null);
        setAdditionalPhotosList(editingSpecimen.additionalPhotos || []);
        setSightingsList(editingSpecimen.sightings || []);
        setShowAddSighting(false);
      } else if (initialCoords) {
        setCoords({ lat: initialCoords.lat, lng: initialCoords.lng });
        if (initialCoords.locality) setLocality(initialCoords.locality);
        if (initialCoords.lifeZone) setLifeZone(initialCoords.lifeZone);
        setShowAddSighting(false);
      }
    }
  }, [isOpen, editingSpecimen, initialCoords]);

  // Coords change handler from the interactive map
  const handleCoordsChange = (newCoords: { lat: number; lng: number; dms: string }) => {
    setCoords({ lat: newCoords.lat, lng: newCoords.lng });
    const nearest = findNearestHotspot(newCoords.lat, newCoords.lng);
    setLocality(nearest.name);
    setProvince(`${nearest.province}, Costa Rica`);
    setElevation(nearest.elevation);

    // Auto-predict Holdridge Life Zone
    const predictedZone = estimateHoldridgeZone(nearest.elevation, newCoords.lat, newCoords.lng);
    setLifeZone(predictedZone.name);
  };

  // Auto-detect Holdridge based on current coords & elevation
  const handleAutoDetectHoldridge = () => {
    const predicted = estimateHoldridgeZone(elevation, coords.lat, coords.lng);
    setLifeZone(predicted.name);
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

  // Audio Upload Handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAudioDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Live Mic Recording
  const startRecordingMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioDataUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
      setMicSeconds(0);

      micIntervalRef.current = setInterval(() => {
        setMicSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone error:', err);
      alert('No se pudo acceder al micrófono. Por favor verifique los permisos de audio.');
    }
  };

  const stopRecordingMic = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    }
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
      if (data.taxonGroup) {
        setTaxonGroup(data.taxonGroup as TaxonGroup);
        if (data.taxonGroup === 'Plantae') {
          setHasBioacoustics(false);
        } else if (data.taxonGroup === 'Amphibia' || data.taxonGroup === 'Aves') {
          setHasBioacoustics(true);
        }
      }
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
      if (data.morphometrics?.courtshipAndMating) {
        setCourtshipNotes(data.morphometrics.courtshipAndMating);
      }
      if (data.morphometrics?.interspecificRelations) {
        setInterspecificNotes(data.morphometrics.interspecificRelations);
      }
      if (data.morphometrics?.confirmedScientificData) {
        setConfirmedScienceNotes(data.morphometrics.confirmedScientificData);
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

      // Bioacoustics from AI
      if (data.bioacoustics) {
        setAudioTitle(data.bioacoustics.title || 'Canto de Anuncio');
        setAudioFrequency(data.bioacoustics.dominantFrequencyRange || '1.8 - 2.4 kHz');
        setAudioPattern(data.bioacoustics.audioPatternDescription || '"Chack-chack" gutural monotonal');
      }

      setAiSuccessFeedback({
        confidence: data.confidenceScore || 0.95,
        rationale: data.identificationRationale || 'Identificación validada taxonómicamente por caracteres diagnósticos.',
        species: data.scientificName,
        common: data.commonName,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#006c49', '#6cf8bb', '#002217', '#e48015'],
      });
    } catch (err: any) {
      console.error('Error en reconocimiento IA:', err);
      setAiError(err.message || 'Error al comunicarse con el servicio de IA taxonómica.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // AI SCIENTIFIC ENRICHMENT (Nombre común, Científico, Anatomía, Cortejo, Etología, Relaciones, Datos confirmados)
  const handleEnrichScientificData = async () => {
    const query = (scientificName || commonName || '').trim();
    if (!query) {
      alert('Por favor ingrese el Nombre Común (ej. "Rana de ojos rojos", "Quetzal", "Jaguar") o el Nombre Científico (ej. "Agalychnis callidryas") o ambos.');
      return;
    }

    setIsEnrichingAI(true);
    try {
      const response = await fetch('/api/ai/enrich-scientific-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scientificName,
          commonName,
          taxonGroup,
        }),
      });

      const res = await response.json();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'No se pudieron recuperar los datos científicos.');
      }

      const d = res.data;
      // Auto-fill names and taxonomy 100%
      if (d.scientificName) setScientificName(d.scientificName);
      if (d.commonName) setCommonName(d.commonName);
      if (d.taxonGroup) {
        setTaxonGroup(d.taxonGroup as TaxonGroup);
        if (d.taxonGroup === 'Plantae') {
          setHasBioacoustics(false);
        } else if (d.taxonGroup === 'Amphibia' || d.taxonGroup === 'Aves') {
          setHasBioacoustics(true);
        }
      }
      if (d.taxonomy?.genus) setGenus(d.taxonomy.genus);
      if (d.taxonomy?.family) setFamily(d.taxonomy.family);

      // Morphometrics
      if (d.morphometrics?.snoutVentLengthMm) {
        setLhcMm(d.morphometrics.snoutVentLengthMm);
      } else if (d.morphometrics?.totalLengthMm) {
        setLhcMm(d.morphometrics.totalLengthMm);
      }

      // Deep scientific notes
      if (d.colorationAndAnatomy) setColorationNotes(d.colorationAndAnatomy);
      if (d.ethologyAndReproduction) setEthologyNotes(d.ethologyAndReproduction);
      if (d.courtshipAndMating) setCourtshipNotes(d.courtshipAndMating);
      if (d.interspecificRelations) setInterspecificNotes(d.interspecificRelations);
      if (d.confirmedScientificData) setConfirmedScienceNotes(d.confirmedScientificData);

      // Holdridge Life Zone and Habitat
      if (d.suggestedHoldridgeZone) setLifeZone(d.suggestedHoldridgeZone);
      if (d.microhabitat) setMicrohabitat(d.microhabitat);
      if (d.elevationMeters && !editingSpecimen) setElevation(d.elevationMeters);

      // Bioacoustics
      if (d.hasBioacoustics !== undefined) {
        setHasBioacoustics(d.hasBioacoustics);
      }
      if (d.bioacoustics) {
        setAudioTitle(d.bioacoustics.title || 'Canto o Llamado de Anuncio');
        setAudioFrequency(d.bioacoustics.dominantFrequencyRange || '1.8 - 2.4 kHz');
        setAudioPattern(d.bioacoustics.audioPatternDescription || 'Patrón sonoro registrado');
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#006c49', '#6cf8bb', '#e48015'],
      });
    } catch (err: any) {
      console.error('Error enriqueciendo datos científicos:', err);
      alert(`Error al generar datos con IA: ${err.message}`);
    } finally {
      setIsEnrichingAI(false);
    }
  };

  // Targeted enrichment for individual scientific fields
  const handleEnrichSpecificField = async (
    field: 'anatomy' | 'ethology' | 'courtship' | 'interspecific' | 'science'
  ) => {
    const query = (scientificName || commonName || '').trim();
    if (!query) {
      alert('Por favor ingrese primero el nombre común o el nombre científico de la especie.');
      return;
    }
    setActiveEnrichingField(field);
    try {
      const response = await fetch('/api/ai/enrich-scientific-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scientificName,
          commonName,
          taxonGroup,
        }),
      });
      const res = await response.json();
      if (!res.success || !res.data) throw new Error(res.error || 'Error al consultar IA');
      const d = res.data;
      if (field === 'anatomy' && d.colorationAndAnatomy) setColorationNotes(d.colorationAndAnatomy);
      if (field === 'ethology' && d.ethologyAndReproduction) setEthologyNotes(d.ethologyAndReproduction);
      if (field === 'courtship' && d.courtshipAndMating) setCourtshipNotes(d.courtshipAndMating);
      if (field === 'interspecific' && d.interspecificRelations) setInterspecificNotes(d.interspecificRelations);
      if (field === 'science' && d.confirmedScientificData) setConfirmedScienceNotes(d.confirmedScientificData);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(`Error al generar con IA: ${err.message}`);
    } finally {
      setActiveEnrichingField(null);
    }
  };

  const handleAddCustomPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const newEntry: PhotoRecord = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      label: newPhotoLabel.trim() || 'Vista adicional',
      description: newPhotoDesc.trim() || 'Fotografía de campo agregada por URL.',
    };
    setAdditionalPhotosList([...additionalPhotosList, newEntry]);
    setNewPhotoUrl('');
    setNewPhotoLabel('');
    setNewPhotoDesc('');
  };

  const handleRemoveCustomPhoto = (id: string) => {
    setAdditionalPhotosList(additionalPhotosList.filter((p) => p.id !== id));
  };

  const handleAddSighting = () => {
    const newSighting: SightingEntry = {
      id: `sight-${Date.now()}`,
      timestamp: new Date().toLocaleString('es-CR'),
      date: new Date().toISOString().slice(0, 10),
      observer: collector || 'Investigador de Campo',
      locality: newSightingLocality.trim() || locality,
      count: newSightingCount > 0 ? newSightingCount : 1,
      behaviorObserved: newSightingBehavior.trim() || 'Observación registrada en campo.',
      microhabitat: microhabitat,
      notes: newSightingNotes.trim() || undefined,
    };
    setSightingsList([newSighting, ...sightingsList]);
    setNewSightingLocality('');
    setNewSightingBehavior('');
    setNewSightingNotes('');
    setShowAddSighting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dms = formatCoordinatesDMS(coords.lat, coords.lng);
    const nearest = findNearestHotspot(coords.lat, coords.lng);

    const bioacousticsRecord: BioacousticRecord | undefined = hasBioacoustics
      ? {
          title: audioTitle,
          callType: audioCallType,
          dominantFrequencyRange: audioFrequency,
          durationSeconds: micSeconds > 0 ? micSeconds : 24,
          audioPatternDescription: audioPattern,
          audioDataUrl: audioDataUrl || undefined,
        }
      : undefined;

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
      bioacoustics: bioacousticsRecord,

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
        courtshipAndMating: courtshipNotes,
        interspecificRelations: interspecificNotes,
        confirmedScientificData: confirmedScienceNotes,
        sympatricSpecies: editingSpecimen?.morphometrics.sympatricSpecies || [
          { scientificName: 'Dendropsophus ebraccatus', commonName: 'Ranita reloj de arena', count: 3 },
        ],
      },

      additionalPhotos: additionalPhotosList,
      sightings: sightingsList,
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

            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
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

              <div className="flex flex-col gap-2 flex-1 justify-between">
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
              <span className="text-[11px] font-mono text-[#414844]">
                Fotografías de muestra en Costa Rica:
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
              </div>
            )}

            {aiError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* BIOACÚSTICA */}
          <div className="p-4 rounded-2xl bg-white border border-[#c1c8c3]/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[20px]">graphic_eq</span>
                Registro Bioacústico (Canto / Llamado)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBioacoustics}
                  onChange={(e) => setHasBioacoustics(e.target.checked)}
                  className="w-4 h-4 rounded text-[#006c49] focus:ring-[#006c49] accent-[#006c49]"
                />
                <span className="text-xs font-semibold text-[#191c19]">
                  {hasBioacoustics ? 'Canto Activo' : 'Suprimido (Sin canto)'}
                </span>
              </label>
            </div>

            {!hasBioacoustics ? (
              <div className="p-3 rounded-xl bg-[#f2f4ee] border border-[#e1e3dd] text-xs text-[#414844] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#717974] text-[18px]">volume_off</span>
                <span>Organismo sin canto o llamado emitido (suprimido para plantas, mariposas, reptiles mudos, etc.).</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#f8faf4] border border-[#c1c8c3] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#002217] block">Micrófono en Campo</span>
                      <span className="text-[11px] text-[#414844]">
                        {isRecordingMic ? `Grabando: 00:${String(micSeconds).padStart(2, '0')}` : 'Grabar audio en vivo'}
                      </span>
                    </div>
                    {isRecordingMic ? (
                      <button
                        type="button"
                        onClick={stopRecordingMic}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow active:scale-95 flex items-center gap-1 cursor-pointer animate-pulse"
                      >
                        <span className="material-symbols-outlined text-[16px]">stop</span>
                        <span>Detener</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecordingMic}
                        className="px-3 py-1.5 rounded-lg bg-[#002217] text-white text-xs font-bold shadow active:scale-95 flex items-center gap-1 hover:bg-[#0f382a] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">mic</span>
                        <span>Grabar</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#f8faf4] border border-[#c1c8c3] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#002217] block">Subir Archivo</span>
                      <span className="text-[11px] text-[#414844]">
                        {audioDataUrl ? 'Audio cargado con éxito' : 'MP3, WAV o M4A'}
                      </span>
                    </div>
                    <label className="px-3 py-1.5 rounded-lg bg-white border border-[#c1c8c3] text-[#002217] text-xs font-bold shadow-sm hover:bg-[#edefe9] flex items-center gap-1 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px] text-[#006c49]">upload_file</span>
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {audioDataUrl && (
                  <div className="p-2.5 rounded-lg bg-[#c1ecd7]/30 border border-[#006c49]/30 flex items-center justify-between text-xs">
                    <span className="text-[#002116] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#006c49]">audio_file</span>
                      Grabación personalizada vinculada
                    </span>
                    <button
                      type="button"
                      onClick={() => setAudioDataUrl(null)}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Remover audio
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GEORREFERENCIACIÓN Y ZONA DE VIDA (HOLDRIDGE) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">satellite_alt</span>
                Georreferenciación &amp; Zona de Vida (Holdridge)
              </label>
              <span className="text-[11px] font-mono text-[#414844]">Datum WGS84</span>
            </div>

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

          {/* Map Preview */}
          <div className="rounded-xl overflow-hidden border border-[#c1c8c3] h-56 relative shadow-sm">
            <CostaRicaMap
              pickerMode={true}
              initialCoords={coords}
              onCoordsChange={handleCoordsChange}
              isOnlineMode={isOnlineMode}
            />
          </div>

          {/* Coords & Holdridge Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-[#c1c8c3]/60 text-xs">
            <div>
              <span className="text-[#414844] block text-[10px] uppercase font-mono">Coordenadas DMS:</span>
              <span className="font-bold text-[#002217] text-[13px] font-mono">{coordsDMS.combined}</span>
              <span className="text-[11px] text-[#414844] block mt-1 truncate">
                {locality} • {province}
              </span>
            </div>

            {/* THE REQUESTED HOLDRIDGE DROPDOWN */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#002217] uppercase">
                  Zona de Vida de Costa Rica (Holdridge)
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectHoldridge}
                  className="text-[10px] text-[#006c49] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Calcular automáticamente según coordenadas y altitud"
                >
                  <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                  <span>Auto-detectar</span>
                </button>
              </div>

              <select
                value={lifeZone}
                onChange={(e) => setLifeZone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#f8faf4] border border-[#c1c8c3] text-xs font-semibold text-[#002217] focus:ring-2 focus:ring-[#006c49]"
              >
                {HOLDRIDGE_LIFE_ZONES_CR.map((zone) => (
                  <option key={zone.code} value={zone.name}>
                    {zone.code} - {zone.name} ({zone.elevationRange})
                  </option>
                ))}
                <option value={lifeZone}>{lifeZone} (Actual)</option>
              </select>

              <span className="text-[10px] text-[#414844] italic">
                {HOLDRIDGE_LIFE_ZONES_CR.find((z) => z.name === lifeZone)?.typicalRegions || 'Región ecológica de Costa Rica'}
              </span>
            </div>
          </div>

          {/* Taxonomy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm italic font-semibold text-[#002217] focus:ring-2 focus:ring-[#006c49]"
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
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm text-[#191c19]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c19] mb-1">
                Grupo Taxonómico
              </label>
              <select
                value={taxonGroup}
                onChange={(e) => setTaxonGroup(e.target.value as TaxonGroup)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-sm text-[#191c19]"
              >
                <option value="Amphibia">Anfibio (Amphibia)</option>
                <option value="Aves">Ave (Aves)</option>
                <option value="Mammalia">Mamífero (Mammalia)</option>
                <option value="Insecta">Insecto / Artrópodo (Insecta)</option>
                <option value="Reptilia">Reptil (Reptilia)</option>
                <option value="Plantae">Flora (Plantae)</option>
              </select>
            </div>
          </div>

          {/* BOTÓN DEDICADO: ENRIQUECER INFORMACIÓN CIENTÍFICA CON IA */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#002217] via-[#0b3323] to-[#006c49] text-white flex flex-col gap-2.5 shadow-md border border-[#6cf8bb]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[#6cf8bb] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  Asistente de Investigación Biológica IA
                </span>
                <p className="text-[11px] text-[#c1ecd7] opacity-95 leading-relaxed mt-0.5">
                  {scientificName || commonName ? (
                    <>
                      Completa automáticamente Nombre científico/común, Taxonomía, Anatomía, Etología, Cortejo, Relaciones intra/interespecíficas y Citas científicas confirmadas para{' '}
                      <strong className="underline text-white font-semibold">
                        "{scientificName || commonName}"
                      </strong>.
                    </>
                  ) : (
                    <>
                      Ingresa el <strong>Nombre Común</strong> (ej. <em>Quetzal, Rana de ojos rojos, Jaguar</em>) o el <strong>Nombre Científico</strong> (o ambos) y la IA rellenará al 100% todos los espacios de la ficha.
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleEnrichScientificData}
                disabled={isEnrichingAI}
                className="py-2.5 px-4 rounded-xl bg-[#6cf8bb] hover:bg-[#8ffbc9] text-[#002116] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-center"
              >
                <span className={`material-symbols-outlined text-[17px] ${isEnrichingAI ? 'animate-spin' : ''}`}>
                  {isEnrichingAI ? 'sync' : 'auto_stories'}
                </span>
                <span>{isEnrichingAI ? 'Consultando Literatura...' : 'Enriquecer con IA'}</span>
              </button>
            </div>

            {/* Sugerencias de especies de Costa Rica en 1 clic */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-white/10 text-[10px]">
              <span className="text-[#a5d0bc] font-mono">Ejemplos para probar:</span>
              {[
                { common: 'Rana de las Nacientes', sci: 'Isthmohyla nacientes' },
                { common: 'Rana de ojos rojos', sci: 'Agalychnis callidryas' },
                { common: 'Quetzal resplandeciente', sci: 'Pharomachrus mocinno' },
                { common: 'Mariposa Morfo azul', sci: 'Morpho peleides' },
                { common: 'Serpiente Terciopelo', sci: 'Bothrops asper' },
                { common: 'Perezoso de tres dedos', sci: 'Bradypus variegatus' },
                { common: 'Guaria Morada', sci: 'Guarianthe skinneri' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCommonName(item.common);
                    setScientificName(item.sci);
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[#6cf8bb] border border-white/15 cursor-pointer transition-colors"
                >
                  {item.common}
                </button>
              ))}
            </div>
          </div>

          {/* CAMPOS CIENTÍFICOS DETALLADOS SOLICITADOS POR EL USUARIO */}
          <div className="flex flex-col gap-3.5">
            {/* Anatomía y Cromática */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#002217] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">biotech</span>
                  Cromática y Anatomía del Espécimen
                </label>
                <button
                  type="button"
                  onClick={() => handleEnrichSpecificField('anatomy')}
                  disabled={activeEnrichingField === 'anatomy'}
                  className="text-[11px] text-[#006c49] hover:text-[#002217] font-bold flex items-center gap-1 cursor-pointer bg-[#c1ecd7]/40 px-2 py-0.5 rounded border border-[#006c49]/30"
                  title="Consultar literatura y caracteres anatómicos con IA"
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeEnrichingField === 'anatomy' ? 'animate-spin' : ''}`}>
                    {activeEnrichingField === 'anatomy' ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{activeEnrichingField === 'anatomy' ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={colorationNotes}
                onChange={(e) => setColorationNotes(e.target.value)}
                placeholder="Morfología diagnóstica, patrones de color, escamación/plumaje..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            {/* Etología y Comportamiento */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#002217] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">psychology_alt</span>
                  Etología y Comportamiento en Sitio
                </label>
                <button
                  type="button"
                  onClick={() => handleEnrichSpecificField('ethology')}
                  disabled={activeEnrichingField === 'ethology'}
                  className="text-[11px] text-[#006c49] hover:text-[#002217] font-bold flex items-center gap-1 cursor-pointer bg-[#c1ecd7]/40 px-2 py-0.5 rounded border border-[#006c49]/30"
                  title="Consultar etología y ritmos circadianos con IA"
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeEnrichingField === 'ethology' ? 'animate-spin' : ''}`}>
                    {activeEnrichingField === 'ethology' ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{activeEnrichingField === 'ethology' ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={ethologyNotes}
                onChange={(e) => setEthologyNotes(e.target.value)}
                placeholder="Horario de actividad diurna/nocturna, termorregulación, forrajeo..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            {/* Cortejo y Reproducción */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#002217] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">favorite</span>
                  Cortejo, Reproducción y Cuidado Parental
                </label>
                <button
                  type="button"
                  onClick={() => handleEnrichSpecificField('courtship')}
                  disabled={activeEnrichingField === 'courtship'}
                  className="text-[11px] text-[#006c49] hover:text-[#002217] font-bold flex items-center gap-1 cursor-pointer bg-[#c1ecd7]/40 px-2 py-0.5 rounded border border-[#006c49]/30"
                  title="Consultar rituales de cortejo y anidación con IA"
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeEnrichingField === 'courtship' ? 'animate-spin' : ''}`}>
                    {activeEnrichingField === 'courtship' ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{activeEnrichingField === 'courtship' ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={courtshipNotes}
                onChange={(e) => setCourtshipNotes(e.target.value)}
                placeholder="Rituales nupciales, señales de atracción, amplexo/cópula, postura de huevos o gestación..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            {/* Relaciones Intra e Interespecíficas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#002217] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">group_work</span>
                  Relaciones Intra e Interespecíficas (Competencia, Depredación y Defensas)
                </label>
                <button
                  type="button"
                  onClick={() => handleEnrichSpecificField('interspecific')}
                  disabled={activeEnrichingField === 'interspecific'}
                  className="text-[11px] text-[#006c49] hover:text-[#002217] font-bold flex items-center gap-1 cursor-pointer bg-[#c1ecd7]/40 px-2 py-0.5 rounded border border-[#006c49]/30"
                  title="Consultar interacciones ecológicas y defensas con IA"
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeEnrichingField === 'interspecific' ? 'animate-spin' : ''}`}>
                    {activeEnrichingField === 'interspecific' ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{activeEnrichingField === 'interspecific' ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={interspecificNotes}
                onChange={(e) => setInterspecificNotes(e.target.value)}
                placeholder="Territorialidad entre machos, especies simpátricas, principales depredadores en CR y toxinas/defensas..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:ring-2 focus:ring-[#006c49]"
              />
            </div>

            {/* Datos Científicos Confirmados */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#002217] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">menu_book</span>
                  Datos Importantes de Investigación Científica Confirmada (UCR / OET / SINAC)
                </label>
                <button
                  type="button"
                  onClick={() => handleEnrichSpecificField('science')}
                  disabled={activeEnrichingField === 'science'}
                  className="text-[11px] text-[#006c49] hover:text-[#002217] font-bold flex items-center gap-1 cursor-pointer bg-[#c1ecd7]/40 px-2 py-0.5 rounded border border-[#006c49]/30"
                  title="Consultar investigaciones publicadas de campo con IA"
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeEnrichingField === 'science' ? 'animate-spin' : ''}`}>
                    {activeEnrichingField === 'science' ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{activeEnrichingField === 'science' ? 'Consultando...' : 'Consultar IA'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={confirmedScienceNotes}
                onChange={(e) => setConfirmedScienceNotes(e.target.value)}
                placeholder="Descubrimientos biológicos publicados, citas de estudios en La Selva, Monteverde, Sirena o UCR..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:ring-2 focus:ring-[#006c49]"
              />
            </div>
          </div>

          {/* GALERÍA DE FOTOS ADICIONALES POR URL */}
          <div className="p-3.5 rounded-xl bg-white border border-[#c1c8c3] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] flex items-center gap-1.5 uppercase">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">photo_library</span>
                Galería de Vistas &amp; Fotos por URL ({additionalPhotosList.length})
              </label>
              <span className="text-[11px] text-[#717974] font-mono">Persistencia en cualquier equipo</span>
            </div>

            {/* List of current additional photos */}
            {additionalPhotosList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {additionalPhotosList.map((photo) => (
                  <div key={photo.id} className="relative rounded-lg overflow-hidden border border-[#c1c8c3] bg-[#f8faf4] p-1.5 flex flex-col gap-1">
                    <img src={photo.url} alt={photo.label} className="w-full h-16 object-cover rounded" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#002217] truncate">{photo.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPhoto(photo.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Eliminar foto"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new photo by URL */}
            <div className="p-2.5 rounded-lg bg-[#f8faf4] border border-[#c1c8c3]/60 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#002217]">Agregar Nueva Fotografía o Vista:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://... URL pública de la imagen"
                  className="px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                />
                <input
                  type="text"
                  value={newPhotoLabel}
                  onChange={(e) => setNewPhotoLabel(e.target.value)}
                  placeholder="Etiqueta (ej. Ojo, Flanco, Puesta)"
                  className="px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={newPhotoDesc}
                  onChange={(e) => setNewPhotoDesc(e.target.value)}
                  placeholder="Descripción científica de la toma..."
                  className="flex-1 px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPhoto}
                  className="px-3 py-1.5 rounded bg-[#002217] hover:bg-[#0f382a] text-[#6cf8bb] font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Agregar Foto</span>
                </button>
              </div>
            </div>
          </div>

          {/* REGISTRO DE AVISTAMIENTOS (ENTRADAS DE VISTAS) */}
          <div className="p-3.5 rounded-xl bg-white border border-[#c1c8c3] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#002217] flex items-center gap-1.5 uppercase">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">visibility</span>
                Registro de Avistamientos / Entradas de Vistas ({sightingsList.length})
              </label>
              <button
                type="button"
                onClick={() => setShowAddSighting(!showAddSighting)}
                className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>{showAddSighting ? 'Cancelar' : 'Nuevo Avistamiento'}</span>
              </button>
            </div>

            {/* Sightings List */}
            {sightingsList.length > 0 && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {sightingsList.map((sight) => (
                  <div key={sight.id} className="p-2.5 rounded-lg bg-[#f8faf4] border border-[#c1c8c3]/60 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#002217]">{sight.locality}</span>
                      <span className="font-mono text-[10px] text-[#006c49] font-bold">
                        N={sight.count} ind. • {sight.timestamp}
                      </span>
                    </div>
                    <p className="text-[#414844]">{sight.behaviorObserved}</p>
                    {sight.notes && <p className="text-[11px] text-[#717974] italic">{sight.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Add Sighting Form */}
            {showAddSighting && (
              <div className="p-3 rounded-lg bg-[#f2f4ee] border border-[#c1c8c3] flex flex-col gap-2 text-xs">
                <span className="font-bold text-[#002217]">Registrar Nueva Observación en Sitio:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newSightingLocality}
                    onChange={(e) => setNewSightingLocality(e.target.value)}
                    placeholder={`Localidad (por defecto: ${locality})`}
                    className="px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newSightingCount}
                    onChange={(e) => setNewSightingCount(parseInt(e.target.value) || 1)}
                    placeholder="Cantidad de individuos"
                    className="px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                  />
                </div>
                <input
                  type="text"
                  value={newSightingBehavior}
                  onChange={(e) => setNewSightingBehavior(e.target.value)}
                  placeholder="Comportamiento observado (ej. Forrajeo nocturno, percha a 2m, en amplexo...)"
                  className="px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={newSightingNotes}
                    onChange={(e) => setNewSightingNotes(e.target.value)}
                    placeholder="Notas ecológicas adicionales..."
                    className="flex-1 px-2.5 py-1.5 rounded bg-white border border-[#c1c8c3] text-xs text-[#191c19]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSighting}
                    className="px-3.5 py-1.5 rounded bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    Guardar Entrada
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e1e3dd]">
            {editingSpecimen && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeletePrompt(true)}
                className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">delete</span>
                <span>Eliminar Registro</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>

      {/* Delete Confirmation Alert */}
      {showDeletePrompt && editingSpecimen && onDelete && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h4 className="font-bold text-center text-[#002217] text-base">
              ¿Eliminar este registro científico?
            </h4>
            <p className="text-xs text-center text-[#414844]">
              Se eliminará definitivamente la ficha de <strong className="italic">{editingSpecimen.scientificName}</strong> ({editingSpecimen.catalogNumber}). Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeletePrompt(false)}
                className="py-2.5 px-3 rounded-xl border border-[#c1c8c3] text-xs font-bold text-[#414844] hover:bg-[#f2f4ee] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(editingSpecimen.id);
                  setShowDeletePrompt(false);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
