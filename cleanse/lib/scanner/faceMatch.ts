import { Asset } from 'expo-media-library';
import type { ScannedAsset } from './screenshots';

export interface FaceMatchConfig {
  referencePhotoUris: string[];
  confidenceThreshold: number;
}

/**
 * Face match stub — requires @react-native-ml-kit/face-detection or equivalent.
 * Install the native module, extract face embeddings, then compare via cosine similarity.
 */
export async function findFaceMatches(
  assets: Asset[],
  _config: FaceMatchConfig,
  onProgress?: (done: number) => void
): Promise<ScannedAsset[]> {
  console.warn('[faceMatch] ML Kit not linked — face scan skipped');
  for (let i = 0; i < assets.length; i++) {
    onProgress?.(i + 1);
  }
  return [];
}
