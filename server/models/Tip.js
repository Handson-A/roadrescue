import mongoose from 'mongoose';
const tipSchema = new mongoose.Schema(
{ title: String, body: String, category: String },
{ timestamps: true }
);
export default mongoose.model('Tip', tipSchema);