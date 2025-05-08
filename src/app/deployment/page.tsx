'use client';

import { useState } from 'react';

export default function DeploymentPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Deployment</h1>
      
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Deploy Your Content</h2>
        <p className="mb-6">
          This feature will be implemented soon. The Deployment tool will allow you to deploy themes or rebranded websites
          directly to various platforms like Vercel, Netlify, GitHub Pages, or custom servers.
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
          Deploy Content
        </button>
      </div>
    </div>
  );
}
