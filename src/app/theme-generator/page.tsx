'use client';

// This ensures the page is rendered on the client side
// and not pre-rendered during build time
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { GeneratedTheme } from '@/services/ai/generator/themeGenerator';

export default function ThemeGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [themeTypes, setThemeTypes] = useState<string[]>([]);
  const [selectedThemeType, setSelectedThemeType] = useState('');
  const [projectType, setProjectType] = useState('web');
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [themePreview, setThemePreview] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available theme types
    const fetchThemeTypes = async () => {
      try {
        // Skip API calls during server-side rendering
        if (typeof window === 'undefined') {
          console.log('Skipping API calls during SSR');
          return;
        }

        const response = await axios.get('/api/generate-theme?action=getThemeTypes');
        setThemeTypes(response.data.themeTypes);
        if (response.data.themeTypes.length > 0) {
          setSelectedThemeType(response.data.themeTypes[0]);
        }
      } catch (err) {
        console.error('Error fetching theme types:', err);
        setError('Failed to load theme types. Please try again later.');
      }
    };

    fetchThemeTypes();
  }, []);

  useEffect(() => {
    // Fetch theme preview when theme type changes
    if (selectedThemeType && typeof window !== 'undefined') {
      fetchThemePreview(selectedThemeType);
    }
  }, [selectedThemeType]);

  const fetchThemePreview = async (themeType: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/generate-theme?action=getThemePreview&themeType=${themeType}`);
      setThemePreview(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching theme preview:', err);
      setError('Failed to load theme preview. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTheme = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.post('/api/generate-theme', {
        themeType: selectedThemeType,
        projectType
      });

      setGeneratedTheme(response.data);
    } catch (err) {
      console.error('Error generating theme:', err);
      setError('Failed to generate theme. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTheme = () => {
    if (!generatedTheme) return;

    const blob = new Blob([JSON.stringify(generatedTheme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Theme Generator</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Generate a New Theme</h2>

          <div className="mb-4">
            <label htmlFor="themeType" className="block text-gray-700 mb-2">Theme Type</label>
            <select
              id="themeType"
              value={selectedThemeType}
              onChange={(e) => setSelectedThemeType(e.target.value)}
              className="input-field"
              disabled={isLoading}
            >
              {themeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="projectType" className="block text-gray-700 mb-2">Project Type</label>
            <select
              id="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="input-field"
              disabled={isLoading}
            >
              <option value="web">Web Application</option>
              <option value="mobile">Mobile Application</option>
              <option value="desktop">Desktop Application</option>
              <option value="blog">Blog</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="portfolio">Portfolio</option>
            </select>
          </div>

          <button
            onClick={handleGenerateTheme}
            disabled={isLoading || !selectedThemeType}
            className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Generating...' : 'Generate Theme'}
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Theme Preview</h2>

          {themePreview ? (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Color Palette</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(themePreview.colorPalette).map(([name, color]) => (
                    <div key={name} className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-md border border-gray-200"
                        style={{ backgroundColor: color as string }}
                      ></div>
                      <span className="text-xs mt-1">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Typography</h3>
                <div className="space-y-2">
                  <p style={{ fontFamily: themePreview.typography.headingFont }}>
                    <span className="text-xs text-gray-500 block">Heading Font:</span>
                    <span className="text-lg">The quick brown fox jumps over the lazy dog</span>
                  </p>
                  <p style={{ fontFamily: themePreview.typography.bodyFont }}>
                    <span className="text-xs text-gray-500 block">Body Font:</span>
                    <span>The quick brown fox jumps over the lazy dog</span>
                  </p>
                  <p style={{ fontFamily: themePreview.typography.codeFont }}>
                    <span className="text-xs text-gray-500 block">Code Font:</span>
                    <span className="font-mono">const greeting = "Hello, World!";</span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Components</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">Buttons:</span>
                    <div className="flex gap-2 mt-1">
                      <button
                        style={{
                          backgroundColor: themePreview.components.buttons.primary.backgroundColor,
                          color: themePreview.components.buttons.primary.color,
                          borderRadius: themePreview.components.buttons.primary.borderRadius,
                          padding: themePreview.components.buttons.primary.padding,
                          fontFamily: themePreview.components.buttons.primary.fontFamily,
                          fontWeight: themePreview.components.buttons.primary.fontWeight
                        }}
                      >
                        Primary
                      </button>
                      <button
                        style={{
                          backgroundColor: themePreview.components.buttons.secondary.backgroundColor,
                          color: themePreview.components.buttons.secondary.color,
                          borderRadius: themePreview.components.buttons.secondary.borderRadius,
                          padding: themePreview.components.buttons.secondary.padding,
                          border: themePreview.components.buttons.secondary.border,
                          fontFamily: themePreview.components.buttons.secondary.fontFamily,
                          fontWeight: themePreview.components.buttons.secondary.fontWeight
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">Card:</span>
                    <div
                      className="p-4 mt-1"
                      style={{
                        backgroundColor: themePreview.components.cards.backgroundColor,
                        borderRadius: themePreview.components.cards.borderRadius,
                        padding: themePreview.components.cards.padding,
                        boxShadow: themePreview.components.cards.boxShadow,
                        border: themePreview.components.cards.border
                      }}
                    >
                      <p className="text-sm">Sample card content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a theme type to see preview</p>
            </div>
          )}
        </div>
      </div>

      {generatedTheme && (
        <div className="card mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Theme: {generatedTheme.name}</h2>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Theme Details</h3>
            <p><strong>Type:</strong> {generatedTheme.type}</p>
            <p><strong>Supported Languages:</strong> {Object.keys(generatedTheme.styles).join(', ')}</p>
            <p><strong>Page Layouts:</strong> {Object.keys(generatedTheme.pageLayouts).join(', ')}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Theme Preview</h3>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(generatedTheme, null, 2)}</pre>
            </div>
          </div>

          <button
            onClick={handleDownloadTheme}
            className="btn-primary"
          >
            Download Theme
          </button>
        </div>
      )}
    </div>
  );
}
