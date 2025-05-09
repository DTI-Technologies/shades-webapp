import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Website } from '@/models';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

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
        const { scrapedContent, name, description, brandElements } = body;

        if (!scrapedContent || !name) {
            return NextResponse.json(
                { error: 'Scraped content and name are required' },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Create website
        const website = new Website({
            name,
            url: scrapedContent.url,
            description: description || scrapedContent.description,
            originalContent: {
                html: scrapedContent.html,
                css: scrapedContent.css,
                images: scrapedContent.images,
                title: scrapedContent.title,
                description: scrapedContent.description,
                structure: scrapedContent.structure
            },
            brandElements: brandElements || {
                name: name,
                colors: {
                    primary: '#3182CE',
                    secondary: '#4299E1',
                    background: '#FFFFFF',
                    text: '#1A202C'
                },
                typography: {
                    primary: 'System-ui, sans-serif'
                }
            },
            creator: userId,
            isPublic: false,
            collaborators: []
        });

        await website.save();

        return NextResponse.json({
            success: true,
            message: 'Website saved successfully',
            websiteId: website._id
        });
    } catch (error) {
        console.error('Error saving website:', error);
        return NextResponse.json(
            { error: `Failed to save website: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'URL parameter is required' },
                { status: 400 }
            );
        }

        // Fetch the website content
        const response = await axios.get(url);
        const html = response.data;

        // Parse the HTML
        const $ = cheerio.load(html);

        // Extract CSS
        const cssLinks: string[] = [];
        $('link[rel="stylesheet"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Handle relative URLs
                if (href.startsWith('http')) {
                    cssLinks.push(href);
                } else {
                    const baseUrl = new URL(url);
                    const absoluteUrl = new URL(href, baseUrl.origin).toString();
                    cssLinks.push(absoluteUrl);
                }
            }
        });

        // Extract inline CSS
        const inlineStyles: string[] = [];
        $('style').each((_, element) => {
            inlineStyles.push($(element).html() || '');
        });

        // Extract images
        const images: string[] = [];
        $('img').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                // Handle relative URLs
                if (src.startsWith('http')) {
                    images.push(src);
                } else {
                    const baseUrl = new URL(url);
                    const absoluteUrl = new URL(src, baseUrl.origin).toString();
                    images.push(absoluteUrl);
                }
            }
        });

        // Extract metadata
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';

        // Analyze structure
        const hasHeader = $('header').length > 0 || $('div[class*="header"]').length > 0;
        const hasFooter = $('footer').length > 0 || $('div[class*="footer"]').length > 0;
        const hasNavigation = $('nav').length > 0 || $('div[class*="nav"]').length > 0;
        const sectionCount = $('section').length + $('div[class*="section"]').length;

        // Combine all CSS
        const allCss = [...cssLinks, ...inlineStyles];

        const scrapedContent = {
            html,
            css: allCss,
            images,
            title,
            description,
            url,
            structure: {
                header: hasHeader,
                footer: hasFooter,
                navigation: hasNavigation,
                sections: sectionCount
            }
        };

        return NextResponse.json(scrapedContent);
    } catch (error) {
        console.error('Error scraping website:', error);
        return NextResponse.json(
            { error: `Failed to scrape website: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
