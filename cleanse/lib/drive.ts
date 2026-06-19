import axios from 'axios';
import { File, UploadTask, UploadType } from 'expo-file-system';
import { getAccessToken } from './auth';

const BASE = 'https://www.googleapis.com';

async function headers() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export async function ensureFolder(name: string, parentId?: string): Promise<string> {
  const h = await headers();
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const search = await axios.get(`${BASE}/drive/v3/files`, {
    headers: h,
    params: { q, fields: 'files(id,name)', spaces: 'drive' },
  });

  if (search.data.files?.length > 0) return search.data.files[0].id as string;

  const create = await axios.post(
    `${BASE}/drive/v3/files`,
    {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : ['root'],
    },
    { headers: h }
  );
  return create.data.id as string;
}

export async function ensureArchivePath(sweepName: string, theme: string, date: string): Promise<string> {
  const cleanse = await ensureFolder('Cleanse');
  const sweep = await ensureFolder(sweepName, cleanse);
  const themeFolder = await ensureFolder(theme, sweep);
  return ensureFolder(date, themeFolder);
}

export async function uploadFile(
  localUri: string,
  filename: string,
  mimeType: string,
  folderId: string,
  onProgress?: (pct: number) => void
): Promise<{ id: string; name: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const metadata = JSON.stringify({ name: filename, parents: [folderId] });
  const url = `${BASE}/upload/drive/v3/files?uploadType=multipart&fields=id,name`;

  const file = new File(localUri);
  const task = new UploadTask(file, url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    parameters: {
      metadata,
    },
    onProgress: onProgress
      ? ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) onProgress(bytesSent / totalBytes);
        }
      : undefined,
  });

  const result = await task.uploadAsync();
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed: ${result.status} ${result.body}`);
  }

  const body = JSON.parse(result.body);
  return { id: body.id, name: body.name };
}

export async function downloadFile(driveFileId: string, destUri: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');
  await File.downloadFileAsync(
    `${BASE}/drive/v3/files/${driveFileId}?alt=media`,
    new File(destUri),
    { headers: { Authorization: `Bearer ${token}` }, idempotent: true }
  );
}

export async function listArchiveItems(folderId?: string): Promise<DriveFile[]> {
  const h = await headers();
  const rootId = folderId ?? (await ensureFolder('Cleanse'));
  const res = await axios.get(`${BASE}/drive/v3/files`, {
    headers: h,
    params: {
      q: `'${rootId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,thumbnailLink,size,createdTime)',
      orderBy: 'createdTime desc',
    },
  });
  return res.data.files ?? [];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
}
