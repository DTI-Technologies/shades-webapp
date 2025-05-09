'use client';

// This ensures the page is rendered on the client side
// and not pre-rendered during build time
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteScraper, ScrapedContent } from '@/services/ai/scraper/websiteScraper';
import { BrandAnalyzer, BrandElements } from '@/services/ai/analyzer/brandAnalyzer';
import { WebsiteRebrander, RebrandedContent } from '@/services/ai/rebrander/websiteRebrander';
import Link from 'next/link';

export default function WebsiteRebranderPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null);
  const [originalBrand, setOriginalBrand] = useState<BrandElements | null>(null);
  const [savedWebsiteId, setSavedWebsiteId] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);
  const [newBrand, setNewBrand] = useState<BrandElements>({
    name: '',
    colors: {
      primary: '#3182CE',
      secondary: '#4299E1',
      accent: '#ED8936',
      background: '#FFFFFF',
      text: '#1A202C',
    },
    typography: {
      primary: 'Inter, sans-serif',
    },
    style: {
      borderRadius: '4px',
    },
  });
  const [rebrandedContent, setRebrandedContent] = useState<RebrandedContent | null>(null);
  const [error, setError] = useState('');

  const handleScrapeWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Skip actual API calls during build
      if (typeof window === 'undefined') {
        console.log('Skipping API calls during build');
        return;
      }

      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      const scraper = new WebsiteScraper();
      const content = await scraper.scrapeWebsite(url, useProxy);

      if (!content) {
        throw new Error('Failed to scrape website content');
      }

      setScrapedContent(content);

      const analyzer = new BrandAnalyzer();
      const brand = await analyzer.analyzeBrand(content);

      if (!brand) {
        throw new Error('Failed to analyze brand elements');
      }

      setOriginalBrand(brand);
      setStep(2);
    } catch (err) {
      console.error('Error in website scraping:', err);
      setError(`Error scraping website: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebrandWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Skip actual API calls during build
      if (typeof window === 'undefined') {
        console.log('Skipping API calls during build');
        return;
      }

      if (!scrapedContent || !originalBrand) {
        throw new Error('Website content not available. Please scrape a website first.');
      }

      // Validate new brand data
      if (!newBrand.name || !newBrand.colors.primary || !newBrand.typography.primary) {
        throw new Error('Please fill in all required brand information.');
      }

      const rebrander = new WebsiteRebrander();
      const content = await rebrander.rebrandWebsite(scrapedContent, originalBrand, newBrand);

      if (!content) {
        throw new Error('Failed to rebrand website content');
      }

      setRebrandedContent(content);
      setStep(3);
    } catch (err) {
      console.error('Error in website rebranding:', err);
      setError(`Error rebranding website: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [section, property] = name.split('.');
      setNewBrand(prev => {
        // Create a new object with all properties from prev
        const newBrand = { ...prev };

        // Create a new section object if it doesn't exist
        if (!newBrand[section as keyof BrandElements]) {
          newBrand[section as keyof BrandElements] = {} as any;
        }

        // Update the property in the section
        const sectionObj = newBrand[section as keyof BrandElements] as Record<string, string>;
        sectionObj[property] = value;

        return newBrand;
      });
    } else {
      setNewBrand(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveWebsite = async () => {
    if (!rebrandedContent) return;

    setIsLoading(true);
    setError('');

    try {
      // Skip actual API calls during build
      if (typeof window === 'undefined') {
        console.log('Skipping API calls during build');
        return;
      }

      const response = await fetch('/api/rebrand-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrand.name,
          url: url,
          description: `Rebranded version of ${url}`,
          originalBrand,
          newBrand,
          rebrandedContent: {
            html: rebrandedContent.html,
            css: [rebrandedContent.css],
            images: rebrandedContent.images || [],
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save website');
      }

      const data = await response.json();
      setSavedWebsiteId(data.website._id);

      // Log activity
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          resourceType: 'website',
          resourceId: data.website._id,
          metadata: {
            name: newBrand.name,
            url,
          },
        }),
      });

      return data.website._id;
    } catch (err) {
      console.error('Error saving website:', err);
      setError(`Error saving website: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployWebsite = async () => {
    try {
      setIsLoading(true);

      // Save the website first if not already saved
      let websiteId = savedWebsiteId;
      if (!websiteId) {
        websiteId = await handleSaveWebsite();
        if (!websiteId) {
          throw new Error('Failed to save website before deployment');
        }
      }

      // Redirect to deployment page with the website ID
      router.push(`/deployment?type=website&id=${websiteId}`);
    } catch (err) {
      console.error('Error preparing for deployment:', err);
      setError(`Error preparing for deployment: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Website Rebrander</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Step 1: Enter Website URL</h2>
          <form onSubmit={handleScrapeWebsite}>
            <div className="mb-4">
              <label htmlFor="url" className="block text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="input-field"
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="useProxy"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="useProxy" className="text-gray-700">
                Use proxy (try this if you have trouble scraping certain websites)
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Scraping...' : 'Scrape Website'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && originalBrand && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Step 2: Enter Your Brand Information</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Original Brand</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <p><strong>Name:</strong> {originalBrand.name}</p>
                <p><strong>Primary Color:</strong> <span className="inline-block w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: originalBrand.colors.primary }}></span> {originalBrand.colors.primary}</p>
                <p><strong>Secondary Color:</strong> <span className="inline-block w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: originalBrand.colors.secondary }}></span> {originalBrand.colors.secondary}</p>
              </div>
              <div>
                <p><strong>Typography:</strong> {originalBrand.typography.primary}</p>
                {originalBrand.logo && <p><strong>Logo:</strong> Found</p>}
              </div>
            </div>
          </div>

          <form onSubmit={handleRebrandWebsite}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 mb-2">Brand Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newBrand.name}
                onChange={handleBrandChange}
                placeholder="Your Brand Name"
                required
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="colors.primary" className="block text-gray-700 mb-2">Primary Color</label>
                <div className="flex">
                  <input
                    type="color"
                    id="colors.primary"
                    name="colors.primary"
                    value={newBrand.colors.primary}
                    onChange={handleBrandChange}
                    className="h-10 w-10 mr-2"
                  />
                  <input
                    type="text"
                    name="colors.primary"
                    value={newBrand.colors.primary}
                    onChange={handleBrandChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="colors.secondary" className="block text-gray-700 mb-2">Secondary Color</label>
                <div className="flex">
                  <input
                    type="color"
                    id="colors.secondary"
                    name="colors.secondary"
                    value={newBrand.colors.secondary}
                    onChange={handleBrandChange}
                    className="h-10 w-10 mr-2"
                  />
                  <input
                    type="text"
                    name="colors.secondary"
                    value={newBrand.colors.secondary}
                    onChange={handleBrandChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="typography.primary" className="block text-gray-700 mb-2">Brand Font</label>
              <select
                id="typography.primary"
                name="typography.primary"
                value={newBrand.typography.primary}
                onChange={(e) => setNewBrand(prev => ({
                  ...prev,
                  typography: {
                    ...prev.typography,
                    primary: e.target.value
                  }
                }))}
                className="input-field"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Playfair Display, serif">Playfair Display</option>
                <option value="Raleway, sans-serif">Raleway</option>
                <option value="Lato, sans-serif">Lato</option>
                <option value="Source Sans Pro, sans-serif">Source Sans Pro</option>
                <option value="System-ui, sans-serif">System UI</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Rebranding...' : 'Rebrand Website'}
            </button>
          </form>
        </div>
      )}

      {step === 3 && rebrandedContent && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Step 3: Preview Rebranded Website</h2>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Rebranding Summary</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>Name Replacements:</strong> {rebrandedContent.changes.nameReplacements}</p>
              <p><strong>Color Replacements:</strong> {rebrandedContent.changes.colorReplacements}</p>
              <p><strong>Font Replacements:</strong> {rebrandedContent.changes.fontReplacements}</p>
              <p><strong>Logo Replaced:</strong> {rebrandedContent.changes.logoReplaced ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            <div className="border rounded-md overflow-hidden">
              <iframe
                srcDoc={rebrandedContent.html}
                title="Rebranded Website Preview"
                className="w-full h-[600px]"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const blob = new Blob([rebrandedContent.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rebranded-website.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn-primary"
            >
              Download HTML
            </button>

            <button
              onClick={() => {
                const blob = new Blob([rebrandedContent.css], { type: 'text/css' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rebranded-styles.css';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary"
            >
              Download CSS
            </button>

            <button
              onClick={() => setStep(1)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-all"
            >
              Start Over
            </button>

            <button
              onClick={handleDeployWebsite}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all"
            >
              {isLoading ? 'Preparing...' : 'Deploy Website'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
