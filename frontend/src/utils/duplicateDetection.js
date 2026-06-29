export async function checkDuplicates({ description, category, area, city }, token = '') {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/duplicate/detect', {
      method: 'POST',
      headers,
      body: JSON.stringify({ description, category, area, city }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.duplicates || [];
  } catch {
    return [];
  }
}
