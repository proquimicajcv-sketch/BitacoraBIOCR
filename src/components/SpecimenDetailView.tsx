import React, { useState, useEffect } from 'react';
import { SpecimenRecord, BioacousticRecord } from '../types/specimen';
import {
  playFrogCall,
  playCustomAudio,
  generateSonogramWav,
  SoundPlaybackController,
} from '../utils/audioBioacoustics';
import { AudioRecordingModal } from './AudioRecordingModal';

interface SpecimenDetailViewProps {
  specimen: SpecimenRecord;
  onBack: () => void;
  onEdit: (specimen: SpecimenRecord) => void;
  onOpenMap: (specimen: SpecimenRecord) => void;
  onOpenDarwinCoreModal: (specimen: SpecimenRecord) => void;
  onDelete: (specimenId: string) => void;
  onUpdateBioacoustics: (specimenId: string, bioacoustics?: BioacousticRecord) => void;
}

export const SpecimenDetailView: React.FC<SpecimenDetailViewProps> = ({
  specimen,
  onBack,
  onEdit,
  onOpenMap,
  onOpenDarwinCoreModal,
  onDelete,
  onUpdateBioacoustics,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackController, setAudioPlaybackController] = useState<SoundPlaybackController | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; label: string; desc: string } | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([
    8, 16, 28, 20, 12, 32, 24, 12, 8, 20, 28, 16, 8, 24, 12, 8,
  ]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioPlaybackController?.stop();
    };
  }, [audioPlaybackController]);

  // Audio Playback toggle
  const toggleAudio = () => {
    if (!specimen.bioacoustics) return;

    if (isPlayingAudio) {
      audioPlaybackController?.stop();
      setIsPlayingAudio(false);
      setAudioPlaybackController(null);
    } else {
      setIsPlayingAudio(true);

      const onTick = (spectrum: number[]) => {
        if (spectrum.length > 0) {
          setWaveformHeights(
            spectrum.map((val) => Math.max(6, Math.floor(val * 32) + Math.floor(Math.random() * 8)))
          );
        }
      };

      const onEnd = () => {
        setIsPlayingAudio(false);
        setAudioPlaybackController(null);
      };

      let controller: SoundPlaybackController;
      if (specimen.bioacoustics.audioDataUrl) {
        controller = playCustomAudio(specimen.bioacoustics.audioDataUrl, onTick, onEnd);
      } else {
        controller = playFrogCall(onTick, onEnd);
      }

      setAudioPlaybackController(controller);
    }
  };

  // Suppress bioacoustics for silent organisms
  const handleSuppressBioacoustics = () => {
    if (window.confirm('¿Desea suprimir el módulo de audio para este espécimen (marcarlo como organismo sin canto/llamado)?')) {
      audioPlaybackController?.stop();
      setIsPlayingAudio(false);
      onUpdateBioacoustics(specimen.id, undefined);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8faf4] pb-20">
      {/* Top Fixed Header */}
      <header className="sticky top-0 inset-x-0 z-50 bg-[#f8faf4]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            <button
              aria-label="Volver"
              onClick={onBack}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#191c19] hover:bg-[#e7e9e3] transition-colors flex-shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="material-symbols-outlined text-[#006c49] text-[24px]">eco</span>
            </div>
            <h1 className="font-bold text-[18px] text-[#191c19] tracking-tight truncate">
              Detalle De Espécimen
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Delete Header Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Eliminar este registro"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <div
              className="w-8 h-8 rounded-full bg-[#002217] flex items-center justify-center flex-shrink-0 text-white cursor-pointer"
              title="Curador: Biol. M. Cordero (UCR-MZ)"
            >
              <span className="material-symbols-outlined text-white text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto w-full">
        {/* Interactive Hero Image */}
        <section className="relative w-full overflow-hidden bg-[#0f382a] shadow-md">
          <div className="relative w-full h-80 sm:h-96 overflow-hidden">
            <img
              src={specimen.heroImage}
              alt={specimen.heroImageDescription}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out select-none cursor-pointer ${
                isZoomed ? 'scale-150' : 'scale-100 hover:scale-105'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            {/* Ambient Gradient Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#002217]/90 via-[#002217]/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#002217]/60 via-transparent to-transparent pointer-events-none" />

            {/* Live Inspection Badges Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
                <span className="font-mono text-[11px] font-bold text-[#002217] uppercase tracking-wider">
                  {specimen.catalogNumber}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm pointer-events-auto">
                <span className="material-symbols-outlined text-[16px] text-[#006c49]">verified</span>
                <span className="text-[11px] font-semibold text-[#191c19]">Curaduría Verificada</span>
              </div>
            </div>

            {/* Quick Interactive Zoom & Audio Tools */}
            <div className="absolute bottom-16 right-3 flex flex-col gap-2 z-10">
              <button
                aria-label="Ampliar imagen de espécimen"
                onClick={() => setIsZoomed(!isZoomed)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-[#191c19] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer hover:bg-white"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isZoomed ? 'zoom_out' : 'zoom_in'}
                </span>
              </button>

              {specimen.bioacoustics && (
                <button
                  aria-label="Reproducir vocalización bioacústica"
                  onClick={toggleAudio}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-[#6cf8bb] text-[#00714d] ring-2 ring-[#006c49]'
                      : 'bg-[#006c49] text-white hover:bg-[#005236]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isPlayingAudio ? 'pause' : 'volume_up'}
                  </span>
                </button>
              )}
            </div>

            {/* Image Metadata Stamp */}
            <div className="absolute bottom-3 left-3 right-16 text-white pointer-events-none">
              <p className="font-mono text-[11px] opacity-90 flex items-center gap-1 drop-shadow-sm">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <span>{specimen.collectionDate} • {specimen.collectionTime}</span>
              </p>
              <p className="font-mono text-[11px] opacity-80 flex items-center gap-1 drop-shadow-sm mt-0.5">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                <span>Colector: {specimen.collector}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Taxonomic Title & Identity Header */}
        <section className="px-4 pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c1ecd7] text-[#002116] font-mono text-[11px] font-bold uppercase">
                {specimen.taxonGroup} • {specimen.realm}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e7e9e3] text-[#414844] font-mono text-[11px] font-medium">
                <span className="material-symbols-outlined text-[14px] text-[#006c49]">cloud_done</span>
                Darwin Core Sync
              </span>
            </div>
            <h2 className="text-[26px] font-bold italic text-[#002217] tracking-tight mt-1">
              {specimen.scientificName}
            </h2>
            <p className="text-[14px] text-[#414844] font-medium">
              {specimen.commonName}
            </p>
          </div>

          {/* Conservation & Biogeographic Status Mosaic */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 rounded-xl bg-[#f2f4ee] shadow-sm flex flex-col justify-between border border-[#e1e3dd]/60">
              <span className="font-mono text-[11px] text-[#414844] uppercase tracking-wider font-semibold">
                Estado UICN
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-7 h-7 rounded-full bg-[#006c49] text-white font-bold text-[12px] flex items-center justify-center flex-shrink-0">
                  {specimen.iucnStatus.code}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-[14px] text-[#191c19] leading-tight">
                    {specimen.iucnStatus.label}
                  </p>
                  <p className="text-[12px] text-[#414844]">
                    {specimen.iucnStatus.trend}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f2f4ee] shadow-sm flex flex-col justify-between border border-[#e1e3dd]/60">
              <span className="font-mono text-[11px] text-[#414844] uppercase tracking-wider font-semibold">
                CITES / Distribución
              </span>
              <div className="mt-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffdcc3] text-[#2f1500] font-mono text-[11px] font-bold">
                  {specimen.citesStatus.appendix}
                </div>
                <p className="text-[13px] text-[#191c19] mt-1 truncate font-medium">
                  {specimen.citesStatus.distribution}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Taxonomic Tree Card */}
        <section className="px-4 mt-4">
          <div className="p-3.5 rounded-xl bg-[#edefe9] shadow-sm border border-[#e1e3dd]/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase text-[#414844] font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#002217]">account_tree</span>
                Jerarquía Taxonómica (NCBI / ITIS)
              </span>
              {specimen.taxonomy.taxonId && (
                <span className="font-mono text-[11px] text-[#006c49] font-bold">
                  Taxon ID: {specimen.taxonomy.taxonId}
                </span>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-1.5 font-mono text-[11px] text-[#191c19]">
              <span className="px-2 py-0.5 rounded bg-white shadow-sm">{specimen.taxonomy.kingdom}</span>
              <span className="text-[#c1c8c3] font-bold">&gt;</span>
              <span className="px-2 py-0.5 rounded bg-white shadow-sm">{specimen.taxonomy.phylum}</span>
              <span className="text-[#c1c8c3] font-bold">&gt;</span>
              <span className="px-2 py-0.5 rounded bg-white shadow-sm">{specimen.taxonomy.class}</span>
              <span className="text-[#c1c8c3] font-bold">&gt;</span>
              <span className="px-2 py-0.5 rounded bg-white shadow-sm">{specimen.taxonomy.order}</span>
              <span className="text-[#c1c8c3] font-bold">&gt;</span>
              <span className="px-2 py-0.5 rounded bg-white shadow-sm">{specimen.taxonomy.family}</span>
              <span className="text-[#c1c8c3] font-bold">&gt;</span>
              <span className="px-2 py-0.5 rounded bg-[#c1ecd7] text-[#002116] font-bold">
                {specimen.taxonomy.genus}
              </span>
            </div>
          </div>
        </section>

        {/* BIOACOUSTIC MODULE (ACTIVE OR SUPPRESSED) */}
        {specimen.bioacoustics ? (
          <section className="px-4 mt-4">
            <div className="p-3.5 rounded-xl bg-[#0f382a] text-white shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAudio}
                    className="w-8 h-8 rounded-full bg-[#6cf8bb] text-[#00714d] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPlayingAudio ? 'pause' : 'graphic_eq'}
                    </span>
                  </button>
                  <div>
                    <h4 className="font-bold text-[15px] text-white">
                      {specimen.bioacoustics.title}
                    </h4>
                    <p className="font-mono text-[11px] text-[#79a28f]">
                      Frecuencia dominante: {specimen.bioacoustics.dominantFrequencyRange}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#002217] text-[#6ffbbe] font-semibold">
                    {isPlayingAudio ? '00:08 / 00:24' : '00:00 / 00:24'}
                  </span>
                </div>
              </div>

              {/* Dynamic Sound Wave Display */}
              <div
                onClick={toggleAudio}
                className="flex items-center gap-1 h-9 px-2 bg-[#002217]/50 rounded-lg justify-between cursor-pointer"
                title="Haga clic para reproducir/pausar vocalización"
              >
                {waveformHeights.map((h, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-[#6ffbbe] rounded-full transition-all duration-150"
                    style={{
                      height: `${h}px`,
                      opacity: isPlayingAudio ? (idx > 7 ? 0.6 : 1) : 0.45,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[#79a28f] font-mono text-[11px]">
                <span className="truncate mr-2">Patrón: {specimen.bioacoustics.audioPatternDescription}</span>
                <button
                  onClick={() => generateSonogramWav(`Sonograma_${specimen.scientificName.replace(' ', '_')}.wav`)}
                  className="text-[#6ffbbe] flex items-center gap-1 font-semibold hover:underline flex-shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Sonograma .WAV</span>
                </button>
              </div>

              {/* Bioacoustic Actions (Grabar, Subir o Suprimir) */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => setIsAudioModalOpen(true)}
                  className="text-[#6cf8bb] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[15px]">mic</span>
                  <span>{specimen.bioacoustics.audioDataUrl ? 'Cambiar Grabación' : 'Grabar / Subir Audio'}</span>
                </button>

                {/* BOTÓN PARA SUPRIMIR CANTO POR DEFECTO */}
                <button
                  onClick={handleSuppressBioacoustics}
                  className="text-red-300 hover:text-red-100 flex items-center gap-1 cursor-pointer"
                  title="Suprimir módulo si el organismo no posee canto o llamado"
                >
                  <span className="material-symbols-outlined text-[14px]">volume_off</span>
                  <span>Suprimir Canto (Organismo mudo)</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* Silent Organism Card with option to add audio */
          <section className="px-4 mt-4">
            <div className="p-3.5 rounded-xl bg-white border border-[#e1e3dd] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#717974] text-[20px]">volume_off</span>
                <div>
                  <h4 className="font-bold text-xs text-[#002217]">Sin Registro Bioacústico</h4>
                  <p className="text-[11px] text-[#414844]">
                    Organismo sin vocalizaciones asignadas (mudo).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#002217] hover:bg-[#0f382a] text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-[#6cf8bb]">mic</span>
                <span>Grabar o Subir Audio</span>
              </button>
            </div>
          </section>
        )}

        {/* Geo-Location & Habitat Module */}
        <section className="px-4 mt-4">
          <div className="p-4 rounded-xl bg-white shadow-sm flex flex-col gap-3 border border-[#e1e3dd]/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-[#002217] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[20px]">explore</span>
                Georreferenciación y Hábitat
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6cf8bb]/30 text-[#006c49] font-mono text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]" />
                Precisión ±{specimen.georeference.accuracyMeters}m
              </span>
            </div>

            <div
              onClick={() => onOpenMap(specimen)}
              title="Haga clic para abrir el Mapa Científico de Costa Rica centrado en este espécimen"
              className="relative w-full h-44 rounded-lg bg-cover bg-center overflow-hidden shadow-inner flex items-end p-2.5 cursor-pointer group"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAkxxXeklAa2bUry9oBjeqq3PQmbv6HWeC7Ay8BQJ3KNcU5dBeGxUruPJLlcp1eVFgeDVoQB_UvVQ7Mjs1Ima4Enav6C9xiQt9UjKcppEUmnpguTULLFXuqw9y4ZduzkpB922OVf9MWNdGui84frHaWeVFmOW3ldeqMwELwfk8YhfUenAVz-ArKUZregBaTOjcxeYUssu8i79ajSEBzJyWrV3qddTnP289ZapXW-AV_0v_X0GtuCoc0')`,
              }}
            >
              <div className="absolute inset-0 bg-[#002217]/25 group-hover:bg-[#002217]/10 transition-colors" />

              <div className="absolute top-2.5 right-2.5 bg-[#002217]/80 text-white px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 group-hover:bg-[#002217] transition-colors">
                <span className="material-symbols-outlined text-[14px] text-[#6cf8bb]">zoom_in</span>
                <span>Explorar en Mapa</span>
              </div>

              <div className="relative z-10 w-full p-2 rounded bg-white/95 backdrop-blur-md shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-red-600 text-[18px]">location_on</span>
                  <span className="font-mono text-[11px] text-[#191c19] truncate font-bold">
                    {specimen.georeference.latitudeDMS}, {specimen.georeference.longitudeDMS}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#006c49] font-bold flex-shrink-0">
                  {specimen.georeference.datum}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[#191c19] pt-1">
              <div className="p-2.5 rounded-lg bg-[#f2f4ee] flex flex-col">
                <span className="font-mono text-[11px] text-[#414844] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span> Localidad
                </span>
                <span className="text-[13px] font-semibold mt-0.5 text-[#191c19] leading-tight">
                  {specimen.georeference.locality}
                </span>
                <span className="text-[11px] text-[#414844] mt-0.5">
                  {specimen.georeference.province}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#f2f4ee] flex flex-col">
                <span className="font-mono text-[11px] text-[#414844] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">forest</span> Zona de Vida
                </span>
                <span className="text-[13px] font-semibold mt-0.5 text-[#191c19] leading-tight">
                  {specimen.georeference.lifeZone}
                </span>
                <span className="text-[11px] text-[#006c49] font-semibold mt-0.5">
                  {specimen.georeference.conservationArea}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#f2f4ee] flex flex-col">
                <span className="font-mono text-[11px] text-[#414844] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">elevation</span> Elevación
                </span>
                <span className="text-[13px] font-semibold mt-0.5 text-[#191c19]">
                  {specimen.georeference.elevationMeters} msnm
                </span>
                <span className="text-[11px] text-[#414844] mt-0.5">
                  {specimen.georeference.elevationMeters < 500 ? 'Tierras bajas del Caribe' : 'Tierras altas'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#f2f4ee] flex flex-col">
                <span className="font-mono text-[11px] text-[#414844] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">water</span> Microhábitat
                </span>
                <span className="text-[13px] font-semibold mt-0.5 text-[#191c19] leading-tight">
                  {specimen.georeference.microhabitat}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Scientific Field Notebook & Morphometrics */}
        <section className="px-4 mt-4">
          <div className="p-4 rounded-xl bg-white shadow-sm flex flex-col gap-3 border border-[#e1e3dd]/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-[#002217] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[20px]">menu_book</span>
                Notas de Campo &amp; Morfometría
              </h3>
              <span className="font-mono text-[11px] text-[#414844] font-semibold">
                {specimen.fieldFolio}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#f2f4ee] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#414844] font-medium">
                  Longitud Hocico-Cloaca (LHC):
                </span>
                <span className="font-mono text-[13px] font-bold text-[#002217] px-2 py-0.5 rounded bg-[#e1e3dd]">
                  {specimen.morphometrics.snoutVentLengthMm?.toFixed(1) || 'N/A'} mm
                </span>
              </div>
              <p className="text-[13px] text-[#191c19] leading-relaxed">
                <strong className="font-bold text-[#002217]">Cromática y Anatomía: </strong>
                {specimen.morphometrics.colorationAndAnatomy}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#f2f4ee] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[#002217]">
                <span className="material-symbols-outlined text-[18px]">psychology_alt</span>
                <span className="font-bold text-[14px]">Etología y Comportamiento</span>
              </div>
              <p className="text-[13px] text-[#191c19] leading-relaxed">
                {specimen.morphometrics.ethologyAndReproduction}
              </p>
            </div>

            {/* Cortejo y Reproducción */}
            {specimen.morphometrics.courtshipAndMating && (
              <div className="p-3 rounded-lg bg-[#f2f4ee] flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[#002217]">
                  <span className="material-symbols-outlined text-[18px] text-[#006c49]">favorite</span>
                  <span className="font-bold text-[14px]">Cortejo, Reproducción &amp; Desove</span>
                </div>
                <p className="text-[13px] text-[#191c19] leading-relaxed">
                  {specimen.morphometrics.courtshipAndMating}
                </p>
              </div>
            )}

            {/* Relaciones Intra e Interespecíficas */}
            {specimen.morphometrics.interspecificRelations && (
              <div className="p-3 rounded-lg bg-[#f2f4ee] flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[#002217]">
                  <span className="material-symbols-outlined text-[18px] text-[#006c49]">shield</span>
                  <span className="font-bold text-[14px]">Relaciones Intra/Interespecíficas, Depredación &amp; Defensas</span>
                </div>
                <p className="text-[13px] text-[#191c19] leading-relaxed">
                  {specimen.morphometrics.interspecificRelations}
                </p>
              </div>
            )}

            {/* Datos Científicos Confirmados (UCR, OET, SINAC) */}
            {specimen.morphometrics.confirmedScientificData && (
              <div className="p-3 rounded-lg bg-[#c1ecd7]/30 border border-[#006c49]/30 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[#002116]">
                  <span className="material-symbols-outlined text-[18px] text-[#006c49]">verified</span>
                  <span className="font-bold text-[14px]">Investigación Científica Confirmada (UCR / OET / SINAC)</span>
                </div>
                <p className="text-[13px] text-[#191c19] leading-relaxed font-normal">
                  {specimen.morphometrics.confirmedScientificData}
                </p>
              </div>
            )}

            {specimen.morphometrics.sympatricSpecies.length > 0 && (
              <div className="p-3 rounded-lg bg-[#f2f4ee] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[#002217]">
                  <span className="material-symbols-outlined text-[18px]">group_work</span>
                  <span className="font-bold text-[14px]">Especies Simpátricas Registradas</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {specimen.morphometrics.sympatricSpecies.map((symp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-white shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold italic text-[#002217] truncate">
                          {symp.scientificName}
                        </p>
                        <p className="text-[11px] text-[#414844]">{symp.commonName}</p>
                      </div>
                      <span className="font-mono text-[11px] text-[#006c49] font-bold">
                        N={symp.count} ind.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Specimen Morphological Gallery Mosaic */}
        {specimen.additionalPhotos.length > 0 && (
          <section className="px-4 mt-4">
            <div className="p-4 rounded-xl bg-white shadow-sm flex flex-col gap-3 border border-[#e1e3dd]/80">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[16px] text-[#002217] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#006c49] text-[20px]">photo_library</span>
                  Registros Fotográficos Complementarios
                </h3>
                <span className="font-mono text-[11px] text-[#414844] font-semibold">
                  {specimen.additionalPhotos.length} Archivos
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {specimen.additionalPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() =>
                      setActivePhotoModal({
                        url: photo.url,
                        label: photo.label,
                        desc: photo.description,
                      })
                    }
                    className="relative rounded-lg overflow-hidden h-24 group bg-[#e7e9e3] cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 left-1 px-1 rounded bg-[#002217]/80 text-white font-mono text-[10px]">
                      {photo.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Registro de Avistamientos / Entradas de Vistas */}
        <section className="px-4 mt-4">
          <div className="p-4 rounded-xl bg-white shadow-sm flex flex-col gap-3 border border-[#e1e3dd]/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-[#002217] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[20px]">visibility</span>
                Historial de Avistamientos &amp; Entradas de Vistas ({specimen.sightings?.length || 1})
              </h3>
              <button
                onClick={() => onEdit(specimen)}
                className="text-xs text-[#006c49] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>+ Nuevo Avistamiento</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {specimen.sightings && specimen.sightings.length > 0 ? (
                specimen.sightings.map((sight) => (
                  <div
                    key={sight.id}
                    className="p-3 rounded-lg bg-[#f2f4ee] border border-[#e1e3dd] flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#002217] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#006c49]">pin_drop</span>
                        {sight.locality}
                      </span>
                      <span className="font-mono text-[10px] text-[#006c49] font-bold bg-white px-2 py-0.5 rounded border border-[#e1e3dd]">
                        N={sight.count} ind. • {sight.timestamp}
                      </span>
                    </div>
                    <p className="text-[#191c19] mt-0.5">{sight.behaviorObserved}</p>
                    {sight.microhabitat && (
                      <span className="text-[11px] text-[#414844]">
                        Hábitat: {sight.microhabitat} {sight.weather ? `• ${sight.weather}` : ''}
                      </span>
                    )}
                    {sight.notes && (
                      <p className="text-[11px] text-[#717974] italic mt-0.5 border-t border-[#e1e3dd] pt-1">
                        Nota: {sight.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-[#f2f4ee] text-xs text-[#414844] flex items-center justify-between">
                  <span>Primer avistamiento de colecta registrado ({specimen.collectionDate}).</span>
                  <button
                    onClick={() => onEdit(specimen)}
                    className="text-[#006c49] font-bold hover:underline"
                  >
                    Añadir nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Primary & Secondary Action Commands */}
        <section className="px-4 mt-6 flex flex-col gap-2.5">
          {/* AI Assistance Action Button */}
          <button
            onClick={() => onEdit(specimen)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#002217] via-[#0f382a] to-[#006c49] hover:brightness-110 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer border border-[#6cf8bb]/30"
          >
            <span className="material-symbols-outlined text-[20px] text-[#6cf8bb]">auto_awesome</span>
            <span>AYUDA IA: Reconocimiento y Auditoría de Especie</span>
          </button>

          {/* Primary CTA: Edit & Curate Specimen */}
          <button
            onClick={() => onEdit(specimen)}
            className="w-full h-11 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-[#006c49]">edit_note</span>
            <span>Editar Registro Científico</span>
          </button>

          {/* Secondary Split CTAs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenDarwinCoreModal(specimen)}
              className="h-11 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3]/60 font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#006c49]">file_download</span>
              <span>Exportar Darwin Core</span>
            </button>
            <button
              onClick={() => onOpenMap(specimen)}
              className="h-11 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3]/60 font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#006c49]">public</span>
              <span>Ver en Mapa Global</span>
            </button>
          </div>

          {/* THE REQUESTED DELETE BUTTON */}
          <div className="pt-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Eliminar Registro Científico</span>
            </button>
          </div>
        </section>
      </div>

      {/* Audio Recording / Upload Modal */}
      <AudioRecordingModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        initialBioacoustics={specimen.bioacoustics}
        onSave={(bio) => onUpdateBioacoustics(specimen.id, bio)}
      />

      {/* Delete Confirmation Alert Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h4 className="font-bold text-center text-[#002217] text-base">
              ¿Eliminar este registro científico?
            </h4>
            <p className="text-xs text-center text-[#414844]">
              Se eliminará definitivamente la ficha de <strong className="italic">{specimen.scientificName}</strong> ({specimen.catalogNumber}). Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-[#c1c8c3] text-xs font-bold text-[#414844] hover:bg-[#f2f4ee] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(specimen.id);
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / High-Res Photo Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={activePhotoModal.url}
                alt={activePhotoModal.label}
                className="max-h-[70vh] w-auto object-contain"
              />
              <button
                onClick={() => setActivePhotoModal(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <span className="font-mono text-xs font-bold text-[#006c49] uppercase">
                {activePhotoModal.label}
              </span>
              <p className="text-sm text-[#191c19]">{activePhotoModal.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
