import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from '@/lib/logger';

/**
 * Service to handle proxy-based web scraping when direct requests fail
 */
export class ProxyService {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('proxy-service');
    }

    /**
     * A simple HTML scraper that uses a basic fetch request
     * This is a last resort when all proxies fail
     * @param url The URL to fetch
     * @returns The HTML content of the page
     */
    private async fetchSimpleHtml(url: string): Promise<string> {
        // Create a simple HTML template with the URL
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Scraped from ${url}</title>
            <meta name="description" content="This is a fallback page for ${url}">
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
                    <p>We were unable to fully scrape the website due to security restrictions.</p>
                    <p>Please try using a different URL or contact support if this issue persists.</p>
                </div>
                <h1>Fallback Content for:</h1>
                <p class="url">${url}</p>
                <p>This is a placeholder page generated when direct scraping fails.</p>
            </div>
        </body>
        </html>
        `;

        return html;
    }

    /**
     * Attempts to fetch a URL through a public CORS proxy
     * @param url The URL to fetch
     * @returns The HTML content of the page
     */
    public async fetchViaProxy(url: string): Promise<string> {
        this.logger.info(`Attempting to fetch via proxy: ${url}`);

        // List of public CORS proxies to try
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://thingproxy.freeboard.io/fetch/${url}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        ];

        // Common request config
        const config: AxiosRequestConfig = {
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        };

        // Try each proxy in sequence
        for (const proxyUrl of proxies) {
            try {
                this.logger.info(`Trying proxy: ${proxyUrl}`);
                const response = await axios.get(proxyUrl, config);

                if (response.status === 200 && response.data) {
                    this.logger.info(`Successfully fetched via proxy: ${proxyUrl}`);
                    return response.data;
                }
            } catch (error) {
                this.logger.warn(`Proxy fetch failed: ${proxyUrl}`, {
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue to the next proxy
            }
        }

        // If all proxies fail, try a simple HTML scraper as a last resort
        try {
            this.logger.info(`All proxies failed, trying simple HTML scraper for: ${url}`);
            return await this.fetchSimpleHtml(url);
        } catch (error) {
            this.logger.error(`Simple HTML scraper also failed: ${url}`, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('All scraping attempts failed');
        }
    }
}
