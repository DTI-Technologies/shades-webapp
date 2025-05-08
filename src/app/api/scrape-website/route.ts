import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
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
