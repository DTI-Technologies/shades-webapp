# Shades Web Application

Shades is an AI-powered web application that creates stylized webpage themes for multiple programming languages and page types. It also provides tools for website rebranding, codebase analysis, and content deployment.

## Features

- **Theme Generation**: Create stylized webpage themes for multiple programming languages and page types
- **Codebase Analysis**: Analyze your codebase for style patterns and get recommendations
- **Theme Customization**: Customize existing themes to match your brand and preferences
- **Website Rebranding**: Scrape and rebrand existing websites with your brand elements
- **Content Deployment**: Deploy themes or rebranded websites directly to various platforms

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/dti-technologies/shades.git
   cd shades/shades-web-app
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

### Deployment

#### Deploy to Vercel

The easiest way to deploy the application is using Vercel:

1. Install Vercel CLI (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel
   ```bash
   vercel login
   ```

3. Deploy using the provided script
   ```bash
   npm run deploy
   # or
   ./deploy.sh
   ```

Alternatively, you can deploy directly from the Vercel dashboard by connecting your GitHub repository.

## Project Structure

```
shades-web-app/
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js app router
│   │   ├── page.tsx       # Home page
│   │   ├── layout.tsx     # Root layout
│   │   ├── theme-generator/
│   │   ├── codebase-analyzer/
│   │   ├── theme-customizer/
│   │   ├── website-rebrander/
│   │   └── deployment/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Shared utilities
│   └── services/          # Core functionality
│       ├── ai/            # AI services
│       ├── analyzer/      # Analysis services
│       ├── generator/     # Theme generation
│       ├── rebrander/     # Website rebranding
│       └── deployment/    # Deployment services
```

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Cheerio**: Fast, flexible implementation of jQuery for server-side HTML parsing
- **Axios**: Promise-based HTTP client

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Originally developed as a VS Code extension
- Converted to a web application for broader accessibility
