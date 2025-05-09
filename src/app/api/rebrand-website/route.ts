import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Website, Activity } from '@/models';
import { OpenAIService } from '@/services/ai/openai/openaiService';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

// Define validation schema for request body
const rebrandSchema = z.object({
  websiteId: z.string().min(1, 'Website ID is required'),
  newBrandElements: z.object({
    name: z.string().min(1, 'Brand name is required'),
    logo: z.string().optional(),
    colors: z.object({
      primary: z.string().min(1, 'Primary color is required'),
      secondary: z.string().min(1, 'Secondary color is required'),
      accent: z.string().optional(),
      background: z.string().min(1, 'Background color is required'),
      text: z.string().min(1, 'Text color is required'),
    }),
    typography: z.object({
      primary: z.string().min(1, 'Primary font is required'),
      secondary: z.string().optional(),
    }),
    style: z.object({
      borderRadius: z.string().optional(),
      spacing: z.string().optional(),
      buttonStyle: z.string().optional(),
    }).optional(),
  }),
  useAI: z.boolean().optional(),
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
    const validationResult = rebrandSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { websiteId, newBrandElements, useAI } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Find website
    const website = await Website.findById(websiteId);
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this website
    if (website.creator.toString() !== userId && !website.collaborators.some(id => id.toString() === userId)) {
      return NextResponse.json(
        { error: 'You do not have permission to rebrand this website' },
        { status: 403 }
      );
    }

    // Get original content
    const { html, css } = website.originalContent;

    // Rebrand the website
    let rebrandedHtml = html;
    let rebrandedCss = [...css];

    if (useAI) {
      // Use OpenAI to help with rebranding
      const openAIService = new OpenAIService();

      // Create a prompt for OpenAI
      const prompt = `
        I need to rebrand a website. Here are the original brand elements:
        ${JSON.stringify(website.brandElements)}

        And here are the new brand elements:
        ${JSON.stringify(newBrandElements)}

        Please provide CSS modifications to apply the new brand elements to the website.
        Focus on:
        1. Replacing color values
        2. Updating font families
        3. Adjusting spacing and border-radius if needed
        4. Any other style changes to match the new brand

        Return only valid CSS that can be added to the website.
      `;

      // Generate CSS modifications
      const aiGeneratedCss = await openAIService.generateText(prompt, { temperature: 0.7 });

      // Add the AI-generated CSS to the rebranded CSS
      rebrandedCss.push(aiGeneratedCss);
    }

    // Basic rebranding (replace text, colors, etc.)
    const $ = cheerio.load(rebrandedHtml);

    // Replace brand name in text nodes
    const oldBrandName = website.brandElements.name;
    const newBrandName = newBrandElements.name;

    $('body').find('*').contents().each((_, element) => {
      if (element.type === 'text' && element.data) {
        element.data = element.data.replace(new RegExp(oldBrandName, 'g'), newBrandName);
      }
    });

    // Replace logo if provided
    if (newBrandElements.logo && website.brandElements.logo) {
      $('img[src*="logo"], img[alt*="logo"], img[alt*="Logo"]').attr('src', newBrandElements.logo);
    }

    // Generate CSS for color replacements
    let colorReplacementCss = '';
    const oldColors = website.brandElements.colors;
    const newColors = newBrandElements.colors;

    // Replace primary color
    colorReplacementCss += `
      /* Primary color replacement */
      [style*="${oldColors.primary}"] { color: ${newColors.primary} !important; }
      [style*="background-color: ${oldColors.primary}"] { background-color: ${newColors.primary} !important; }
      [style*="border-color: ${oldColors.primary}"] { border-color: ${newColors.primary} !important; }

      /* Secondary color replacement */
      [style*="${oldColors.secondary}"] { color: ${newColors.secondary} !important; }
      [style*="background-color: ${oldColors.secondary}"] { background-color: ${newColors.secondary} !important; }
      [style*="border-color: ${oldColors.secondary}"] { border-color: ${newColors.secondary} !important; }

      /* Text color replacement */
      [style*="${oldColors.text}"] { color: ${newColors.text} !important; }

      /* Background color replacement */
      [style*="${oldColors.background}"] { background-color: ${newColors.background} !important; }
      body { background-color: ${newColors.background}; color: ${newColors.text}; }

      /* Typography replacement */
      body, p, div { font-family: ${newBrandElements.typography.primary}, sans-serif; }
      ${newBrandElements.typography.secondary ? `h1, h2, h3, h4, h5, h6 { font-family: ${newBrandElements.typography.secondary}, sans-serif; }` : ''}
    `;

    // Add the color replacement CSS to the rebranded CSS
    rebrandedCss.push(colorReplacementCss);

    // Update the rebranded HTML
    rebrandedHtml = $.html();

    // Update website with rebranded content
    website.rebrandedContent = {
      html: rebrandedHtml,
      css: rebrandedCss,
      images: website.originalContent.images,
    };

    // Update brand elements
    website.brandElements = newBrandElements;

    await website.save();

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'rebrand',
      resourceType: 'website',
      resource: websiteId,
      metadata: {
        oldBrandName,
        newBrandName,
      },
    });

    await activity.save();

    return NextResponse.json({
      success: true,
      message: 'Website rebranded successfully',
      website: {
        id: website._id,
        name: website.name,
        url: website.url,
        brandElements: website.brandElements,
      },
    });
  } catch (error) {
    console.error('Error rebranding website:', error);
    return NextResponse.json(
      { error: `Failed to rebrand website: ${error instanceof Error ? error.message : String(error)}` },
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

    if (action === 'getUserWebsites') {
      // Get user's websites
      const websites = await Website.find({
        $or: [
          { creator: userId },
          { collaborators: userId },
        ],
      })
        .sort({ updatedAt: -1 })
        .select('name url description brandElements creator isPublic collaborators createdAt updatedAt');

      return NextResponse.json({ websites });
    } else if (action === 'getWebsiteById') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json(
          { error: 'Website ID is required' },
          { status: 400 }
        );
      }

      // Get website
      const website = await Website.findById(id);
      if (!website) {
        return NextResponse.json(
          { error: 'Website not found' },
          { status: 404 }
        );
      }

      // Check if user has access to this website
      if (website.creator.toString() !== userId && !website.collaborators.some(id => id.toString() === userId) && !website.isPublic) {
        return NextResponse.json(
          { error: 'You do not have permission to view this website' },
          { status: 403 }
        );
      }

      return NextResponse.json({ website });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting websites:', error);
    return NextResponse.json(
      { error: `Failed to get websites: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
