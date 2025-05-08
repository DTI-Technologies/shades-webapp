import { DesignTrendAnalyzer } from '../trends/designTrendAnalyzer';
import { LanguageStyleGenerator } from './languageStyleGenerator';
import { PageTypeGenerator } from './pageTypeGenerator';

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

    constructor() {
        this.trendAnalyzer = new DesignTrendAnalyzer();
        this.languageStyleGenerator = new LanguageStyleGenerator();
        this.pageTypeGenerator = new PageTypeGenerator();
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
}
