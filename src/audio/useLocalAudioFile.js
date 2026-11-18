import { useCallback, useState } from 'react';
import { validateAudioFile } from './songFiles.js';

export default function useLocalAudioFile() {
  const [track, setTrack] = useState(null);
  const [fileError, setFileError] = useState('');

  const selectFile = useCallback((file) => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setFileError(validation.message);
      return false;
    }

    setTrack({ file });
    setFileError('');
    return true;
  }, []);

  const clearFileError = useCallback(() => setFileError(''), []);

  return { track, fileError, selectFile, clearFileError };
}
