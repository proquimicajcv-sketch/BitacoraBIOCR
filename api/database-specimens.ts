import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Memory cache as fallback for serverless environments
let memorySpecimens: any[] | null = null;
let memoryLastModified: number = Date.now();

export default function handler(req: Request, res: Response) {
  const DB_DIR = path.resolve('data');
  const DB_FILE = path.join(DB_DIR, 'specimens-database.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.status(200).json({
            success: true,
            data: parsed,
            lastModified: memoryLastModified,
          });
        }
      }
    } catch (err) {
      console.warn('Error reading file in serverless:', err);
    }

    if (memorySpecimens && memorySpecimens.length > 0) {
      return res.status(200).json({
        success: true,
        data: memorySpecimens,
        lastModified: memoryLastModified,
      });
    }

    return res.status(200).json({ success: true, data: null });
  }

  if (req.method === 'POST') {
    try {
      const { specimens, lastModified } = req.body || {};
      if (!Array.isArray(specimens)) {
        return res.status(400).json({ success: false, error: 'Formato inválido' });
      }

      memorySpecimens = specimens;
      memoryLastModified = Number(lastModified) || Date.now();

      try {
        if (!fs.existsSync(DB_DIR)) {
          fs.mkdirSync(DB_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(specimens, null, 2), 'utf-8');
      } catch (e) {
        // May be read-only in some serverless environments, memory cache will serve it
      }

      return res.status(200).json({
        success: true,
        count: specimens.length,
        lastModified: memoryLastModified,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
