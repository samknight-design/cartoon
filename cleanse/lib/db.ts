import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('cleanse.db');
  await migrate(_db);
  return _db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sweeps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      themes TEXT NOT NULL DEFAULT '[]',
      total_scanned INTEGER DEFAULT 0,
      total_flagged INTEGER DEFAULT 0,
      total_archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sweep_items (
      id TEXT PRIMARY KEY,
      sweep_id TEXT NOT NULL REFERENCES sweeps(id),
      asset_id TEXT NOT NULL,
      asset_uri TEXT NOT NULL,
      media_type TEXT NOT NULL,
      theme TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      action TEXT DEFAULT 'pending',
      drive_file_id TEXT,
      drive_path TEXT,
      archived_at INTEGER,
      filename TEXT,
      file_size INTEGER,
      created_time INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_sweep_items_sweep ON sweep_items(sweep_id);
    CREATE INDEX IF NOT EXISTS idx_sweep_items_action ON sweep_items(action);
  `);
}

export interface Sweep {
  id: string;
  name: string;
  created_at: number;
  status: 'pending' | 'running' | 'review' | 'archiving' | 'complete';
  themes: string[];
  total_scanned: number;
  total_flagged: number;
  total_archived: number;
}

export interface SweepItem {
  id: string;
  sweep_id: string;
  asset_id: string;
  asset_uri: string;
  media_type: string;
  theme: string;
  confidence: number;
  action: 'pending' | 'archive' | 'keep' | 'skip';
  drive_file_id?: string;
  drive_path?: string;
  archived_at?: number;
  filename?: string;
  file_size?: number;
  created_time?: number;
}

export async function createSweep(sweep: Omit<Sweep, 'total_scanned' | 'total_flagged' | 'total_archived'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sweeps (id, name, created_at, status, themes) VALUES (?, ?, ?, ?, ?)`,
    sweep.id, sweep.name, sweep.created_at, sweep.status, JSON.stringify(sweep.themes)
  );
}

export async function updateSweepStatus(id: string, status: Sweep['status'], counts?: Partial<Pick<Sweep, 'total_scanned' | 'total_flagged' | 'total_archived'>>): Promise<void> {
  const db = await getDb();
  if (counts) {
    await db.runAsync(
      `UPDATE sweeps SET status = ?, total_scanned = COALESCE(?, total_scanned), total_flagged = COALESCE(?, total_flagged), total_archived = COALESCE(?, total_archived) WHERE id = ?`,
      status, counts.total_scanned ?? null, counts.total_flagged ?? null, counts.total_archived ?? null, id
    );
  } else {
    await db.runAsync(`UPDATE sweeps SET status = ? WHERE id = ?`, status, id);
  }
}

export async function getSweep(id: string): Promise<Sweep | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM sweeps WHERE id = ?`, id);
  if (!row) return null;
  return { ...row, themes: JSON.parse(row.themes) };
}

export async function listSweeps(): Promise<Sweep[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM sweeps ORDER BY created_at DESC`);
  return rows.map(r => ({ ...r, themes: JSON.parse(r.themes) }));
}

export async function insertSweepItem(item: SweepItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO sweep_items (id, sweep_id, asset_id, asset_uri, media_type, theme, confidence, action, filename, file_size, created_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.sweep_id, item.asset_id, item.asset_uri, item.media_type,
    item.theme, item.confidence, item.action,
    item.filename ?? null, item.file_size ?? null, item.created_time ?? null
  );
}

export async function getSweepItems(sweepId: string, theme?: string): Promise<SweepItem[]> {
  const db = await getDb();
  if (theme) {
    return db.getAllAsync<SweepItem>(`SELECT * FROM sweep_items WHERE sweep_id = ? AND theme = ? ORDER BY confidence DESC`, sweepId, theme);
  }
  return db.getAllAsync<SweepItem>(`SELECT * FROM sweep_items WHERE sweep_id = ? ORDER BY theme, confidence DESC`, sweepId);
}

export async function updateItemAction(id: string, action: SweepItem['action']): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sweep_items SET action = ? WHERE id = ?`, action, id);
}

export async function markItemArchived(id: string, driveFileId: string, drivePath: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sweep_items SET drive_file_id = ?, drive_path = ?, archived_at = ?, action = 'archive' WHERE id = ?`,
    driveFileId, drivePath, Date.now(), id
  );
}
