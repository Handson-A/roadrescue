import User from '../models/User.js';
import Shop from '../models/MechanicShop.js';
import Tip from '../models/Tip.js';

// List all users
export async function listUsers(req, res) {
	const users = await User.find({}, { passwordHash: 0 });
	res.json(users);
}

// Change user role
export async function changeUserRole(req, res) {
	const { role } = req.body;
	if (!['user', 'mechanic', 'admin'].includes(role)) {
		return res.status(400).json({ error: 'Invalid role' });
	}
	const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
	if (!user) return res.status(404).json({ error: 'User not found' });
	res.json({ id: user._id, email: user.email, role: user.role });
}

// Delete user
export async function deleteUser(req, res) {
	const user = await User.findByIdAndDelete(req.params.id);
	if (!user) return res.status(404).json({ error: 'User not found' });
	res.json({ message: 'User deleted' });
}

// Verify/deactivate shop
export async function verifyShop(req, res) {
	const { isVerified, isActive } = req.body;
	const shop = await Shop.findByIdAndUpdate(
		req.params.id,
		{ isVerified, isActive },
		{ new: true }
	);
	if (!shop) return res.status(404).json({ error: 'Shop not found' });
	res.json(shop);
}

// Delete shop
export async function deleteShop(req, res) {
	const shop = await Shop.findByIdAndDelete(req.params.id);
	if (!shop) return res.status(404).json({ error: 'Shop not found' });
	res.json({ message: 'Shop deleted' });
}

// Create tip
export async function createTip(req, res) {
	try {
		const tip = await Tip.create(req.body);
		res.status(201).json(tip);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

// Delete tip
export async function deleteTip(req, res) {
	const tip = await Tip.findByIdAndDelete(req.params.id);
	if (!tip) return res.status(404).json({ error: 'Tip not found' });
	res.json({ message: 'Tip deleted' });
}
