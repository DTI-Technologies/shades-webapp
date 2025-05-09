import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import { CodebaseAnalyzer, CodeFile } from '@/services/ai/analyzer/codebaseAnalyzer';
import { Activity } from '@/models';
import dbConnect from '@/lib/mongoose';
import { z } from 'zod';

// Define validation schema for request body
const analyzeCodebaseSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      content: z.string(),
      language: z.string(),
    })
  ).min(1, 'At least one file is required'),
  saveAnalysis: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    // Get user ID if saving analysis
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = analyzeCodebaseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { files, saveAnalysis } = validationResult.data;

    // Initialize analyzer
    const analyzer = new CodebaseAnalyzer();

    // Analyze codebase
    const analysis = await analyzer.analyzeCodebase(files);

    // Save analysis if requested
    if (saveAnalysis) {
      await dbConnect();

      // Log activity
      const activity = new Activity({
        user: userId,
        action: 'analyze',
        resourceType: 'system',
        metadata: {
          fileCount: files.length,
          summary: analysis.summary,
        },
      });

      await activity.save();
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing codebase:', error);
    return NextResponse.json(
      { error: `Failed to analyze codebase: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
