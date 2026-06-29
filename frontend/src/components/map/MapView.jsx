import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { HiLocationMarker, HiCheckCircle, HiClock } from 'react-icons/hi';
import L from 'leaflet';

const defaultIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#2d6e34;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="color:white;font-size:16px">⚠</span></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const resolvedIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#689a50;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="color:white;font-size:16px">✓</span></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export default function MapView({ reports = [], center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, onLocationSelect }) {
  const isSelectable = !!onLocationSelect;

  const handleClick = (e) => {
    if (isSelectable) {
      onLocationSelect(e.latlng);
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      onClick={handleClick}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {reports.map((report) => {
        if (!report.lat || !report.lng) return null;
        const isResolved = report.status === 'resolved';
        return (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={isResolved ? resolvedIcon : defaultIcon}
          >
            <Popup className="custom-popup">
              <div className="min-w-[200px]">
                <p className="font-medium text-forest-800 text-sm mb-1">
                  {report.description?.slice(0, 80)}{(report.description?.length || 0) > 80 ? '...' : ''}
                </p>
                <div className="flex items-center gap-2 text-xs text-earth-500 mb-1">
                  <span className="capitalize px-2 py-0.5 rounded-full bg-beige-100">
                    {report.category}
                  </span>
                  <span className={`flex items-center gap-1 ${isResolved ? 'text-sage-600' : 'text-yellow-600'}`}>
                    {isResolved ? <HiCheckCircle size={12} /> : <HiClock size={12} />}
                    {report.status}
                  </span>
                </div>
                {report.area && report.city && (
                  <p className="text-xs text-earth-400 mb-1">
                    {report.area}, {report.city}{report.state ? `, ${report.state}` : ''}
                  </p>
                )}
                <p className="text-xs text-earth-400">
                  {report.userName} · {report.upvotes || 0} upvotes
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {isSelectable && center && (
        <Marker position={center} icon={defaultIcon}>
          <Popup>Selected location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
