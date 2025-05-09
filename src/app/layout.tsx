import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Providers from '@/components/providers/Providers';

export const metadata: Metadata = {
  title: 'Shades - AI Theme Generator',
  description: 'AI-powered web application that creates stylized webpage themes for multiple programming languages and page types',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Navigation />
          <main className="min-h-screen pt-6">
            {children}
          </main>
          <footer className="bg-gray-100 py-6 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>© {new Date().getFullYear()} Shades by DTI Technologies. All rights reserved.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
