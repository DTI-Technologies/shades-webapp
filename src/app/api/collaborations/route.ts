import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Collaboration, Theme, Website, User, Activity } from '@/models';
import { z } from 'zod';

// Define validation schema for request body
const collaborationSchema = z.object({
  resourceType: z.enum(['theme', 'website']),
  resource: z.string().min(1, 'Resource ID is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['editor', 'viewer']),
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
    const validationResult = collaborationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { resourceType, resource, email, role } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Check if resource exists and user is the owner
    let resourceExists = false;
    let isOwner = false;

    if (resourceType === 'theme') {
      const theme = await Theme.findById(resource);
      if (theme) {
        resourceExists = true;
        isOwner = theme.creator.toString() === userId;
      }
    } else if (resourceType === 'website') {
      const website = await Website.findById(resource);
      if (website) {
        resourceExists = true;
        isOwner = website.creator.toString() === userId;
      }
    }

    if (!resourceExists) {
      return NextResponse.json(
        { error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found` },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the owner can invite collaborators' },
        { status: 403 }
      );
    }

    // Find the user to invite
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User with this email not found' },
        { status: 404 }
      );
    }

    // Check if user is already a collaborator
    const existingCollaboration = await Collaboration.findOne({
      resourceType,
      resource,
      user: invitedUser._id,
    });

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      );
    }

    // Create collaboration
    const collaboration = new Collaboration({
      resourceType,
      resource,
      user: invitedUser._id,
      role,
      invitedBy: userId,
      status: 'pending',
    });

    await collaboration.save();

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'share',
      resourceType,
      resource,
      metadata: {
        collaborationId: collaboration._id,
        invitedUser: invitedUser._id,
        role,
      },
    });

    await activity.save();

    // Populate user data for response
    const populatedCollaboration = await Collaboration.findById(collaboration._id)
      .populate('user', 'name email image')
      .populate('invitedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Collaboration invitation sent successfully',
      collaboration: populatedCollaboration,
    });
  } catch (error) {
    console.error('Error creating collaboration:', error);
    return NextResponse.json(
      { error: `Failed to create collaboration: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

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

    if (action === 'invitations') {
      // Get pending invitations for the user
      const invitations = await Collaboration.find({
        user: userId,
        status: 'pending',
      })
        .populate('resource')
        .populate('invitedBy', 'name email image');

      return NextResponse.json({ invitations });
    } else if (action === 'collaborations') {
      // Get active collaborations for the user
      const collaborations = await Collaboration.find({
        user: userId,
        status: 'accepted',
      })
        .populate('resource')
        .populate('invitedBy', 'name email image');

      return NextResponse.json({ collaborations });
    } else if (action === 'resourceCollaborators') {
      // Get collaborators for a specific resource
      const resourceType = searchParams.get('resourceType');
      const resourceId = searchParams.get('resourceId');

      if (!resourceType || !resourceId) {
        return NextResponse.json(
          { error: 'Resource type and resource ID are required' },
          { status: 400 }
        );
      }

      // Check if user is the owner or a collaborator
      let isOwnerOrCollaborator = false;

      if (resourceType === 'theme') {
        const theme = await Theme.findById(resourceId);
        if (theme) {
          isOwnerOrCollaborator = theme.creator.toString() === userId;
        }
      } else if (resourceType === 'website') {
        const website = await Website.findById(resourceId);
        if (website) {
          isOwnerOrCollaborator = website.creator.toString() === userId;
        }
      }

      if (!isOwnerOrCollaborator) {
        const collaboration = await Collaboration.findOne({
          resourceType,
          resource: resourceId,
          user: userId,
          status: 'accepted',
        });

        isOwnerOrCollaborator = !!collaboration;
      }

      if (!isOwnerOrCollaborator) {
        return NextResponse.json(
          { error: 'You do not have permission to view collaborators' },
          { status: 403 }
        );
      }

      // Get collaborators
      const collaborators = await Collaboration.find({
        resourceType,
        resource: resourceId,
      })
        .populate('user', 'name email image')
        .populate('invitedBy', 'name email');

      return NextResponse.json({ collaborators });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting collaborations:', error);
    return NextResponse.json(
      { error: `Failed to get collaborations: ${error instanceof Error ? error.message : String(error)}` },
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
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Collaboration ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'reject', 'change-role'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (accept, reject, or change-role)' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find collaboration
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'accept' || action === 'reject') {
      // Only the invited user can accept or reject
      if (collaboration.user.toString() !== userId) {
        return NextResponse.json(
          { error: 'Only the invited user can accept or reject the invitation' },
          { status: 403 }
        );
      }

      // Update collaboration status
      collaboration.status = action === 'accept' ? 'accepted' : 'rejected';
      await collaboration.save();

      // If accepted, update the resource's collaborators array
      if (action === 'accept' && collaboration.resourceType === 'website') {
        await Website.findByIdAndUpdate(
          collaboration.resource,
          { $addToSet: { collaborators: userId } }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Invitation ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
      });
    } else if (action === 'change-role') {
      // Only the resource owner can change roles
      let isOwner = false;

      if (collaboration.resourceType === 'theme') {
        const theme = await Theme.findById(collaboration.resource);
        if (theme) {
          isOwner = theme.creator.toString() === userId;
        }
      } else if (collaboration.resourceType === 'website') {
        const website = await Website.findById(collaboration.resource);
        if (website) {
          isOwner = website.creator.toString() === userId;
        }
      }

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only the owner can change collaboration roles' },
          { status: 403 }
        );
      }

      // Get new role from request
      const { role } = body;
      if (!role || !['editor', 'viewer'].includes(role)) {
        return NextResponse.json(
          { error: 'Valid role is required (editor or viewer)' },
          { status: 400 }
        );
      }

      // Update collaboration role
      collaboration.role = role;
      await collaboration.save();

      return NextResponse.json({
        success: true,
        message: 'Collaboration role updated successfully',
      });
    }
  } catch (error) {
    console.error('Error updating collaboration:', error);
    return NextResponse.json(
      { error: `Failed to update collaboration: ${error instanceof Error ? error.message : String(error)}` },
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

    // Get collaboration ID from URL
    const { searchParams } = new URL(request.url);
    const collaborationId = searchParams.get('id');
    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Collaboration ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find collaboration
    const collaboration = await Collaboration.findById(collaborationId);
    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner of the resource or the collaborator
    let isOwner = false;

    if (collaboration.resourceType === 'theme') {
      const theme = await Theme.findById(collaboration.resource);
      if (theme) {
        isOwner = theme.creator.toString() === userId;
      }
    } else if (collaboration.resourceType === 'website') {
      const website = await Website.findById(collaboration.resource);
      if (website) {
        isOwner = website.creator.toString() === userId;
      }
    }

    const isCollaborator = collaboration.user.toString() === userId;

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this collaboration' },
        { status: 403 }
      );
    }

    // Delete collaboration
    await Collaboration.findByIdAndDelete(collaborationId);

    // Remove from website collaborators if needed
    if (collaboration.status === 'accepted' && collaboration.resourceType === 'website') {
      await Website.findByIdAndUpdate(
        collaboration.resource,
        { $pull: { collaborators: collaboration.user } }
      );
    }

    return NextResponse.json({ success: true, message: 'Collaboration deleted successfully' });
  } catch (error) {
    console.error('Error deleting collaboration:', error);
    return NextResponse.json(
      { error: `Failed to delete collaboration: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
