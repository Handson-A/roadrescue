import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listUsers,
  changeUserRole,
  deleteUser,
  verifyShop,
  deleteShop,
  createTip,
  deleteTip
} from '../controllers/adminController.js';

const r = Router();

r.get('/users', requireAuth, requireAdmin, listUsers);
r.patch('/users/:id/role', requireAuth, requireAdmin, changeUserRole);
r.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

r.patch('/shops/:id/verify', requireAuth, requireAdmin, verifyShop);
r.delete('/shops/:id', requireAuth, requireAdmin, deleteShop);

r.post('/tips', requireAuth, requireAdmin, createTip);
r.delete('/tips/:id', requireAuth, requireAdmin, deleteTip);

export default r;