import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// On Vercel (serverless), only /tmp is writable
const UPLOADS_DIR = process.env.VERCEL
  ? '/tmp/materials'
  : path.join(process.cwd(), 'public', 'uploads', 'materials');

try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, _file, cb) => {
    const suffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${suffix}.pdf`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF only'));
    }
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/materials/upload', (req, res) => {
  pdfUpload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'PDF only') {
        return res.status(400).json({ ok: false, error: 'PDF files only' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: 'File too large (max 10MB)' });
      }
      return res.status(400).json({ ok: false, error: 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }
    res.json({
      ok: true,
      url: `/uploads/materials/${req.file.filename}`,
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
  try {
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to delete file' });
  }
});

export default app;
