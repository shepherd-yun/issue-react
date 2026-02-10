export const AREAS = [
  '上合管委',
  '临空管委',
  '大沽河管委',
  '阜安街道',
  '中云街道',
  '胶北街道',
  '三里河街道',
  '胶东街道',
  '九龙街道',
  '胶莱街道',
  '胶西街道',
  '李哥庄镇',
] as const;

export type Area = (typeof AREAS)[number];

export type IssueStatus = 'pending' | 'rejected' | 'resolved';
export type FollowUpStatus = 'normal' | 'rejected' | 'resolved';
export type Role = 'admin' | 'resolver';
export type UserRole = 'user' | 'resolver' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface Issue {
  id: string;
  issueNumber: string;
  title: string | null;
  description: string | null;
  status: IssueStatus;
  creator: string | null;
  phone: string | null;
  area: string;
  location: string | null;
  images: string[];
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: string;
  issueId: string;
  handlerId: string | null;
  handlerName: string;
  handleDescription: string | null;
  handleImages: string[];
  handleTime: string;
  status: FollowUpStatus;
  rejectionReason: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  handler: { id: string; name: string } | null;
}

export interface StatusCounts {
  all: number;
  pending: number;
  rejected: number;
  resolved: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: StatusCounts;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface IssueFilters {
  area: string;
  issueNumber: string;
  dateRange: { start: string; end: string };
  title: string;
  phone: string;
  status: string;
}
