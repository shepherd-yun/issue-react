import client from './client';
import type { Issue, PaginatedResponse } from '../types';

export interface QueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  area?: string;
  issueNumber?: string;
  title?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
}

export async function getIssues(
  params: QueryParams,
): Promise<PaginatedResponse<Issue>> {
  const query: Record<string, string | number> = {};
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;
  if (params.status && params.status !== 'all') query.status = params.status;
  if (params.area) query.area = params.area;
  if (params.issueNumber) query.issueNumber = params.issueNumber;
  if (params.title) query.title = params.title;
  if (params.phone) query.phone = params.phone;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;

  const { data } = await client.get<PaginatedResponse<Issue>>('/issues', {
    params: query,
  });
  return data;
}

export async function getIssue(id: string): Promise<Issue> {
  const { data } = await client.get<Issue>(`/issues/${id}`);
  return data;
}

export async function createIssue(issue: {
  title: string;
  description: string;
  area: string;
  location: string;
  creator: string;
  phone: string;
  images?: string[];
}): Promise<Issue> {
  const { data } = await client.post<Issue>('/issues', issue);
  return data;
}

export async function updateIssue(
  id: string,
  update: Partial<{
    title: string;
    description: string;
    area: string;
    location: string;
    creator: string;
    phone: string;
    images: string[];
    deadline: string;
  }>,
): Promise<Issue> {
  const { data } = await client.patch<Issue>(`/issues/${id}`, update);
  return data;
}

export async function deleteIssue(id: string): Promise<void> {
  await client.delete(`/issues/${id}`);
}

export async function updateIssueStatus(
  id: string,
  status: string,
): Promise<Issue> {
  const { data } = await client.patch<Issue>(`/issues/${id}/status`, {
    status,
  });
  return data;
}
