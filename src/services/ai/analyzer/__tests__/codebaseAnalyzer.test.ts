import { CodebaseAnalyzer, CodeFile } from '../codebaseAnalyzer';
import { OpenAIService } from '../../openai/openaiService';

// Mock OpenAI service
jest.mock('../../openai/openaiService', () => {
  return {
    OpenAIService: jest.fn().mockImplementation(() => ({
      generateStructuredData: jest.fn(),
      generateText: jest.fn(),
    })),
  };
});

describe('CodebaseAnalyzer', () => {
  let analyzer: CodebaseAnalyzer;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new analyzer instance
    analyzer = new CodebaseAnalyzer();
    
    // Get the mocked OpenAI service
    mockOpenAIService = (analyzer as any).openAIService;
  });

  describe('analyzeCodebase', () => {
    it('should analyze a collection of code files', async () => {
      // Mock sample files
      const files: CodeFile[] = [
        {
          name: 'styles.css',
          path: 'src/styles.css',
          content: `
            :root {
              --primary-color: #3182CE;
              --secondary-color: #4299E1;
              --text-color: #1A202C;
              --background-color: #FFFFFF;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              font-size: 16px;
              line-height: 1.5;
              color: var(--text-color);
              background-color: var(--background-color);
            }
          `,
          language: 'CSS',
        },
        {
          name: 'Button.jsx',
          path: 'src/components/Button.jsx',
          content: `
            import React from 'react';
            
            const Button = ({ children, variant = 'primary', size = 'medium', ...props }) => {
              return (
                <button
                  className={\`btn btn-\${variant} btn-\${size}\`}
                  {...props}
                >
                  {children}
                </button>
              );
            };
            
            export default Button;
          `,
          language: 'JavaScript (React)',
        },
      ];

      // Mock the OpenAI responses
      mockOpenAIService.generateStructuredData
        // Mock colors extraction
        .mockResolvedValueOnce({ colors: ['#3182CE', '#4299E1', '#1A202C', '#FFFFFF'] })
        // Mock typography extraction
        .mockResolvedValueOnce({ typography: { fonts: ['Inter'], sizes: ['16px'] } })
        // Mock components extraction
        .mockResolvedValueOnce({ components: ['Button'] })
        // Mock frameworks and libraries detection
        .mockResolvedValueOnce({ frameworks: ['React'], libraries: [] })
        // Mock final analysis
        .mockResolvedValueOnce({
          summary: {
            styleConsistency: 85,
            readability: 90,
            maintainability: 80,
            overallScore: 85,
          },
          stylePatterns: {
            colors: ['#3182CE', '#4299E1', '#1A202C', '#FFFFFF'],
            typography: {
              fonts: ['Inter'],
              sizes: ['16px'],
            },
            spacing: [],
            components: ['Button'],
          },
          recommendations: {
            general: ['Consider using a CSS preprocessor like SCSS for better organization'],
            styleImprovements: ['Create a more comprehensive color palette with accent colors'],
            structureImprovements: ['Organize styles into separate files by component'],
          },
          detectedFrameworks: ['React'],
          detectedLibraries: [],
        });

      // Call the method
      const result = await analyzer.analyzeCodebase(files);

      // Verify the result
      expect(result).toEqual({
        summary: {
          styleConsistency: 85,
          readability: 90,
          maintainability: 80,
          overallScore: 85,
        },
        stylePatterns: {
          colors: ['#3182CE', '#4299E1', '#1A202C', '#FFFFFF'],
          typography: {
            fonts: ['Inter'],
            sizes: ['16px'],
          },
          spacing: [],
          components: ['Button'],
        },
        recommendations: {
          general: ['Consider using a CSS preprocessor like SCSS for better organization'],
          styleImprovements: ['Create a more comprehensive color palette with accent colors'],
          structureImprovements: ['Organize styles into separate files by component'],
        },
        detectedFrameworks: ['React'],
        detectedLibraries: [],
      });

      // Verify that OpenAI was called the expected number of times
      expect(mockOpenAIService.generateStructuredData).toHaveBeenCalledTimes(5);
    });

    it('should throw an error if no relevant files are found', async () => {
      // Mock sample files with no relevant extensions
      const files: CodeFile[] = [
        {
          name: 'README.md',
          path: 'README.md',
          content: '# Project README',
          language: 'Markdown',
        },
      ];

      // Call the method and expect it to throw
      await expect(analyzer.analyzeCodebase(files)).rejects.toThrow('No relevant files found for analysis');
    });

    it('should handle errors from OpenAI', async () => {
      // Mock sample files
      const files: CodeFile[] = [
        {
          name: 'styles.css',
          path: 'src/styles.css',
          content: 'body { color: black; }',
          language: 'CSS',
        },
      ];

      // Mock OpenAI to throw an error
      mockOpenAIService.generateStructuredData.mockRejectedValueOnce(new Error('OpenAI API error'));

      // Call the method and expect it to throw
      await expect(analyzer.analyzeCodebase(files)).rejects.toThrow('Failed to analyze codebase: OpenAI API error');
    });
  });

  describe('filterRelevantFiles', () => {
    it('should filter files based on relevant extensions', () => {
      // Create a mix of relevant and irrelevant files
      const files: CodeFile[] = [
        {
          name: 'styles.css',
          path: 'src/styles.css',
          content: 'body { color: black; }',
          language: 'CSS',
        },
        {
          name: 'README.md',
          path: 'README.md',
          content: '# Project README',
          language: 'Markdown',
        },
        {
          name: 'app.js',
          path: 'src/app.js',
          content: 'console.log("Hello");',
          language: 'JavaScript',
        },
      ];

      // Call the private method using any type assertion
      const result = (analyzer as any).filterRelevantFiles(files);

      // Verify that only CSS and JS files are included
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('styles.css');
      expect(result[1].name).toBe('app.js');
    });
  });
});
