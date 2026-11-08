import { Router } from 'express';
import { getRooms, getRoomById, updateRoom } from '../controllers/roomController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public/authenticated room reading
router.get('/', authenticate, getRooms);
router.get('/:id', authenticate, getRoomById);

// Admin room management
router.put('/:id', authenticate, requireAdmin, updateRoom);

export default router;

