import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isUserAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { level, message, context } = body;

    // Validate request
    if (!level || !message) {
      return NextResponse.json(
        { error: 'Level and message are required' },
        { status: 400 }
      );
    }

    // Log the message
    switch (level) {
      case 'debug':
        logger.debug(message, context);
        break;
      case 'info':
        logger.info(message, context);
        break;
      case 'warn':
        logger.warn(message, context);
        break;
      case 'error':
        logger.error(message, context);
        break;
      default:
        logger.info(message, context);
    }

    return NextResponse.json({
      success: true,
      message: 'Log entry created',
    });
  } catch (error) {
    console.error('Error creating log entry:', error);
    return NextResponse.json(
      { error: `Failed to create log entry: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    // Get logs
    let logs;
    if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
      logs = logger.getLogsByLevel(level as 'debug' | 'info' | 'warn' | 'error');
    } else {
      logs = logger.getLogs();
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    return NextResponse.json(
      { error: `Failed to get logs: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
