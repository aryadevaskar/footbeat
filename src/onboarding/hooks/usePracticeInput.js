import { useEffect, useRef } from 'react';
import { zones } from '../../data/zones.js';

const keyToZone = Object.fromEntries(zones.map(({ key, id }) => [key.toLowerCase(), id]));

export default function usePracticeInput(active, onZoneKey) {
  const heldKeys = useRef(new Set());
  const callback = useRef(onZoneKey);
  callback.current = onZoneKey;

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const zoneId = keyToZone[key];
      if (!zoneId || event.repeat || heldKeys.current.has(key)) return;
      heldKeys.current.add(key);
      event.preventDefault();
      callback.current(zoneId);
    };
    const onKeyUp = (event) => heldKeys.current.delete(event.key.toLowerCase());
    const onBlur = () => heldKeys.current.clear();

    if (active) window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      if (active) window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      heldKeys.current.clear();
    };
  }, [active]);
}
