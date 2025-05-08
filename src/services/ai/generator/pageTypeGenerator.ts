import { GeneratedTheme } from './themeGenerator';

export class PageTypeGenerator {
    private pageTypes = {
        product: [
            'details', 'description', 'reviews', 'shipping', 
            'specifications', 'features', 'ingredients', 'brand'
        ],
        navigation: [
            'home', 'about', 'services', 'contact'
        ],
        profile: [
            'personal', 'professional', 'education', 'skills'
        ],
        blog: [
            'post', 'comments', 'related'
        ],
        settings: [
            'account', 'privacy', 'notifications'
        ],
        application: [
            'projectFiles', 'userFiles', 'settings'
        ]
    };
    
    public async generateLayouts(
        themeType: string, 
        colorPalette: GeneratedTheme['colorPalette'],
        typography: GeneratedTheme['typography']
    ): Promise<{ [pageType: string]: any }> {
        const layouts: { [pageType: string]: any } = {};
        
        // Generate layouts for each page type category
        for (const [category, types] of Object.entries(this.pageTypes)) {
            layouts[category] = {};
            
            for (const type of types) {
                layouts[category][type] = await this.generatePageLayout(
                    category, 
                    type, 
                    themeType, 
                    colorPalette, 
                    typography
                );
            }
        }
        
        return layouts;
    }
    
    private async generatePageLayout(
        category: string,
        type: string,
        themeType: string,
        colorPalette: GeneratedTheme['colorPalette'],
        typography: GeneratedTheme['typography']
    ): Promise<any> {
        // Base layout properties
        const baseLayout = {
            backgroundColor: colorPalette.background,
            textColor: colorPalette.text,
            headingFont: typography.headingFont,
            bodyFont: typography.bodyFont,
            spacing: themeType === 'Modern Minimalism' ? 'compact' : 'comfortable',
            borderRadius: themeType === 'Modern Minimalism' ? '2px' : '8px',
            boxShadow: themeType === 'Modern Minimalism' ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)'
        };
        
        // Category-specific layout properties
        switch (category) {
            case 'product':
                return {
                    ...baseLayout,
                    layout: 'grid',
                    imageSize: 'large',
                    detailsLayout: type === 'details' ? 'sidebar' : 'below',
                    callToAction: {
                        backgroundColor: colorPalette.primary,
                        textColor: '#FFFFFF',
                        borderRadius: themeType === 'Modern Minimalism' ? '2px' : '4px',
                        padding: '12px 24px'
                    }
                };
                
            case 'navigation':
                return {
                    ...baseLayout,
                    layout: 'horizontal',
                    sticky: type === 'home',
                    transparent: type === 'home',
                    menuStyle: themeType === 'Modern Minimalism' ? 'text' : 'button',
                    activeIndicator: themeType === 'Modern Minimalism' ? 'underline' : 'background'
                };
                
            case 'profile':
                return {
                    ...baseLayout,
                    layout: type === 'personal' ? 'centered' : 'sidebar',
                    avatarSize: type === 'personal' ? 'large' : 'medium',
                    sections: type === 'professional' ? 'tabbed' : 'stacked',
                    contentWidth: type === 'education' ? 'narrow' : 'wide'
                };
                
            case 'blog':
                return {
                    ...baseLayout,
                    layout: type === 'post' ? 'centered' : 'sidebar',
                    imagePosition: type === 'post' ? 'top' : 'side',
                    readingWidth: '680px',
                    typography: {
                        headingSize: '2rem',
                        bodySize: '1.125rem',
                        lineHeight: 1.8
                    }
                };
                
            case 'settings':
                return {
                    ...baseLayout,
                    layout: 'sidebar',
                    formStyle: themeType === 'Modern Minimalism' ? 'clean' : 'grouped',
                    controlSize: 'medium',
                    labelPosition: 'top'
                };
                
            case 'application':
                return {
                    ...baseLayout,
                    layout: 'split',
                    sidebarWidth: '280px',
                    toolbarPosition: 'top',
                    contentPadding: '24px'
                };
                
            default:
                return baseLayout;
        }
    }
    
    public getPageTypeCategories(): string[] {
        return Object.keys(this.pageTypes);
    }
    
    public getPageTypes(category: string): string[] {
        return this.pageTypes[category as keyof typeof this.pageTypes] || [];
    }
}
