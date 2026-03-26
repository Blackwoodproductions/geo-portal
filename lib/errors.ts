import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
}

export function errorResponse(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code }, { status });
}

export function badRequest(message: string, code?: string) {
  return errorResponse(message, 400, code);
}

export function unauthorized(message = 'Authentication required') {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbidden(message = 'Access denied') {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function notFound(message = 'Not found') {
  return errorResponse(message, 404, 'NOT_FOUND');
}

export function tooManyRequests(message = 'Too many requests') {
  return errorResponse(message, 429, 'RATE_LIMITED');
}

export function serverError(message = 'Internal server error') {
  return errorResponse(message, 500, 'INTERNAL_ERROR');
}
