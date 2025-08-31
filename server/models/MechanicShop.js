import mongoose from 'mongoose';


const ShopSchema = new mongoose.Schema(
{
owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
name: { type: String, required: true },
phone: { type: String, required: true },
hotline: { type: String },
brands: [{ type: String }],
services: [{ type: String }],
address: { type: String },
location: {
type: { type: String, enum: ['Point'], default: 'Point' },
coordinates: { type: [Number], required: true } // [lng, lat]
},
isVerified: { type: Boolean, default: false },
isActive: { type: Boolean, default: true }
},
{ timestamps: true }
);


ShopSchema.index({ location: '2dsphere' });
export default mongoose.model('MechanicShop', ShopSchema);