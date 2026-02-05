import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "materials");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `${uniqueSuffix}.pdf`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === "application/pdf" && ext === ".pdf") {
      cb(null, true);
    } else {
      cb(new Error("PDF only"));
    }
  },
});

function isPdfMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString("ascii", 0, 4) === "%PDF";
  } catch {
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/materials/upload', (req, res, next) => {
    pdfUpload.single('file')(req, res, (err) => {
      if (err) {
        if (err.message === "PDF only") {
          return res.status(400).json({ ok: false, error: "PDF files only" });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ ok: false, error: "File too large (max 10MB)" });
        }
        return res.status(400).json({ ok: false, error: "Upload failed" });
      }

      if (!req.file) {
        return res.status(400).json({ ok: false, error: "No file uploaded" });
      }

      const filePath = path.join(UPLOADS_DIR, req.file.filename);
      if (!isPdfMagicBytes(filePath)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ ok: false, error: "Invalid PDF file" });
      }

      const url = `/uploads/materials/${req.file.filename}`;
      res.json({
        ok: true,
        url,
        originalName: req.file.originalname,
      });
    });
  });

  app.delete('/api/materials', (req, res) => {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing url' });
    }
    
    if (!url.startsWith('/uploads/materials/') || url.includes('..')) {
      return res.status(400).json({ ok: false, error: 'Invalid path' });
    }
    
    const filename = path.basename(url);
    if (!filename.endsWith('.pdf')) {
      return res.status(400).json({ ok: false, error: 'Invalid file type' });
    }
    
    const filePath = path.join(UPLOADS_DIR, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Failed to delete file' });
    }
  });

  return httpServer;
}
