import * as cheerio from 'cheerio';
import { ScrapedContent } from '../scraper/websiteScraper';

export interface BrandElements {
    name: string;
    logo?: string;
    colors: {
        primary: string;
        secondary: string;
        accent?: string;
        background: string;
        text: string;
    };
    typography: {
        primary: string;
        secondary?: string;
    };
    style?: {
        borderRadius?: string;
        spacing?: string;
        buttonStyle?: string;
    };
}

export class BrandAnalyzer {
    /**
     * Analyzes a website's brand elements
     * @param scrapedContent The scraped website content
     * @returns The detected brand elements
     */
    public async analyzeBrand(scrapedContent: ScrapedContent): Promise<BrandElements> {
        try {
            // Parse the HTML
            const $ = cheerio.load(scrapedContent.html);

            // Extract brand name
            let brandName = '';

            // Try to find brand name in common locations
            const potentialBrandElements = [
                'a.brand',
                'a.navbar-brand',
                '.brand',
                '.logo',
                'header .logo',
                'header h1',
                'header a',
                'a[class*="logo"]',
                'a[class*="brand"]'
            ];

            for (const selector of potentialBrandElements) {
                const element = $(selector).first();
                if (element.length) {
                    // Try to get text content
                    const text = element.text().trim();
                    if (text && text.length < 30) { // Reasonable brand name length
                        brandName = text;
                        break;
                    }

                    // Try to get alt text from logo
                    const img = element.find('img');
                    if (img.length) {
                        const alt = img.attr('alt');
                        if (alt && alt.length < 30) {
                            brandName = alt;
                            break;
                        }
                    }
                }
            }

            // If still no brand name, use the title
            if (!brandName) {
                brandName = scrapedContent.title.split(' | ')[0].split(' - ')[0].trim();
            }

            // Extract logo
            let logo = '';
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
                    const src = element.attr('src');
                    if (src) {
                        logo = src;
                        break;
                    }
                }
            }

            // Extract colors from CSS
            const colors = this.extractColors(scrapedContent);

            // Extract typography
            const typography = this.extractTypography(scrapedContent);

            // Extract style elements
            const style = this.extractStyleElements(scrapedContent);

