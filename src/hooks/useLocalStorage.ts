import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData } from '../types';
import { loadData, saveData, defaultData } from '../utils/storage';

export function useAppData() {
  const [data, setData]       = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  // Becomes true once the server data has been loaded into state.
  // Used to prevent saving the defaultData placeholder back to the server.
  const didLoad = useRef(false);

  // Load from server on mount
  useEffect(() => {
    loadData().then((d) => {
      didLoad.current = true;
      setData(d);
      setLoading(false);
    });
  }, []);

  // Persist to server whenever data changes (skip until initial load is done)
  useEffect(() => {
    if (!didLoad.current) return;
    saveData(data);
  }, [data]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  return { data, update, loading };
}
