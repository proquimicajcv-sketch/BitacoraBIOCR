import React, { useState } from 'react';
import { SpecimenRecord, TaxonGroup } from '../types/specimen';

interface SpecimenCatalogViewProps {
  specimens: SpecimenRecord[];
  onSelectSpecimen: (specimen: SpecimenRecord) => void;
  onOpenNew: () => void;
  onOpenMap: () => void;
  onOpenDarwinCore: () => void;
}

export const SpecimenCatalogView: React.FC<SpecimenCatalogViewProps> = ({
  specimens,
  onSelectSpecimen,
  onOpenNew,
  onOpenMap,
  onOpenDarwinCore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const filtered = specimens.filter((spec) => {
    const matchesGroup = selectedGroup === 'ALL' || spec.taxonGroup === selectedGroup;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      spec.scientificName.toLowerCase().includes(query) ||
      spec.commonName.toLowerCase().includes(query) ||
      spec.catalogNumber.toLowerCase().includes(query) ||
      spec.georeference.locality.toLowerCase().includes(query);
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8faf4] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 inset-x-0 z-40 bg-[#f8faf4]/90 backdrop-blur-xl border-b border-[#e1e3dd]">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#002217] flex items-center justify-center text-[#6cf8bb]">
              <span className="material-symbols-outlined text-[20px]">biotech</span>
            </div>
            <div>
              <h1 className="font-bold text-[18px] text-[#002217] tracking-tight leading-tight">
                BioBitácora Costa Rica
              </h1>
              <p className="text-[11px] text-[#414844] font-mono">
                Registro de Biodiversidad &amp; Canopy GIS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMap}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3] text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#006c49]">map</span>
              <span className="hidden sm:inline">Mapa Costa Rica</span>
            </button>
            <button
              onClick={onOpenNew}
              className="px-3.5 py-1.5 rounded-xl bg-[#002217] hover:bg-[#0f382a] text-white text-xs font-bold flex items-center gap-1 shadow active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">add</span>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        {/* Banner with Stats & Darwin Core pill */}
        <div className="p-4 rounded-2xl bg-[#0f382a] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-[#6cf8bb] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
              Base de Datos Científica Activa
            </span>
            <h2 className="text-[20px] font-bold leading-tight">
              Catálogo de Especímenes y Registros de Campo
            </h2>
            <p className="text-xs text-[#79a28f]">
              {specimens.length} especímenes curados • Sistema WGS84 • Interoperable con GBIF y SiB CR
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onOpenDarwinCore}
              className="px-3 py-2 rounded-xl bg-[#002217] hover:bg-black text-[#c1ecd7] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#6cf8bb]/30 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">download</span>
              <span>Exportar Darwin Core</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#717974] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre científico, común, localidad o catálogo..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#c1c8c3] text-xs text-[#191c19] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717974] hover:text-[#191c19]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Taxon Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'Amphibia', label: 'Anfibios' },
              { id: 'Aves', label: 'Aves' },
              { id: 'Mammalia', label: 'Mamíferos' },
              { id: 'Insecta', label: 'Insectos' },
              { id: 'Reptilia', label: 'Reptiles' },
            ].map((tax) => (
              <button
                key={tax.id}
                onClick={() => setSelectedGroup(tax.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGroup === tax.id
                    ? 'bg-[#002217] text-white shadow-sm'
                    : 'bg-white text-[#414844] border border-[#c1c8c3]/60 hover:bg-[#edefe9]'
                }`}
              >
                {tax.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specimen Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filtered.map((specimen) => (
            <div
              key={specimen.id}
              onClick={() => onSelectSpecimen(specimen)}
              className="bg-white rounded-2xl border border-[#c1c8c3]/70 overflow-hidden shadow-sm hover:shadow-md hover:border-[#006c49]/50 transition-all cursor-pointer flex flex-col group"
            >
              {/* Card Photo Header */}
              <div className="relative w-full h-44 bg-[#0f382a] overflow-hidden">
                <img
                  src={specimen.heroImage}
                  alt={specimen.scientificName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Catalog Pill */}
                <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md text-[#002217] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {specimen.catalogNumber}
                </span>

                {/* Taxon & Realm Badge */}
                <span className="absolute top-2.5 right-2.5 bg-[#002217]/80 backdrop-blur-md text-[#6cf8bb] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {specimen.taxonGroup}
                </span>

                {/* Bottom title on photo */}
                <div className="absolute bottom-2 inset-x-2.5 text-white">
                  <h3 className="text-[16px] font-bold italic tracking-tight leading-snug drop-shadow-sm">
                    {specimen.scientificName}
                  </h3>
                  <p className="text-[12px] opacity-90 truncate drop-shadow-sm">
                    {specimen.commonName}
                  </p>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between bg-white">
                <div className="flex flex-col gap-1.5">
                  {/* Location & Elevation */}
                  <div className="flex items-center gap-1.5 text-xs text-[#414844]">
                    <span className="material-symbols-outlined text-[16px] text-red-600 flex-shrink-0">
                      location_on
                    </span>
                    <span className="font-medium truncate text-[#191c19]">
                      {specimen.georeference.locality}
                    </span>
                    <span className="font-mono text-[11px] text-[#006c49] font-bold">
                      ({specimen.georeference.elevationMeters}m)
                    </span>
                  </div>

                  {/* Life Zone */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#414844]">
                    <span className="material-symbols-outlined text-[15px] text-[#006c49]">forest</span>
                    <span className="truncate">{specimen.georeference.lifeZone}</span>
                  </div>
                </div>

                {/* Footer with IUCN & Action */}
                <div className="pt-2 border-t border-[#e1e3dd] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#414844] flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-[10px]">
                      {specimen.iucnStatus.code}
                    </span>
                    <span className="truncate">{specimen.iucnStatus.label}</span>
                  </span>

                  <span className="text-[#006c49] font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>Ver Ficha</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#c1c8c3] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[#717974]">search_off</span>
            <h3 className="font-bold text-[#002217] text-base">No se encontraron especímenes</h3>
            <p className="text-xs text-[#414844]">
              Intente con otro término o grupo taxonómico, o registre un nuevo espécimen en el mapa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
