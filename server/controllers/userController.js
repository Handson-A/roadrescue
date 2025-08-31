import User from '../models/User.js';

// Delete own user account
export async function deleteOwnUser(req, res) {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
