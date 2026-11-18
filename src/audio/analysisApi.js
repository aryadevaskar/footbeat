export async function analyseTrack(file, { signal } = {}) {
  const body = new FormData();
  body.append('file', file, file.name);

  let response;
  try {
    response = await fetch('/api/analyse', { method: 'POST', body, signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not reach the FOOTBEAT analysis service. Check that the Python backend is running.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The analysis service returned an unreadable response.');
  }

  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : 'Audio analysis failed. Try another MP3 file.';
    throw new Error(detail);
  }

  if (!Array.isArray(payload.beat_times) || !Number.isFinite(payload.duration)) {
    throw new Error('The analysis service returned incomplete rhythm data.');
  }

  return payload;
}
