import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.resolve('public')));

// Initialize GoogleGenAI with mandatory telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DB_DIR = path.resolve('data');
const DB_FILE = path.join(DB_DIR, 'specimens-database.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data dir:', err);
  }
}

/**
 * Server JSON Database Endpoints for Cross-Device Persistence
 */
let serverDbLastModified = Date.now();
const DEVICES_DIR = path.join(process.cwd(), 'data', 'devices');
if (!fs.existsSync(DEVICES_DIR)) {
  fs.mkdirSync(DEVICES_DIR, { recursive: true });
}

function getTargetDbFile(deviceId?: string): string {
  if (!deviceId || typeof deviceId !== 'string') {
    return DB_FILE;
  }
  const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return path.join(DEVICES_DIR, `${safeId}.json`);
}

app.get('/api/database/specimens', (req: Request, res: Response): void => {
  try {
    const deviceId = req.query.deviceId as string | undefined;

    // Check central shared database first for cross-device synchronization
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        const stats = fs.statSync(DB_FILE);
        res.json({
          success: true,
          data,
          deviceId: deviceId || 'global',
          lastModified: Math.max(serverDbLastModified, stats.mtimeMs),
        });
        return;
      }
    }

    // Fallback to device-specific file if central not found
    if (deviceId) {
      const targetFile = getTargetDbFile(deviceId);
      if (fs.existsSync(targetFile)) {
        const content = fs.readFileSync(targetFile, 'utf-8');
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          const stats = fs.statSync(targetFile);
          res.json({
            success: true,
            data,
            deviceId,
            lastModified: stats.mtimeMs,
          });
          return;
        }
      }
    }

    res.json({ success: true, data: null, lastModified: 0 });
  } catch (err: any) {
    console.warn('Error reading database file:', err);
    res.json({ success: true, data: null, lastModified: 0 });
  }
});

function mergeSpecimens(existingList: any[], incomingList: any[]): any[] {
  if (!Array.isArray(existingList) || existingList.length === 0) return incomingList;
  if (!Array.isArray(incomingList) || incomingList.length === 0) return existingList;

  const result: any[] = [...existingList];

  for (const incoming of incomingList) {
    const idx = result.findIndex(
      (e) => (incoming.id && e.id === incoming.id) ||
             (incoming.scientificName && e.scientificName === incoming.scientificName)
    );

    if (idx === -1) {
      result.push(incoming);
    } else {
      const existing = result[idx];

      // Merge sightings: UNION by id, NEVER LOSE A SIGHTING!
      const existingSightings = Array.isArray(existing.sightings) ? existing.sightings : [];
      const incomingSightings = Array.isArray(incoming.sightings) ? incoming.sightings : [];

      const sightingMap = new Map<string, any>();
      for (const s of existingSightings) {
        if (s && s.id) sightingMap.set(s.id, s);
      }
      for (const s of incomingSightings) {
        if (s && s.id) {
          const old = sightingMap.get(s.id);
          sightingMap.set(s.id, old ? { ...old, ...s } : s);
        }
      }

      const mergedSightings = Array.from(sightingMap.values()).sort((a, b) => {
        const dateA = a.date || a.timestamp || '';
        const dateB = b.date || b.timestamp || '';
        return dateB.localeCompare(dateA);
      });

      // Merge additional photos: UNION by id/label
      const existingPhotos = Array.isArray(existing.additionalPhotos) ? existing.additionalPhotos : [];
      const incomingPhotos = Array.isArray(incoming.additionalPhotos) ? incoming.additionalPhotos : [];
      const photoMap = new Map<string, any>();
      for (const p of existingPhotos) {
        if (p && (p.id || p.label)) photoMap.set(p.id || p.label, p);
      }
      for (const p of incomingPhotos) {
        if (p && (p.id || p.label)) {
          const key = p.id || p.label;
          const old = photoMap.get(key);
          photoMap.set(key, old ? { ...old, ...p } : p);
        }
      }
      const mergedPhotos = Array.from(photoMap.values());

      result[idx] = {
        ...existing,
        ...incoming,
        sightings: mergedSightings,
        additionalPhotos: mergedPhotos,
      };
    }
  }

  return result;
}

