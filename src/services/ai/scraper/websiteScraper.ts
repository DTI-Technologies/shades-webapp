import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
    html: string;
    css: string[];
    images: string[];
    title: string;
    description: string;
    url: string;
    structure: {
        header: boolean;
        footer: boolean;
        navigation: boolean;
        sections: number;
    };
}

export class WebsiteScraper {
    /**
     * Scrapes a website and returns its content
     * @param url The URL of the website to scrape
     * @param useProxy Whether to use a proxy for scraping (optional)
     * @returns The scraped content
     */
    public async scrapeWebsite(url: string, useProxy: boolean = false): Promise<ScrapedContent> {
        try {
            // In a web application, we need to use a server-side API to avoid CORS issues
            // This will be handled by our API route
            const apiUrl = `/api/scrape-website?url=${encodeURIComponent(url)}${useProxy ? '&useProxy=true' : ''}`;

            // Add a timeout to the request
            const response = await axios.get(apiUrl, {
                timeout: 30000, // 30 seconds timeout
            });

            return response.data;
        } catch (error) {
            console.error('Error scraping website:', error);

            // If the error is from axios and it's a 500 error, try with proxy
            if (axios.isAxiosError(error) && error.response?.status === 500 && !useProxy) {
                console.log('Retrying with proxy...');
                return this.scrapeWebsite(url, true);
            }

            // If we already tried with proxy and still got an error, create a minimal fallback content
            if (useProxy) {
                console.log('Creating fallback content...');
                return this.createFallbackContent(url);
            }

            throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Creates fallback content when scraping fails
     * @param url The URL that failed to scrape
     * @returns A minimal ScrapedContent object
     */
    private createFallbackContent(url: string): ScrapedContent {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fallback for ${url}</title>
            <meta name="description" content="Fallback content for ${url}">
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; }
                .alert { background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
                .url { word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="alert">
                    <p>We were unable to scrape the website due to security restrictions.</p>
                    <p>Please try using a different URL or contact support if this issue persists.</p>
                </div>
                <h1>Fallback Content for:</h1>
                <p class="url">${url}</p>
                <div id="header">Header Placeholder</div>
                <div id="content">Content Placeholder</div>
                <div id="footer">Footer Placeholder</div>
            </div>
        </body>
        </html>
        `;

        return {
            html,
            css: [],
            images: [],
            title: `Fallback for ${url}`,
            description: `Fallback content for ${url}`,
            url,
            structure: {
                header: true,
                footer: true,
                navigation: false,
                sections: 1
            }
        };
    }
}
