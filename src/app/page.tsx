import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold font-heading text-primary mb-4">Shades</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered web application that creates stylized webpage themes and rebrands websites
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <FeatureCard 
          title="Generate Theme" 
          description="Create a new theme based on your project requirements and preferences."
          link="/theme-generator"
          icon="✨"
        />
        <FeatureCard 
          title="Analyze Codebase" 
          description="Analyze your codebase for style patterns and get recommendations."
          link="/codebase-analyzer"
          icon="🔍"
        />
        <FeatureCard 
          title="Customize Theme" 
          description="Customize an existing theme to match your brand and preferences."
          link="/theme-customizer"
          icon="🎨"
        />
        <FeatureCard 
          title="Rebrand Website" 
          description="Scrape and rebrand an existing website with your brand elements."
          link="/website-rebrander"
          icon="🔄"
        />
        <FeatureCard 
          title="Deploy Content" 
          description="Deploy themes or rebranded websites directly to servers."
          link="/deployment"
          icon="🚀"
        />
        <FeatureCard 
          title="Design Trends" 
          description="Explore current design trends and apply them to your projects."
          link="/design-trends"
          icon="📊"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, link, icon }: { title: string; description: string; link: string; icon: string }) {
  return (
    <Link href={link} className="card hover:shadow-lg transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold font-heading mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="text-primary font-medium">Get started →</div>
    </Link>
  );
}
