import { auth, db } from '../firebase/admin.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ error: 'User profile not found' });
      }
      const userRole = userDoc.data().role || 'citizen';
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
      }
      req.userRole = userRole;
      next();
    } catch (err) {
      console.error('Role check failed:', err);
      res.status(500).json({ error: 'Failed to verify role' });
    }
  };
}