            return {
                name: brandName,
                logo: logo || undefined,
                colors,
                typography,
                style
            };
        } catch (error) {
            console.error('Error analyzing brand:', error);

            // Return default brand elements on error
            return {
                name: 'Unknown Brand',
                colors: {
                    primary: '#3182CE',
                    secondary: '#4299E1',
                    background: '#FFFFFF',
                    text: '#1A202C'
                },
                typography: {
                    primary: 'System-ui, sans-serif'
                },
                style: {}
            };
        }
    }

    /**
     * Extracts color information from CSS
     * @param scrapedContent The scraped website content
     * @returns The extracted colors
     */
    private extractColors(scrapedContent: ScrapedContent): BrandElements['colors'] {
        // Default colors
        const colors: BrandElements['colors'] = {
            primary: '#3182CE',
            secondary: '#4299E1',
            background: '#FFFFFF',
            text: '#1A202C',
            accent: '#ED8936'
        };

        try {
            // Parse the HTML
            const $ = cheerio.load(scrapedContent.html);

            // Extract inline styles
            const inlineStyles: string[] = [];
            $('style').each((_, element) => {
                inlineStyles.push($(element).html() || '');
            });

            // Combine all CSS
            const allCss = inlineStyles.join(' ');

            // Extract color values
            const colorRegex = /#[0-9a-f]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)/gi;
            const colorMatches = allCss.match(colorRegex) || [];

            if (colorMatches.length > 0) {
                // Count color occurrences
                const colorCounts: { [color: string]: number } = {};
                for (const color of colorMatches) {
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }

                // Sort colors by occurrence
                const sortedColors = Object.entries(colorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(entry => entry[0]);

                // Assign colors based on frequency and brightness
                const nonWhiteColors = sortedColors.filter(color =>
                    !this.isWhiteOrTransparent(color));

                if (nonWhiteColors.length > 0) {
                    colors.primary = nonWhiteColors[0];

                    if (nonWhiteColors.length > 1) {
                        colors.secondary = nonWhiteColors[1];
                    }

                    if (nonWhiteColors.length > 2) {
                        colors.accent = nonWhiteColors[2];
                    }
                }

                // Find background color (usually white or light)
                const lightColors = sortedColors.filter(color =>
                    this.isLightColor(color) && !this.isWhiteOrTransparent(color));

                if (lightColors.length > 0) {
                    colors.background = lightColors[0];
                }

                // Find text color (usually dark)
                const darkColors = sortedColors.filter(color =>
                    !this.isLightColor(color) && !this.isWhiteOrTransparent(color));

                if (darkColors.length > 0) {
                    colors.text = darkColors[0];
                }
            }

            return colors;
        } catch (error) {
            console.error('Error extracting colors:', error);
            return colors; // Return default colors on error
        }
    }

    /**
     * Extracts typography information from CSS
     * @param scrapedContent The scraped website content
     * @returns The extracted typography
     */
    private extractTypography(scrapedContent: ScrapedContent): BrandElements['typography'] {
        // Default typography
        const typography: BrandElements['typography'] = {
            primary: 'System-ui, sans-serif'
        };

        try {
            // Parse the HTML
            const $ = cheerio.load(scrapedContent.html);

            // Extract inline styles
            const inlineStyles: string[] = [];
            $('style').each((_, element) => {
                inlineStyles.push($(element).html() || '');
            });

            // Combine all CSS
            const allCss = inlineStyles.join(' ');

            // Extract font-family values
            const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi;
            const fontFamilyMatches = allCss.match(fontFamilyRegex) || [];

            if (fontFamilyMatches.length > 0) {
                // Extract font names
                const fontNames: string[] = [];
                for (const match of fontFamilyMatches) {
                    const fontName = match.split(':')[1].trim();
                    fontNames.push(fontName);
                }

                // Count font occurrences
                const fontCounts: { [font: string]: number } = {};
                for (const font of fontNames) {
                    fontCounts[font] = (fontCounts[font] || 0) + 1;
                }

                // Sort fonts by occurrence
                const sortedFonts = Object.entries(fontCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(entry => entry[0]);

                if (sortedFonts.length > 0) {
                    typography.primary = sortedFonts[0];

                    if (sortedFonts.length > 1) {
                        typography.secondary = sortedFonts[1];
                    }
                }
            }

            return typography;
        } catch (error) {
            console.error('Error extracting typography:', error);
            return typography; // Return default typography on error
        }
    }

    /**
     * Extracts style elements from CSS
     * @param scrapedContent The scraped website content
     * @returns The extracted style elements
     */
    private extractStyleElements(scrapedContent: ScrapedContent): BrandElements['style'] {
        // Default style
        const style: BrandElements['style'] = {};

        try {
            // Parse the HTML
            const $ = cheerio.load(scrapedContent.html);

            // Extract inline styles
            const inlineStyles: string[] = [];
            $('style').each((_, element) => {
                inlineStyles.push($(element).html() || '');
            });

            // Combine all CSS
            const allCss = inlineStyles.join(' ');

            // Extract border-radius values
            const borderRadiusRegex = /border-radius\s*:\s*([^;]+)/gi;
            const borderRadiusMatches = allCss.match(borderRadiusRegex) || [];

            if (borderRadiusMatches.length > 0) {
                // Count border-radius occurrences
                const borderRadiusCounts: { [radius: string]: number } = {};
                for (const match of borderRadiusMatches) {
                    const radius = match.split(':')[1].trim();
                    borderRadiusCounts[radius] = (borderRadiusCounts[radius] || 0) + 1;
                }

                // Find most common border-radius
                const mostCommonBorderRadius = Object.entries(borderRadiusCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(entry => entry[0])[0];

                if (mostCommonBorderRadius) {
                    style.borderRadius = mostCommonBorderRadius;
                }
            }

            // Extract button styles
            const buttons = $('button, .btn, [class*="button"]');
            if (buttons.length > 0) {
                // Check if buttons are mostly rounded or square
                let roundedCount = 0;
                let squareCount = 0;

                buttons.each((_, element) => {
                    const borderRadius = $(element).css('border-radius');
                    if (borderRadius && parseInt(borderRadius) > 0) {
                        roundedCount++;
                    } else {
                        squareCount++;
                    }
                });

                style.buttonStyle = roundedCount > squareCount ? 'rounded' : 'square';
            }

            return style;
        } catch (error) {
            console.error('Error extracting style elements:', error);
            return style; // Return default style on error
        }
    }

    /**
     * Checks if a color is white or transparent
     * @param color The color to check
     * @returns True if the color is white or transparent
     */
    private isWhiteOrTransparent(color: string): boolean {
        if (color.includes('rgba') && color.includes('0)')) {
            return true; // Transparent
        }

        if (color === '#fff' || color === '#ffffff' || color === 'white') {
            return true; // White
        }

        return false;
    }

    /**
     * Checks if a color is light
     * @param color The color to check
     * @returns True if the color is light
     */
    private isLightColor(color: string): boolean {
        // Simple heuristic for light vs dark colors
        if (color.startsWith('#')) {
            // Convert hex to RGB
            let hex = color.substring(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }

            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            // Calculate perceived brightness
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128;
        }

        // For simplicity, assume other formats are dark
        return false;
    }
}
