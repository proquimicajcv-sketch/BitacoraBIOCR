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
import { StatisticsView } from './components/StatisticsView';
import { DeviceProfileModal } from './components/DeviceProfileModal';

type ActiveView = 'COVER' | 'DETAIL' | 'MAP' | 'CATALOG' | 'STATISTICS';

const STORAGE_KEY = 'biobitacora_cr_specimens_v2';
const CHANGED_KEY = 'biobitacora_cr_has_user_changes';
const TIMESTAMP_KEY = 'biobitacora_cr_last_modified';
const DEVICE_ID_KEY = 'biobitacora_cr_device_id';
const OBSERVER_NAME_KEY = 'biobitacora_cr_observer_name';
const DEVICE_NAME_KEY = 'biobitacora_cr_device_name';

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      id = `DEV-${rand}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'DEV-LOCAL';
  }
}

export default function App() {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [observerName, setObserverName] = useState<string>(() => {
    try {
      return localStorage.getItem(OBSERVER_NAME_KEY) || 'Ing. Jorge Carvajal V.';
    } catch {
      return 'Ing. Jorge Carvajal V.';
    }
  });
  const [deviceName, setDeviceName] = useState<string>(() => {
    try {
      return localStorage.getItem(DEVICE_NAME_KEY) || 'Dispositivo de Campo';
    } catch {
      return 'Dispositivo de Campo';
    }
  });
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [syncStatusToast, setSyncStatusToast] = useState<string | null>(null);

  const [specimens, setSpecimens] = useState<SpecimenRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed: SpecimenRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Seamlessly upgrade Agalychnis sample to Isthmohyla nacientes if present
          parsed = parsed.map((item) =>
            item.scientificName === 'Agalychnis callidryas' || item.id === 'cr-bio-2024-8842'
              ? INITIAL_SPECIMENS[0]
              : item
          );
          return parsed;
        }
      }
      // Backward compatibility check with v1
      const oldSaved = localStorage.getItem('biobitacora_cr_specimens');
      if (oldSaved) {
        let parsed: SpecimenRecord[] = JSON.parse(oldSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed.map((item) =>
            item.scientificName === 'Agalychnis callidryas' || item.id === 'cr-bio-2024-8842'
              ? INITIAL_SPECIMENS[0]
              : item
          );
          return parsed;
        }
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

  // Centralized robust persistence helper (isolated per device)
  const persistSpecimens = (updated: SpecimenRecord[]) => {
    setSpecimens(updated);
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(TIMESTAMP_KEY, String(now));
      localStorage.setItem(CHANGED_KEY, 'true');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    // Isolated background-save to server keyed by this deviceId
    fetch('/api/database/specimens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specimens: updated, lastModified: now, deviceId }),
    }).catch(() => {});
  };

  // Check isolated server backup for THIS specific device ID if available (no cross-device mixing)
  useEffect(() => {
    const hasLocalChanges = localStorage.getItem(CHANGED_KEY) === 'true';
    const localTimestamp = Number(localStorage.getItem(TIMESTAMP_KEY) || '0');

    // Query server only for this device's backup
    fetch(`/api/database/specimens?deviceId=${encodeURIComponent(deviceId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.deviceId === deviceId && Array.isArray(data.data) && data.data.length > 0) {
          const serverTimestamp = Number(data.lastModified || '0');
          if (!hasLocalChanges || serverTimestamp > localTimestamp) {
            setSpecimens(data.data);
            if (data.data.length > 0) {
              setCurrentSpecimen(data.data[0]);
            }
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
              if (serverTimestamp) {
                localStorage.setItem(TIMESTAMP_KEY, String(serverTimestamp));
              }
            } catch {}
          }
        }
      })
      .catch((err) => console.log('Modo local/offline activo:', err));
  }, [deviceId]);

  // Handle saving new or edited specimen
  const handleSaveSpecimen = (savedSpecimen: SpecimenRecord) => {
    const existsIndex = specimens.findIndex((s) => s.id === savedSpecimen.id);
    let updated: SpecimenRecord[];
    if (existsIndex >= 0) {
      updated = [...specimens];
      updated[existsIndex] = savedSpecimen;
    } else {
      updated = [savedSpecimen, ...specimens];
    }

    persistSpecimens(updated);
    setCurrentSpecimen(savedSpecimen);
    setEditingSpecimen(null);
  };

  // Handle deleting specimen
  const handleDeleteSpecimen = (specimenId: string) => {
    const filtered = specimens.filter((s) => s.id !== specimenId);
    if (currentSpecimen.id === specimenId) {
      if (filtered.length > 0) {
        setCurrentSpecimen(filtered[0]);
      } else {
        setCurrentSpecimen(INITIAL_SPECIMENS[0]);
      }
      setActiveView('CATALOG');
    }

    persistSpecimens(filtered);
  };

  // Handle updating bioacoustics directly
  const handleUpdateBioacoustics = (specimenId: string, bioacoustics?: BioacousticRecord) => {
    const updated = specimens.map((s) => {
      if (s.id === specimenId) {
        const item = { ...s, bioacoustics };
        if (currentSpecimen.id === specimenId) {
          setCurrentSpecimen(item);
        }
        return item;
      }
      return s;
    });
    persistSpecimens(updated);
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
    persistSpecimens(result);
    if (result.length > 0) {
      setCurrentSpecimen(result[0]);
    }
  };

  // Server sync action (isolated per device)
  const handleSyncServer = async () => {
    setIsSyncingServer(true);
    try {
      const res = await fetch('/api/database/specimens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens, deviceId, lastModified: Date.now() }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusToast(`¡Copia de seguridad guardada! ${specimens.length} registros respaldados para ${deviceId}.`);
      } else {
        setSyncStatusToast('No se pudo guardar en el servidor: ' + data.error);
      }
    } catch {
      setSyncStatusToast('Estás en modo offline; tus datos siguen protegidos localmente en este equipo.');
    } finally {
      setIsSyncingServer(false);
      setTimeout(() => setSyncStatusToast(null), 4000);
    }
  };

  const handleResetToInitial = () => {
    persistSpecimens(INITIAL_SPECIMENS);
    setCurrentSpecimen(INITIAL_SPECIMENS[0]);
    localStorage.removeItem(CHANGED_KEY);
    setSyncStatusToast('Bitácora de este equipo restablecida al catálogo de referencia limpio.');
    setTimeout(() => setSyncStatusToast(null), 3500);
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
            onOpenStatistics={() => setActiveView('STATISTICS')}
            onOpenNewSpecimen={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            onOpenSyncBackup={() => setIsSyncModalOpen(true)}
            onOpenDeviceProfile={() => setIsDeviceModalOpen(true)}
            deviceId={deviceId}
            observerName={observerName}
          />
        )}

        {activeView === 'DETAIL' && (
          <SpecimenDetailView
            specimen={currentSpecimen}
            onBack={() => setActiveView('CATALOG')}
            onGoHome={() => setActiveView('COVER')}
            onSaveSpecimen={handleSaveSpecimen}
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
            currentObserverName={observerName}
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
                {/* Ícono superior para regresar a Inicio */}
                <button
                  onClick={() => setActiveView('COVER')}
                  className="flex items-center gap-1.5 hover:opacity-85 transition-all cursor-pointer group text-left"
                  title="Ir a Inicio / Portada"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 group-hover:bg-[#006c49] flex items-center justify-center text-[#6cf8bb] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">cottage</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm tracking-tight text-white group-hover:text-[#6cf8bb] transition-colors">
                      SIG de Biodiversidad CR
                    </h2>
                    <span className="text-[10px] text-[#a5d0bc] font-mono">(Inicio)</span>
                  </div>
                </button>
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
            onOpenStatistics={() => setActiveView('STATISTICS')}
            onGoHome={() => setActiveView('COVER')}
            onDeleteSpecimen={handleDeleteSpecimen}
          />
        )}

        {activeView === 'STATISTICS' && (
          <StatisticsView
            specimens={specimens}
            onSelectSpecimen={(spec) => {
              setCurrentSpecimen(spec);
              setActiveView('DETAIL');
            }}
            onOpenCatalog={() => setActiveView('CATALOG')}
            onOpenNewSpecimen={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            onGoHome={() => setActiveView('COVER')}
          />
        )}
      </main>

      {/* Bottom Global Navigation Bar: 3 ítems izquierda | BOTÓN CENTRAL [+] | 3 ítems derecha */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#f8faf4]/95 backdrop-blur-xl border-t border-[#c1c8c3]/40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="h-16 max-w-xl mx-auto px-2 sm:px-3 flex items-center justify-between">
          {/* 1. Portada */}
          <button
            onClick={() => setActiveView('COVER')}
            className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'COVER'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] sm:text-[21px] ${
                activeView === 'COVER' ? 'text-[#006c49]' : ''
              }`}
            >
              cottage
            </span>
            <span>Portada</span>
          </button>

          {/* 2. Ficha */}
          <button
            onClick={() => setActiveView('DETAIL')}
            className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'DETAIL'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] sm:text-[21px] ${
                activeView === 'DETAIL' ? 'text-[#006c49]' : ''
              }`}
            >
              description
            </span>
            <span>Ficha</span>
          </button>

          {/* 3. Mapa CR (Ahora antes del botón central de registro) */}
          <button
            onClick={() => setActiveView('MAP')}
            className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'MAP'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] sm:text-[21px] ${
                activeView === 'MAP' ? 'text-[#006c49]' : ''
              }`}
            >
              map
            </span>
            <span>Mapa CR</span>
          </button>

          {/* 4. BOTÓN CENTRAL: Registrar nuevo espécimen (UBICADO EXACTAMENTE DESPUÉS DEL MAPA, TOTALMENTE CENTRADO) */}
          <button
            onClick={() => {
              setEditingSpecimen(null);
              setPresetNewCoords(undefined);
              setIsNewModalOpen(true);
            }}
            className="w-11 h-11 -mt-4 rounded-full bg-[#002217] hover:bg-[#0f382a] text-[#6cf8bb] flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer border-2 border-white flex-shrink-0"
            title="Registrar nuevo espécimen con GPS o mapa offline"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          {/* 5. Colección */}
          <button
            onClick={() => setActiveView('CATALOG')}
            className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'CATALOG'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] sm:text-[21px] ${
                activeView === 'CATALOG' ? 'text-[#006c49]' : ''
              }`}
            >
              grid_view
            </span>
            <span>Colección</span>
          </button>

          {/* 6. Estadística */}
          <button
            onClick={() => setActiveView('STATISTICS')}
            className={`flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              activeView === 'STATISTICS'
                ? 'text-[#002217] scale-105 font-bold'
                : 'text-[#717974] hover:text-[#191c19]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] sm:text-[21px] ${
                activeView === 'STATISTICS' ? 'text-[#006c49]' : ''
              }`}
            >
              analytics
            </span>
            <span>Estadística</span>
          </button>

          {/* 7. Respaldo */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-[#717974] hover:text-[#002217] transition-all cursor-pointer"
            title="Respaldo JSON y Sincronización multi-dispositivo"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[21px] text-[#006c49]">sync_saved_locally</span>
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
        defaultCollector={observerName}
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
        deviceId={deviceId}
      />

      {/* Device & Observer Profile Modal */}
      <DeviceProfileModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        deviceId={deviceId}
        observerName={observerName}
        onSaveObserverName={(newName) => {
          setObserverName(newName);
          try {
            localStorage.setItem(OBSERVER_NAME_KEY, newName);
          } catch {}
        }}
        deviceName={deviceName}
        onSaveDeviceName={(newDev) => {
          setDeviceName(newDev);
          try {
            localStorage.setItem(DEVICE_NAME_KEY, newDev);
          } catch {}
        }}
        specimensCount={specimens.length}
        totalSightingsCount={specimens.reduce((acc, s) => acc + (s.sightings?.length || 1), 0)}
        onResetToInitial={handleResetToInitial}
        onOpenSyncBackup={() => setIsSyncModalOpen(true)}
      />

      {/* Toast Notification */}
      {syncStatusToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[92%] bg-[#002217] text-[#6cf8bb] px-4 py-3 rounded-2xl shadow-2xl border border-[#6cf8bb]/40 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{syncStatusToast}</span>
          </div>
          <button onClick={() => setSyncStatusToast(null)} className="text-white hover:text-[#6cf8bb] cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
