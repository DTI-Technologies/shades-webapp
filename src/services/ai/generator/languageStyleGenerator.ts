import { GeneratedTheme } from './themeGenerator';

export class LanguageStyleGenerator {
    private supportedLanguages = [
        'php', 'ruby', 'javascript', 'css', 'python', 'java', 'csharp', 
        'html', 'typescript', 'react', 'swift', 'go', 'perl', 'r', 'angular'
    ];
    
    public async generateStyles(
        themeType: string, 
        colorPalette: GeneratedTheme['colorPalette']
    ): Promise<{ [language: string]: any }> {
        const styles: { [language: string]: any } = {};
        
        // Generate styles for each supported language
        for (const language of this.supportedLanguages) {
            styles[language] = await this.generateLanguageStyle(language, themeType, colorPalette);
        }
        
        return styles;
    }
    
    private async generateLanguageStyle(
        language: string, 
        themeType: string, 
        colorPalette: GeneratedTheme['colorPalette']
    ): Promise<any> {
        // Base style properties for all languages
        const baseStyle = {
            backgroundColor: colorPalette.background,
            textColor: colorPalette.text,
            lineHeight: 1.5,
            fontSize: '14px',
            padding: '16px',
            borderRadius: '4px',
            border: themeType === 'Modern Minimalism' ? `1px solid ${colorPalette.secondary}` : 'none',
            boxShadow: themeType === 'Modern Minimalism' ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
        };
        
        // Language-specific syntax highlighting
        const syntaxHighlighting = this.getSyntaxHighlighting(language, themeType, colorPalette);
        
        return {
            ...baseStyle,
            syntaxHighlighting
        };
    }
    
    private getSyntaxHighlighting(
        language: string, 
        themeType: string, 
        colorPalette: GeneratedTheme['colorPalette']
    ): any {
        // Base syntax highlighting for all languages
        const baseHighlighting = {
            keyword: colorPalette.primary,
            string: colorPalette.accent,
            comment: themeType === 'Dark Mode' ? '#6B7280' : '#718096',
            function: colorPalette.secondary,
            variable: colorPalette.text,
            number: colorPalette.accent,
            operator: colorPalette.primary,
            punctuation: colorPalette.text,
            property: colorPalette.secondary,
            tag: colorPalette.primary,
            attribute: colorPalette.secondary,
            value: colorPalette.accent
        };
        
        // Language-specific adjustments
        switch (language) {
            case 'javascript':
            case 'typescript':
                return {
                    ...baseHighlighting,
                    regex: '#D69E2E',
                    builtin: colorPalette.primary,
                    className: colorPalette.secondary
                };
                
            case 'html':
                return {
                    ...baseHighlighting,
                    doctype: '#718096',
                    tagName: colorPalette.primary,
                    attributeName: colorPalette.secondary,
                    attributeValue: colorPalette.accent
                };
                
            case 'css':
                return {
                    ...baseHighlighting,
                    selector: colorPalette.primary,
                    property: colorPalette.secondary,
                    value: colorPalette.accent,
                    unit: colorPalette.text,
                    important: '#E53E3E'
                };
                
            case 'python':
                return {
                    ...baseHighlighting,
                    decorator: colorPalette.accent,
                    builtin: colorPalette.primary,
                    self: colorPalette.primary
                };
                
            case 'java':
            case 'csharp':
                return {
                    ...baseHighlighting,
                    annotation: colorPalette.accent,
                    className: colorPalette.secondary,
                    namespace: colorPalette.primary
                };
                
            case 'react':
                return {
                    ...baseHighlighting,
                    component: colorPalette.primary,
                    prop: colorPalette.secondary,
                    jsx: colorPalette.accent
                };
                
            default:
                return baseHighlighting;
        }
    }
    
    public getSupportedLanguages(): string[] {
        return this.supportedLanguages;
    }
}
