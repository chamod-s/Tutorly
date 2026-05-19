import { Role } from '@prisma/client';

// ─── Auth types ───────────────────────────────────────────────

export interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

// ─── API Response types ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: PaginationMeta;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── PayHere types ────────────────────────────────────────────

export interface PayhereOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  itemName: string;
}

export interface PayhereWebhookPayload {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  payment_id?: string;
  subscription_id?: string;
  customer_token?: string;
  method?: string;
  status_message?: string;
}

// ─── Socket event types ───────────────────────────────────────

export interface SocketChatMessage {
  chatRoomId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
}

export interface SocketNotification {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

// ─── Analytics ───────────────────────────────────────────────

export interface AnalyticsDashboard {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  totalLessons: number;
  recentPayments: unknown[];
  enrollmentTrend: unknown[];
  topCourses: unknown[];
}
