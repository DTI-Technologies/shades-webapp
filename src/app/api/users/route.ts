import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId, isUserAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { User } from '@/models';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Define validation schema for user registration
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot be more than 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Define validation schema for user profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot be more than 50 characters').optional(),
  image: z.string().url('Invalid image URL').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'user',
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: `Failed to register user: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Connect to database
    await dbConnect();

    if (action === 'profile') {
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

      // Get user profile
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user });
    } else if (action === 'all') {
      // Only admins can get all users
      const authError = await isAuthenticated(request);
      if (authError) return authError;

      const isAdmin = await isUserAdmin();
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Get all users
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;
      const search = searchParams.get('search') || '';

      // Build query
      let query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count for pagination
      const total = await User.countDocuments(query);

      // Get users
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return NextResponse.json({
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: `Failed to get users: ${error instanceof Error ? error.message : String(error)}` },
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, image, currentPassword, newPassword } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updates: any = {};
    if (name) updates.name = name;
    if (image) updates.image = image;

    // Handle password change
    if (currentPassword && newPassword) {
      // Get user with password
      const userWithPassword = await User.findById(userId).select('+password');
      if (!userWithPassword) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check current password
      const isPasswordValid = await userWithPassword.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
