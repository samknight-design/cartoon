import { Asset } from 'expo-media-library';
import type { ScannedAsset } from './screenshots';

export async function findByDateRange(
  assets: Asset[],
  before?: Date,
  after?: Date,
  onProgress?: (done: number) => void
): Promise<ScannedAsset[]> {
  const results: ScannedAsset[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const creationTime = await asset.getCreationTime();
    const ts = creationTime ?? 0;

    const matchesBefore = before ? ts < before.getTime() : true;
    const matchesAfter = after ? ts > after.getTime() : true;

    if (matchesBefore && matchesAfter) {
      const [uri, filename, mediaType] = await Promise.all([
        asset.getUri(),
        asset.getFilename(),
        asset.getMediaType(),
      ]);
      results.push({ asset, confidence: 1.0, uri, filename, creationTime: ts, mediaType: String(mediaType) });
    }

    onProgress?.(i + 1);
  }

  return results;
}
