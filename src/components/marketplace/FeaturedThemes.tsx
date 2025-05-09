'use client';

import { useState, useEffect } from 'react';
import ThemeCard from './ThemeCard';

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
  isFeatured: boolean;
}

export default function FeaturedThemes() {
  const [featuredThemes, setFeaturedThemes] = useState<Theme[]>([]);
  const [newestThemes, setNewestThemes] = useState<Theme[]>([]);
  const [popularThemes, setPopularThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      ratingCount: 24,
      isFeatured: true,
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
      ratingCount: 18,
      isFeatured: true,
    },
  ];

  useEffect(() => {
    const fetchFeaturedThemes = async () => {
      try {
        setLoading(true);

        // Skip API calls during server-side rendering or build
        if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_SKIP_API_CALLS === 'true') {
          console.log('Using mock data for featured themes');
          setFeaturedThemes(mockThemes);
          setNewestThemes(mockThemes);
          setPopularThemes(mockThemes);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/featured-themes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured themes');
        }
        
        const data = await response.json();
        setFeaturedThemes(data.featuredThemes || []);
        setNewestThemes(data.newestThemes || []);
        setPopularThemes(data.popularThemes || []);
      } catch (error) {
        console.error('Error fetching featured themes:', error);
        setError('Failed to load featured themes. Please try again later.');
        
        // Use mock data as fallback
        setFeaturedThemes(mockThemes);
        setNewestThemes(mockThemes);
        setPopularThemes(mockThemes);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedThemes();
  }, []);

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
    <div className="space-y-12">
      {/* Featured Themes */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Featured Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredThemes.length > 0 ? (
            featuredThemes.map((theme) => (
              <ThemeCard key={theme._id} theme={theme} />
            ))
          ) : (
            <p className="col-span-3 text-gray-500">No featured themes available.</p>
          )}
        </div>
      </section>

      {/* Newest Themes */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Newest Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {newestThemes.length > 0 ? (
            newestThemes.map((theme) => (
              <ThemeCard key={theme._id} theme={theme} />
            ))
          ) : (
            <p className="col-span-3 text-gray-500">No new themes available.</p>
          )}
        </div>
      </section>

      {/* Popular Themes */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularThemes.length > 0 ? (
            popularThemes.map((theme) => (
              <ThemeCard key={theme._id} theme={theme} />
            ))
          ) : (
            <p className="col-span-3 text-gray-500">No popular themes available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
