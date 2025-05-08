import * as cheerio from 'cheerio';
import { ScrapedContent } from '../scraper/websiteScraper';
import { BrandElements } from '../analyzer/brandAnalyzer';

export interface RebrandedContent {
    html: string;
    css: string;
    originalUrl: string;
    changes: {
        nameReplacements: number;
        colorReplacements: number;
        fontReplacements: number;
        logoReplaced: boolean;
    };
}

export class WebsiteRebrander {
    /**
     * Rebrands a website with new brand elements
     * @param scrapedContent The scraped website content
     * @param originalBrand The original brand elements
     * @param newBrand The new brand elements
     * @returns The rebranded content
     */
    public async rebrandWebsite(
        scrapedContent: ScrapedContent,
        originalBrand: BrandElements,
        newBrand: BrandElements
    ): Promise<RebrandedContent> {
        try {
            // Parse the HTML
            const $ = cheerio.load(scrapedContent.html);

            // Track changes
            const changes = {
                nameReplacements: 0,
                colorReplacements: 0,
                fontReplacements: 0,
                logoReplaced: false
            };

            // Replace brand name
            if (originalBrand.name && newBrand.name) {
                const nameRegex = new RegExp(this.escapeRegExp(originalBrand.name), 'gi');

                // Replace in text nodes
                $('*').contents().each((_, element) => {
                    if (element.type === 'text') {
                        const oldText = $(element).text();
                        const newText = oldText.replace(nameRegex, newBrand.name);
                        if (oldText !== newText) {
                            $(element).replaceWith(newText);
                            changes.nameReplacements++;
                        }
                    }
                });

                // Replace in attributes
                $('*').each((_, element) => {
                    const attrs = $(element).attr();
                    for (const attr in attrs) {
                        if (attrs[attr] && typeof attrs[attr] === 'string') {
                            const oldValue = attrs[attr];
                            const newValue = oldValue.replace(nameRegex, newBrand.name);
                            if (oldValue !== newValue) {
                                $(element).attr(attr, newValue);
                                changes.nameReplacements++;
                            }
                        }
                    }
                });
            }

            // Replace logo
            if (originalBrand.logo) {
                const logoSelectors = [
                    'a.brand img',
                    'a.navbar-brand img',
                    '.brand img',
                    '.logo img',
                    'header .logo img',
                    'a[class*="logo"] img',
                    'a[class*="brand"] img',
                    'img[class*="logo"]',
                    'img[alt*="logo"]',
                    'img[alt*="Logo"]'
                ];

                for (const selector of logoSelectors) {
                    const element = $(selector).first();
                    if (element.length) {
                        // Instead of replacing with an actual image (which we don't have),
                        // we'll add a placeholder with the new brand name
                        element.attr('src', 'https://via.placeholder.com/150x50/3182CE/FFFFFF/?text=' + encodeURIComponent(newBrand.name));
                        element.attr('alt', newBrand.name + ' logo');
                        changes.logoReplaced = true;
                        break;
                    }
                }
            }

            // Extract inline styles
            const inlineStyles: string[] = [];
            $('style').each((_, element) => {
                inlineStyles.push($(element).html() || '');
            });

            // Combine all CSS
            let allCss = inlineStyles.join('\n');

            // Replace colors in CSS
            if (originalBrand.colors && newBrand.colors) {
                // Replace primary color
                const primaryColorRegex = new RegExp(this.escapeRegExp(originalBrand.colors.primary), 'gi');
                allCss = allCss.replace(primaryColorRegex, newBrand.colors.primary);
                changes.colorReplacements += (allCss.match(primaryColorRegex) || []).length;

                // Replace secondary color
                if (originalBrand.colors.secondary && newBrand.colors.secondary) {
                    const secondaryColorRegex = new RegExp(this.escapeRegExp(originalBrand.colors.secondary), 'gi');
                    allCss = allCss.replace(secondaryColorRegex, newBrand.colors.secondary);
                    changes.colorReplacements += (allCss.match(secondaryColorRegex) || []).length;
                }

                // Replace accent color
                if (originalBrand.colors.accent && newBrand.colors.accent) {
                    const accentColorRegex = new RegExp(this.escapeRegExp(originalBrand.colors.accent), 'gi');
                    allCss = allCss.replace(accentColorRegex, newBrand.colors.accent);
                    changes.colorReplacements += (allCss.match(accentColorRegex) || []).length;
                }
            }

            // Replace typography in CSS
            if (originalBrand.typography && newBrand.typography) {
                // Replace primary font
                const primaryFontRegex = new RegExp(this.escapeRegExp(originalBrand.typography.primary), 'gi');
                allCss = allCss.replace(primaryFontRegex, newBrand.typography.primary);
                changes.fontReplacements += (allCss.match(primaryFontRegex) || []).length;

                // Replace secondary font
                if (originalBrand.typography.secondary && newBrand.typography.secondary) {
                    const secondaryFontRegex = new RegExp(this.escapeRegExp(originalBrand.typography.secondary), 'gi');
                    allCss = allCss.replace(secondaryFontRegex, newBrand.typography.secondary);
                    changes.fontReplacements += (allCss.match(secondaryFontRegex) || []).length;
                }
            }

            // Replace inline styles
            $('style').each((i, element) => {
                if (i < inlineStyles.length) {
                    $(element).html(allCss);
                }
            });

            // Add Google Fonts for the new brand font
            if (newBrand.typography.primary) {
                const fontName = newBrand.typography.primary.split(',')[0].trim();
                if (fontName !== 'System-ui') {
                    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}&display=swap" rel="stylesheet">`;
                    $('head').append(fontLink);
                }
            }

            // Add a meta tag to indicate the rebranding
            $('head').append(`<meta name="generator" content="Shades AI Rebranding Tool">`);

            // Generate the rebranded HTML
            const rebrandedHtml = $.html();

            return {
                html: rebrandedHtml,
                css: allCss,
                originalUrl: scrapedContent.url,
                changes
            };
        } catch (error) {
            console.error('Error rebranding website:', error);
            throw new Error(`Failed to rebrand website: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Escapes special characters in a string for use in a regular expression
     * @param string The string to escape
     * @returns The escaped string
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
