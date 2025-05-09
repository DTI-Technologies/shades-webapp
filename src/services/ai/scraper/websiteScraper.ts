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
            const response = await axios.get(apiUrl);
            return response.data;
        } catch (error) {
            console.error('Error scraping website:', error);

            // If the error is from axios and it's a 500 error, try with proxy
            if (axios.isAxiosError(error) && error.response?.status === 500 && !useProxy) {
                console.log('Retrying with proxy...');
                return this.scrapeWebsite(url, true);
            }

            throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
