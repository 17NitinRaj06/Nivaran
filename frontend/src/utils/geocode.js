const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeArea(area, city, state) {
  const parts = [area, city, state, 'India'].filter(Boolean);
  const q = parts.join(', ');

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch {
    return [];
  }
}
