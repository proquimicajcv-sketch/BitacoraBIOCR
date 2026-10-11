import React, { useState, useMemo } from 'react';
import { SpecimenRecord, TaxonGroup } from '../types/specimen';

interface StatisticsViewProps {
  specimens: SpecimenRecord[];
  onSelectSpecimen: (specimen: SpecimenRecord) => void;
  onOpenCatalog: () => void;
  onOpenNewSpecimen: () => void;
  onGoHome?: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  specimens,
  onSelectSpecimen,
  onOpenCatalog,
  onOpenNewSpecimen,
  onGoHome,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [sortBy, setSortBy] = useState<'individuals' | 'sightings' | 'name'>('individuals');

  // Aggregated calculations
  const stats = useMemo(() => {
    let totalIndividuals = 0;
    let totalSightings = 0;

    const groupCounts: Record<string, { speciesCount: number; individualsCount: number; sightingsCount: number }> = {
      Mammalia: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Amphibia: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Reptilia: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Plantae: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Aves: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Insecta: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
      Otros: { speciesCount: 0, individualsCount: 0, sightingsCount: 0 },
    };

    const lifeZoneCounts: Record<string, number> = {};
    const iucnCounts: Record<string, number> = {};
    const elevationBins = {
      'Basal (0 - 500 m)': 0,
      'Premontano (501 - 1,500 m)': 0,
      'Montano Bajo (1,501 - 2,500 m)': 0,
      'Montano (> 2,500 m)': 0,
    };
    const families = new Set<string>();

    specimens.forEach((spec) => {
      // Group
      const g = groupCounts[spec.taxonGroup] ? spec.taxonGroup : 'Otros';
      groupCounts[g].speciesCount += 1;

      // Sightings & Individuals
      const sightings = spec.sightings || [];
      const specSightingsCount = sightings.length;
      let specIndividuals = 0;

      if (sightings.length > 0) {
        sightings.forEach((s) => {
          specIndividuals += s.individualsCount || 1;
        });
      } else {
        // At least 1 individual represented by the specimen record itself
        specIndividuals = 1;
      }

      groupCounts[g].sightingsCount += specSightingsCount;
      groupCounts[g].individualsCount += specIndividuals;

      totalIndividuals += specIndividuals;
      totalSightings += specSightingsCount;

      // Life zones
      const lz = spec.georeference.lifeZone || 'No especificada';
      // simplify name for chart
      const simplifiedLz = lz.split('(')[0].trim();
      lifeZoneCounts[simplifiedLz] = (lifeZoneCounts[simplifiedLz] || 0) + 1;

      // IUCN
      const iucn = spec.iucnStatus?.code || 'DD';
      iucnCounts[iucn] = (iucnCounts[iucn] || 0) + 1;

      // Elevation
      const elev = spec.georeference.elevationMeters || 0;
      if (elev <= 500) elevationBins['Basal (0 - 500 m)'] += 1;
      else if (elev <= 1500) elevationBins['Premontano (501 - 1,500 m)'] += 1;
      else if (elev <= 2500) elevationBins['Montano Bajo (1,501 - 2,500 m)'] += 1;
      else elevationBins['Montano (> 2,500 m)'] += 1;

      // Family
      if (spec.taxonomy?.family) {
        families.add(spec.taxonomy.family);
      }
    });

    return {
      totalSpecies: specimens.length,
      totalIndividuals,
      totalSightings,
      uniqueFamiliesCount: families.size,
      groupCounts,
      lifeZoneCounts,
      iucnCounts,
      elevationBins,
      lifeZonesSampledCount: Object.keys(lifeZoneCounts).length,
    };
  }, [specimens]);

  // Taxon group definitions with color schemes & icons
  const taxonGroupsMeta = [
    {
      key: 'Mammalia',
      label: 'Mamíferos',
      icon: 'pets',
      color: '#f59e0b',
      bgLight: '#fef3c7',
      border: '#fde68a',
    },
    {
      key: 'Amphibia',
      label: 'Anfibios',
      icon: 'flutter_dash',
      color: '#10b981',
      bgLight: '#d1fae5',
      border: '#a7f3d0',
    },
    {
      key: 'Reptilia',
      label: 'Reptiles',
      icon: 'pest_control',
      color: '#e11d48',
      bgLight: '#ffe4e6',
      border: '#fecdd3',
    },
    {
      key: 'Aves',
      label: 'Aves',
      icon: 'cruelty_free',
      color: '#0284c7',
      bgLight: '#e0f2fe',
      border: '#bae6fd',
    },
    {
      key: 'Plantae',
      label: 'Plantas / Flora',
      icon: 'local_florist',
      color: '#16a34a',
      bgLight: '#dcfce7',
      border: '#bbf7d0',
    },
    {
      key: 'Insecta',
      label: 'Insectos / Artrópodos',
      icon: 'bug_report',
      color: '#8b5cf6',
      bgLight: '#ede9fe',
      border: '#ddd6fe',
    },
  ];

