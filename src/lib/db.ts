import { get, set, del, keys } from 'idb-keyval';

export interface RelicRecord {
  id: string;
  timestamp: number;
  originalImage: string; // Base64
  result: any; // The full JSON from the AI
}

const STORE_PREFIX = 'relic_';

export async function saveRelic(image: string, result: any): Promise<string> {
  const id = STORE_PREFIX + Date.now().toString();
  const record: RelicRecord = {
    id,
    timestamp: Date.now(),
    originalImage: image,
    result
  };
  await set(id, record);
  return id;
}

export async function getAllRelics(): Promise<RelicRecord[]> {
  const allKeys = await keys();
  const relicKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(STORE_PREFIX));
  
  const records: RelicRecord[] = [];
  for (const key of relicKeys) {
    const record = await get(key);
    if (record) {
      records.push(record as RelicRecord);
    }
  }
  
  // Sort descending by timestamp (newest first)
  return records.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteRelic(id: string): Promise<void> {
  await del(id);
}
