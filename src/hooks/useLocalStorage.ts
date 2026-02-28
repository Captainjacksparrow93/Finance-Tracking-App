import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';
import { loadData, saveData } from '../utils/storage';

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);

  // Persist whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  return { data, update };
}
