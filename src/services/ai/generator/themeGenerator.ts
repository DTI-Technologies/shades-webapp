import { DesignTrendAnalyzer } from '../trends/designTrendAnalyzer';
import { LanguageStyleGenerator } from './languageStyleGenerator';
import { PageTypeGenerator } from './pageTypeGenerator';
import { OpenAIService } from '../openai/openaiService';

export interface GeneratedTheme {
    name: string;
    type: string;
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        codeFont: string;
    };
    components: {
        [key: string]: any;
    };
    styles: {
        [language: string]: any;
    };
    pageLayouts: {
        [pageType: string]: any;
    };
}

export class ThemeGenerator {
    private trendAnalyzer: DesignTrendAnalyzer;
    private languageStyleGenerator: LanguageStyleGenerator;
    private pageTypeGenerator: PageTypeGenerator;
    private openAIService: OpenAIService;

    constructor() {
        this.trendAnalyzer = new DesignTrendAnalyzer();
        this.languageStyleGenerator = new LanguageStyleGenerator();
        this.pageTypeGenerator = new PageTypeGenerator();
        this.openAIService = new OpenAIService();
    }

    public async generateTheme(themeType: string, projectType: string = 'web'): Promise<GeneratedTheme> {
        // Get current design trends
        const trendFeatures = await this.trendAnalyzer.getDesignTrendFeatures(themeType);

        // Generate color palette based on theme type
        const colorPalette = this.generateColorPalette(themeType);

        // Generate typography settings
        const typography = this.generateTypography(themeType);

        // Generate language-specific styles
        const languageStyles = await this.languageStyleGenerator.generateStyles(themeType, colorPalette);

        // Generate page type layouts
        const pageLayouts = await this.pageTypeGenerator.generateLayouts(themeType, colorPalette, typography);

        // Combine everything into a theme
        const theme: GeneratedTheme = {
            name: `Shades ${themeType}`,
            type: themeType,
            colorPalette,
            typography,
            components: this.generateComponents(themeType, colorPalette, typography),
            styles: languageStyles,
            pageLayouts
        };

        return theme;
    }

    private generateColorPalette(themeType: string): GeneratedTheme['colorPalette'] {
        // Default color palettes based on theme type
        switch (themeType) {
            case 'Modern Minimalism':
                return {
                    primary: '#2D3748',
                    secondary: '#4A5568',
                    accent: '#38B2AC',
                    background: '#F7FAFC',
                    text: '#1A202C'
                };
            case 'Dark Mode':
                return {
                    primary: '#1A202C',
                    secondary: '#2D3748',
                    accent: '#38B2AC',
                    background: '#171923',
                    text: '#E2E8F0'
                };
            case 'Bold Typography':
                return {
                    primary: '#2B6CB0',
                    secondary: '#3182CE',
                    accent: '#F6AD55',
                    background: '#F7FAFC',
                    text: '#1A202C'
                };
            case 'Abstract Design':
                return {
                    primary: '#553C9A',
                    secondary: '#6B46C1',
                    accent: '#F6AD55',
                    background: '#FAF5FF',
                    text: '#44337A'
                };
            default:
                return {
                    primary: '#3182CE',
                    secondary: '#4299E1',
                    accent: '#ED8936',
                    background: '#F7FAFC',
                    text: '#1A202C'
                };
        }
    }

    private generateTypography(themeType: string): GeneratedTheme['typography'] {
        // Default typography settings based on theme type
        switch (themeType) {
            case 'Modern Minimalism':
                return {
                    headingFont: 'Inter, sans-serif',
                    bodyFont: 'Inter, sans-serif',
                    codeFont: 'JetBrains Mono, monospace'
                };
            case 'Dark Mode':
                return {
                    headingFont: 'Poppins, sans-serif',
                    bodyFont: 'Poppins, sans-serif',
                    codeFont: 'Fira Code, monospace'
                };
            case 'Bold Typography':
                return {
                    headingFont: 'Montserrat, sans-serif',
                    bodyFont: 'Open Sans, sans-serif',
                    codeFont: 'Source Code Pro, monospace'
                };
            case 'Abstract Design':
                return {
                    headingFont: 'Playfair Display, serif',
                    bodyFont: 'Raleway, sans-serif',
                    codeFont: 'IBM Plex Mono, monospace'
                };
            default:
                return {
                    headingFont: 'System-ui, sans-serif',
                    bodyFont: 'System-ui, sans-serif',
                    codeFont: 'Menlo, monospace'
                };
        }
    }

    private generateComponents(
        themeType: string,
        colorPalette: GeneratedTheme['colorPalette'],
        typography: GeneratedTheme['typography']
    ): GeneratedTheme['components'] {
        // Generate component styles based on theme type and color palette
        return {
            buttons: {
                primary: {
                    backgroundColor: colorPalette.primary,
                    color: '#FFFFFF',
                    borderRadius: themeType === 'Modern Minimalism' ? '2px' : '4px',
                    padding: '10px 20px',
                    fontFamily: typography.bodyFont,
                    fontWeight: 'bold'
                },
                secondary: {
                    backgroundColor: 'transparent',
                    color: colorPalette.primary,
                    borderRadius: themeType === 'Modern Minimalism' ? '2px' : '4px',
                    padding: '10px 20px',
                    border: `1px solid ${colorPalette.primary}`,
                    fontFamily: typography.bodyFont,
                    fontWeight: 'normal'
                }
            },
            cards: {
                backgroundColor: colorPalette.background,
                borderRadius: themeType === 'Abstract Design' ? '12px' : '6px',
                padding: '20px',
                boxShadow: themeType === 'Modern Minimalism'
                    ? 'none'
                    : '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: themeType === 'Modern Minimalism'
                    ? `1px solid ${colorPalette.secondary}`
                    : 'none'
            },
            navigation: {
                backgroundColor: colorPalette.primary,
                color: '#FFFFFF',
                fontFamily: typography.headingFont,
                fontWeight: 'medium'
            },
            tabs: {
                backgroundColor: colorPalette.background,
                activeColor: colorPalette.accent,
                inactiveColor: colorPalette.secondary,
                borderRadius: themeType === 'Modern Minimalism' ? '0px' : '4px 4px 0 0',
                fontFamily: typography.bodyFont,
                fontWeight: 'medium'
            }
        };
    }

