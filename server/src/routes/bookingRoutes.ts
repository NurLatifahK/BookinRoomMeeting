import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createBooking,
  updateBooking,
  cancelBooking,
  getBookings,
  getMyBookings,
  getAvailability,
  getDashboardStats,
  approveBooking,
  getPendingApprovals,
  getNotaDinas,
} from '../controllers/bookingController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Setup direktori upload
const uploadDir = path.join(process.cwd(), 'uploads', 'nota-dinas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `nota-dinas-${unique}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5 MB
});

// Error handler multer
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('notaDinas')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran file terlalu besar. Maksimum 5 MB.'
          : `Upload error: ${err.message}`,
      });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ─── Routes ─────────────────────────────────────────────────────────────────

// Statistik & Availability
router.get('/availability', authenticate, getAvailability);
router.get('/stats', authenticate, getDashboardStats);

// Booking milik sendiri
router.get('/my', authenticate, getMyBookings);

// Admin: pending approvals
router.get('/pending-approvals', authenticate, requireAdmin, getPendingApprovals);

// Admin: approve / reject
router.patch('/:id/approve', authenticate, requireAdmin, approveBooking);

// Nota Dinas download/view
router.get('/:id/nota-dinas', authenticate, getNotaDinas);

// CRUD umum
router.get('/', authenticate, getBookings);
router.post('/', authenticate, handleUpload, createBooking);
router.put('/:id', authenticate, updateBooking);
router.patch('/:id/cancel', authenticate, cancelBooking);

export default router;
