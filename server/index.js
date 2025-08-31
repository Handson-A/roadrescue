import('dotenv/config');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from "dotenv";


import authRouter from './routes/auth.js';
import shopRouter from './routes/shops.js';
import tipsRouter from './routes/tips.js';
import userRouter from './routes/user.js';
import adminRouter from './routes/admin.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

//routes
app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/shops', shopRouter);
app.use('/tips', tipsRouter);
app.use('/user', userRouter);


const { PORT = 4000, MONGO_URI } = process.env;
mongoose.connect(MONGO_URI).then(() => {
app.listen(PORT, () => console.log(`API running http://localhost:${PORT}`));
})
.catch((e) => {
console.error('Mongo error', e);
process.exit(1);
});