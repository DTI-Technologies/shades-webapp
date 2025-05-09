import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Theme, Activity } from '@/models';
import { z } from 'zod';

// Define validation schema for request body
const deploySchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
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

    const { themeId, deploymentOptions } = validationResult.data;

    // Connect to database
    await dbConnect();

    // Find theme
    const theme = await Theme.findById(themeId);
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this theme
    if (theme.creator.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to deploy this theme' },
        { status: 403 }
      );
    }

    // Generate deployment files
    const deploymentFiles = generateDeploymentFiles(theme, deploymentOptions);

    // In a real implementation, we would actually deploy the theme to the selected platform
    // For now, we'll just simulate a successful deployment

    // Log activity
    const activity = new Activity({
      user: userId,
      action: 'deploy',
      resourceType: 'theme',
      resource: themeId,
      resourceName: theme.name,
      metadata: {
        platform: deploymentOptions.platform,
        customDomain: deploymentOptions.customDomain,
        deploymentUrl: generateDeploymentUrl(deploymentOptions),
      },
    });

    await activity.save();

    // Increment theme downloads count
    theme.downloads += 1;
    await theme.save();

    return NextResponse.json({
      success: true,
      message: 'Theme deployment initiated',
      deploymentFiles,
      deploymentUrl: generateDeploymentUrl(deploymentOptions),
    });
  } catch (error) {
    console.error('Error deploying theme:', error);
    return NextResponse.json(
      { error: `Failed to deploy theme: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Generate deployment files for the theme
 */
function generateDeploymentFiles(theme: any, deploymentOptions: any) {
  // Create a simple HTML preview of the theme
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${theme.name} - Theme Preview</title>
  <style>
    :root {
      --primary-color: ${theme.colorPalette.primary};
      --secondary-color: ${theme.colorPalette.secondary};
      --accent-color: ${theme.colorPalette.accent || '#f59e0b'};
      --background-color: ${theme.colorPalette.background};
      --text-color: ${theme.colorPalette.text};
      --heading-font: ${theme.typography.headingFont || 'sans-serif'};
      --body-font: ${theme.typography.bodyFont || 'sans-serif'};
      --code-font: ${theme.typography.codeFont || 'monospace'};
    }
    
    body {
      font-family: var(--body-font);
      background-color: var(--background-color);
      color: var(--text-color);
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    header {
      background-color: var(--primary-color);
      color: white;
      padding: 1rem 0;
      text-align: center;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font);
    }
    
    .btn {
      display: inline-block;
      background-color: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    
    .btn:hover {
      background-color: var(--secondary-color);
    }
    
    .card {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .color-palette {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .color-swatch {
      width: 100px;
      height: 100px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>${theme.name}</h1>
      <p>${theme.description || `A ${theme.type} theme`}</p>
    </div>
  </header>
  
  <div class="container">
    <div class="card">
      <h2>Theme Preview</h2>
      <p>This is a preview of the ${theme.name} theme. This theme is designed for ${theme.type} websites.</p>
      <a href="#" class="btn">Primary Button</a>
    </div>
    
    <div class="card">
      <h2>Color Palette</h2>
      <div class="color-palette">
        <div class="color-swatch" style="background-color: ${theme.colorPalette.primary}">Primary</div>
        <div class="color-swatch" style="background-color: ${theme.colorPalette.secondary}">Secondary</div>
        <div class="color-swatch" style="background-color: ${theme.colorPalette.accent || '#f59e0b'}">Accent</div>
        <div class="color-swatch" style="background-color: ${theme.colorPalette.background}; color: ${theme.colorPalette.text}">Background</div>
        <div class="color-swatch" style="background-color: ${theme.colorPalette.text}">Text</div>
      </div>
    </div>
    
    <div class="card">
      <h2>Typography</h2>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p>This is a paragraph text in the body font. The body font is set to ${theme.typography.bodyFont || 'sans-serif'}.</p>
      <p><code>This is code text in the code font. The code font is set to ${theme.typography.codeFont || 'monospace'}.</code></p>
    </div>
  </div>
  
  <footer>
    <div class="container">
      <p>Theme created with Shades by DTI Technologies</p>
    </div>
  </footer>
</body>
</html>
  `;

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

  // Generate a JSON file with the theme data
  const themeJson = JSON.stringify(theme, null, 2);

  return {
    'index.html': html,
    'theme.json': themeJson,
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
