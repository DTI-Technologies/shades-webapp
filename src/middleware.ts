import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for request tracking, performance monitoring, and error handling
 */
export function middleware(request: NextRequest) {
  // Get the start time for performance tracking
  const startTime = Date.now();

  // Get request details
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const ip = request.ip || '';

  // Create a unique request ID
  const requestId = crypto.randomUUID();

  // Add request ID to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Log request details
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}${search} - RequestID: ${requestId}`);

  // Create the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add response headers for tracking
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);

  // In a production environment, we would send this data to a monitoring service
  // For now, we'll just log it
  response.headers.set('x-request-path', pathname);
  response.headers.set('x-request-method', method);

  return response;
}

/**
 * Configure which paths should be processed by this middleware
 */
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Exclude Next.js static files and API routes that handle their own monitoring
    '/((?!_next/static|_next/image|favicon.ico|api/monitoring).*)',
  ],
};
