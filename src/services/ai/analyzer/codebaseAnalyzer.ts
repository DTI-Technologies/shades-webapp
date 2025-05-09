import { OpenAIService } from '../openai/openaiService';

export interface CodeAnalysisResult {
  summary: {
    styleConsistency: number; // 0-100
    readability: number; // 0-100
    maintainability: number; // 0-100
    overallScore: number; // 0-100
  };
  stylePatterns: {
    colors: string[];
    typography: {
      fonts: string[];
      sizes: string[];
    };
    spacing: string[];
    components: string[];
  };
  recommendations: {
    general: string[];
    styleImprovements: string[];
    structureImprovements: string[];
  };
  detectedFrameworks: string[];
  detectedLibraries: string[];
}

export interface CodeFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export class CodebaseAnalyzer {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Analyze a collection of code files to identify style patterns and provide recommendations
   * @param files Array of code files to analyze
   * @returns Analysis results
   */
  public async analyzeCodebase(files: CodeFile[]): Promise<CodeAnalysisResult> {
    try {
      // Filter to only include relevant files for style analysis
      const relevantFiles = this.filterRelevantFiles(files);
      
      if (relevantFiles.length === 0) {
        throw new Error('No relevant files found for analysis');
      }

      // Extract style information from files
      const styleInfo = await this.extractStyleInformation(relevantFiles);
      
      // Generate analysis using OpenAI
      const analysis = await this.generateAnalysis(styleInfo, relevantFiles);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      throw new Error(`Failed to analyze codebase: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Filter files to only include those relevant for style analysis
   */
  private filterRelevantFiles(files: CodeFile[]): CodeFile[] {
    // Focus on files that are likely to contain style information
    const styleFileExtensions = [
      '.css', '.scss', '.less', '.sass',
      '.jsx', '.tsx', '.js', '.ts',
      '.html', '.vue', '.svelte'
    ];
    
    return files.filter(file => {
      const extension = file.path.substring(file.path.lastIndexOf('.'));
      return styleFileExtensions.includes(extension);
    });
  }

  /**
   * Extract style information from code files
   */
  private async extractStyleInformation(files: CodeFile[]): Promise<any> {
    // Group files by type for specialized analysis
    const cssFiles = files.filter(file => file.path.endsWith('.css') || file.path.endsWith('.scss') || file.path.endsWith('.less'));
    const jsxFiles = files.filter(file => file.path.endsWith('.jsx') || file.path.endsWith('.tsx'));
    const htmlFiles = files.filter(file => file.path.endsWith('.html'));
    
    // Extract color patterns
    const colors = await this.extractColors(cssFiles);
    
    // Extract typography patterns
    const typography = await this.extractTypography(cssFiles);
    
    // Extract component patterns
    const components = await this.extractComponents(jsxFiles);
    
    // Extract frameworks and libraries
    const { frameworks, libraries } = await this.detectFrameworksAndLibraries(files);
    
    return {
      colors,
      typography,
      components,
      frameworks,
      libraries
    };
  }

  /**
   * Extract color patterns from CSS files
   */
  private async extractColors(cssFiles: CodeFile[]): Promise<string[]> {
    if (cssFiles.length === 0) return [];
    
    // Combine CSS content for analysis
    const cssContent = cssFiles.map(file => file.content).join('\n');
    
    // Use OpenAI to extract color patterns
    const prompt = `
      Extract all color values from the following CSS code. 
      Return only an array of unique color values (hex, rgb, rgba, hsl, etc.).
      
      CSS code:
      ${cssContent.substring(0, 8000)} // Limit to avoid token limits
    `;
    
    const schema = {
      colors: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    };
    
    try {
      const result = await this.openAIService.generateStructuredData<{ colors: string[] }>(prompt, schema);
      return result.colors || [];
    } catch (error) {
      console.error('Error extracting colors:', error);
      return [];
    }
  }

  /**
   * Extract typography patterns from CSS files
   */
  private async extractTypography(cssFiles: CodeFile[]): Promise<{ fonts: string[], sizes: string[] }> {
    if (cssFiles.length === 0) return { fonts: [], sizes: [] };
    
    // Combine CSS content for analysis
    const cssContent = cssFiles.map(file => file.content).join('\n');
    
    // Use OpenAI to extract typography patterns
    const prompt = `
      Extract all typography-related information from the following CSS code.
      Return an object with two arrays:
      1. fonts: Array of font family names
      2. sizes: Array of font sizes
      
      CSS code:
      ${cssContent.substring(0, 8000)} // Limit to avoid token limits
    `;
    
    const schema = {
      typography: {
        type: 'object',
        properties: {
          fonts: {
            type: 'array',
            items: { type: 'string' }
          },
          sizes: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    };
    
    try {
      const result = await this.openAIService.generateStructuredData<{ typography: { fonts: string[], sizes: string[] } }>(prompt, schema);
      return result.typography || { fonts: [], sizes: [] };
    } catch (error) {
      console.error('Error extracting typography:', error);
      return { fonts: [], sizes: [] };
    }
  }

  /**
   * Extract component patterns from JSX/TSX files
   */
  private async extractComponents(jsxFiles: CodeFile[]): Promise<string[]> {
    if (jsxFiles.length === 0) return [];
    
    // Combine JSX content for analysis
    const jsxContent = jsxFiles.map(file => `// ${file.path}\n${file.content}`).join('\n\n');
    
    // Use OpenAI to extract component patterns
    const prompt = `
      Extract all React component names from the following JSX/TSX code.
      Return only an array of unique component names.
      
      JSX/TSX code:
      ${jsxContent.substring(0, 8000)} // Limit to avoid token limits
    `;
    
    const schema = {
      components: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    };
    
    try {
      const result = await this.openAIService.generateStructuredData<{ components: string[] }>(prompt, schema);
      return result.components || [];
    } catch (error) {
      console.error('Error extracting components:', error);
      return [];
    }
  }

  /**
   * Detect frameworks and libraries used in the codebase
   */
  private async detectFrameworksAndLibraries(files: CodeFile[]): Promise<{ frameworks: string[], libraries: string[] }> {
    // Look for package.json to identify dependencies
    const packageJsonFile = files.find(file => file.path.endsWith('package.json'));
    
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Categorize dependencies as frameworks or libraries
        const frameworks = [];
        const libraries = [];
        
        for (const dep in dependencies) {
          if (['react', 'vue', 'angular', 'next', 'nuxt', 'svelte'].includes(dep)) {
            frameworks.push(dep);
          } else {
            libraries.push(dep);
          }
        }
        
        return { frameworks, libraries };
      } catch (error) {
        console.error('Error parsing package.json:', error);
      }
    }
    
    // If no package.json, try to infer from imports
    const jsFiles = files.filter(file => 
      file.path.endsWith('.js') || 
      file.path.endsWith('.jsx') || 
      file.path.endsWith('.ts') || 
      file.path.endsWith('.tsx')
    );
    
    const jsContent = jsFiles.map(file => file.content).join('\n');
    
    // Use OpenAI to detect frameworks and libraries
    const prompt = `
      Analyze the following JavaScript/TypeScript code and identify all frameworks and libraries being used.
      Return an object with two arrays:
      1. frameworks: Array of framework names (e.g., React, Vue, Angular)
      2. libraries: Array of library names (e.g., lodash, axios, redux)
      
      Code:
      ${jsContent.substring(0, 8000)} // Limit to avoid token limits
    `;
    
    const schema = {
      frameworks: {
        type: 'array',
        items: { type: 'string' }
      },
      libraries: {
        type: 'array',
        items: { type: 'string' }
      }
    };
    
    try {
      const result = await this.openAIService.generateStructuredData<{ frameworks: string[], libraries: string[] }>(prompt, schema);
      return {
        frameworks: result.frameworks || [],
        libraries: result.libraries || []
      };
    } catch (error) {
      console.error('Error detecting frameworks and libraries:', error);
      return { frameworks: [], libraries: [] };
    }
  }

