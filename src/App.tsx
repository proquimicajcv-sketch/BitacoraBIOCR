/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SpecimenRecord, BioacousticRecord } from './types/specimen';
import { INITIAL_SPECIMENS } from './data/initialSpecimens';
import { CoverLandingView } from './components/CoverLandingView';
import { SpecimenDetailView } from './components/SpecimenDetailView';
import { CostaRicaMap } from './components/CostaRicaMap';
import { NewSpecimenModal } from './components/NewSpecimenModal';
import { SpecimenCatalogView } from './components/SpecimenCatalogView';
import { DarwinCoreExporterModal } from './components/DarwinCoreExporterModal';
import { SyncBackupModal } from './components/SyncBackupModal';

type ActiveView = 'COVER' | 'DETAIL' | 'MAP' | 'CATALOG';

export default function App() {
  const [specimens, setSpecimens] = useState<SpecimenRecord[]>(() => {
    try {
      const saved = localStorage.getItem('biobitacora_cr_specimens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_SPECIMENS;
  });

  const [currentSpecimen, setCurrentSpecimen] = useState<SpecimenRecord>(specimens[0]);
  const [activeView, setActiveView] = useState<ActiveView>('COVER');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingSpecimen, setEditingSpecimen] = useState<SpecimenRecord | null>(null);
  const [isDwcModalOpen, setIsDwcModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [presetNewCoords, setPresetNewCoords] = useState<{
    lat: number;
    lng: number;
    locality?: string;
    lifeZone?: string;
  } | undefined>(undefined);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('biobitacora_cr_specimens', JSON.stringify(specimens));
    } catch {
      // Ignore
    }
  }, [specimens]);

  // Initial attempt to load shared database from server (cross-device persistence)
  useEffect(() => {
    fetch('/api/database/specimens')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // If local has only initial specimens or fewer, update with server persistent database
          setSpecimens((local) => {
            if (local.length <= INITIAL_SPECIMENS.length) {
              return data.data;
            }
            return local;
          });
        }
      })
      .catch((err) => console.log('Offline or server database unreachable:', err));
  }, []);

  // Handle saving new or edited specimen
  const handleSaveSpecimen = (savedSpecimen: SpecimenRecord) => {
    setSpecimens((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === savedSpecimen.id);
      let updated: SpecimenRecord[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = savedSpecimen;
      } else {
        updated = [savedSpecimen, ...prev];
      }

      // Automatically background-save to server database
      fetch('/api/database/specimens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens: updated }),
      }).catch(() => {});

      return updated;
    });

    setCurrentSpecimen(savedSpecimen);
    setActiveView('DETAIL');
    setEditingSpecimen(null);
  };

  // Handle deleting specimen
  const handleDeleteSpecimen = (specimenId: string) => {
    setSpecimens((prev) => {
      const filtered = prev.filter((s) => s.id !== specimenId);
      if (currentSpecimen.id === specimenId) {
        if (filtered.length > 0) {
          setCurrentSpecimen(filtered[0]);
        } else {
          setCurrentSpecimen(INITIAL_SPECIMENS[0]);
        }
        setActiveView('CATALOG');
      }

      // Sync deletion to server
      fetch('/api/database/specimens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens: filtered }),
      }).catch(() => {});

      return filtered;
    });
  };

  // Handle updating or suppressing bioacoustics directly
  const handleUpdateBioacoustics = (specimenId: string, bioacoustics?: BioacousticRecord) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id === specimenId) {
          const updated = { ...s, bioacoustics };
          if (currentSpecimen.id === specimenId) {
            setCurrentSpecimen(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  // Handle importing JSON records
  const handleImportSpecimens = (imported: SpecimenRecord[], replace: boolean) => {
    let result: SpecimenRecord[];
    if (replace) {
      result = imported;
    } else {
      const existingIds = new Set(specimens.map((s) => s.id));
      const uniqueNew = imported.filter((s) => !existingIds.has(s.id));
      result = [...specimens, ...uniqueNew];
    }
    setSpecimens(result);
    if (result.length > 0) {
      setCurrentSpecimen(result[0]);
    }
    // Save to server
    fetch('/api/database/specimens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specimens: result }),
    }).catch(() => {});
  };

  // Server sync action
  const handleSyncServer = async () => {
    setIsSyncingServer(true);
    try {
      const res = await fetch('/api/database/specimens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`¡Sincronización exitosa! ${specimens.length} registros guardados en el servidor para cualquier dispositivo.`);
      } else {
        alert('No se pudo guardar en el servidor: ' + data.error);
      }
    } catch (err: any) {
      alert('Error de conexión con el servidor. Estás en modo offline; tus datos siguen guardados localmente.');
    } finally {
      setIsSyncingServer(false);
    }
  };

  const handleOpenEdit = (specimen: SpecimenRecord) => {
    setEditingSpecimen(specimen);
    setIsNewModalOpen(true);
  };

  const handleOpenNewFromCoords = (coords: {
    lat: number;
    lng: number;
    locality: string;
    lifeZone: string;
  }) => {
    setEditingSpecimen(null);
    setPresetNewCoords(coords);
    setIsNewModalOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8faf4] text-[#191c19] flex flex-col font-sans">
      {/* Dynamic View Display */}
      <main className="flex-1 w-full flex flex-col">
        {activeView === 'COVER' && (
          <CoverLandingView
            currentSpecimen={currentSpecimen}
            specimensCount={specimens.length}
            onOpenDetail={() => setActiveView('DETAIL')}
            onOpenMap={() => setActiveView('MAP')}
            onOpenCatalog={() => setActiveView('CATALOG')}
            onOpenNewSpecimen={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            onOpenSyncBackup={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeView === 'DETAIL' && (
          <SpecimenDetailView
            specimen={currentSpecimen}
            onBack={() => setActiveView('CATALOG')}
            onEdit={handleOpenEdit}
            onOpenMap={(spec) => {
              setCurrentSpecimen(spec);
              setActiveView('MAP');
            }}
            onOpenDarwinCoreModal={(spec) => {
              setCurrentSpecimen(spec);
              setIsDwcModalOpen(true);
            }}
            onDelete={handleDeleteSpecimen}
            onUpdateBioacoustics={handleUpdateBioacoustics}
          />
        )}

        {activeView === 'MAP' && (
          <div className="flex flex-col w-full h-[calc(100vh-64px)] relative">
            {/* Map Header */}
            <div className="h-14 px-4 bg-[#002217] text-white flex items-center justify-between z-30">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('DETAIL')}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white cursor-pointer"
                  title="Volver a la ficha de espécimen"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#6cf8bb] text-[20px]">travel_explore</span>
                  <h2 className="font-bold text-sm tracking-tight">
                    SIG de Biodiversidad Costa Rica
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#6cf8bb] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Respaldo JSON y sincronización"
                >
                  <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSpecimen(null);
                    setPresetNewCoords(undefined);
                    setIsNewModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#6cf8bb] text-[#002116] font-bold text-xs flex items-center gap-1 shadow hover:bg-[#a5d0bc] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                  <span className="hidden sm:inline">Nuevo Registro</span>
                </button>
              </div>
            </div>

            {/* Full Costa Rica Map */}
            <div className="flex-1 w-full h-full relative">
              <CostaRicaMap
                specimens={specimens}
                onSelectSpecimen={(spec) => {
                  setCurrentSpecimen(spec);
                  setActiveView('DETAIL');
                }}
                onOpenNewSpecimen={handleOpenNewFromCoords}
                initialCoords={{
                  lat: currentSpecimen.georeference.latitude,
                  lng: currentSpecimen.georeference.longitude,
                }}
              />
            </div>
          </div>
        )}

        {activeView === 'CATALOG' && (
          <SpecimenCatalogView
            specimens={specimens}
            onSelectSpecimen={(spec) => {
              setCurrentSpecimen(spec);
              setActiveView('DETAIL');
            }}
            onOpenNew={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            onOpenMap={() => setActiveView('MAP')}
            onOpenDarwinCore={() => setIsDwcModalOpen(true)}
            onOpenSyncBackup={() => setIsSyncModalOpen(true)}
            onDeleteSpecimen={handleDeleteSpecimen}
          />
        )}
      </main>

      {/* Bottom Global Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#f8faf4]/95 backdrop-blur-xl border-t border-[#c1c8c3]/40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="h-16 max-w-lg mx-auto px-3 flex items-center justify-between">
          <button
            onClick={() => setActiveView('COVER')}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'COVER'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[21px] ${
                activeView === 'COVER' ? 'text-[#006c49]' : ''
              }`}
            >
              cottage
            </span>
            <span>Portada</span>
          </button>

          <button
            onClick={() => setActiveView('DETAIL')}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'DETAIL'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[21px] ${
                activeView === 'DETAIL' ? 'text-[#006c49]' : ''
              }`}
            >
              description
            </span>
            <span>Ficha</span>
          </button>

          {/* Central Add Button */}
          <button
            onClick={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            className="w-11 h-11 -mt-4 rounded-full bg-[#002217] hover:bg-[#0f382a] text-[#6cf8bb] flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-white"
            title="Registrar nuevo espécimen con GPS o mapa offline"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          <button
            onClick={() => setActiveView('MAP')}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'MAP'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[21px] ${
                activeView === 'MAP' ? 'text-[#006c49]' : ''
              }`}
            >
              map
            </span>
            <span>Mapa CR</span>
          </button>

          <button
            onClick={() => setActiveView('CATALOG')}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'CATALOG'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[21px] ${
                activeView === 'CATALOG' ? 'text-[#006c49]' : ''
              }`}
            >
              grid_view
            </span>
            <span>Colección</span>
          </button>

          {/* Respaldo JSON y Sincronización */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-[#717974] hover:text-[#002217] transition-all cursor-pointer"
            title="Respaldo JSON y Sincronización multi-dispositivo"
          >
            <span className="material-symbols-outlined text-[21px] text-[#006c49]">sync_saved_locally</span>
            <span>Respaldo</span>
          </button>
        </div>
      </nav>

      {/* New / Edit Specimen Modal */}
      <NewSpecimenModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingSpecimen(null);
          setPresetNewCoords(undefined);
        }}
        onSave={handleSaveSpecimen}
        onDelete={handleDeleteSpecimen}
        initialCoords={presetNewCoords}
        editingSpecimen={editingSpecimen}
      />

      {/* Darwin Core Exporter Modal */}
      <DarwinCoreExporterModal
        isOpen={isDwcModalOpen}
        onClose={() => setIsDwcModalOpen(false)}
        specimen={currentSpecimen}
        allSpecimens={specimens}
      />

      {/* Sync & Backup JSON Modal */}
      <SyncBackupModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        specimens={specimens}
        onImportSpecimens={handleImportSpecimens}
        onSyncServer={handleSyncServer}
        isSyncingServer={isSyncingServer}
      />
    </div>
  );
}
