import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId, isUserAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Activity, Theme, Website, User } from '@/models';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    // Get user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Connect to database
    await dbConnect();

    if (action === 'user-activity') {
      // Get user's activity
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const activities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('resource')
        .lean();

      const total = await Activity.countDocuments({ user: userId });

      return NextResponse.json({
        activities,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } else if (action === 'user-stats') {
      // Get user's statistics
      const themeCount = await Theme.countDocuments({ creator: userId });
      const websiteCount = await Website.countDocuments({ creator: userId });

      const publishedThemeCount = await Theme.countDocuments({
        creator: userId,
        isPublished: true,
        isPublic: true
      });

      const totalThemeDownloads = await Theme.aggregate([
        { $match: { creator: userId } },
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]);

      const averageThemeRating = await Theme.aggregate([
        { $match: { creator: userId, ratingCount: { $gt: 0 } } },
        { $group: { _id: null, average: { $avg: '$rating' } } }
      ]);

      const activityCount = await Activity.countDocuments({ user: userId });

      // Get most recent activity
      const recentActivity = await Activity.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('resource')
        .lean();

      return NextResponse.json({
        stats: {
          themeCount,
          websiteCount,
          publishedThemeCount,
          totalDownloads: totalThemeDownloads[0]?.total || 0,
          averageRating: averageThemeRating[0]?.average || 0,
          activityCount,
          recentActivity
        }
      });
    } else if (action === 'resource-activity') {
      // Get activity for a specific resource
      const resourceType = searchParams.get('resourceType');
      const resourceId = searchParams.get('resourceId');

      if (!resourceType || !resourceId) {
        return NextResponse.json(
          { error: 'Resource type and resource ID are required' },
          { status: 400 }
        );
      }

      // Check if user has access to this resource
      let hasAccess = false;

      if (resourceType === 'theme') {
        const theme = await Theme.findById(resourceId);
        if (theme) {
          hasAccess = theme.creator.toString() === userId || theme.isPublic;
        }
      } else if (resourceType === 'website') {
        const website = await Website.findById(resourceId);
        if (website) {
          hasAccess = website.creator.toString() === userId ||
                     (website.isPublic || website.collaborators.some(id => id.toString() === userId));
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have permission to view this resource activity' },
          { status: 403 }
        );
      }

      // Get activity
      const activities = await Activity.find({
        resourceType,
        resource: resourceId
      })
        .sort({ createdAt: -1 })
        .populate('user', 'name image')
        .lean();

      return NextResponse.json({ activities });
    } else if (action === 'global-stats') {
      // Only admins can access global stats
      const isAdmin = await isUserAdmin();
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Get global statistics
      const userCount = await User.countDocuments();
      const themeCount = await Theme.countDocuments();
      const websiteCount = await Website.countDocuments();

      const publishedThemeCount = await Theme.countDocuments({
        isPublished: true,
        isPublic: true
      });

      const totalDownloads = await Theme.aggregate([
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]);

      const topThemes = await Theme.find({
        isPublished: true,
        isPublic: true
      })
        .sort({ downloads: -1 })
        .limit(5)
        .populate('creator', 'name')
        .lean();

      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email image createdAt')
        .lean();

      return NextResponse.json({
        stats: {
          userCount,
          themeCount,
          websiteCount,
          publishedThemeCount,
          totalDownloads: totalDownloads[0]?.total || 0,
          topThemes,
          recentUsers
        }
      });
    } else if (action === 'getDeploymentHistory') {
      // Get user's deployment history
      const deployments = await Activity.find({
        user: userId,
        action: 'deploy'
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return NextResponse.json({
        deployments
      });
    } else if (action === 'recommendations') {
      // Get personalized recommendations for the user

      // Get user's recent activities to understand preferences
      const userActivities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Extract themes and websites the user has interacted with
      const interactedThemeIds = userActivities
        .filter(a => a.resourceType === 'theme')
        .map(a => a.resource);

      // Find themes similar to what the user has interacted with
      const recommendedThemes = await Theme.find({
        _id: { $nin: interactedThemeIds },
        isPublished: true,
        isPublic: true
      })
        .sort({ rating: -1, downloads: -1 })
        .limit(5)
        .populate('creator', 'name image')
        .lean();

      // Get trending themes (most downloaded in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingThemes = await Theme.find({
        isPublished: true,
        isPublic: true,
        updatedAt: { $gte: thirtyDaysAgo }
      })
        .sort({ downloads: -1 })
        .limit(5)
        .populate('creator', 'name image')
        .lean();

      // Get featured themes
      const featuredThemes = await Theme.find({
        isPublished: true,
        isPublic: true,
        isFeatured: true
      })
        .sort({ rating: -1 })
        .limit(5)
        .populate('creator', 'name image')
        .lean();

      // Get newest themes
      const newestThemes = await Theme.find({
        isPublished: true,
        isPublic: true
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('creator', 'name image')
        .lean();

      return NextResponse.json({
        recommendations: {
          recommendedThemes,
          trendingThemes,
          featuredThemes,
          newestThemes
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: `Failed to get analytics: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    // Get user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, resourceType, resourceId, metadata } = body;

    if (!action || !resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Action, resource type, and resource ID are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Create activity
    const activity = new Activity({
      user: userId,
      action,
      resourceType,
      resource: resourceId,
      metadata: metadata || {},
    });

    await activity.save();

    // Update download count if action is 'download'
    if (action === 'download' && resourceType === 'theme') {
      await Theme.findByIdAndUpdate(
        resourceId,
        { $inc: { downloads: 1 } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully',
      activity,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: `Failed to log activity: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
