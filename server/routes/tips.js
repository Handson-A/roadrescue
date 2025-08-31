import { Router } from 'express';
import Tip from '../models/Tip.js';
const r = Router();


r.get('/', async (_, res) => {
const tips = await Tip.find({}).sort({ createdAt: -1 }).limit(100);
res.json(tips);
});


export default r;

// import express from "express";
// import { getTips, createTip } from "../controllers/tipController.js";
// import { requireAuth } from "../middleware/auth.js";

// const router = express.Router();

// router.get("/", getTips);
// router.post("/", requireAuth, createTip);

// export default router;
