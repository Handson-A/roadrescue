import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { deleteOwnUser } from '../controllers/userController.js';

const r = Router();
r.delete('/me', requireAuth, deleteOwnUser);
export default r;