import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Review, Theme, Activity } from '@/models';
import { z } from 'zod';

// Define validation schema for request body
const reviewSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment cannot be more than 500 characters'),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { themeId, rating, comment } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Check if theme exists and is public
    const theme = await Theme.findById(themeId);
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    if (!theme.isPublished || !theme.isPublic) {
      return NextResponse.json(
        { error: 'Cannot review a theme that is not published or public' },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this theme
    const existingReview = await Review.findOne({ theme: themeId, user: userId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this theme' },
        { status: 400 }
      );
    }

    // Create review
    const review = new Review({
      theme: themeId,
      user: userId,
      rating,
      comment,
    });

    await review.save();

    // Update theme rating
    const reviews = await Review.find({ theme: themeId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Theme.findByIdAndUpdate(themeId, {
      rating: averageRating,
      ratingCount: reviews.length,
    });

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'rate',
      resourceType: 'theme',
      resource: themeId,
      metadata: {
        rating,
        reviewId: review._id,
      },
    });

    await activity.save();

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: `Failed to submit review: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');

    if (!themeId) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get reviews for theme
    const reviews = await Review.find({ theme: themeId })
      .sort({ createdAt: -1 })
      .populate('user', 'name image');

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return NextResponse.json(
      { error: `Failed to get reviews: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get review ID from URL
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this review' },
        { status: 403 }
      );
    }

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Update theme rating
    const themeId = review.theme;
    const reviews = await Review.find({ theme: themeId });
    
    if (reviews.length === 0) {
      await Theme.findByIdAndUpdate(themeId, {
        rating: 0,
        ratingCount: 0,
      });
    } else {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Theme.findByIdAndUpdate(themeId, {
        rating: averageRating,
        ratingCount: reviews.length,
      });
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: `Failed to delete review: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
