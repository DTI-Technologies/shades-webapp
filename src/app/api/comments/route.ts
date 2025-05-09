import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Comment, Theme, Website, Activity } from '@/models';
import { z } from 'zod';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

// Define validation schema for request body
const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment cannot be more than 1000 characters'),
  resourceType: z.enum(['theme', 'website']),
  resource: z.string().min(1, 'Resource ID is required'),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    element: z.string().optional(),
  }).optional(),
  parentComment: z.string().optional(),
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
    const validationResult = commentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { content, resourceType, resource, position, parentComment } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Check if resource exists
    let resourceExists = false;
    if (resourceType === 'theme') {
      const theme = await Theme.findById(resource);
      resourceExists = !!theme;
    } else if (resourceType === 'website') {
      const website = await Website.findById(resource);
      resourceExists = !!website;
    }

    if (!resourceExists) {
      return NextResponse.json(
        { error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found` },
        { status: 404 }
      );
    }

    // Check if parent comment exists if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = new Comment({
      content,
      user: userId,
      resourceType,
      resource,
      position,
      parentComment,
      isResolved: false,
    });

    await comment.save();

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'comment',
      resourceType,
      resource,
      metadata: {
        commentId: comment._id,
        isReply: !!parentComment,
      },
    });

    await activity.save();

    // Populate user data for response
    const populatedComment = await Comment.findById(comment._id).populate('user', 'name image');

    return NextResponse.json({
      success: true,
      message: 'Comment submitted successfully',
      comment: populatedComment,
    });
  } catch (error) {
    console.error('Error submitting comment:', error);
    return NextResponse.json(
      { error: `Failed to submit comment: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Resource type and resource ID are required' },
        { status: 400 }
      );
    }

    if (resourceType !== 'theme' && resourceType !== 'website') {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get comments for resource
    const comments = await Comment.find({
      resourceType,
      resource: resourceId,
      parentComment: { $exists: false }, // Only get top-level comments
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name image');

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .sort({ createdAt: 1 })
          .populate('user', 'name image');

        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Error getting comments:', error);
    return NextResponse.json(
      { error: `Failed to get comments: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this comment' },
        { status: 403 }
      );
    }

    // Validate updates
    const allowedUpdates = ['content', 'isResolved'];
    const invalidUpdates = Object.keys(updates).filter(key => !allowedUpdates.includes(key));
    if (invalidUpdates.length > 0) {
      return NextResponse.json(
        { error: `Invalid updates: ${invalidUpdates.join(', ')}` },
        { status: 400 }
      );
    }

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name image');

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: `Failed to update comment: ${error instanceof Error ? error.message : String(error)}` },
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

    // Get comment ID from URL
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      );
    }

    // Delete comment and all replies
    await Comment.deleteMany({ $or: [{ _id: commentId }, { parentComment: commentId }] });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: `Failed to delete comment: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
