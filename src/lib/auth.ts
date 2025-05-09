import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to check if the user is authenticated
 * @param req The Next.js request object
 * @returns A response if authentication fails, or null if it succeeds
 */
export async function isAuthenticated(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Middleware to check if the user is an admin
 * @param req The Next.js request object
 * @returns A response if authorization fails, or null if it succeeds
 */
export async function isAdmin(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Get the current user's ID from the session
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Check if the current user is authenticated
 * @returns True if authenticated, false otherwise
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Check if the current user is an admin
 * @returns True if admin, false otherwise
 */
export async function isUserAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'admin';
}
