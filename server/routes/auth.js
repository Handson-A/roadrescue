import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const r = Router();


r.post('/register', async (req, res) => {
try {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ error: 'email & password required' });
const exists = await User.findOne({ email });
if (exists) return res.status(409).json({ error: 'email in use' });
const passwordHash = await bcrypt.hash(password, 10);
const user = await User.create({ email, passwordHash, role });
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token });
} catch (e) {
res.status(500).json({ error: 'server error' });
}
});


r.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) return res.status(401).json({ error: 'invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ error: 'invalid credentials' });
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token });
} catch (e) {
res.status(500).json({ error: 'server error' });
}
});


export default r;


// import express from "express";
// import { register, login } from "../controllers/authController.js";

// const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);

// export default router;
