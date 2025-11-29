import { get, set, del } from 'idb-keyval';
import { ProjectData } from '../types';

const STORAGE_KEY = 'pdf-correction-project';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const saveProject = async (data: ProjectData): Promise<void> => {
  try {
    await set(STORAGE_KEY, data);
  } catch (e) {
    console.error('Failed to save project:', e);
    throw new Error('Storage quota exceeded or error.');
  }
};

export const loadProject = async (): Promise<ProjectData | null> => {
  try {
    const data = await get<ProjectData>(STORAGE_KEY);
    if (!data) return null;

    // Check expiration
    if (Date.now() - data.timestamp > EXPIRY_MS) {
      await del(STORAGE_KEY);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Failed to load project:', e);
    return null;
  }
};

export const clearProject = async (): Promise<void> => {
  await del(STORAGE_KEY);
};
