import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiTrendingUp, HiExclamationCircle, HiLocationMarker, HiClock,
  HiDocumentReport, HiLightningBolt, HiCalendar, HiChartBar,
  HiArrowUp, HiArrowDown, HiX, HiShieldExclamation,
} from 'react-icons/hi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { SkeletonLoader } from '../../components/skeletons/LoadingSkeleton';

export default function PredictiveInsights() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7');
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/insights/predictions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="space-y-6"><SkeletonLoader type="page" /></div>;
  if (!data) return <div className="card p-8 text-center text-earth-500">Failed to load predictions</div>;

  const { forecast, hotspots, categoryForecast, deptPredictions, escalationRisk } = data;

  const trendUp = forecast.trendDirection >= 0;
  const forecastData = range === '7' ? forecast.next7 : forecast.next30;
  const combinedChart = [
    ...forecast.daily.slice(-30).map(d => ({ ...d, predicted: null })),
    ...forecastData.map(d => ({ date: d.date, predicted: d.predicted, actual: null })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-forest-800 flex items-center gap-2">
            <HiLightningBolt className="text-amber-500" />
            Predictive Insights
          </h2>
          <p className="text-sm text-earth-500 mt-1">AI-driven forecasting and risk analysis based on historical data</p>
        </div>
        <button onClick={fetchPredictions} className="btn-secondary text-sm px-4 py-2">Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Forecast (7d)', value: forecast.totalPredicted7, icon: HiTrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Forecast (30d)', value: forecast.totalPredicted30, icon: HiCalendar, color: 'text-purple-600 bg-purple-50' },
          { label: 'Hotspots', value: hotspots.length, icon: HiLocationMarker, color: 'text-red-600 bg-red-50' },
          { label: 'High Risk', value: escalationRisk.high, icon: HiShieldExclamation, color: 'text-orange-600 bg-orange-50' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
            <div className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
              <card.icon size={16} />
            </div>
            <p className="text-xl font-bold text-forest-800">{card.value}</p>
            <p className="text-xs text-earth-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-forest-700 flex items-center gap-2">
            <HiChartBar className="text-forest-500" />
            Complaint Volume Forecast
          </h3>
          <div className="flex gap-1 bg-beige-50 rounded-xl p-1">
            <button onClick={() => setRange('7')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === '7' ? 'bg-white text-forest-700 shadow-sm' : 'text-earth-500'}`}>7 days</button>
            <button onClick={() => setRange('30')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === '30' ? 'bg-white text-forest-700 shadow-sm' : 'text-earth-500'}`}>30 days</button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className={`flex items-center gap-1 ${trendUp ? 'text-red-600' : 'text-green-600'}`}>
            {trendUp ? <HiArrowUp size={14} /> : <HiArrowDown size={14} />}
            {Math.abs(forecast.trendDirection).toFixed(1)} avg daily change
          </span>
          <span className="text-earth-300">|</span>
          <span className="text-earth-500">Moving average + linear regression</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={combinedChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="actual" stroke="#2d6e34" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
            <Line type="monotone" dataKey="smoothed" stroke="#689a50" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Trend" connectNulls={false} />
            <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-3 text-xs text-earth-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-forest-600 inline-block" /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sage-500 inline-block border-dashed" style={{ borderTop: '2px dashed #689a50', height: 0 }} /> Trend</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-500 inline-block" style={{ borderTop: '2px dashed #f97316', height: 0 }} /> Forecast</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-forest-700 mb-4 flex items-center gap-2">
            <HiLocationMarker className="text-red-500" />
            High-Risk Hotspots
          </h3>
          {hotspots.length === 0 ? (
            <p className="text-earth-500 text-sm">No high-risk areas detected</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {hotspots.map((h, i) => (
                <button
                  key={h.area}
                  onClick={() => setSelectedHotspot(selectedHotspot === h.area ? null : h.area)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                    selectedHotspot === h.area ? 'bg-red-50 border border-red-200' : 'bg-beige-50 hover:bg-beige-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      h.score >= 70 ? 'bg-red-500' : h.score >= 50 ? 'bg-orange-500' : 'bg-amber-500'
                    }`}>{i + 1}</span>
                    <div className="text-left">
                      <p className="font-medium text-earth-800">{h.area}</p>
                      <p className="text-xs text-earth-400">{h.total} reports · {h.pending} pending · {h.recent} recent</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    h.score >= 70 ? 'bg-red-100 text-red-700' : h.score >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                  }`}>{h.score}/100</span>
                </button>
              ))}
            </div>
          )}
          {selectedHotspot && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-3 bg-red-50 rounded-xl text-sm">
              <div className="flex items-start justify-between">
                <p className="font-medium text-red-700">{selectedHotspot}</p>
                <button onClick={() => setSelectedHotspot(null)}><HiX size={14} className="text-red-400" /></button>
              </div>
              <p className="text-red-600 text-xs mt-1">
                This area shows elevated complaint activity. Consider proactive inspection and resource allocation.
              </p>
            </motion.div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-forest-700 mb-4 flex items-center gap-2">
            <HiShieldExclamation className="text-orange-500" />
            Escalation Risk
          </h3>
          <div className="flex gap-3 mb-4">
            {[
              { label: 'High', value: escalationRisk.high, color: 'bg-red-100 text-red-700' },
              { label: 'Medium', value: escalationRisk.medium, color: 'bg-amber-100 text-amber-700' },
              { label: 'Low', value: escalationRisk.low, color: 'bg-green-100 text-green-700' },
            ].map(s => (
              <div key={s.label} className={`flex-1 p-3 rounded-xl text-center ${s.color}`}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          {escalationRisk.items.length > 0 && (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {escalationRisk.items.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2.5 bg-beige-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      r.risk === 'high' ? 'bg-red-500' : r.risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <span className="truncate text-earth-700 text-xs">{r.area || r.id?.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-earth-400">{r.daysOpen}d open</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                      r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      r.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-forest-700 mb-4 flex items-center gap-2">
            <HiDocumentReport className="text-forest-500" />
            Category Forecast
          </h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {Object.entries(categoryForecast).map(([cat, info]) => (
              <div key={cat} className="p-3 bg-beige-50 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm text-earth-800 capitalize">{cat}</span>
                  <span className="text-xs text-earth-400">{info.current} total</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-earth-500">
                  <span>Forecast 7d: <strong className="text-forest-700">{info.forecast7?.reduce((a, b) => a + b, 0) ?? '—'}</strong></span>
                  {info.avgResolutionDays && (
                    <span>Avg resolution: <strong className="text-forest-700">{info.avgResolutionDays}d</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-forest-700 mb-4 flex items-center gap-2">
            <HiClock className="text-purple-500" />
            Department Resolution Predictions
          </h3>
          {Object.keys(deptPredictions).length === 0 ? (
            <p className="text-earth-500 text-sm">No department resolution data yet</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {Object.entries(deptPredictions).map(([dept, info]) => (
                <div key={dept} className="p-3 bg-beige-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-earth-800">{dept}</span>
                    <span className="text-xs text-earth-400">{info.casesHandled} cases</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-earth-500">
                    <span>Avg resolution: <strong className="text-forest-700">{info.avgResolutionDays}d</strong></span>
                    <span>Load: <strong className="text-purple-700">{info.load}%</strong></span>
                  </div>
                  <div className="mt-1.5 w-full bg-beige-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(info.load, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
