'use client';

import Link from 'next/link';

interface ThemeCardProps {
  theme: {
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
  };
}

export default function ThemeCard({ theme }: ThemeCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
        {theme.previewImage ? (
          <img
            src={theme.previewImage}
            alt={theme.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 p-4 w-full h-full">
              <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.primary }}></div>
              <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.secondary }}></div>
              <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.background }}></div>
              <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.accent || theme.colorPalette.text }}></div>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          {theme.type}
        </div>
      </div>
      <div className="px-4 py-4">
        <Link href={`/dashboard/marketplace/theme/${theme._id}`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate">
            {theme.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {theme.description}
        </p>
      </div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <img
            className="h-8 w-8 rounded-full"
            src={theme.creator.image || `https://ui-avatars.com/api/?name=${theme.creator.name}&background=random`}
            alt={theme.creator.name}
          />
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {theme.creator.name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-1">{theme.rating.toFixed(1)}</span>
            <span className="ml-1">({theme.ratingCount})</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="ml-1">{theme.downloads}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
