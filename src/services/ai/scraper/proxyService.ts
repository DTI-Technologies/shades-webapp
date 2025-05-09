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
     * Attempts to fetch a URL through a public CORS proxy
     * @param url The URL to fetch
     * @returns The HTML content of the page
     */
    public async fetchViaProxy(url: string): Promise<string> {
        this.logger.info(`Attempting to fetch via proxy: ${url}`);
        
        // List of public CORS proxies to try
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`,
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
        
        // If all proxies fail, throw an error
        throw new Error('All proxy attempts failed');
    }
}
