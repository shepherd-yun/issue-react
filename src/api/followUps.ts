import client from './client';
import type { FollowUp } from '../types';

export async function createFollowUp(
  issueId: string,
  data: {
    handlerName: string;
    handleImages: string[];
    handleDescription?: string;
  },
): Promise<FollowUp> {
  const { data: result } = await client.post<FollowUp>(
    `/issues/${issueId}/follow-ups`,
    data,
  );
  return result;
}

export async function updateFollowUp(
  id: string,
  data: {
    handleDescription?: string;
    handleImages?: string[];
  },
): Promise<FollowUp> {
  const { data: result } = await client.patch<FollowUp>(
    `/follow-ups/${id}`,
    data,
  );
  return result;
}

export async function deleteFollowUp(id: string): Promise<void> {
  await client.delete(`/follow-ups/${id}`);
}
