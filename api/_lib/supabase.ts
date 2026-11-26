import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const sendJson = (res: VercelResponse, statusCode: number, payload: unknown) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(statusCode).json(payload);
};

export const parseJsonBody = (req: VercelRequest): Record<string, unknown> | null => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}') as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return {};
};

export const extractBearerToken = (req: VercelRequest): string | null => {
  const header = req.headers.authorization || '';
  const value = Array.isArray(header) ? header[0] : header;
  return value.match(/^Bearer\s+(.+)$/i)?.[1] || null;
};

export const normalizeIdentifier = (value: unknown): string =>
  String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9/_-]/g, '');

export const internalEmail = (identifier: string): string =>
  `id-${normalizeIdentifier(identifier).replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()}@accounts.lasu.invalid`;

export const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9\s]/.test(value);

export const createAnonClient = (url: string, anonKey: string, token?: string) =>
  createClient(url, anonKey, {
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    auth: { persistSession: false, autoRefreshToken: false },
  });

export const createServiceClient = (url: string, serviceKey: string) =>
  createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
