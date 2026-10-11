import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI with mandatory telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Helper to fetch image and convert to base64 if an HTTP URL is supplied
 */
async function getImagePart(imageUrl?: string, imageBase64?: string): Promise<{ mimeType: string; data: string } | null> {
  if (imageBase64) {
    // If base64 contains data:image/xxx;base64, prefix
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

Tu tarea es:
1. Identificar la especie con rigor científico (género y epíteto específico, p. ej. "Agalychnis callidryas").
2. Proveer los nombres vernáculos comunes en español y en inglés.
3. Clasificar la jerarquía taxonómica completa (Reino, Filo, Clase, Orden, Familia, Género, Especie, y Taxon ID estimado de ITIS/NCBI).
4. Asignar el estado de conservación según la Lista Roja de la UICN (código LC, NT, VU, EN o CR, etiqueta y tendencia) y estatus CITES (Apéndice I, II, III o Sin clasificar) con su distribución biogeográfica en Costa Rica / Mesoamérica.
5. Suministrar morfometría típica para el individuo (Longitud Hocico-Cloaca LHC en milímetros o envergadura/longitud total, descripción anatómica y cromática exhaustiva en español de los patrones observados en la foto).
6. Describir la etología y ecología reproductiva habitual de esta especie en el bosque tropical costarricense.
7. Mencionar 2 o 3 especies simpátricas habituales que comparten su microhábitat en Costa Rica.
8. Sugerir la zona de vida de Holdridge (p. ej. Bosque Tropical Húmedo bmh-T, Bosque Nuboso Premontano bp-PM, etc.), elevación típica en metros sobre el nivel del mar y microhábitat específico (p. ej. "Estrato arbustivo sobre arroyo de aguas lénticas").
9. Si es un anfibio o ave o emite vocalización, proveer los atributos bioacústicos típicos (tipo de canto, rango de frecuencia dominante en kHz, patrón sonoro).
10. Dar un puntaje de confianza estimado (0.0 a 1.0) y una justificación biológica diagnóstica en español (identificationRationale) explicando los rasgos anatómicos que confirman la identificación.

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
    "ethologyAndReproduction": "Descripción de comportamiento, reproducción...",
    "sympatricSpecies": [
      { "scientificName": "Nombre científico", "commonName": "Nombre común", "count": 2 }
    ]
  },
  "suggestedHabitat": {
    "lifeZone": "Bosque Tropical Húmedo (Clasificación bmh-T)",
    "microhabitat": "Estrato arbustivo sobre charca temporal...",
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
  "identificationRationale": "La imagen muestra con claridad las pupilas verticales rojas..."
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
      // Fallback cleanup if model wrapped with ```json
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
