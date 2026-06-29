import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { HiFilter, HiX, HiLocationMarker, HiClock, HiCheckCircle, HiFire } from 'react-icons/hi';

const STATUS_ICONS = {
  'pending': L.divIcon({
    className: '', html: '<div style="background:#EAB308;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">⏳</div>',
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  }),
  'verified': L.divIcon({
    className: '', html: '<div style="background:#3B82F6;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">✓</div>',
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  }),
  'assigned': L.divIcon({
    className: '', html: '<div style="background:#8B5CF6;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">👥</div>',
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  }),
  'in-progress': L.divIcon({
    className: '', html: '<div style="background:#F97316;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">🔧</div>',
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  }),
  'resolved': L.divIcon({
    className: '', html: '<div style="background:#22C55E;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">✓</div>',
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  }),
};


const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const CATEGORIES = ['all', 'pothole', 'streetlight', 'garbage', 'drainage', 'water', 'road', 'electricity', 'other'];
const STATUSES = ['all', 'pending', 'verified', 'assigned', 'in-progress', 'resolved'];

function HeatmapLayer({ points, intensity }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!window.L.heatLayer) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    if (points.length > 0) {
      const heatPoints = points.map(p => [p.lat, p.lng, intensity]);
      layerRef.current = L.heatLayer(heatPoints, {
        radius: 30,
        blur: 20,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.0: '#22c55e',
          0.3: '#84cc16',
          0.5: '#eab308',
          0.7: '#f97316',
          0.9: '#ef4444',
        },
      });
      map.addLayer(layerRef.current);
    }
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map, points, intensity]);

  return null;
}

function MapMarker({ report }) {
  const lat = parseFloat(report.lat);
  const lng = parseFloat(report.lng);
  if (isNaN(lat) || isNaN(lng)) return null;

  const icon = STATUS_ICONS[report.status] || STATUS_ICONS.pending;

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
    >
      <Popup className="custom-popup">
        <div className="min-w-[220px] p-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              report.status === 'resolved' ? 'bg-green-100 text-green-700' :
              report.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>{report.status}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-beige-100 text-earth-600">{report.category}</span>
          </div>
          <p className="text-sm text-forest-800 font-medium mb-1">
            {report.description?.slice(0, 100)}{(report.description?.length || 0) > 100 ? '...' : ''}
          </p>
          {report.area && <p className="text-xs text-earth-500 mb-1">{report.area}, {report.city}</p>}
          <div className="flex items-center justify-between text-xs text-earth-400">
            <span>{report.userName || 'Anonymous'}</span>
            <span>{report.upvotes || 0} upvotes</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function EnhancedMapView({
  reports = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onLocationSelect,
  showHeatmap = true,
  height = '600px',
}) {
  const reportsWithCoords = useMemo(() => {
    return reports.filter(r => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lng);
      return !isNaN(lat) && !isNaN(lng);
    });
  }, [reports]);
  const [heatmapEnabled, setHeatmapEnabled] = useState(showHeatmap);
  const [heatIntensity, setHeatIntensity] = useState(0.6);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const filteredReports = useMemo(() => {
    let filtered = [...reports];
    if (categoryFilter !== 'all') filtered = filtered.filter(r => r.category === categoryFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
    if (dateRange === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(r => r.createdAt?.seconds * 1000 > weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(r => r.createdAt?.seconds * 1000 > monthAgo);
    }
    return filtered;
  }, [reports, categoryFilter, statusFilter, dateRange]);

  const heatmapPoints = useMemo(() => {
    return reportsWithCoords.map(r => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lng) }));
  }, [reportsWithCoords]);

  const stats = useMemo(() => {
    return {
      total: filteredReports.length,
      resolved: filteredReports.filter(r => r.status === 'resolved').length,
      pending: filteredReports.filter(r => r.status === 'pending' || r.status === 'verified').length,
      inProgress: filteredReports.filter(r => r.status === 'in-progress' || r.status === 'assigned').length,
    };
  }, [filteredReports]);

  const activeFilters = [categoryFilter, statusFilter, dateRange].filter(f => f !== 'all').length;
  const hasCoords = reportsWithCoords.length > 0;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card" style={{ height }}>
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-soft p-2 flex gap-1">
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              heatmapEnabled ? 'bg-forest-500 text-white' : 'text-earth-600 hover:bg-beige-50'
            }`}
          >
            <HiFire size={14} />
            Heatmap
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterOpen || activeFilters > 0 ? 'bg-forest-500 text-white' : 'text-earth-600 hover:bg-beige-50'
            }`}
          >
            <HiFilter size={14} />
            Filters
            {activeFilters > 0 && <span className="w-4 h-4 bg-white text-forest-700 rounded-full text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl shadow-soft p-3 min-w-[140px]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-earth-500">Total:</span>
          <span className="text-forest-800 font-medium text-right">{stats.total}</span>
          <span className="text-green-600">Resolved:</span>
          <span className="text-forest-800 font-medium text-right">{stats.resolved}</span>
          <span className="text-yellow-600">Pending:</span>
          <span className="text-forest-800 font-medium text-right">{stats.pending}</span>
          <span className="text-orange-600">Active:</span>
          <span className="text-forest-800 font-medium text-right">{stats.inProgress}</span>
        </div>
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-soft p-4 w-72 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-forest-700">Map Filters</span>
              <button onClick={() => setFilterOpen(false)} className="text-earth-400 hover:text-earth-600"><HiX size={16} /></button>
            </div>
            <div>
              <label className="text-xs text-earth-500 block mb-1">Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field py-1.5 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-earth-500 block mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-1.5 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-earth-500 block mb-1">Date</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="input-field py-1.5 text-sm">
                <option value="all">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
            {heatmapEnabled && (
              <div>
                <label className="text-xs text-earth-500 block mb-1">Heat Intensity: {heatIntensity.toFixed(1)}</label>
                <input type="range" min="0.1" max="1" step="0.1" value={heatIntensity} onChange={e => setHeatIntensity(parseFloat(e.target.value))} className="w-full" />
              </div>
            )}
            <button onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setDateRange('all'); }} className="text-xs text-forest-600 hover:underline">Clear filters</button>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasCoords && reports.length > 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-beige-50 rounded-2xl">
          <div className="text-center p-8">
            <HiLocationMarker className="mx-auto text-beige-300 mb-3" size={40} />
            <p className="text-earth-500 font-medium">No reports with map coordinates found</p>
            <p className="text-earth-400 text-sm mt-1">Reports need a pinned location to appear on the map</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          onClick={(e) => onLocationSelect?.(e.latlng)}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {heatmapEnabled && <HeatmapLayer points={heatmapPoints} intensity={heatIntensity} />}

          {filteredReports.map((report) => (
            <MapMarker key={report.id} report={report} />
          ))}
        </MapContainer>
      )}
    </div>
  );
}
