import Tip from "../models/Tip.js";

export async function getTips(req, res) {
  const tips = await Tip.find();
  res.json(tips);
}

export async function createTip(req, res) {
  try {
    const tip = await Tip.create(req.body);
    res.json(tip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
