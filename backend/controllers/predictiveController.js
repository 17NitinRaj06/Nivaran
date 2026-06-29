import { db } from '../firebase/admin.js';

const REPORTS = 'reports';

function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'object' && value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

function movingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
    result.push(avg);
  }
  return result;
}

function linearForecast(data, steps) {
  const n = data.length;
  if (n < 2) return Array(steps).fill(data[n - 1] || 0);
  const xMean = (n - 1) / 2;
  let yMean = 0;
  for (let i = 0; i < n; i++) yMean += data[i];
  yMean /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (data[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  const forecast = [];
  for (let i = 1; i <= steps; i++) {
    const val = intercept + slope * (n - 1 + i);
    forecast.push(Math.max(0, Math.round(val)));
  }
  return forecast;
}

export async function getPredictions(req, res) {
  try {
    const snapshot = await db.collection(REPORTS).get();
    const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const now = new Date();
    const dailyCounts = {};
    const categoryCounts = {};
    const areaCounts = {};
    const resolutionTimes = {};
    const deptResolutionTimes = {};

    reports.forEach(r => {
      const created = parseDate(r.createdAt);
      if (created) {
        const day = created.toISOString().slice(0, 10);
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
      if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      if (r.area) {
        if (!areaCounts[r.area]) areaCounts[r.area] = { total: 0, recent: 0, pending: 0, days: [] };
        areaCounts[r.area].total++;
        if (r.status === 'pending' || r.status === 'verified') areaCounts[r.area].pending++;
        if (created && (now - created) / 86400000 < 14) areaCounts[r.area].recent++;
        if (created) areaCounts[r.area].days.push(created.toISOString().slice(0, 10));
      }
      if (r.category && r.status === 'resolved') {
        const resolvedAt = parseDate(r.resolvedAt || r.updatedAt);
        const created = parseDate(r.createdAt);
        if (resolvedAt && created) {
          const days = (resolvedAt - created) / 86400000;
          if (!resolutionTimes[r.category]) resolutionTimes[r.category] = [];
          resolutionTimes[r.category].push(days);
        }
      }
      if (r.assignedDepartment && r.status === 'resolved') {
        const resolvedAt = parseDate(r.resolvedAt || r.updatedAt);
        const created = parseDate(r.createdAt);
        if (resolvedAt && created) {
          const days = (resolvedAt - created) / 86400000;
          if (!deptResolutionTimes[r.assignedDepartment]) deptResolutionTimes[r.assignedDepartment] = [];
          deptResolutionTimes[r.assignedDepartment].push(days);
        }
      }
    });

    const sortedDays = Object.keys(dailyCounts).sort();
    const counts = sortedDays.map(d => dailyCounts[d]);

    const forecast7 = linearForecast(counts, 7);
    const forecast30 = linearForecast(counts, 30);
    const smoothed = movingAverage(counts, 7);

    const lastDate = sortedDays.length > 0 ? new Date(sortedDays[sortedDays.length - 1]) : now;
    const trendLabels7 = [];
    const trendLabels30 = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      trendLabels7.push(d.toISOString().slice(0, 10));
    }
    for (let i = 1; i <= 30; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      trendLabels30.push(d.toISOString().slice(0, 10));
    }

    const categoryForecast = {};
    const catNames = Object.keys(categoryCounts);
    catNames.forEach(cat => {
      const catReports = reports.filter(r => r.category === cat);
      const catDaily = {};
      catReports.forEach(r => {
        const created = parseDate(r.createdAt);
        if (created) {
          const day = created.toISOString().slice(0, 10);
          catDaily[day] = (catDaily[day] || 0) + 1;
        }
      });
      const catCounts = sortedDays.map(d => catDaily[d] || 0);
      categoryForecast[cat] = {
        current: categoryCounts[cat],
        forecast7: linearForecast(catCounts, 7),
        avgResolutionDays: resolutionTimes[cat]
          ? Math.round((resolutionTimes[cat].reduce((a, b) => a + b, 0) / resolutionTimes[cat].length) * 10) / 10
          : null,
      };
    });

    const hotspots = Object.entries(areaCounts)
      .map(([area, data]) => {
        const velocity = data.recent / Math.max(1, data.total);
        const urgency = data.pending / Math.max(1, data.total);
        const score = Math.min(100, Math.round((velocity * 50 + urgency * 30 + (data.total > 5 ? 20 : 0))));
        return { area, total: data.total, pending: data.pending, recent: data.recent, score };
      })
      .filter(h => h.score > 20)
      .sort((a, b) => b.score - a.score);

    const deptPredictions = {};
    Object.entries(deptResolutionTimes).forEach(([dept, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      deptPredictions[dept] = {
        avgResolutionDays: Math.round(avg * 10) / 10,
        casesHandled: times.length,
        load: Math.round((times.length / reports.length) * 100),
      };
    });

    const pendingPrediction = reports.filter(r => r.status === 'pending' || r.status === 'verified' || r.status === 'assigned' || r.status === 'in-progress');
    const pendingWithRisk = pendingPrediction.map(r => {
      const created = parseDate(r.createdAt);
      const daysOpen = created ? (now - created) / 86400000 : 0;
      let risk = 'low';
      let riskScore = 0;
      if (daysOpen > 14) { risk = 'high'; riskScore = 3; }
      else if (daysOpen > 7) { risk = 'medium'; riskScore = 2; }
      else riskScore = 1;
      return {
        id: r.id,
        area: r.area,
        category: r.category,
        status: r.status,
        daysOpen: Math.round(daysOpen * 10) / 10,
        risk,
        riskScore,
      };
    }).sort((a, b) => b.riskScore - a.riskScore || b.daysOpen - a.daysOpen);

    const trendDirection = counts.length >= 14
      ? (counts.slice(-7).reduce((a, b) => a + b, 0) / 7) - (counts.slice(-14, -7).reduce((a, b) => a + b, 0) / 7)
      : 0;

    res.json({
      forecast: {
        daily: sortedDays.map((d, i) => ({ date: d, actual: counts[i], smoothed: Math.round(smoothed[i] * 10) / 10 })),
        next7: trendLabels7.map((d, i) => ({ date: d, predicted: forecast7[i] })),
        next30: trendLabels30.map((d, i) => ({ date: d, predicted: forecast30[i] })),
        trendDirection: Math.round(trendDirection * 10) / 10,
        totalPredicted7: forecast7.reduce((a, b) => a + b, 0),
        totalPredicted30: forecast30.reduce((a, b) => a + b, 0),
      },
      hotspots: hotspots.slice(0, 20),
      categoryForecast,
      deptPredictions,
      escalationRisk: {
        high: pendingWithRisk.filter(r => r.risk === 'high').length,
        medium: pendingWithRisk.filter(r => r.risk === 'medium').length,
        low: pendingWithRisk.filter(r => r.risk === 'low').length,
        items: pendingWithRisk.slice(0, 10),
      },
    });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
}
