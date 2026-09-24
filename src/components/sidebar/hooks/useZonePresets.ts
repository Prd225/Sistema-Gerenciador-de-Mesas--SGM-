import { useState, useEffect } from 'react';
import type { Zone, ZoneEvent } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';

export function useZonePresets(zone: Zone | null) {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const [eventPresets, setEventPresets] = useState<ZoneEvent[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgm_event_presets');
      if (saved) setEventPresets(JSON.parse(saved));
    } catch {}
  }, []);

  const saveEventAsPreset = (evt: ZoneEvent) => {
    const newPresets = [...eventPresets, evt];
    setEventPresets(newPresets);
    localStorage.setItem('sgm_event_presets', JSON.stringify(newPresets));
  };

  const clearPresets = () => {
    if (!confirm('Limpar todas as predefinições salvas?')) return;
    setEventPresets([]);
    localStorage.removeItem('sgm_event_presets');
  };

  const addPresetEvent = (idxStr: string) => {
    if (idxStr === '' || !zone) return;
    const idx = parseInt(idxStr, 10);
    const preset = eventPresets[idx];
    if (!preset) return;
    const newEvents = [...(zone.data?.customEvents || []), { ...preset }];
    updateZoneData(zone.id, { customEvents: newEvents });
  };

  return {
    eventPresets,
    saveEventAsPreset,
    clearPresets,
    addPresetEvent,
  };
}
