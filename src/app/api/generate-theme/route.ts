import { NextResponse } from 'next/server';
import { ThemeGenerator } from '@/services/ai/generator/themeGenerator';

export async function POST(request: Request) {
    try {
        const { themeType, projectType } = await request.json();

        if (!themeType) {
            return NextResponse.json(
                { error: 'Theme type is required' },
                { status: 400 }
            );
        }

        const themeGenerator = new ThemeGenerator();
        const theme = await themeGenerator.generateTheme(themeType, projectType || 'web');

        return NextResponse.json(theme);
    } catch (error) {
        console.error('Error generating theme:', error);
        return NextResponse.json(
            { error: `Failed to generate theme: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const themeGenerator = new ThemeGenerator();

        if (action === 'getThemeTypes') {
            const themeTypes = themeGenerator.getAvailableThemeTypes();
            return NextResponse.json({ themeTypes });
        } else if (action === 'getThemePreview') {
            const themeType = searchParams.get('themeType');
            if (!themeType) {
                return NextResponse.json(
                    { error: 'Theme type is required for preview' },
                    { status: 400 }
                );
            }
            
            const preview = themeGenerator.getThemePreview(themeType);
            return NextResponse.json(preview);
        }

        return NextResponse.json(
            { error: 'Invalid action parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error with theme generator API:', error);
        return NextResponse.json(
            { error: `API error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