app.post('/api/database/specimens', (req: Request, res: Response): void => {
  try {
    const { specimens, lastModified, deviceId } = req.body;
    if (!Array.isArray(specimens)) {
      res.status(400).json({ success: false, error: 'Formato inválido' });
      return;
    }
    const updatedTime = Number(lastModified) || Date.now();
    serverDbLastModified = updatedTime;

    // Smart-merge with existing DB so sightings from ANY device are never lost
    let finalSpecimens = specimens;
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const currentData = JSON.parse(content);
        if (Array.isArray(currentData) && currentData.length > 0) {
          finalSpecimens = mergeSpecimens(currentData, specimens);
        }
      } catch (err) {
        console.warn('Error reading DB_FILE for merge:', err);
      }
    }

    // CRITICAL: Always write merged database to DB_FILE so all devices stay updated
    fs.writeFileSync(DB_FILE, JSON.stringify(finalSpecimens, null, 2), 'utf-8');

    // Also write device backup if specified
    if (deviceId) {
      const targetFile = getTargetDbFile(deviceId);
      try {
        fs.writeFileSync(targetFile, JSON.stringify(finalSpecimens, null, 2), 'utf-8');
      } catch {}
    }

    res.json({
      success: true,
      data: finalSpecimens,
      count: finalSpecimens.length,
      deviceId: deviceId || 'global',
      lastModified: updatedTime,
      message: 'Base de datos y avistamientos sincronizados permanentemente para todos los dispositivos',
    });
  } catch (err: any) {
    console.error('Error writing database file:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to export central JSON file directly
app.get('/api/database/export-json', (_req: Request, res: Response): void => {
  try {
    if (fs.existsSync(DB_FILE)) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="BioBitacora_CR_Respaldo_${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(DB_FILE);
      return;
    }
    res.status(404).json({ success: false, error: 'No existe archivo central de base de datos' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to import and broadcast a JSON database file
app.post('/api/database/import-json', (req: Request, res: Response): void => {
  try {
    const payload = req.body;
    let recordsToImport: any[] | null = null;
    if (Array.isArray(payload)) {
      recordsToImport = payload;
    } else if (payload && Array.isArray(payload.specimens)) {
      recordsToImport = payload.specimens;
    }

    if (!recordsToImport || recordsToImport.length === 0) {
      res.status(400).json({ success: false, error: 'El archivo JSON no contiene una lista válida de especímenes' });
      return;
    }

    let finalImport = recordsToImport;
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const currentData = JSON.parse(content);
        if (Array.isArray(currentData) && currentData.length > 0) {
          finalImport = mergeSpecimens(currentData, recordsToImport);
        }
      } catch {}
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(finalImport, null, 2), 'utf-8');
    serverDbLastModified = Date.now();

    res.json({
      success: true,
      data: finalImport,
      count: finalImport.length,
      lastModified: serverDbLastModified,
      message: `¡Archivo JSON importado y sincronizado! ${finalImport.length} registros y todos los avistamientos actualizados en todos los dispositivos.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to upload and persist photos locally in public folder
const UPLOADS_DIR = path.resolve('public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.post('/api/upload-photo', (req: Request, res: Response): void => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      res.status(400).json({ success: false, error: 'No se envió imagen' });
      return;
    }
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = (filename || `photo_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const targetPath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);
    const publicUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Helper to fetch image and convert to base64 if an HTTP URL is supplied
 */
async function getImagePart(imageUrl?: string, imageBase64?: string): Promise<{ mimeType: string; data: string } | null> {
  if (imageBase64) {
    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      return {
        mimeType: matches[1],
        data: matches[2],
      };
    }
    return {
      mimeType: 'image/jpeg',
      data: imageBase64,
    };
  }

  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    try {
      const resp = await fetch(imageUrl);
      if (!resp.ok) return null;
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return {
        mimeType: contentType.split(';')[0],
        data: buffer.toString('base64'),
      };
    } catch (err) {
      console.warn('Error fetching image from URL:', err);
      return null;
    }
  }

  return null;
}

/**
 * AI Species Recognition & Scientific Auto-Fill API Endpoint
 */
app.post('/api/ai/identify-specimen', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl, imageBase64, userNotes, locationHint } = req.body;
    const imagePart = await getImagePart(imageUrl, imageBase64);

    const promptText = `
Eres un distinguido biólogo taxónomo y curador de museo especializado en la biodiversidad de Costa Rica y el Neotrópico (UCR, INBio, OET, SINAC).
Analiza detalladamente esta fotografía de campo del espécimen biológico.
${locationHint ? `Pista de ubicación en Costa Rica: ${locationHint}` : ''}
${userNotes ? `Notas de campo adicionales: ${userNotes}` : ''}

Tu tarea es proveer información científica fidedigna sobre:
1. Identificación taxonómica completa (género, especie, nombre común en español/inglés, reino, filo, clase, orden, familia, género, taxon ID ITIS/NCBI).
2. Estado de conservación UICN y CITES con distribución biogeográfica en Costa Rica.
3. Cromática y Anatomía detallada.
4. Etología y Comportamiento diario (forrajeo, horarios de actividad, termorregulación).
5. Cortejo y Reproducción (rituales nupciales, amplexo/cortejo, oviposición o anidación, masa de huevos/crías, cuidado parental).
6. Relaciones intra e interespecíficas (territorialidad entre individuos, competencia simpátrica, depredadores naturales en Costa Rica y defensas químicas/alcaloides/veneno/aposematismo).
7. Datos importantes de investigación científica confirmada (estudios de campo UCR, OET, SINAC, Smithsonian o descubrimientos publicados sobre la especie).
8. Zona de vida de Holdridge en Costa Rica (código y nombre: bmh-T, bp-PM, bs-T, bp-MB, etc.), rango de elevación y microhábitat específico.
9. Bioacústica si emite sonidos.
10. Puntaje de confianza (0.0 a 1.0) y explicación diagnóstica.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "scientificName": "Género especie",
  "commonName": "Nombre común en español / Common English name",
  "taxonGroup": "Amphibia" | "Aves" | "Mammalia" | "Insecta" | "Reptilia" | "Plantae",
  "realm": "Neotropical",
  "taxonomy": {
    "kingdom": "Animalia",
    "phylum": "Chordata",
    "class": "Amphibia",
    "order": "Anura",
    "family": "Hylidae",
    "genus": "Agalychnis",
    "species": "callidryas",
    "taxonId": "8408"
  },
  "iucnStatus": {
    "code": "LC",
    "label": "Preocupación Menor",
    "trend": "Población Estable"
  },
  "citesStatus": {
    "appendix": "Apéndice II",
    "distribution": "Nativa Mesoamericana"
  },
  "morphometrics": {
    "snoutVentLengthMm": 58.0,
    "totalLengthMm": 58.0,
    "weightGrams": 15.0,
    "colorationAndAnatomy": "Descripción cromática y diagnóstica detallada...",
    "ethologyAndReproduction": "Descripción de comportamiento general...",
    "courtshipAndMating": "Ritual de cortejo, vocalizaciones nupciales, amplexo axilar y anidación sobre hojas suspendidas...",
    "interspecificRelations": "Territorialidad entre machos por sitios de canto, depredación por serpientes Leptodeira septentrionalis y avispas Polybia, defensas...",
    "confirmedScientificData": "Investigaciones de la OET en La Selva y Boston University demostraron eclosión inducida por vibraciones sísmicas de depredadores...",
    "sympatricSpecies": [
      { "scientificName": "Nombre científico", "commonName": "Nombre común", "count": 2 }
    ]
  },
  "suggestedHabitat": {
    "lifeZone": "Bosque Muy Húmedo Tropical (bmh-T)",
    "microhabitat": "Estrato arbustivo sobre charca temporal de lluvia...",
    "elevationMeters": 68,
    "locality": "Estación La Selva, Sarapiquí",
    "province": "Heredia, Costa Rica",
    "conservationArea": "Área de Conservación Arenal Huetar Norte (ACAHN)"
  },
  "bioacoustics": {
    "title": "Canto de Anuncio",
    "callType": "Vocalización Territorial",
    "dominantFrequencyRange": "1.8 - 2.4 kHz",
    "durationSeconds": 24,
    "audioPatternDescription": "\\"Chack-chack\\" gutural monotonal"
  },
  "confidenceScore": 0.95,
  "identificationRationale": "La imagen muestra pupilas verticales rojas y membrana nictitante reticulada diagnóstica."
}
`;

    const contents: Array<{
      role?: string;
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: promptText },
    ];

    if (imagePart) {
      parts.push({
        inlineData: {
          mimeType: imagePart.mimeType,
          data: imagePart.data,
        },
      });
    }

    contents.push({ parts });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error during AI species identification:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error al procesar la identificación con IA',
    });
  }
});