  /**
   * Generate the final analysis using OpenAI
   */
  private async generateAnalysis(styleInfo: any, files: CodeFile[]): Promise<CodeAnalysisResult> {
    // Create a summary of the codebase for analysis
    const filesSummary = files.map(file => `${file.path} (${file.language})`).join('\n');
    
    // Use OpenAI to generate the final analysis
    const prompt = `
      Analyze this codebase based on the extracted style information and file list.
      
      Style Information:
      ${JSON.stringify(styleInfo, null, 2)}
      
      Files:
      ${filesSummary}
      
      Generate a comprehensive analysis including:
      1. Summary with numerical scores (0-100) for style consistency, readability, maintainability, and overall score
      2. Style patterns detected (colors, typography, spacing, components)
      3. Specific recommendations for improvements
      4. Detected frameworks and libraries
      
      Return the analysis in the exact format specified by the schema.
    `;
    
    const schema = {
      summary: {
        type: 'object',
        properties: {
          styleConsistency: { type: 'number' },
          readability: { type: 'number' },
          maintainability: { type: 'number' },
          overallScore: { type: 'number' }
        }
      },
      stylePatterns: {
        type: 'object',
        properties: {
          colors: { type: 'array', items: { type: 'string' } },
          typography: {
            type: 'object',
            properties: {
              fonts: { type: 'array', items: { type: 'string' } },
              sizes: { type: 'array', items: { type: 'string' } }
            }
          },
          spacing: { type: 'array', items: { type: 'string' } },
          components: { type: 'array', items: { type: 'string' } }
        }
      },
      recommendations: {
        type: 'object',
        properties: {
          general: { type: 'array', items: { type: 'string' } },
          styleImprovements: { type: 'array', items: { type: 'string' } },
          structureImprovements: { type: 'array', items: { type: 'string' } }
        }
      },
      detectedFrameworks: { type: 'array', items: { type: 'string' } },
      detectedLibraries: { type: 'array', items: { type: 'string' } }
    };
    
    try {
      return await this.openAIService.generateStructuredData<CodeAnalysisResult>(prompt, schema);
    } catch (error) {
      console.error('Error generating analysis:', error);
      throw new Error(`Failed to generate analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
