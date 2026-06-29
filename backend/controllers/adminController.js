import { db } from '../firebase/admin.js';

const COLLECTIONS = ['reports', 'users'];
const REPORTS = 'reports';
const USERS = 'users';

export async function getCollections(req, res) {
  try {
    const snapshots = await Promise.all(
      COLLECTIONS.map(async (name) => {
        const snap = await db.collection(name).limit(1).get();
        return { name, exists: snap.size > 0 };
      })
    );
    res.json({ collections: snapshots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list collections' });
  }
}

export async function listDocuments(req, res) {
  try {
    const { collection } = req.params;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection: ${collection}` });
    }

    const { limit: limitParam, orderBy: orderByField, orderDir, startAfter: startAfterId } = req.query;
    const pageSize = Math.min(parseInt(limitParam) || 20, 100);

    let q = db.collection(collection)
      .orderBy(orderByField || 'createdAt', orderDir === 'asc' ? 'asc' : 'desc')
      .limit(pageSize + 1);

    if (startAfterId) {
      const startDoc = await db.collection(collection).doc(startAfterId).get();
      if (startDoc.exists) q = q.startAfter(startDoc);
    }

    const snapshot = await q.get();
    const docs = [];
    let hasMore = false;

    snapshot.docs.forEach((doc, i) => {
      if (i < pageSize) {
        docs.push({ id: doc.id, ...doc.data() });
      } else {
        hasMore = true;
      }
    });

    res.json({ docs, hasMore, lastId: docs.length > 0 ? docs[docs.length - 1].id : null });
  } catch (err) {
    console.error('Error listing documents:', err);
    res.status(500).json({ error: 'Failed to list documents' });
  }
}

export async function getDocument(req, res) {
  try {
    const { collection, id } = req.params;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection: ${collection}` });
    }

    const docRef = db.collection(collection).doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
}

export async function createDocument(req, res) {
  try {
    const { collection } = req.params;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection: ${collection}` });
    }

    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid document data' });
    }

    const allowedFields = collection === REPORTS
      ? ['userId', 'userName', 'description', 'category', 'lat', 'lng', 'state', 'city', 'area', 'pincode', 'imageURL', 'videoURL', 'status', 'anonymous', 'assignedTo', 'assignedDepartment']
      : ['name', 'email', 'phone', 'photoURL', 'role', 'points', 'badges', 'reportsCount'];

    const sanitized = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) sanitized[key] = data[key];
    }

    if (collection === REPORTS && !sanitized.status) sanitized.status = 'pending';
    if (collection === USERS && !sanitized.role) sanitized.role = 'citizen';
    if (!sanitized.createdAt) sanitized.createdAt = new Date().toISOString();
    sanitized.updatedAt = new Date().toISOString();

    const docRef = collection === REPORTS
      ? db.collection(REPORTS).doc()
      : db.collection(USERS).doc(data.userId || db.collection(USERS).doc().id);

    await docRef.set(sanitized);
    res.json({ id: docRef.id, ...sanitized });
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
}

export async function updateDocument(req, res) {
  try {
    const { collection, id } = req.params;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection: ${collection}` });
    }

    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid update data' });
    }

    const allowedFields = collection === REPORTS
      ? ['userId', 'userName', 'photoURL', 'description', 'generatedDescription', 'category', 'lat', 'lng', 'state', 'city', 'area', 'pincode', 'imageURL', 'videoURL', 'resolvedImageURL', 'status', 'upvotes', 'upvotedBy', 'anonymous', 'assignedTo', 'assignedDepartment', 'resolvedBy', 'statusHistory']
      : ['name', 'email', 'phone', 'photoURL', 'role', 'points', 'badges', 'reportsCount', 'reports'];

    const sanitized = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) sanitized[key] = data[key];
    }
    sanitized.updatedAt = new Date().toISOString();

    const docRef = db.collection(collection).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await docRef.update(sanitized);
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { collection, id } = req.params;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection: ${collection}` });
    }

    const docRef = db.collection(collection).doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await docRef.delete();
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}
