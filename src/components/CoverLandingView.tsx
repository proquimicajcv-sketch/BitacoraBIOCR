import React from 'react';
import { SpecimenRecord } from '../types/specimen';

interface CoverLandingViewProps {
  onOpenDetail: () => void;
  onOpenMap: () => void;
  onOpenCatalog: () => void;
  onOpenNewSpecimen: () => void;
  onOpenSyncBackup: () => void;
  specimensCount: number;
  currentSpecimen: SpecimenRecord;
}

export const CoverLandingView: React.FC<CoverLandingViewProps> = ({
  onOpenDetail,
  onOpenMap,
  onOpenCatalog,
  onOpenNewSpecimen,
  onOpenSyncBackup,
  specimensCount,
  currentSpecimen,
}) => {
  const coverImageUrl =
    currentSpecimen?.heroImage ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvI7_6fTqgfYbPLKbGn0dFeW7hmnuRolqzd7Q_i2tcUFhIQO5UPw2MQBrfoR_PjDM-c7sqT6CdtQVsyoIP_fnDU9RXrw8NvRVtpA7JOiYHRcmwErrYso4uiDIH7IO1HdniMZq4nm1LM36RywajGzBnMXJI6ZBv8MEGSO_anGlnFjpGLL2LtKkDeBkJ6bAZ8qKDSvDv2NczPj54ygoDcje8UU6V8oi7EG7ddl-wRYqrXNZecg1XCf3y';

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full flex flex-col justify-between overflow-hidden bg-[#00170f] text-white select-none">
      {/* Background High-Res Nature Hero Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 transform scale-105"
        style={{ backgroundImage: `url('${coverImageUrl}')` }}
      >
        {/* Multilayer gradient backdrop for maximum typographic contrast and jungle ambiance */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001a11] via-[#002217]/75 to-[#00140d]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(108,248,187,0.15),transparent_60%)]" />
      </div>

      {/* Top Header / Heraldic Bar */}
      <header className="relative z-10 px-5 pt-6 pb-2 max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#6cf8bb] shadow-lg">
            <span className="material-symbols-outlined text-[24px]">forest</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-widest text-[#6cf8bb] uppercase font-bold">
              República de Costa Rica
            </span>
            <span className="text-xs text-[#a5d0bc] font-medium tracking-wide">
              Sistema de Bitácora de Campo &amp; Taxonomía
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSyncBackup}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[#6cf8bb] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          title="Respaldo JSON y persistencia multi-dispositivo"
        >
          <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
          <span className="hidden sm:inline">Respaldo JSON</span>
        </button>
      </header>

      {/* Central Hero Body */}
      <div className="relative z-10 px-5 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6 my-auto">
        {/* Main Title & Scientific Identity */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6cf8bb]/15 border border-[#6cf8bb]/30 w-fit backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#6cf8bb] uppercase tracking-wider">
              Canopy Field Log • Versión de Campo
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            BioBitácora <span className="text-[#6cf8bb]">CR</span>
          </h1>

          <p className="text-sm sm:text-base text-[#e1e3dd] max-w-xl font-light leading-relaxed">
            Plataforma científica para registro biológico en Costa Rica con coordenadas WGS84,
            zonas de vida Holdridge, bioacústica de campo, asistencia IA y exportación estándar Darwin Core.
          </p>
        </div>

        {/* Featured Specimen Badge Card */}
        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#6cf8bb]/40 flex-shrink-0 shadow-inner">
              <img
                src={coverImageUrl}
                alt="Ejemplar portada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-[#6cf8bb] font-bold">
                {currentSpecimen.catalogNumber}
              </span>
              <h2 className="text-base font-bold italic text-white truncate">
                {currentSpecimen.scientificName}
              </h2>
              <span className="text-xs text-[#c1c8c3] truncate">
                {currentSpecimen.commonName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenDetail}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#6cf8bb] hover:bg-[#85f9c9] text-[#002116] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              <span>Abrir Ficha Científica</span>
            </button>
          </div>
        </div>

        {/* Primary Interactive Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Card 1: Nuevo Registro */}
          <button
            onClick={onOpenNewSpecimen}
            className="p-4 rounded-2xl bg-[#002e20]/80 hover:bg-[#003d2b] border border-[#6cf8bb]/30 backdrop-blur-md flex flex-col gap-2 text-left transition-all hover:scale-[1.02] shadow-lg group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6cf8bb]/20 text-[#6cf8bb] flex items-center justify-center group-hover:bg-[#6cf8bb] group-hover:text-[#002116] transition-colors">
              <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white flex items-center gap-1">
                Nuevo Registro en Campo
                <span className="material-symbols-outlined text-[16px] text-[#6cf8bb] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </span>
              <span className="text-xs text-[#a5d0bc]">
                Captura GPS en vivo o selección manual en mapa offline
              </span>
            </div>
          </button>

          {/* Card 2: Mapa SIG */}
          <button
            onClick={onOpenMap}
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md flex flex-col gap-2 text-left transition-all hover:scale-[1.02] shadow-lg group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#002116] transition-colors">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white flex items-center gap-1">
                Mapa SIG Costa Rica
                <span className="material-symbols-outlined text-[16px] text-white group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </span>
              <span className="text-xs text-[#c1c8c3]">
                Puntos calientes biológicos, capas satelitales y curvas de nivel
              </span>
            </div>
          </button>

          {/* Card 3: Colección & Catálogo */}
          <button
            onClick={onOpenCatalog}
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md flex flex-col gap-2 text-left transition-all hover:scale-[1.02] shadow-lg group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#002116] transition-colors">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white flex items-center gap-1">
                Colección &amp; Catálogo ({specimensCount})
                <span className="material-symbols-outlined text-[16px] text-white group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </span>
              <span className="text-xs text-[#c1c8c3]">
                Filtros por anfibios, aves, reptiles, mamíferos e insectos
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Scientific Status Bar */}
      <footer className="relative z-10 px-5 py-4 max-w-4xl mx-auto w-full border-t border-white/10 bg-black/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-[#a5d0bc]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">my_location</span>
            <span>CR: [9.7489° N, 83.7534° W]</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">landscape</span>
            <span>13 Zonas de Vida Holdridge</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">offline_pin</span>
            <span>Respaldo JSON 100% Offline</span>
          </div>
        </div>

        <button
          onClick={onOpenSyncBackup}
          className="text-[#6cf8bb] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">database</span>
          <span>Gestor de Datos JSON</span>
        </button>
      </footer>
    </div>
  );
};
