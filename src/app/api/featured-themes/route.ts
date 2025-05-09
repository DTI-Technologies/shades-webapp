import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Theme } from '@/models';
import { isAuthenticated, isUserAdmin } from '@/lib/auth';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

/**
 * GET /api/featured-themes
 * Get featured themes for the marketplace
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get featured themes (highest rated and most downloaded)
    const featuredThemes = await Theme.find({
      isPublished: true,
      isPublic: true,
    })
      .sort({ rating: -1, downloads: -1 })
      .limit(6)
      .populate('creator', 'name image')
      .lean();

    // Get newest themes
    const newestThemes = await Theme.find({
      isPublished: true,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('creator', 'name image')
      .lean();

    // Get most popular themes (most downloaded)
    const popularThemes = await Theme.find({
      isPublished: true,
      isPublic: true,
    })
      .sort({ downloads: -1 })
      .limit(6)
      .populate('creator', 'name image')
      .lean();

    return NextResponse.json({
      featuredThemes,
      newestThemes,
      popularThemes,
    });
  } catch (error) {
    console.error('Error getting featured themes:', error);
    return NextResponse.json(
      { error: `Failed to get featured themes: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/featured-themes
 * Set a theme as featured (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    // Check if user is admin
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { themeId, featured } = body;

    if (!themeId) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Update theme
    const theme = await Theme.findByIdAndUpdate(
      themeId,
      { isFeatured: featured === true },
      { new: true }
    );

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Theme ${featured ? 'featured' : 'unfeatured'} successfully`,
      theme,
    });
  } catch (error) {
    console.error('Error updating featured theme:', error);
    return NextResponse.json(
      { error: `Failed to update featured theme: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
