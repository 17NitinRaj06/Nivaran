import { db } from '../firebase/admin.js';

const USERS = 'users';

export async function getUser(req, res) {
  try {
    const doc = await db.collection(USERS).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function getLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const snapshot = await db
      .collection(USERS)
      .orderBy('points', 'desc')
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
