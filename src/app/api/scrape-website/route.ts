import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { isAuthenticated, getCurrentUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { Website } from '@/models';
import { Logger } from '@/lib/logger';
import { ProxyService } from '@/services/ai/scraper/proxyService';

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
    const logger = new Logger('scrape-website');
    const proxyService = new ProxyService();

    try {
        // Skip authentication for GET requests - we're just scraping public websites
        // This avoids authentication issues when testing the scraper

        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const useProxy = searchParams.get('useProxy') === 'true';

        if (!url) {
            return NextResponse.json(
                { error: 'URL parameter is required' },
                { status: 400 }
            );
        }

        logger.info(`Attempting to scrape website: ${url}${useProxy ? ' using proxy' : ''}`);

        let html: string;

        // If proxy is explicitly requested, use it directly
        if (useProxy) {
            try {
                html = await proxyService.fetchViaProxy(url);
                logger.info(`Successfully fetched website content via proxy from: ${url}`);
            } catch (proxyError) {
                logger.error('Proxy fetch failed:', {
                    error: proxyError instanceof Error ? proxyError.message : String(proxyError),
                    url
                });
                return NextResponse.json(
                    { error: `Failed to fetch via proxy: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}` },
                    { status: 502 }
                );
            }
        } else {
            // Try direct fetch first
            try {
                // Configure axios with timeout and headers to mimic a browser
                const response = await axios.get(url, {
                    timeout: 15000, // 15 seconds timeout
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Referer': 'https://www.google.com/',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Cache-Control': 'max-age=0'
                    },
                    maxRedirects: 5
                });

                logger.info(`Successfully fetched website content directly from: ${url}`);
                html = response.data;
            } catch (directError) {
                logger.warn('Direct fetch failed, trying proxy as fallback:', {
                    error: directError instanceof Error ? directError.message : String(directError),
                    url
                });

                // If direct fetch fails, try via proxy as fallback
                try {
                    html = await proxyService.fetchViaProxy(url);
                    logger.info(`Successfully fetched website content via proxy fallback from: ${url}`);
                } catch (proxyError) {
                    logger.error('Both direct and proxy fetch failed:', {
                        directError: directError instanceof Error ? directError.message : String(directError),
                        proxyError: proxyError instanceof Error ? proxyError.message : String(proxyError),
                        url
                    });

                    // Re-throw the original error to be handled by the catch block
                    throw directError;
                }
            }
        }

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
        logger.error('Error scraping website:', {
            error: error instanceof Error ? error.message : String(error),
            url: new URL(request.url).searchParams.get('url'),
            stack: error instanceof Error ? error.stack : undefined
        });

        // Provide more specific error messages based on the type of error
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                return NextResponse.json(
                    { error: 'Request timed out. The website might be too slow to respond.' },
                    { status: 504 }
                );
            }

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                return NextResponse.json(
                    {
                        error: `Website returned an error: ${error.response.status} ${error.response.statusText}`,
                        details: error.response.data
                    },
                    { status: error.response.status }
                );
            } else if (error.request) {
                // The request was made but no response was received
                return NextResponse.json(
                    { error: 'No response received from the website. It might be down or blocking our requests.' },
                    { status: 502 }
                );
            }
        }

        // Generic error response for other types of errors
        return NextResponse.json(
            { error: `Failed to scrape website: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
