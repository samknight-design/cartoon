import { Asset, Query, AssetField, MediaType } from 'expo-media-library';
import { findScreenshots } from './screenshots';
import { findDuplicates } from './duplicates';
import { findByDateRange } from './dateRange';
import { findFaceMatches, FaceMatchConfig } from './faceMatch';
import type { ScannedAsset } from './screenshots';
import { insertSweepItem, updateSweepStatus } from '../db';

export type ThemeName = 'screenshots' | 'duplicates' | 'date_range' | 'face_match';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  confidence: number;
  before?: Date;
  after?: Date;
  faceMatch?: FaceMatchConfig;
}

export interface ScanProgress {
  phase: 'loading' | 'scanning' | 'done';
  scanned: number;
  total: number;
  flaggedByTheme: Record<string, number>;
}

async function loadAllAssets(): Promise<Asset[]> {
  const allAssets: Asset[] = [];
  let offset = 0;
  const pageSize = 200;

  while (true) {
    const page = await new Query()
      .within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO])
      .orderBy(AssetField.CREATION_TIME)
      .limit(pageSize)
      .offset(offset)
      .exe();

    allAssets.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return allAssets;
}

export async function runSweep(
  sweepId: string,
  themes: ThemeConfig[],
  onProgress: (p: ScanProgress) => void
): Promise<void> {
  await updateSweepStatus(sweepId, 'running');
  onProgress({ phase: 'loading', scanned: 0, total: 0, flaggedByTheme: {} });

  const allAssets = await loadAllAssets();
  const total = allAssets.length;
  const flaggedByTheme: Record<string, number> = {};
  const seenKeys = new Set<string>();

  for (const themeConfig of themes) {
    flaggedByTheme[themeConfig.name] = 0;

    const tick = (done: number) => {
      onProgress({ phase: 'scanning', scanned: done, total, flaggedByTheme });
    };

    let matches: ScannedAsset[] = [];

    switch (themeConfig.name) {
      case 'screenshots':
        matches = await findScreenshots(allAssets, tick);
        break;
      case 'duplicates':
        matches = await findDuplicates(allAssets, tick);
        break;
      case 'date_range':
        matches = await findByDateRange(allAssets, themeConfig.before, themeConfig.after, tick);
        break;
      case 'face_match':
        matches = themeConfig.faceMatch
          ? await findFaceMatches(allAssets, themeConfig.faceMatch, tick)
          : [];
        break;
    }

    for (const m of matches) {
      if (m.confidence < themeConfig.confidence) continue;
      const key = `${themeConfig.name}_${m.asset.id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      await insertSweepItem({
        id: key,
        sweep_id: sweepId,
        asset_id: m.asset.id,
        asset_uri: m.uri,
        media_type: m.mediaType,
        theme: themeConfig.name,
        confidence: m.confidence,
        action: 'pending',
        filename: m.filename,
        file_size: undefined,
        created_time: m.creationTime,
      });

      flaggedByTheme[themeConfig.name] = (flaggedByTheme[themeConfig.name] ?? 0) + 1;
    }

    onProgress({ phase: 'scanning', scanned: total, total, flaggedByTheme });
  }

  const totalFlagged = Object.values(flaggedByTheme).reduce((a, b) => a + b, 0);
  await updateSweepStatus(sweepId, 'review', {
    total_scanned: total,
    total_flagged: totalFlagged,
  });

  onProgress({ phase: 'done', scanned: total, total, flaggedByTheme });
}
