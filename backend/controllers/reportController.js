import { db, adminApp } from '../firebase/admin.js';

const REPORTS = 'reports';
const USERS = 'users';

const BADGE_MILESTONES = [
  { name: 'First Responder', minReports: 1 },
  { name: 'Community Watcher', minReports: 5 },
  { name: 'Neighborhood Hero', minReports: 15 },
  { name: 'Civic Champion', minReports: 30 },
];

export async function createReport(req, res) {
  try {
    const {
      description, category, lat, lng, imageURL, videoURL, userId, userName, photoURL,
      state, city, area, pincode, anonymous, generatedDescription, emergency,
    } = req.body;

    if (!description || !category || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const statusHistory = [
      { status: 'pending', timestamp: new Date().toISOString(), note: 'Report submitted' },
    ];

    const report = {
      userId,
      userName: anonymous ? 'Anonymous' : (userName || 'Anonymous'),
      photoURL: anonymous ? '' : (photoURL || ''),
      description,
      generatedDescription: generatedDescription || description,
      category,
      lat: lat || null,
      lng: lng || null,
      state: state || '',
      city: city || '',
      area: area || '',
      pincode: pincode || '',
      imageURL: imageURL || '',
      videoURL: videoURL || '',
      status: 'pending',
      upvotes: 0,
      upvotedBy: [],
      anonymous: !!anonymous,
      emergency: !!emergency,
      statusHistory,
      assignedTo: '',
      assignedDepartment: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection(REPORTS).add(report);
    report.id = ref.id;

    const userRef = db.collection(USERS).doc(userId);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data();
      const newCount = (userData.reportsCount || 0) + 1;
      const newPoints = (userData.points || 0) + 10;
      const currentBadges = userData.badges || [];
      const newBadges = [];

      for (const badge of BADGE_MILESTONES) {
        if (newCount >= badge.minReports && !currentBadges.includes(badge.name)) {
          newBadges.push(badge.name);
        }
      }

      const userUpdate = {
        reportsCount: newCount,
        points: newPoints,
        badges: currentBadges.length ? [...currentBadges, ...newBadges] : newBadges,
      };
      if (city) userUpdate.city = city;
      if (area) userUpdate.area = area;

      await userRef.update(userUpdate);
    }

    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

export async function getAllReports(req, res) {
  try {
    let query = db.collection(REPORTS).orderBy('createdAt', 'desc');

    if (req.query.category && req.query.category !== 'all') {
      query = query.where('category', '==', req.query.category);
    }
    if (req.query.status && req.query.status !== 'all') {
      query = query.where('status', '==', req.query.status);
    }
    if (req.query.userId) {
      query = query.where('userId', '==', req.query.userId);
    }
    if (req.query.state) {
      query = query.where('state', '==', req.query.state);
    }

    const limit = parseInt(req.query.limit) || 50;
    query = query.limit(limit);

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || null,
    }));

    // Sort emergency reports to top
    reports.sort((a, b) => {
      const aE = a.emergency ? 1 : 0;
      const bE = b.emergency ? 1 : 0;
      if (aE !== bE) return bE - aE;
      return 0;
    });

    res.json({ reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function getReportById(req, res) {
  try {
    const doc = await db.collection(REPORTS).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const { status, note, assignedTo, assignedDepartment } = req.body;
    const validStatuses = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (assignedTo) updateData.assignedTo = assignedTo;
    if (assignedDepartment) updateData.assignedDepartment = assignedDepartment;

    const currentHistory = reportSnap.data().statusHistory || [];
    currentHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    });
    updateData.statusHistory = currentHistory;

    await reportRef.update(updateData);

    if (status === 'resolved') {
      const report = reportSnap.data();
      const userRef = db.collection(USERS).doc(report.userId);
      await userRef.update({
        points: adminApp.firestore.FieldValue.increment(20),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

export async function verifyReport(req, res) {
  try {
    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const currentHistory = reportSnap.data().statusHistory || [];
    currentHistory.push({
      status: 'verified',
      timestamp: new Date().toISOString(),
      note: `Verified by officer ${req.user.uid}`,
    });

    await reportRef.update({
      status: 'verified',
      verifiedBy: req.user.uid,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: currentHistory,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error verifying report:', err);
    res.status(500).json({ error: 'Failed to verify report' });
  }
}

export async function assignReport(req, res) {
  try {
    const { assignedTo, assignedDepartment } = req.body;
    if (!assignedTo || !assignedDepartment) {
      return res.status(400).json({ error: 'Both assignedTo and assignedDepartment are required' });
    }

    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const currentHistory = reportSnap.data().statusHistory || [];
    currentHistory.push({
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: `Assigned to ${assignedTo} (${assignedDepartment})`,
    });

    await reportRef.update({
      status: 'assigned',
      assignedTo,
      assignedDepartment,
      assignedBy: req.user.uid,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: currentHistory,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning report:', err);
    res.status(500).json({ error: 'Failed to assign report' });
  }
}

export async function officerResolveReport(req, res) {
  try {
    const { resolvedImageURL } = req.body;
    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const currentHistory = reportSnap.data().statusHistory || [];
    currentHistory.push({
      status: 'resolved',
      timestamp: new Date().toISOString(),
      note: `Resolved by officer ${req.user.uid}`,
    });

    const updateData = {
      status: 'resolved',
      resolvedBy: req.user.uid,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: currentHistory,
    };
    if (resolvedImageURL) updateData.resolvedImageURL = resolvedImageURL;

    await reportRef.update(updateData);

    const report = reportSnap.data();
    const userRef = db.collection(USERS).doc(report.userId);
    await userRef.update({
      points: adminApp.firestore.FieldValue.increment(20),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
}

export async function toggleUpvote(req, res) {
  try {
    const { userId } = req.body;
    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportSnap.data();

    if (report.userId === userId) {
      return res.status(400).json({ error: 'Cannot upvote your own report' });
    }

    const upvotedBy = report.upvotedBy || [];
    const alreadyUpvoted = upvotedBy.includes(userId);

    if (alreadyUpvoted) {
      await reportRef.update({
        upvotes: adminApp.firestore.FieldValue.increment(-1),
        upvotedBy: adminApp.firestore.FieldValue.arrayRemove(userId),
      });
      res.json({ upvoted: false });
    } else {
      const newCount = (report.upvotes || 0) + 1;
      const updateFields = {
        upvotes: adminApp.firestore.FieldValue.increment(1),
        upvotedBy: adminApp.firestore.FieldValue.arrayUnion(userId),
      };

      if (newCount > 5 && report.status === 'pending') {
        updateFields.status = 'verified';
        const currentHistory = report.statusHistory || [];
        currentHistory.push({
          status: 'verified',
          timestamp: new Date().toISOString(),
          note: 'Automatically verified (5+ upvotes)',
        });
        updateFields.statusHistory = currentHistory;
      }

      await reportRef.update(updateFields);
      await db.collection(USERS).doc(report.userId).update({
        points: adminApp.firestore.FieldValue.increment(1),
      });
      res.json({ upvoted: true, autoVerified: newCount > 5 && report.status === 'pending' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle upvote' });
  }
}

export async function getAdminStats(req, res) {
  try {
    const snapshot = await db.collection(REPORTS).get();
    const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const pending = reports.filter(r => r.status === 'pending' || r.status === 'verified').length;
    const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'assigned').length;
    const categoryStats = {};
    const dailyCounts = {};
    const statusCounts = { pending: 0, verified: 0, assigned: 0, 'in-progress': 0, resolved: 0 };
    const stateCounts = {};
    const uniqueUsers = new Set();

    reports.forEach(r => {
      if (r.category) categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
      if (r.createdAt) {
        const day = new Date(r.createdAt).toISOString().slice(0, 10);
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
      if (r.status) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      if (r.state) stateCounts[r.state] = (stateCounts[r.state] || 0) + 1;
      if (r.userId) uniqueUsers.add(r.userId);
    });

    const userSnapshot = await db.collection(USERS).get();
    const totalUsers = userSnapshot.size;

    res.json({
      stats: { total, resolved, pending, inProgress, totalUsers, uniqueUsers: uniqueUsers.size },
      categoryStats,
      dailyCounts,
      statusCounts,
      stateCounts,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function detectDuplicate(req, res) {
  try {
    const { description, category, area, city } = req.body;
    if (!description) return res.json({ duplicates: [] });

    const snapshot = await db.collection(REPORTS)
      .where('category', '==', category || '__none__')
      .limit(20)
      .get();

    const duplicates = [];
    const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const desc = (data.description || '').toLowerCase();
      const matchCount = keywords.filter(k => desc.includes(k)).length;
      const score = keywords.length > 0 ? matchCount / keywords.length : 0;

      if (score > 0.3 && data.area === area) {
        duplicates.push({
          id: doc.id,
          score: Math.round(score * 100),
          description: data.description?.slice(0, 100),
          area: data.area,
          city: data.city,
          status: data.status,
          createdAt: data.createdAt,
        });
      }
    });

    duplicates.sort((a, b) => b.score - a.score);
    res.json({ duplicates: duplicates.slice(0, 5) });
  } catch (err) {
    console.error('Duplicate detection error:', err);
    res.json({ duplicates: [] });
  }
}
