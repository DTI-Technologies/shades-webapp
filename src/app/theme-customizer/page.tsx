'use client';

import { useState } from 'react';

export default function ThemeCustomizerPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Theme Customizer</h1>
      
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Customize Your Theme</h2>
        <p className="mb-6">
          This feature will be implemented soon. The Theme Customizer will allow you to customize an existing theme
          to match your brand and preferences.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            Coming soon! This feature is currently being migrated from the VS Code extension.
          </p>
        </div>
        
        <button
          disabled={true}
          className="btn-primary opacity-50 cursor-not-allowed"
        >
          Customize Theme
        </button>
      </div>
    </div>
  );
}
