import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Website, Activity } from '@/models';
import { z } from 'zod';

// Define validation schema for request body
const deploySchema = z.object({
  websiteId: z.string().min(1, 'Website ID is required'),
  deploymentOptions: z.object({
    platform: z.enum(['vercel', 'netlify', 'github-pages', 'custom']),
    customDomain: z.string().optional(),
    repositoryUrl: z.string().optional(),
    deploymentToken: z.string().optional(),
  }),
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
    const validationResult = deploySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { websiteId, deploymentOptions } = validationResult.data;

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
        { error: 'You do not have permission to deploy this website' },
        { status: 403 }
      );
    }

    // Check if website has been rebranded
    if (!website.rebrandedContent || !website.rebrandedContent.html) {
      return NextResponse.json(
        { error: 'Website must be rebranded before deployment' },
        { status: 400 }
      );
    }

    // Generate deployment files
    const deploymentFiles = generateDeploymentFiles(website, deploymentOptions);

    // In a real implementation, we would actually deploy the website to the selected platform
    // For now, we'll just simulate a successful deployment

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'deploy',
      resourceType: 'website',
      resource: websiteId,
      metadata: {
        platform: deploymentOptions.platform,
        customDomain: deploymentOptions.customDomain,
      },
    });

    await activity.save();

    return NextResponse.json({
      success: true,
      message: 'Website deployment initiated',
      deploymentFiles,
      deploymentUrl: generateDeploymentUrl(deploymentOptions),
    });
  } catch (error) {
    console.error('Error deploying website:', error);
    return NextResponse.json(
      { error: `Failed to deploy website: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Generate deployment files for the website
 */
function generateDeploymentFiles(website: any, deploymentOptions: any) {
  const { rebrandedContent } = website;
  const { html, css } = rebrandedContent;

  // Create index.html with embedded CSS
  const cssLinks = css.map((cssUrl: string) => {
    if (cssUrl.startsWith('http')) {
      return `<link rel="stylesheet" href="${cssUrl}">`;
    } else {
      return `<style>${cssUrl}</style>`;
    }
  }).join('\n');

  // Insert CSS links into HTML
  let indexHtml = html;
  if (indexHtml.includes('</head>')) {
    indexHtml = indexHtml.replace('</head>', `${cssLinks}\n</head>`);
  } else {
    indexHtml = `<html><head>${cssLinks}</head>${indexHtml}</html>`;
  }

  // Generate configuration files based on platform
  const configFiles: Record<string, string> = {};

  switch (deploymentOptions.platform) {
    case 'vercel':
      configFiles['vercel.json'] = JSON.stringify({
        version: 2,
        builds: [{ src: '*.html', use: '@vercel/static' }],
        routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index.html' }],
      }, null, 2);
      break;
    case 'netlify':
      configFiles['netlify.toml'] = `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;
      break;
    case 'github-pages':
      configFiles['.nojekyll'] = '';
      break;
    default:
      break;
  }

  return {
    'index.html': indexHtml,
    ...configFiles,
  };
}

/**
 * Generate a deployment URL based on deployment options
 */
function generateDeploymentUrl(deploymentOptions: any) {
  const { platform, customDomain } = deploymentOptions;

  if (customDomain) {
    return `https://${customDomain}`;
  }

  // Generate a random subdomain
  const randomSubdomain = `shades-${Math.random().toString(36).substring(2, 8)}`;

  switch (platform) {
    case 'vercel':
      return `https://${randomSubdomain}.vercel.app`;
    case 'netlify':
      return `https://${randomSubdomain}.netlify.app`;
    case 'github-pages':
      return `https://${randomSubdomain}.github.io`;
    default:
      return `https://${randomSubdomain}.example.com`;
  }
}
