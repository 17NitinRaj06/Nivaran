import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const NOTIFICATIONS = 'notifications';

export async function createWelcomeNotification(userId, userName) {
  try {
    await addDoc(collection(db, NOTIFICATIONS), {
      userId,
      type: 'welcome',
      title: 'Welcome to Nivaran!',
      message: `Welcome, ${userName}! Start reporting civic issues in your neighborhood and help make your community better.`,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error creating welcome notification:', err);
  }
}

export async function createReportNotification(report) {
  if (!report.city || !report.userId) return;

  try {
    // Find users in the same city from their profile (set when they file a report)
    const q = query(
      collection(db, 'users'),
      where('city', '==', report.city),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const userIds = [];
    snapshot.docs.forEach((d) => {
      const uid = d.id;
      if (uid && uid !== report.userId) {
        const data = d.data();
        // Only notify if they're in the same area or have no area filter
        if (!report.area || !data.area || data.area === report.area) {
          userIds.push(uid);
        }
      }
    });

    if (userIds.length === 0) return;

    const isEmergency = report.emergency;
    const notification = {
      type: 'new_report',
      title: isEmergency ? '🚨 Emergency Report in Your Area' : 'New Report in Your Area',
      message: isEmergency
        ? `URGENT: ${report.userName || 'Someone'} reported an emergency ${report.category} issue near ${report.area || ''} ${report.city}.`
        : `${report.userName || 'Someone'} reported a ${report.category} issue near ${report.area || ''} ${report.city}.`,
      reportId: report.id || '',
      read: false,
      createdAt: serverTimestamp(),
    };

    const promises = userIds.map(uid =>
      addDoc(collection(db, NOTIFICATIONS), { ...notification, userId: uid })
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('Error creating report notifications:', err);
  }
}

export async function getUserNotifications(userId, limitCount = 50) {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function getUnreadCount(userId) {
  if (!userId) return 0;
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(notificationId) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), { read: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
  }
}

export async function markAllNotificationsRead(userId) {
  if (!userId) return;
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((d) => updateDoc(d.ref, { read: true }))
    );
  } catch (err) {
    console.error('Error marking all notifications read:', err);
  }
}
