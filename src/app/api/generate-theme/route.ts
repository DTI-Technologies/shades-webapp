import { NextResponse, NextRequest } from 'next/server';
import { ThemeGenerator } from '@/services/ai/generator/themeGenerator';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Theme } from '@/models';
import { z } from 'zod';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

// Define validation schema for request body
const themeRequestSchema = z.object({
    themeType: z.string().min(1, 'Theme type is required'),
    projectType: z.string().optional(),
    useAI: z.boolean().optional(),
    saveToDatabase: z.boolean().optional(),
    customOptions: z.object({
        colorPalette: z.record(z.string()).optional(),
        typography: z.record(z.string()).optional(),
        components: z.record(z.any()).optional(),
        description: z.string().optional(),
    }).optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Check authentication if saving to database
        const body = await request.json();
        if (body.saveToDatabase) {
            const authError = await isAuthenticated(request);
            if (authError) return authError;
        }

        // Validate request body
        const validationResult = themeRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { themeType, projectType, useAI, saveToDatabase, customOptions } = validationResult.data;

        // Generate the theme
        const themeGenerator = new ThemeGenerator();
        const theme = useAI
            ? await themeGenerator.generateAITheme(themeType, projectType || 'web', customOptions)
            : await themeGenerator.generateTheme(themeType, projectType || 'web');

        // Save to database if requested
        if (saveToDatabase) {
            await dbConnect();
            const userId = await getCurrentUserId();

            if (!userId) {
                return NextResponse.json(
                    { error: 'User ID not found' },
                    { status: 401 }
                );
            }

            const newTheme = new Theme({
                ...theme,
                creator: userId,
                description: customOptions?.description || `A ${themeType} theme for ${projectType || 'web'} projects`,
                isPublished: false,
                isPublic: false,
            });

            await newTheme.save();

            return NextResponse.json({
                theme,
                saved: true,
                themeId: newTheme._id ? newTheme._id.toString() : undefined
            });
        }

        return NextResponse.json(theme);
    } catch (error) {
        console.error('Error generating theme:', error);
        return NextResponse.json(
            { error: `Failed to generate theme: ${error instanceof Error ? error.message : String(error)}` },
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
                { error: 'Theme ID is required' },
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

        // Find theme
        const theme = await Theme.findById(id);
        if (!theme) {
            return NextResponse.json(
                { error: 'Theme not found' },
                { status: 404 }
            );
        }

        // Check if user owns the theme
        if (theme.creator.toString() !== userId) {
            return NextResponse.json(
                { error: 'You do not have permission to update this theme' },
                { status: 403 }
            );
        }

        // Validate updates
        const allowedUpdates = [
            'name', 'description', 'isPublished', 'isPublic', 'price', 'tags', 'previewImage',
            'colorPalette', 'typography', 'components'
        ];

        const invalidUpdates = Object.keys(updates).filter(key => !allowedUpdates.includes(key));
        if (invalidUpdates.length > 0) {
            return NextResponse.json(
                { error: `Invalid updates: ${invalidUpdates.join(', ')}` },
                { status: 400 }
            );
        }

        // Update theme
        const updatedTheme = await Theme.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Theme updated successfully',
            theme: updatedTheme
        });
    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json(
            { error: `Failed to update theme: ${error instanceof Error ? error.message : String(error)}` },
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

        // Get theme ID from URL
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json(
                { error: 'Theme ID is required' },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find theme
        const theme = await Theme.findById(id);
        if (!theme) {
            return NextResponse.json(
                { error: 'Theme not found' },
                { status: 404 }
            );
        }

        // Check if user owns the theme
        if (theme.creator.toString() !== userId) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this theme' },
                { status: 403 }
            );
        }

        // Delete theme
        await Theme.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Theme deleted successfully' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        return NextResponse.json(
            { error: `Failed to delete theme: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const themeGenerator = new ThemeGenerator();

        if (action === 'getThemeTypes') {
            const themeTypes = themeGenerator.getAvailableThemeTypes();
            return NextResponse.json({ themeTypes });
        } else if (action === 'getThemePreview') {
            const themeType = searchParams.get('themeType');
            if (!themeType) {
                return NextResponse.json(
                    { error: 'Theme type is required for preview' },
                    { status: 400 }
                );
            }

            const preview = themeGenerator.getThemePreview(themeType);
            return NextResponse.json(preview);
        } else if (action === 'getUserThemes') {
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

            // Connect to database
            await dbConnect();

            // Get user's themes
            const themes = await Theme.find({ creator: userId })
                .sort({ updatedAt: -1 })
                .select('name type description colorPalette isPublished isPublic downloads rating createdAt updatedAt');

            return NextResponse.json({ themes });
        } else if (action === 'getPublicThemes') {
            // Connect to database
            await dbConnect();

            // Get public themes
            const limit = parseInt(searchParams.get('limit') || '10');
            const page = parseInt(searchParams.get('page') || '1');
            const skip = (page - 1) * limit;
            const sort = searchParams.get('sort') || 'rating';
            const search = searchParams.get('search') || '';

            // Build query
            let query: any = { isPublished: true, isPublic: true };
            if (search) {
                query.$text = { $search: search };
            }

            // Get total count for pagination
            const total = await Theme.countDocuments(query);

            // Get themes
            const themes = await Theme.find(query)
                .sort(sort === 'rating' ? { rating: -1 } : sort === 'downloads' ? { downloads: -1 } : { createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('name type description colorPalette creator isPublished isPublic downloads rating createdAt updatedAt')
                .populate('creator', 'name image');

            return NextResponse.json({
                themes,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });
        } else if (action === 'getThemeById') {
            const id = searchParams.get('id');
            if (!id) {
                return NextResponse.json(
                    { error: 'Theme ID is required' },
                    { status: 400 }
                );
            }

            // Connect to database
            await dbConnect();

            // Get theme
            const theme = await Theme.findById(id)
                .populate('creator', 'name image');

            if (!theme) {
                return NextResponse.json(
                    { error: 'Theme not found' },
                    { status: 404 }
                );
            }

            // Check if user can access this theme
            if (!theme.isPublic) {
                const userId = await getCurrentUserId();
                if (!userId || userId !== theme.creator.toString()) {
                    return NextResponse.json(
                        { error: 'You do not have permission to access this theme' },
                        { status: 403 }
                    );
                }
            }

            return NextResponse.json({ theme });
        }

        return NextResponse.json(
            { error: 'Invalid action parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error with theme generator API:', error);
        return NextResponse.json(
            { error: `API error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
