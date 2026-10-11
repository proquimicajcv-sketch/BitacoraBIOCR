import React, { useState } from 'react';
import { SpecimenRecord } from '../types/specimen';
import {
  formatDarwinCoreRecord,
  exportDarwinCoreJson,
  exportDarwinCoreCsv,
} from '../utils/darwinCoreExport';

interface DarwinCoreExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen?: SpecimenRecord;
  allSpecimens: SpecimenRecord[];
}

export const DarwinCoreExporterModal: React.FC<DarwinCoreExporterModalProps> = ({
  isOpen,
  onClose,
  specimen,
  allSpecimens,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'single' | 'all'>('single');
  const targetSpecimen = specimen || allSpecimens[0];
  const dwcRecord = targetSpecimen ? formatDarwinCoreRecord(targetSpecimen) : null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#c1c8c3] overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#002217] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6cf8bb] text-[24px]">cloud_sync</span>
            <div>
              <h2 className="font-bold text-[16px] leading-tight">
                Estándar Darwin Core (GBIF / TDWG)
              </h2>
              <p className="text-[11px] text-[#79a28f] font-mono">
                Biodiversity Information Standards • WGS84 Georeferenced
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

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-2 border-b border-[#e1e3dd] flex items-center gap-2 bg-[#f8faf4]">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-[#002217] text-white shadow-sm'
                : 'text-[#414844] hover:bg-[#edefe9]'
            }`}
          >
            Ficha Actual ({targetSpecimen?.catalogNumber})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#002217] text-white shadow-sm'
                : 'text-[#414844] hover:bg-[#edefe9]'
            }`}
          >
            Colección Completa ({allSpecimens.length} Registros)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Compliance Status Badge */}
          <div className="p-3 rounded-xl bg-[#c1ecd7]/30 border border-[#006c49]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c49] text-[20px]">verified</span>
              <div>
                <p className="text-xs font-bold text-[#002116]">
                  Esquema Darwin Core Validado (Darwin Core Archive v1.4)
                </p>
                <p className="text-[11px] text-[#414844]">
                  Listo para interoperabilidad con GBIF, SiB Costa Rica y VertNet.
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#006c49] bg-[#6cf8bb]/40 px-2 py-0.5 rounded">
              DwC-A Sync
            </span>
          </div>

          {/* JSON Schema Viewer */}
          {activeTab === 'single' && dwcRecord && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs font-bold text-[#002217] uppercase">
                Metadatos Darwin Core Mapeados:
              </span>
              <div className="p-3 rounded-xl bg-[#0f382a] text-[#c1ecd7] font-mono text-[11px] overflow-x-auto max-h-60">
                <pre>{JSON.stringify(dwcRecord, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'all' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#002217]">
                Registros listos para exportación masiva en lote:
              </span>
              <div className="border border-[#e1e3dd] rounded-xl overflow-hidden divide-y divide-[#e1e3dd] max-h-56 overflow-y-auto">
                {allSpecimens.map((spec) => (
                  <div key={spec.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-[#002217]">{spec.catalogNumber}</span>
                      <span className="text-[#414844] italic ml-2">{spec.scientificName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#006c49] bg-[#edefe9] px-2 py-0.5 rounded">
                      {spec.georeference.locality.split(',')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                if (activeTab === 'single' && targetSpecimen) {
                  exportDarwinCoreJson(targetSpecimen);
                } else {
                  exportDarwinCoreCsv(allSpecimens);
                }
              }}
              className="py-2.5 px-4 rounded-xl bg-[#002217] hover:bg-[#0f382a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#6cf8bb]">download</span>
              <span>{activeTab === 'single' ? 'Descargar JSON-LD DwC' : 'Descargar Archivo CSV Completo'}</span>
            </button>

            <button
              onClick={() => exportDarwinCoreCsv(activeTab === 'single' && targetSpecimen ? [targetSpecimen] : allSpecimens)}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#f2f4ee] text-[#002217] border border-[#c1c8c3] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#006c49]">table_view</span>
              <span>Descargar Tabla CSV Darwin Core</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
