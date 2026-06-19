import { Asset } from 'expo-media-library';
import type { ScannedAsset } from './screenshots';

export async function findDuplicates(
  assets: Asset[],
  onProgress?: (done: number) => void
): Promise<Array<ScannedAsset & { groupId: string }>> {
  // Build a metadata map — async getters called once per asset
  type Meta = { filename: string; creationTime: number; duration: number | null; uri: string; mediaType: string };
  const metaList: Array<{ asset: Asset; meta: Meta }> = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const [filename, creationTime, duration, uri, mediaType] = await Promise.all([
      asset.getFilename(),
      asset.getCreationTime(),
      asset.getDuration(),
      asset.getUri(),
      asset.getMediaType(),
    ]);
    metaList.push({
      asset,
      meta: { filename, creationTime: creationTime ?? 0, duration, uri, mediaType: String(mediaType) },
    });
    onProgress?.(i + 1);
  }

  // Group by composite key: duration bucket + creation-time rounded to 1s
  const hashMap = new Map<string, typeof metaList>();
  for (const entry of metaList) {
    const { creationTime, duration } = entry.meta;
    const key = `${Math.round((duration ?? 0) * 10)}_${Math.round(creationTime / 1000)}`;
    const group = hashMap.get(key) ?? [];
    group.push(entry);
    hashMap.set(key, group);
  }

  const results: Array<ScannedAsset & { groupId: string }> = [];
  for (const [key, group] of hashMap.entries()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.meta.creationTime - b.meta.creationTime);
    // Flag all but the oldest
    for (let i = 1; i < sorted.length; i++) {
      const { asset, meta } = sorted[i];
      results.push({
        asset,
        confidence: 0.85,
        groupId: key,
        uri: meta.uri,
        filename: meta.filename,
        creationTime: meta.creationTime,
        mediaType: meta.mediaType,
      });
    }
  }

  return results;
}