    public getAvailableThemeTypes(): string[] {
        return [
            'Modern Minimalism',
            'Dark Mode',
            'Bold Typography',
            'Abstract Design',
            'Custom'
        ];
    }

    public getThemePreview(themeType: string): any {
        const colorPalette = this.generateColorPalette(themeType);
        const typography = this.generateTypography(themeType);

        return {
            colorPalette,
            typography,
            components: this.generateComponents(themeType, colorPalette, typography)
        };
    }

    /**
     * Generate a theme using AI with advanced customization
     * @param themeType The type of theme to generate
     * @param projectType The type of project
     * @param customOptions Custom options for theme generation
     * @returns The generated theme
     */
    public async generateAITheme(
        themeType: string,
        projectType: string = 'web',
        customOptions: {
            colorPalette?: Partial<GeneratedTheme['colorPalette']>;
            typography?: Partial<GeneratedTheme['typography']>;
            components?: Partial<Record<string, any>>;
            description?: string;
        } = {}
    ): Promise<GeneratedTheme> {
        try {
            // Get current design trends
            const trendFeatures = await this.trendAnalyzer.getDesignTrendFeatures(themeType);

            // Create a prompt for OpenAI
            const prompt = `
                Generate a detailed theme for a ${projectType} project with a "${themeType}" style.
                ${customOptions.description ? `The theme should: ${customOptions.description}` : ''}

                Current design trends for this style include:
                - Color Palette: ${trendFeatures.colorPalette.join(', ')}
                - Typography: ${trendFeatures.typography.join(', ')}
                - Components: ${trendFeatures.components.join(', ')}
                - Animations: ${trendFeatures.animations.join(', ')}
                - Layout: ${trendFeatures.layout.join(', ')}

                ${customOptions.colorPalette ? `Use these specific colors where appropriate: ${JSON.stringify(customOptions.colorPalette)}` : ''}
                ${customOptions.typography ? `Use these specific fonts where appropriate: ${JSON.stringify(customOptions.typography)}` : ''}
                ${customOptions.components ? `Include these specific component styles: ${JSON.stringify(customOptions.components)}` : ''}

                Generate a complete theme with color palette, typography, and component styles.
            `;

            // Define the schema for the AI response
            const schema = {
                name: { type: 'string', description: 'The name of the theme' },
                type: { type: 'string', description: 'The type/style of the theme' },
                description: { type: 'string', description: 'A brief description of the theme' },
                colorPalette: {
                    type: 'object',
                    properties: {
                        primary: { type: 'string', description: 'Primary color (hex)' },
                        secondary: { type: 'string', description: 'Secondary color (hex)' },
                        accent: { type: 'string', description: 'Accent color (hex)' },
                        background: { type: 'string', description: 'Background color (hex)' },
                        text: { type: 'string', description: 'Text color (hex)' }
                    }
                },
                typography: {
                    type: 'object',
                    properties: {
                        headingFont: { type: 'string', description: 'Font for headings' },
                        bodyFont: { type: 'string', description: 'Font for body text' },
                        codeFont: { type: 'string', description: 'Font for code' }
                    }
                },
                components: { type: 'object', description: 'Component styles' }
            };

            // Generate the theme using OpenAI
            const aiGeneratedTheme = await this.openAIService.generateStructuredData<Partial<GeneratedTheme>>(
                prompt,
                schema,
                { temperature: 0.8 }
            );

            // Merge AI-generated theme with base theme and custom options
            const baseColorPalette = this.generateColorPalette(themeType);
            const baseTypography = this.generateTypography(themeType);

            const colorPalette = {
                ...baseColorPalette,
                ...aiGeneratedTheme.colorPalette,
                ...customOptions.colorPalette
            };

            const typography = {
                ...baseTypography,
                ...aiGeneratedTheme.typography,
                ...customOptions.typography
            };

            // Generate language-specific styles
            const languageStyles = await this.languageStyleGenerator.generateStyles(themeType, colorPalette);

            // Generate page type layouts
            const pageLayouts = await this.pageTypeGenerator.generateLayouts(themeType, colorPalette, typography);

            // Combine everything into a theme
            const theme: GeneratedTheme = {
                name: aiGeneratedTheme.name || `Shades ${themeType}`,
                type: themeType,
                colorPalette,
                typography,
                components: {
                    ...this.generateComponents(themeType, colorPalette, typography),
                    ...aiGeneratedTheme.components,
                    ...customOptions.components
                },
                styles: languageStyles,
                pageLayouts
            };

            return theme;
        } catch (error) {
            console.error('Error generating AI theme:', error);
            // Fall back to standard theme generation if AI fails
            return this.generateTheme(themeType, projectType);
        }
    }
}
