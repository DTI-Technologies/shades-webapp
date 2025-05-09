'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Website {
  _id: string;
  name: string;
  url: string;
  description: string;
  rebrandedContent?: {
    html: string;
    css: string[];
    images: string[];
  };
}

interface Theme {
  _id: string;
  name: string;
  type: string;
  description: string;
}

interface DeploymentOptions {
  platform: 'vercel' | 'netlify' | 'github-pages' | 'custom';
  customDomain?: string;
  repositoryUrl?: string;
  deploymentToken?: string;
}

export default function DeploymentPage() {
  const { data: session } = useSession();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<'website' | 'theme'>('website');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [deploymentOptions, setDeploymentOptions] = useState<DeploymentOptions>({
    platform: 'vercel',
    customDomain: '',
    repositoryUrl: '',
    deploymentToken: '',
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    message: string;
    deploymentUrl?: string;
  } | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);

        // Skip API calls during server-side rendering or build
        if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_SKIP_API_CALLS === 'true') {
          console.log('Using mock data for deployment page');
          setWebsites([
            { _id: '1', name: 'Example Website', url: 'https://example.com', description: 'An example website' },
            { _id: '2', name: 'Portfolio Site', url: 'https://portfolio.com', description: 'A portfolio website' },
          ]);
          setThemes([
            { _id: '1', name: 'Modern Business', type: 'business', description: 'A modern business theme' },
            { _id: '2', name: 'Creative Portfolio', type: 'portfolio', description: 'A creative portfolio theme' },
          ]);
          setLoading(false);
          return;
        }

        // Fetch user's websites
        const websitesResponse = await fetch('/api/rebrand-website?action=getUserWebsites');
        if (!websitesResponse.ok) {
          throw new Error('Failed to fetch websites');
        }
        const websitesData = await websitesResponse.json();
        setWebsites(websitesData.websites || []);

        // Fetch user's themes
        const themesResponse = await fetch('/api/generate-theme?action=getUserThemes');
        if (!themesResponse.ok) {
          throw new Error('Failed to fetch themes');
        }
        const themesData = await themesResponse.json();
        setThemes(themesData.themes || []);

        // Fetch deployment history
        const historyResponse = await fetch('/api/analytics?action=getDeploymentHistory');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setDeploymentHistory(historyData.deployments || []);
        }

        // Check for URL parameters
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const type = params.get('type');
          const id = params.get('id');

          if (type && id) {
            setSelectedContentType(type as 'website' | 'theme');
            setSelectedContentId(id);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content. Please try again later.');
        setLoading(false);
      }
    };

    if (session) {
      fetchContent();
    }
  }, [session]);

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeploymentResult(null);

      if (!selectedContentId) {
        throw new Error('Please select content to deploy');
      }

      if (selectedContentType === 'website') {
        // Deploy website
        const response = await fetch('/api/deploy-website', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId: selectedContentId,
            deploymentOptions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to deploy website');
        }

        const data = await response.json();
        setDeploymentResult({
          success: true,
          message: data.message,
          deploymentUrl: data.deploymentUrl,
        });

        // Refresh deployment history
        const historyResponse = await fetch('/api/analytics?action=getDeploymentHistory');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setDeploymentHistory(historyData.deployments || []);
        }
      } else {
        // Deploy theme
        const response = await fetch('/api/deploy-theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            themeId: selectedContentId,
            deploymentOptions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to deploy theme');
        }

        const data = await response.json();
        setDeploymentResult({
          success: true,
          message: data.message,
          deploymentUrl: data.deploymentUrl,
        });

        // Refresh deployment history
        const historyResponse = await fetch('/api/analytics?action=getDeploymentHistory');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setDeploymentHistory(historyData.deployments || []);
        }
      }
    } catch (error) {
      console.error('Error deploying content:', error);
      setDeploymentResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Please sign in to access the deployment features.
          </p>
          <Link href="/auth/signin" className="text-blue-600 hover:underline mt-2 inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Deployment</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Deploy Your Content</h2>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Content Type</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedContentType('website')}
                  className={`px-4 py-2 rounded-md ${
                    selectedContentType === 'website'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Website
                </button>
                <button
                  onClick={() => setSelectedContentType('theme')}
                  className={`px-4 py-2 rounded-md ${
                    selectedContentType === 'theme'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Theme
                </button>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="content" className="block text-gray-700 mb-2">
                    Select {selectedContentType === 'website' ? 'Website' : 'Theme'}
                  </label>
                  <select
                    id="content"
                    value={selectedContentId}
                    onChange={(e) => setSelectedContentId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select {selectedContentType === 'website' ? 'a website' : 'a theme'}</option>
                    {selectedContentType === 'website'
                      ? websites.map((website) => (
                          <option key={website._id} value={website._id}>
                            {website.name}
                          </option>
                        ))
                      : themes.map((theme) => (
                          <option key={theme._id} value={theme._id}>
                            {theme.name} ({theme.type})
                          </option>
                        ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="platform" className="block text-gray-700 mb-2">
                    Deployment Platform
                  </label>
                  <select
                    id="platform"
                    value={deploymentOptions.platform}
                    onChange={(e) => setDeploymentOptions({
                      ...deploymentOptions,
                      platform: e.target.value as DeploymentOptions['platform'],
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="vercel">Vercel</option>
                    <option value="netlify">Netlify</option>
                    <option value="github-pages">GitHub Pages</option>
                    <option value="custom">Custom Domain</option>
                  </select>
                </div>

                {deploymentOptions.platform === 'custom' && (
                  <div className="mb-6">
                    <label htmlFor="customDomain" className="block text-gray-700 mb-2">
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      id="customDomain"
                      value={deploymentOptions.customDomain || ''}
                      onChange={(e) => setDeploymentOptions({
                        ...deploymentOptions,
                        customDomain: e.target.value,
                      })}
                      placeholder="example.com"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {(deploymentOptions.platform === 'github-pages' || deploymentOptions.platform === 'custom') && (
                  <div className="mb-6">
                    <label htmlFor="repositoryUrl" className="block text-gray-700 mb-2">
                      Repository URL (optional)
                    </label>
                    <input
                      type="text"
                      id="repositoryUrl"
                      value={deploymentOptions.repositoryUrl || ''}
                      onChange={(e) => setDeploymentOptions({
                        ...deploymentOptions,
                        repositoryUrl: e.target.value,
                      })}
                      placeholder="https://github.com/username/repo"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {(deploymentOptions.platform === 'vercel' || deploymentOptions.platform === 'netlify') && (
                  <div className="mb-6">
                    <label htmlFor="deploymentToken" className="block text-gray-700 mb-2">
                      Deployment Token (optional)
                    </label>
                    <input
                      type="password"
                      id="deploymentToken"
                      value={deploymentOptions.deploymentToken || ''}
                      onChange={(e) => setDeploymentOptions({
                        ...deploymentOptions,
                        deploymentToken: e.target.value,
                      })}
                      placeholder="Your deployment token"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !selectedContentId}
                  className={`btn-primary ${
                    isDeploying || !selectedContentId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDeploying ? 'Deploying...' : 'Deploy Content'}
                </button>
              </>
            )}
          </div>

          {deploymentResult && (
            <div className={`card mb-6 ${
              deploymentResult.success ? 'border-green-500' : 'border-red-500'
            }`}>
              <h2 className="text-xl font-bold mb-4">Deployment Result</h2>
              <p className={`mb-4 ${
                deploymentResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {deploymentResult.message}
              </p>

              {deploymentResult.deploymentUrl && (
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">Your content is deployed at:</p>
                  <a
                    href={deploymentResult.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {deploymentResult.deploymentUrl}
                  </a>
                </div>
              )}

              <button
                onClick={() => setDeploymentResult(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Deployment History</h2>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded mb-3"></div>
                <div className="h-16 bg-gray-200 rounded mb-3"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ) : deploymentHistory.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {deploymentHistory.map((deployment) => (
                  <li key={deployment._id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deployment.resourceName}</p>
                        <p className="text-sm text-gray-500">
                          {deployment.platform} • {new Date(deployment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {deployment.deploymentUrl && (
                        <a
                          href={deployment.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No deployment history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
