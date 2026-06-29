import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { createReportNotification } from './notificationsService';

const REPORTS = 'reports';
const USERS = 'users';

export async function createReport(data) {
  const reportData = {
    ...data,
    emergency: data.emergency || false,
    upvotes: 0,
    upvotedBy: [],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, REPORTS), reportData);
  await setDoc(
    doc(db, USERS, data.userId),
    {
      reportsCount: increment(1),
      ...(data.city ? { city: data.city, area: data.area || '' } : {}),
    },
    { merge: true }
  );
  createReportNotification({ id: docRef.id, ...data });
  return docRef.id;
}

export async function getReports(filters = {}) {
  let constraints = [];
  const hasFilter = filters.category || filters.status || filters.userId;

  if (filters.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.userId) {
    constraints.push(where('userId', '==', filters.userId));
  }

  function sortReports(list) {
    const sortField = filters.sort || 'createdAt';
    const sortDir = filters.order || 'desc';
    list.sort((a, b) => {
      // Emergency reports always on top
      const aEmerg = a.emergency ? 1 : 0;
      const bEmerg = b.emergency ? 1 : 0;
      if (aEmerg !== bEmerg) return bEmerg - aEmerg;
      const aVal = a[sortField]?.seconds || a[sortField] || 0;
      const bVal = b[sortField]?.seconds || b[sortField] || 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return list;
  }

  if (hasFilter) {
    constraints.push(limit(filters.limit || 50));
    const q = query(collection(db, REPORTS), ...constraints);
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return sortReports(results);
  }

  const sortField = filters.sort || 'createdAt';
  const sortDir = filters.order || 'desc';
  constraints.push(orderBy(sortField, sortDir));
  constraints.push(limit(filters.limit || 50));

  const q = query(collection(db, REPORTS), ...constraints);
  const snapshot = await getDocs(q);
  return sortReports(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
}

export async function getReportById(id) {
  const docSnap = await getDoc(doc(db, REPORTS, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function toggleUpvote(reportId, userId) {
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Report not found');
  const data = snap.data();
  if (data.userId === userId) throw new Error('Cannot upvote your own report');

  const alreadyUpvoted = (data.upvotedBy || []).includes(userId);
  if (alreadyUpvoted) {
    await updateDoc(ref, {
      upvotes: increment(-1),
      upvotedBy: arrayRemove(userId),
    });
    return { upvoted: false, newCount: data.upvotes - 1 };
  } else {
    const newCount = data.upvotes + 1;
    const updateData = {
      upvotes: increment(1),
      upvotedBy: arrayUnion(userId),
    };

    if (newCount > 5 && data.status === 'pending') {
      updateData.status = 'verified';
      const history = data.statusHistory || [];
      history.push({
        status: 'verified',
        timestamp: new Date().toISOString(),
        note: 'Automatically verified (5+ upvotes)',
      });
      updateData.statusHistory = history;
    }

    await updateDoc(ref, updateData);
    return { upvoted: true, newCount, autoVerified: newCount > 5 && data.status === 'pending' };
  }
}

export async function getUserData(userId) {
  const docSnap = await getDoc(doc(db, USERS, userId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function getLeaderboard(limitCount = 20) {
  const q = query(
    collection(db, USERS),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAllCategories() {
  const reportsSnap = await getDocs(collection(db, REPORTS));
  const cats = new Set();
  reportsSnap.docs.forEach((d) => {
    if (d.data().category) cats.add(d.data().category);
  });
  return Array.from(cats);
}

export async function deleteReport(reportId, userId) {
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Report not found');
  if (snap.data().userId !== userId) throw new Error('Unauthorized');
  await deleteDoc(ref);
}

export async function deleteUserAccount(userId) {
  const reportsSnap = await getDocs(query(collection(db, REPORTS), where('userId', '==', userId)));
  const batch = [];
  reportsSnap.forEach(d => batch.push(deleteDoc(doc(db, REPORTS, d.id))));
  await Promise.all(batch);
  await deleteDoc(doc(db, USERS, userId));
}

export async function updateUserProfile(userId, data) {
  await setDoc(doc(db, USERS, userId), data, { merge: true });
}
