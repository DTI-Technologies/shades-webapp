'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeCard from '@/components/marketplace/ThemeCard';

interface Theme {
  _id: string;
  name: string;
  type: string;
  description: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
  };
  creator: {
    name: string;
    image?: string;
  };
  downloads: number;
  rating: number;
  ratingCount: number;
  previewImage?: string;
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<{
    recommendedThemes: Theme[];
    trendingThemes: Theme[];
    featuredThemes: Theme[];
    newestThemes: Theme[];
  }>({
    recommendedThemes: [],
    trendingThemes: [],
    featuredThemes: [],
    newestThemes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('recommended');

  // Mock data for SSR and build
  const mockThemes = [
    {
      _id: '1',
      name: 'Modern Business Theme',
      type: 'business',
      description: 'A clean, modern theme for business websites',
      colorPalette: { 
        primary: '#3182CE', 
        secondary: '#4299E1',
        accent: '#ECC94B',
        background: '#FFFFFF',
        text: '#1A202C'
      },
      creator: { name: 'Demo User', image: '' },
      downloads: 120,
      rating: 4.5,
      ratingCount: 24
    },
    {
      _id: '2',
      name: 'Creative Portfolio',
      type: 'portfolio',
      description: 'Showcase your creative work with this elegant theme',
      colorPalette: { 
        primary: '#805AD5', 
        secondary: '#9F7AEA',
        accent: '#F6AD55',
        background: '#FFFFFF',
        text: '#1A202C'
      },
      creator: { name: 'Demo User', image: '' },
      downloads: 85,
      rating: 4.2,
      ratingCount: 18
    },
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // Skip API calls during server-side rendering or build
        if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_SKIP_API_CALLS === 'true') {
          console.log('Using mock data for recommendations');
          setRecommendations({
            recommendedThemes: mockThemes,
            trendingThemes: mockThemes,
            featuredThemes: mockThemes,
            newestThemes: mockThemes
          });
          setLoading(false);
          return;
        }

        const response = await fetch('/api/analytics?action=recommendations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('Failed to load recommendations. Please try again later.');
        
        // Use mock data as fallback
        setRecommendations({
          recommendedThemes: mockThemes,
          trendingThemes: mockThemes,
          featuredThemes: mockThemes,
          newestThemes: mockThemes
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const getActiveThemes = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations.recommendedThemes;
      case 'trending':
        return recommendations.trendingThemes;
      case 'featured':
        return recommendations.featuredThemes;
      case 'newest':
        return recommendations.newestThemes;
      default:
        return recommendations.recommendedThemes;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
        <Link
          href="/dashboard/marketplace"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`${
              activeTab === 'recommended'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`${
              activeTab === 'trending'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`${
              activeTab === 'featured'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Featured
          </button>
          <button
            onClick={() => setActiveTab('newest')}
            className={`${
              activeTab === 'newest'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Newest
          </button>
        </nav>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {getActiveThemes().length > 0 ? (
          getActiveThemes().map((theme) => (
            <ThemeCard key={theme._id} theme={theme} />
          ))
        ) : (
          <p className="col-span-3 text-gray-500">No themes available in this category.</p>
        )}
      </div>
    </div>
  );
}
