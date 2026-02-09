import client from './client';

export async function uploadImages(
  files: File[],
): Promise<{ urls: string[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await client.post<{ urls: string[] }>(
    '/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
