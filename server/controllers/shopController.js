import Shop from "../models/MechanicShop.js";

export async function getShops(req, res) {
  const shops = await Shop.find();
  res.json(shops);
}

export async function createShop(req, res) {
  try {
    const shop = await Shop.create({ ...req.body, owner: req.user.id });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
