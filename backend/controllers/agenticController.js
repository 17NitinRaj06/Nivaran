import { GoogleGenerativeAI } from '@google/generative-ai';
import { db, adminApp } from '../firebase/admin.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const REPORTS = 'reports';
const USERS = 'users';

const CATEGORY_DEPARTMENT_MAP = {
  pothole: 'Roads & Infrastructure',
  road: 'Roads & Infrastructure',
  streetlight: 'Electricity & Power',
  electricity: 'Electricity & Power',
  garbage: 'Sanitation & Waste Management',
  drainage: 'Sanitation & Waste Management',
  water: 'Water Supply & Plumbing',
  other: 'General Services',
};

const SEVERITY_CATEGORIES = {
  pothole: 3,
  road: 3,
  streetlight: 2,
  electricity: 4,
  garbage: 2,
  drainage: 4,
  water: 4,
  other: 1,
};

function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'object' && value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

export async function autoAssignReport(req, res) {
  try {
    const reportRef = db.collection(REPORTS).doc(req.params.id);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const report = reportSnap.data();
    if (report.status !== 'verified' && report.status !== 'pending') {
      return res.status(400).json({ error: 'Report must be pending or verified to auto-assign' });
    }

    const department = CATEGORY_DEPARTMENT_MAP[report.category] || 'General Services';

    const currentHistory = report.statusHistory || [];
    currentHistory.push({
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: `Auto-assigned to ${department} by AI`,
    });

    await reportRef.update({
      status: 'assigned',
      assignedDepartment: department,
      assignedTo: `${department} Team`,
      assignedBy: 'system',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: currentHistory,
    });

    res.json({ success: true, department });
  } catch (err) {
    console.error('Auto-assign error:', err);
    res.status(500).json({ error: 'Failed to auto-assign report' });
  }
}

export async function checkEscalations(req, res) {
  try {
    const snapshot = await db.collection(REPORTS)
      .where('status', 'in', ['pending', 'verified', 'assigned', 'in-progress'])
      .get();

    const now = new Date();
    const escalated = [];
    const updates = [];

    snapshot.docs.forEach(doc => {
      const report = { id: doc.id, ...doc.data() };
      const created = parseDate(report.createdAt);
      if (!created) return;

      const daysOpen = (now - created) / 86400000;
      let shouldEscalate = false;
      let escalationLevel = '';

      if (daysOpen > 14 && report.status !== 'in-progress') {
        shouldEscalate = true;
        escalationLevel = 'critical';
      } else if (daysOpen > 7 && report.status === 'pending') {
        shouldEscalate = true;
        escalationLevel = 'high';
      }

      if (shouldEscalate) {
        const currentHistory = report.statusHistory || [];
        currentHistory.push({
          status: report.status,
          timestamp: new Date().toISOString(),
          note: `Auto-escalated (${escalationLevel}): ${daysOpen.toFixed(1)} days since creation`,
        });

        updates.push(doc.ref.update({
          escalated: true,
          escalationLevel,
          escalationDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: currentHistory,
        }));

        escalated.push({
          id: report.id,
          area: report.area,
          category: report.category,
          status: report.status,
          daysOpen: Math.round(daysOpen * 10) / 10,
          escalationLevel,
        });
      }
    });

    await Promise.all(updates);
    res.json({ escalated, count: escalated.length });
  } catch (err) {
    console.error('Escalation check error:', err);
    res.status(500).json({ error: 'Failed to check escalations' });
  }
}

export async function getResolutionSuggestions(req, res) {
  try {
    const { id } = req.params;
    const reportSnap = await db.collection(REPORTS).doc(id).get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const report = reportSnap.data();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a civic issue resolution expert. Given the following report, suggest specific actionable steps to resolve this issue.

Category: ${report.category}
Description: ${report.description}
Location: ${report.area || 'Unknown'}, ${report.city || ''} ${report.state || ''}
Days Open: ${report.createdAt ? Math.round((new Date() - new Date(report.createdAt)) / 86400000) : 'Unknown'}

Respond with ONLY valid JSON in this exact format (no other text):
{
  "estimatedResolutionTime": "e.g. 2-3 days",
  "requiredDepartment": "department name",
  "steps": ["step 1", "step 2", "step 3"],
  "priority": "low/medium/high/critical",
  "resourcesNeeded": ["resource1", "resource2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json?/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        estimatedResolutionTime: '3-5 days',
        requiredDepartment: CATEGORY_DEPARTMENT_MAP[report.category] || 'General Services',
        steps: ['Inspect the reported issue on site', 'Assign appropriate team', 'Complete repairs and verify'],
        priority: 'medium',
        resourcesNeeded: ['Field inspection team', 'Required equipment'],
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error('Resolution suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}

export async function suggestAssignment(req, res) {
  try {
    const { id } = req.params;
    const reportSnap = await db.collection(REPORTS).doc(id).get();
    if (!reportSnap.exists) return res.status(404).json({ error: 'Report not found' });

    const report = reportSnap.data();
    const department = CATEGORY_DEPARTMENT_MAP[report.category] || 'General Services';
    const severity = SEVERITY_CATEGORIES[report.category] || 1;

    const snapshot = await db.collection(USERS)
      .where('role', '==', 'officer')
      .limit(20)
      .get();

    const officers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const created = parseDate(report.createdAt);
    const daysOpen = created ? (new Date() - created) / 86400000 : 0;
    const priority = daysOpen > 7 ? 'high' : daysOpen > 3 ? 'medium' : 'normal';
    const suggestedDeadline = daysOpen > 7 ? '24 hours'
      : daysOpen > 3 ? '48 hours'
      : '72 hours';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Given the following civic issue and available officers, suggest the best officer to assign.

Issue: ${report.description}
Category: ${report.category}
Department: ${department}
Severity: ${severity}/4
Priority: ${priority}

Available Officers:
${officers.map((o, i) => `${i + 1}. ${o.name || o.id} - Reports handled: ${o.reportsCount || 0}`).join('\n')}

Respond with ONLY valid JSON:
{
  "suggestedOfficer": "name or id",
  "reason": "brief reason",
  "department": "${department}",
  "priority": "${priority}",
  "suggestedDeadline": "${suggestedDeadline}"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json?/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        suggestedOfficer: officers[0]?.name || 'Available officer',
        reason: 'Best match based on category expertise',
        department,
        priority,
        suggestedDeadline,
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error('Assignment suggestion error:', err);
    res.status(500).json({ error: 'Failed to suggest assignment' });
  }
}

export async function batchAutoAssign(req, res) {
  try {
    const snapshot = await db.collection(REPORTS)
      .where('status', '==', 'verified')
      .get();

    const assigned = [];
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      const report = { id: doc.id, ...doc.data() };
      const department = CATEGORY_DEPARTMENT_MAP[report.category] || 'General Services';
      const currentHistory = report.statusHistory || [];

      currentHistory.push({
        status: 'assigned',
        timestamp: new Date().toISOString(),
        note: `Auto-assigned to ${department} by AI`,
      });

      batch.update(doc.ref, {
        status: 'assigned',
        assignedDepartment: department,
        assignedTo: `${department} Team`,
        assignedBy: 'system',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: currentHistory,
      });

      assigned.push({ id: report.id, department });
    });

    await batch.commit();
    res.json({ assigned, count: assigned.length });
  } catch (err) {
    console.error('Batch auto-assign error:', err);
    res.status(500).json({ error: 'Failed to batch auto-assign' });
  }
}
