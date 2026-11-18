const supportedMp3Types = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mpeg',
  'audio/mpeg3',
  'audio/x-mpeg-3',
  'application/octet-stream',
]);

export function validateAudioFile(file) {
  if (!file) return { valid: false, message: 'Choose an MP3 file to continue.' };

  const isMp3Name = /\.mp3$/i.test(file.name || '');
  const type = (file.type || '').toLowerCase();
  const isSupportedType = !type || supportedMp3Types.has(type);

  if (!isMp3Name || !isSupportedType) {
    return { valid: false, message: 'That file is not a supported MP3. Choose a .mp3 file to continue.' };
  }

  return { valid: true, message: '' };
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}
