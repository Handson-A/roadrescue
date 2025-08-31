import { Router } from 'express';
import MechanicShop from '../models/MechanicShop.js';
import { requireAuth } from '../middleware/auth.js';


const r = Router();


// Create or update a shop (mechanic)
r.post('/', requireAuth, async (req, res) => {
try {
const { name, phone, hotline, brands = [], services = [], address, lng, lat } = req.body;
if (!name || !phone || lng === undefined || lat === undefined) {
return res.status(400).json({ error: 'name, phone, lng, lat required' });
}
const doc = await MechanicShop.create({
owner: req.user.id,
name,
phone,
hotline,
brands,
services,
address,
location: { type: 'Point', coordinates: [Number(lng), Number(lat)] }
});
res.status(201).json(doc);
} catch (e) {
res.status(500).json({ error: 'server error' });
}
});


// Nearby search with optional filters
r.get('/', async (req, res) => {
try {
const { lat, lng, radiusKm = 10, brand, service } = req.query;
if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });
const pipeline = [
{
$geoNear: {
near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
distanceField: 'distance',
maxDistance: Number(radiusKm) * 1000,
spherical: true
}
},
{ $limit: 100 }
];
if (brand) pipeline.push({ $match: { brands: { $in: [brand] } } });
if (service) pipeline.push({ $match: { services: { $in: [service] } } });
pipeline.push({ $project: { name: 1, phone: 1, hotline: 1, brands: 1, services: 1, address: 1, location: 1, distance: 1 } });
const docs = await MechanicShop.aggregate(pipeline);
res.json(docs);
} catch (e) {
res.status(500).json({ error: 'server error' });
}
});

// List all shops, no location filter
r.get('/all', async (req, res) => {
  try {
    const docs = await MechanicShop.find({}, { name: 1, phone: 1, address: 1, location: 1, brands: 1, services: 1 });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// Fetch single shop
r.get('/:id', async (req, res) => {
const doc = await MechanicShop.findById(req.params.id);
if (!doc) return res.status(404).json({ error: 'not found' });
res.json(doc);
});


export default r;


// import express from "express";
// import { getShops, createShop } from "../controllers/shopController.js";
// import { requireAuth } from "../middleware/auth.js";

// const router = express.Router();

// router.get("/", getShops);
// router.post("/", requireAuth, createShop);

// export default router;