  // Filtered specimen list for numerical table
  const tableData = useMemo(() => {
    return specimens
      .map((spec) => {
        const sightings = spec.sightings || [];
        const individuals = sightings.reduce((acc, s) => acc + (s.individualsCount || 1), sightings.length > 0 ? 0 : 1);
        return {
          specimen: spec,
          individuals,
          sightingsCount: sightings.length,
          relativeAbundance: stats.totalIndividuals > 0 ? ((individuals / stats.totalIndividuals) * 100).toFixed(1) : '0.0',
        };
      })
      .filter((item) => {
        const matchesGroup = selectedGroupFilter === 'ALL' || item.specimen.taxonGroup === selectedGroupFilter;
        const q = searchTableQuery.toLowerCase();
        const matchesQuery =
          !q ||
          item.specimen.scientificName.toLowerCase().includes(q) ||
          item.specimen.commonName.toLowerCase().includes(q) ||
          item.specimen.georeference.locality.toLowerCase().includes(q);
        return matchesGroup && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'individuals') return b.individuals - a.individuals;
        if (sortBy === 'sightings') return b.sightingsCount - a.sightingsCount;
        return a.specimen.scientificName.localeCompare(b.specimen.scientificName);
      });
  }, [specimens, selectedGroupFilter, searchTableQuery, sortBy, stats.totalIndividuals]);

  // Export report as TXT
  const handleExportTextReport = () => {
    const dateStr = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `=====================================================================\n`;
    text += `BIOBITÁCORA COSTA RICA - INFORME ESTADÍSTICO DE BIODIVERSIDAD\n`;
    text += `Plataforma diseñada y elaborada por: Ing. Jorge Carvajal V.\n`;
    text += `Fecha de emisión: ${dateStr}\n`;
    text += `=====================================================================\n\n`;
    text += `RESUMEN GENERAL CUANTITATIVO:\n`;
    text += `- Especímenes Registrados: ${stats.totalSpecies}\n`;
    text += `- Individuos Totales Contabilizados: ${stats.totalIndividuals}\n`;
    text += `- Entradas de Avistamientos en Campo: ${stats.totalSightings}\n`;
    text += `- Zonas de Vida de Holdridge Muestreadas: ${stats.lifeZonesSampledCount}\n`;
    text += `- Familias Taxonómicas Representadas: ${stats.uniqueFamiliesCount}\n\n`;

    text += `CONTEO Y DISTRIBUCIÓN POR GRUPO TAXONÓMICO:\n`;
    taxonGroupsMeta.forEach((g) => {
      const data = stats.groupCounts[g.key] || { speciesCount: 0, individualsCount: 0, sightingsCount: 0 };
      const pct = stats.totalSpecies > 0 ? ((data.speciesCount / stats.totalSpecies) * 100).toFixed(1) : '0';
      text += `* ${g.label.toUpperCase()}:\n`;
      text += `  - Fichas / Especies: ${data.speciesCount} (${pct}% del inventario)\n`;
      text += `  - Individuos observados: ${data.individualsCount}\n`;
      text += `  - Avistamientos de campo: ${data.sightingsCount}\n\n`;
    });

    text += `DETALLE DE REGISTROS INDIVIDUALES:\n`;
    tableData.forEach((item, idx) => {
      text += `${idx + 1}. [${item.specimen.taxonGroup}] ${item.specimen.scientificName} ("${item.specimen.commonName}")\n`;
      text += `   Localidad: ${item.specimen.georeference.locality} | Elevación: ${item.specimen.georeference.elevationMeters} msnm\n`;
      text += `   Zona Holdridge: ${item.specimen.georeference.lifeZone}\n`;
      text += `   Avistamientos: ${item.sightingsCount} | Individuos: ${item.individuals} (${item.relativeAbundance}% abundancia relativa)\n`;
      text += `   Estado UICN: ${item.specimen.iucnStatus?.code || 'DD'} - ${item.specimen.iucnStatus?.label || 'No evaluado'}\n\n`;
    });

    text += `=====================================================================\n`;
    text += `Certificado por: Ing. Jorge Carvajal V. - BioBitácora CR\n`;
    text += `=====================================================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Estadistico_Biodiversidad_Ing_Jorge_Carvajal_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8faf4] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 inset-x-0 z-40 bg-[#f8faf4]/90 backdrop-blur-xl border-b border-[#e1e3dd]">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left hover:opacity-85 transition-all cursor-pointer group"
            title="Ir a Inicio / Portada"
          >
            <div className="w-10 h-10 rounded-xl bg-[#002217] flex items-center justify-center text-[#6cf8bb] shadow-md group-hover:bg-[#006c49] transition-colors">
              <span className="material-symbols-outlined text-[22px]">cottage</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-[18px] text-[#002217] tracking-tight leading-tight group-hover:text-[#006c49] transition-colors">
                  Estadísticas &amp; Conteos
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#006c49]/10 text-[#006c49] text-[10px] font-mono font-bold">
                  Inicio
                </span>
              </div>
              <p className="text-[11px] text-[#414844]">
                Elaborado por: <strong className="text-[#006c49] font-bold">Ing. Jorge Carvajal V.</strong>
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTextReport}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Descargar informe completo en texto"
            >
              <span className="material-symbols-outlined text-[16px] text-[#006c49]">download</span>
              <span className="hidden sm:inline">Descargar Informe</span>
            </button>
            <button
              onClick={onOpenCatalog}
              className="px-3 py-1.5 rounded-xl bg-[#002217] hover:bg-[#0f382a] text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">grid_view</span>
              <span>Ver Colección</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 pt-4 flex flex-col gap-6">
        {/* Banner with Author Certificate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#002217] via-[#093525] to-[#002217] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#6cf8bb]/20">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#6cf8bb]/20 text-[#6cf8bb] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border border-[#6cf8bb]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6cf8bb] animate-pulse" />
                Auditoría Científica de Biodiversidad
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              Control Numérico de Especies &amp; Avistamientos
            </h2>
            <p className="text-xs text-[#a5d0bc] leading-relaxed">
              Monitoreo continuo de individuos observados, frecuencia de avistamientos, representación por taxón
              y zonas de vida de Holdridge en Costa Rica.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end bg-black/30 backdrop-blur-md p-3 rounded-xl border border-white/10 flex-shrink-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a5d0bc]">
              Ingeniero a Cargo
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <span className="material-symbols-outlined text-[#6cf8bb] text-[18px]">verified</span>
              Ing. Jorge Carvajal V.
            </span>
            <span className="text-[10px] text-[#717974] mt-0.5">
              Sistema BioBitácora Costa Rica
            </span>
          </div>
        </div>

        {/* Big Numbers KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Especímenes Totales */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#414844]">Especímenes</span>
              <span className="material-symbols-outlined text-[#006c49] text-[18px]">menu_book</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#002217]">{stats.totalSpecies}</span>
              <span className="block text-[10px] text-[#717974]">Fichas catalogadas</span>
            </div>
          </div>

          {/* Card 2: Individuos Contados */}
          <div className="p-3.5 rounded-2xl bg-[#002217] text-white shadow-sm flex flex-col justify-between border border-[#6cf8bb]/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#a5d0bc]">Individuos Totales</span>
              <span className="material-symbols-outlined text-[#6cf8bb] text-[18px]">groups</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#6cf8bb]">{stats.totalIndividuals}</span>
              <span className="block text-[10px] text-[#c1ecd7]">Ejemplares en campo</span>
            </div>
          </div>

          {/* Card 3: Avistamientos Registrados */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#414844]">Avistamientos</span>
              <span className="material-symbols-outlined text-[#0284c7] text-[18px]">visibility</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#002217]">{stats.totalSightings}</span>
              <span className="block text-[10px] text-[#717974]">Entradas de campo</span>
            </div>
          </div>

          {/* Card 4: Zonas Holdridge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#414844]">Zonas Holdridge</span>
              <span className="material-symbols-outlined text-[#16a34a] text-[18px]">landscape</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#002217]">{stats.lifeZonesSampledCount}</span>
              <span className="block text-[10px] text-[#717974]">de 13 en Costa Rica</span>
            </div>
          </div>

          {/* Card 5: Familias Taxonómicas */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#414844]">Familias</span>
              <span className="material-symbols-outlined text-[#8b5cf6] text-[18px]">account_tree</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#002217]">{stats.uniqueFamiliesCount}</span>
              <span className="block text-[10px] text-[#717974]">Taxonomías únicas</span>
            </div>
          </div>

          {/* Card 6: Conteo Aves & Mamíferos */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#414844]">Vertebrados</span>
              <span className="material-symbols-outlined text-[#f59e0b] text-[18px]">cruelty_free</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#002217]">
                {(stats.groupCounts['Amphibia']?.speciesCount || 0) +
                  (stats.groupCounts['Reptilia']?.speciesCount || 0) +
                  (stats.groupCounts['Aves']?.speciesCount || 0) +
                  (stats.groupCounts['Mammalia']?.speciesCount || 0)}
              </span>
              <span className="block text-[10px] text-[#717974]">Fauna mayor registrada</span>
            </div>
          </div>
        </section>

        {/* Section: Conteo Desglosado por Taxón (Requerimiento explícito: Mamíferos, Anfibios, Reptiles, Plantas, Aves, etc.) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-base text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">category</span>
                Conteo por Grupo Taxonómico (Mamíferos, Anfibios, Reptiles, Plantas, Aves, Insectos)
              </h3>
              <p className="text-xs text-[#717974]">
                Haz clic en cualquier grupo para filtrar automáticamente la tabla de control inferior
              </p>
            </div>
            {selectedGroupFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedGroupFilter('ALL')}
                className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                <span>Mostrar Todos los Grupos</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {taxonGroupsMeta.map((group) => {
              const data = stats.groupCounts[group.key] || { speciesCount: 0, individualsCount: 0, sightingsCount: 0 };
              const percentage = stats.totalSpecies > 0 ? ((data.speciesCount / stats.totalSpecies) * 100).toFixed(1) : '0';
              const isSelected = selectedGroupFilter === group.key;

              return (
                <div
                  key={group.key}
                  onClick={() => setSelectedGroupFilter(isSelected ? 'ALL' : group.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'bg-white ring-2 ring-[#006c49] border-[#006c49]'
                      : 'bg-white border-[#c1c8c3]/70 hover:border-[#006c49]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: group.bgLight, color: group.color }}
                      >
                        <span className="material-symbols-outlined text-[22px]">{group.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#002217]">{group.label}</h4>
                        <span className="text-[10px] text-[#717974] font-mono">{group.key}</span>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono"
                      style={{ backgroundColor: group.bgLight, color: group.color }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {/* Quantitative numbers */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f0f2ec] text-center">
                    <div>
                      <span className="text-[10px] text-[#717974] block">Especies</span>
                      <strong className="text-base font-extrabold text-[#002217]">{data.speciesCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#717974] block">Individuos</span>
                      <strong className="text-base font-extrabold text-[#002217]">{data.individualsCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#717974] block">Avistamientos</span>
                      <strong className="text-base font-extrabold text-[#002217]">{data.sightingsCount}</strong>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#f0f2ec] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(Number(percentage), 3)}%`,
                        backgroundColor: group.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Gráficas de Biodiversidad (Bar Charts + Holdridge + IUCN) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfica 1: Proporción por Taxón */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">bar_chart</span>
                Gráfica: Proporción por Taxón
              </h4>
              <span className="text-[11px] text-[#717974] font-mono">{stats.totalSpecies} especies</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {taxonGroupsMeta.map((group) => {
                const data = stats.groupCounts[group.key] || { speciesCount: 0, individualsCount: 0 };
                const pct = stats.totalSpecies > 0 ? (data.speciesCount / stats.totalSpecies) * 100 : 0;

                return (
                  <div key={group.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#191c19] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.label}
                      </span>
                      <span className="font-mono text-[#414844] font-bold">
                        {data.speciesCount} ({pct.toFixed(1)}%) • {data.individualsCount} inds.
                      </span>
                    </div>
                    <div className="w-full bg-[#f0f2ec] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, data.speciesCount > 0 ? 5 : 0)}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfica 2: Distribución por Zonas de Vida Holdridge */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16a34a]">landscape</span>
                Gráfica: Zonas de Vida de Holdridge
              </h4>
              <span className="text-[11px] text-[#717974] font-mono">
                {stats.lifeZonesSampledCount} zonas muestreadas
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {Object.entries(stats.lifeZoneCounts).map(([zone, count], idx) => {
                const colors = ['#006c49', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981', '#e11d48'];
                const color = colors[idx % colors.length];
                const pct = stats.totalSpecies > 0 ? (count / stats.totalSpecies) * 100 : 0;

                return (
                  <div key={zone} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#191c19] truncate max-w-[220px]" title={zone}>
                        {zone}
                      </span>
                      <span className="font-mono text-[#414844] font-bold">
                        {count} {count === 1 ? 'registro' : 'registros'} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f0f2ec] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 6)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfica 3: Estado de Conservación UICN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e11d48]">shield</span>
                Gráfica: Estado UICN de Conservación
              </h4>
              <span className="text-[11px] text-[#717974] font-mono">Listas Rojas CR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { code: 'LC', label: 'Preocupación Menor', color: '#10b981', bg: '#d1fae5' },
                { code: 'NT', label: 'Casi Amenazado', color: '#f59e0b', bg: '#fef3c7' },
                { code: 'VU', label: 'Vulnerable', color: '#ea580c', bg: '#ffedd5' },
                { code: 'EN', label: 'En Peligro', color: '#dc2626', bg: '#fee2e2' },
              ].map((item) => {
                const count = stats.iucnCounts[item.code] || 0;
                const pct = stats.totalSpecies > 0 ? ((count / stats.totalSpecies) * 100).toFixed(0) : '0';

                return (
                  <div
                    key={item.code}
                    className="p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 border"
                    style={{ backgroundColor: item.bg, borderColor: item.color }}
                  >
                    <span className="text-xs font-mono font-black" style={{ color: item.color }}>
                      {item.code}
                    </span>
                    <strong className="text-xl font-black text-[#002217]">{count}</strong>
                    <span className="text-[10px] text-[#414844] leading-tight font-medium">
                      {item.label}
                    </span>
                    <span className="text-[9px] font-mono text-[#717974]">{pct}% del total</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfica 4: Distribución Altitudinal de los Muestreos */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284c7]">altitude</span>
                Gráfica: Pisos Altitudinales (msnm)
              </h4>
              <span className="text-[11px] text-[#717974] font-mono">Gradiente Costa Rica</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {Object.entries(stats.elevationBins).map(([bin, count]) => {
                const pct = stats.totalSpecies > 0 ? (count / stats.totalSpecies) * 100 : 0;

                return (
                  <div key={bin} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#191c19]">{bin}</span>
                      <span className="font-mono text-[#414844] font-bold">
                        {count} especímenes ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f0f2ec] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0284c7] transition-all duration-700"
                        style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section: Tabla de Control Numérico de Especies */}
        <section className="p-4 sm:p-5 rounded-2xl bg-white border border-[#c1c8c3]/70 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[#002217] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">table_rows</span>
                Tabla de Auditoría Numérica por Especie
              </h3>
              <p className="text-xs text-[#717974]">
                Cantidades, conteos de avistamientos e individuos observados por ejemplar
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#717974] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  placeholder="Buscar en tabla..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#f0f2ec] text-xs text-[#191c19] focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-transparent w-44"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#717974] text-[11px]">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#f0f2ec] text-xs text-[#002217] font-semibold border-none focus:outline-none cursor-pointer"
                >
                  <option value="individuals">Mayor Cant. Individuos</option>
                  <option value="sightings">Más Avistamientos</option>
                  <option value="name">Nombre Científico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e1e3dd]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f0f2ec] text-[#414844] font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Especie / Taxonomía</th>
                  <th className="py-2.5 px-3">Grupo</th>
                  <th className="py-2.5 px-3 text-center">Avistamientos</th>
                  <th className="py-2.5 px-3 text-center">Individuos</th>
                  <th className="py-2.5 px-3 text-center">Abundancia Rel.</th>
                  <th className="py-2.5 px-3">Zona Holdridge</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2ec]">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#717974]">
                      No se encontraron especies con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => (
                    <tr
                      key={item.specimen.id}
                      className="hover:bg-[#f8faf4] transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.specimen.heroImage}
                            alt={item.specimen.scientificName}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-[#c1c8c3]"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold italic text-[#002217] truncate">
                              {item.specimen.scientificName}
                            </span>
                            <span className="text-[11px] text-[#717974] truncate">
                              {item.specimen.commonName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#f0f2ec] text-[#002217]">
                          {item.specimen.taxonGroup}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold font-mono text-[#0284c7]">
                          {item.sightingsCount}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold font-mono text-xs bg-[#006c49]/10 text-[#006c49]">
                          {item.individuals}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#414844]">
                        {item.relativeAbundance}%
                      </td>

                      <td className="py-2.5 px-3 text-[#414844] max-w-[180px] truncate" title={item.specimen.georeference.lifeZone}>
                        {item.specimen.georeference.lifeZone || 'No asignada'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectSpecimen(item.specimen)}
                          className="px-2.5 py-1 rounded-lg bg-[#002217] hover:bg-[#0f382a] text-[#6cf8bb] text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer info box */}
        <div className="p-4 rounded-xl bg-white border border-[#c1c8c3]/60 flex items-center justify-between text-xs text-[#717974] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#006c49]">verified_user</span>
            <span>
              Certificación de datos y conteos de biodiversidad • BioBitácora Costa Rica
            </span>
          </div>
          <span className="font-semibold text-[#002217]">
            Autor: Ing. Jorge Carvajal V.
          </span>
        </div>
      </main>
    </div>
  );
};
