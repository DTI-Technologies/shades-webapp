# Shades Web Application

Shades is an AI-powered web application that creates stylized webpage themes for multiple programming languages and page types. It also provides tools for website rebranding, codebase analysis, and content deployment.

## Features

### Core Features
- **Theme Generation**: Create stylized webpage themes for multiple programming languages and page types
- **Codebase Analysis**: Analyze your codebase for style patterns, detect frameworks, and get AI-powered recommendations
- **Theme Customization**: Customize existing themes to match your brand and preferences
- **Website Rebranding**: Scrape and rebrand existing websites with your brand elements
- **Content Deployment**: Deploy themes or rebranded websites directly to various platforms

### Advanced Features
- **MongoDB Integration**: Full database support for storing themes, websites, users, and more
- **Advanced AI Features**: Enhanced OpenAI integration for sophisticated theme generation and analysis
- **Theme Marketplace**: Publish, discover, and download themes created by the community
- **Collaboration**: Work together on themes and websites with role-based permissions
- **Analytics & Insights**: Track usage, downloads, and get personalized recommendations

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- MongoDB (for database features)
- OpenAI API key (for AI features)

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

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` to add your MongoDB URI, OpenAI API key, and other required variables

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

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
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── generate-theme/
│   │   │   ├── scrape-website/
│   │   │   ├── rebrand-website/
│   │   │   ├── deploy-website/
│   │   │   ├── reviews/   # Theme reviews
│   │   │   ├── comments/  # Collaboration comments
│   │   │   ├── collaborations/
│   │   │   ├── analytics/ # Usage statistics
│   │   │   ├── users/     # User management
│   │   │   ├── openai/    # OpenAI proxy
│   │   │   └── monitoring/
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # User dashboard
│   │   │   ├── themes/    # Theme management
│   │   │   ├── websites/  # Website management
│   │   │   ├── marketplace/
│   │   │   ├── collaborations/
│   │   │   ├── analytics/ # User analytics
│   │   │   └── settings/  # User settings
│   │   ├── theme-generator/
│   │   ├── codebase-analyzer/
│   │   ├── theme-customizer/
│   │   ├── website-rebrander/
│   │   └── deployment/
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── marketplace/   # Marketplace components
│   │   └── collaboration/ # Collaboration components
│   ├── lib/               # Shared utilities
│   │   ├── mongodb.ts     # MongoDB connection
│   │   ├── mongoose.ts    # Mongoose connection
│   │   ├── auth.ts        # Auth utilities
│   │   └── logger.ts      # Logging system
│   ├── models/            # Database models
│   │   ├── User.ts        # User model
│   │   ├── Theme.ts       # Theme model
│   │   ├── Website.ts     # Website model
│   │   ├── Review.ts      # Review model
│   │   ├── Comment.ts     # Comment model
│   │   ├── Activity.ts    # Activity tracking
│   │   └── Collaboration.ts
│   └── services/          # Core functionality
│       ├── ai/            # AI services
│       │   ├── openai/    # OpenAI integration
│       │   ├── analyzer/  # Analysis services
│       │   ├── generator/ # Theme generation
│       │   └── trends/    # Design trend analysis
│       ├── rebrander/     # Website rebranding
│       └── deployment/    # Deployment services
├── middleware.ts          # Request tracking & monitoring
├── jest.config.js         # Jest configuration
└── jest.setup.js          # Jest setup
```

## Technologies Used

### Frontend
- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication for Next.js

### Backend
- **MongoDB**: NoSQL database for storing application data
- **Mongoose**: MongoDB object modeling for Node.js
- **OpenAI API**: Advanced AI capabilities for theme generation and analysis
- **Zod**: TypeScript-first schema validation

### Utilities
- **Cheerio**: Fast, flexible implementation of jQuery for server-side HTML parsing
- **Axios**: Promise-based HTTP client
- **Jest**: JavaScript testing framework
- **bcrypt**: Password hashing library

### DevOps
- **Vercel**: Deployment and hosting platform
- **Sentry**: Error tracking and monitoring

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Originally developed as a VS Code extension
- Converted to a web application for broader accessibility

## Documentation

For detailed documentation on each feature, please refer to the following:

- [Authentication System](docs/authentication.md)
- [Theme Generation](docs/theme-generation.md)
- [Theme Marketplace](docs/marketplace.md)
- [Collaboration Features](docs/collaboration.md)
- [Analytics & Insights](docs/analytics.md)
- [API Reference](docs/api-reference.md)

## Testing

Run the test suite with:

```bash
npm test
# or
yarn test
```

For test coverage:

```bash
npm run test:coverage
# or
yarn test:coverage
```