/**
 * AI Scientific Enrichment Endpoint: Nombre científico, Nombre común, Taxonomía,
 * Anatomía, Cortejo, Etología, Relaciones ecológicas y Datos confirmados
 */
app.post('/api/ai/enrich-scientific-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const { scientificName, commonName, taxonGroup } = req.body;
    const queryTerm = (scientificName || commonName || '').trim();

    if (!queryTerm) {
      res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos el nombre común o el nombre científico de la especie.',
      });
      return;
    }

    const promptText = `
Eres un biólogo taxónomo y ecólogo investigador especialista en la biodiversidad de Costa Rica y el Neotrópico (UCR, OET, SINAC, INBio, Smithsonian).

El usuario necesita identificar y completar 100% la ficha científica para este organismo:
- Nombre científico proporcionado: "${scientificName || 'No indicado'}"
- Nombre común proporcionado: "${commonName || 'No indicado'}"
- Grupo taxonómico aproximado: "${taxonGroup || 'No indicado'}"

Tu tarea:
1. Si el usuario dio solo el nombre común (ej. "Rana de ojos rojos", "Quetzal", "Jaguar", "Yigüirro", "Guaria morada"), determina con exactitud su nombre científico binomial válido para Costa Rica, su jerarquía taxonómica completa y grupo taxonómico.
2. Si el usuario dio solo el nombre científico (ej. "Agalychnis callidryas", "Pharomachrus mocinno"), determina su nombre común en español utilizado en Costa Rica y en inglés.
3. Si dio ambos, valida la taxonomía y completa todos los detalles morfológicos, etológicos y reproductivos.
4. Genera datos exhaustivos y fidedignos confirmados en investigaciones de campo en Costa Rica (UCR / OET La Selva, Monteverde, Sirena, Palo Verde, etc.).

Responde ÚNICAMENTE con un JSON válido con la siguiente estructura:
{
  "scientificName": "Género epíteto",
  "commonName": "Nombre común en Costa Rica / Nombre en inglés",
  "taxonGroup": "Amphibia" | "Aves" | "Mammalia" | "Insecta" | "Reptilia" | "Plantae",
  "taxonomy": {
    "kingdom": "Animalia" o "Plantae",
    "phylum": "Chordata",
    "class": "Amphibia",
    "order": "Anura",
    "family": "Hylidae",
    "genus": "Agalychnis",
    "species": "callidryas"
  },
  "morphometrics": {
    "snoutVentLengthMm": 58.0,
    "totalLengthMm": 58.0,
    "weightGrams": 15.0
  },
  "colorationAndAnatomy": "Morfología diagnóstica, detalles cromáticos, adaptaciones esqueléticas, tegumento, plumaje o escamas, dimorfismo sexual.",
  "ethologyAndReproduction": "Patrones etológicos, ritmos circadianos, estrategias de forrajeo y termorregulación en su hábitat costarricense.",
  "courtshipAndMating": "Rituales de cortejo, señales visuales/bioacústicas de atracción, amplexo/cópula, modo reproductivo, fecundación, cuidados parentales y anidación/ovoposición.",
  "interspecificRelations": "Territorialidad intraespecífica, relaciones con especies simpátricas, principales depredadores en Costa Rica, mecanismos de defensa (aposematismo, camuflaje, toxinas, tanatosis).",
  "confirmedScientificData": "Datos y descubrimientos científicos confirmados por investigaciones biológicas de campo en Costa Rica (citas de estaciones como La Selva OET, Monteverde, Sirena o universidades UCR/UNA).",
  "suggestedHoldridgeZone": "Nombre completo de la zona de vida de Holdridge en Costa Rica (ej. Bosque Muy Húmedo Tropical (bmh-T))",
  "microhabitat": "Microhábitat exacto donde suele registrarse (follaje, arroyo, estrato arbóreo, hojarasca)",
  "elevationMeters": 68,
  "hasBioacoustics": true,
  "bioacoustics": {
    "title": "Canto de Anuncio o Llamado",
    "callType": "Vocalización Territorial / Reproductiva",
    "dominantFrequencyRange": "1.8 - 2.4 kHz",
    "audioPatternDescription": "Descripción de la pauta bioacústica o sonido emitido"
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in scientific enrichment:', error);
    res.status(500).json({ success: false, error: error?.message || 'Error al enriquecer datos científicos' });
  }
});

// Configure Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BioBitácora CR] Servidor iniciado en http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
