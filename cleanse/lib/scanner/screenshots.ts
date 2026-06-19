import { Asset } from 'expo-media-library';

export interface ScannedAsset {
  asset: Asset;
  confidence: number;
  uri: string;
  filename: string;
  creationTime: number;
  mediaType: string;
}

export async function findScreenshots(
  assets: Asset[],
  onProgress?: (done: number) => void
): Promise<ScannedAsset[]> {
  const results: ScannedAsset[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const filename = await asset.getFilename();
    const lower = filename.toLowerCase();

    const isScreenshot =
      /screenshot[_\s-]/i.test(filename) ||
      lower.startsWith('screenshot') ||
      lower.includes('screen_shot') ||
      lower.includes('screen shot');

    if (isScreenshot) {
      const [uri, creationTime, mediaType] = await Promise.all([
        asset.getUri(),
        asset.getCreationTime(),
        asset.getMediaType(),
      ]);
      results.push({
        asset,
        confidence: 0.95,
        uri,
        filename,
        creationTime: creationTime ?? 0,
        mediaType: String(mediaType),
      });
    }

    onProgress?.(i + 1);
  }

  return results;
}
