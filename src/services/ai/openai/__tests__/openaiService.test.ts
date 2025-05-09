import { OpenAIService } from '../openaiService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('OpenAIService', () => {
  let openaiService: OpenAIService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the service
    openaiService = new OpenAIService();
    
    // Get the mocked OpenAI instance
    mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;
  });

  describe('generateText', () => {
    it('should call OpenAI API with correct parameters', async () => {
      // Mock the OpenAI response
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated text',
            },
          },
        ],
      };
      
      // Set up the mock implementation
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);
      
      // Call the method
      const result = await openaiService.generateText('Test prompt');
      
      // Check that OpenAI was called with the correct parameters
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      
      // Check the result
      expect(result).toBe('Generated text');
    });

    it('should use custom options when provided', async () => {
      // Mock the OpenAI response
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated text with custom options',
            },
          },
        ],
      };
      
      // Set up the mock implementation
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);
      
      // Call the method with custom options
      const result = await openaiService.generateText('Test prompt', {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 500,
        topP: 0.8,
        frequencyPenalty: 0.2,
        presencePenalty: 0.2,
      });
      
      // Check that OpenAI was called with the correct parameters
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.5,
        max_tokens: 500,
        top_p: 0.8,
        frequency_penalty: 0.2,
        presence_penalty: 0.2,
      });
      
      // Check the result
      expect(result).toBe('Generated text with custom options');
    });

    it('should handle errors gracefully', async () => {
      // Set up the mock to throw an error
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API error'));
      
      // Call the method and expect it to throw
      await expect(openaiService.generateText('Test prompt')).rejects.toThrow('Failed to generate text: API error');
    });
  });

  describe('generateStructuredData', () => {
    it('should call OpenAI API with correct parameters and parse JSON response', async () => {
      // Mock the OpenAI response
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"name":"Test","value":123}',
            },
          },
        ],
      };
      
      // Set up the mock implementation
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);
      
      // Define a schema
      const schema = {
        name: { type: 'string' },
        value: { type: 'number' },
      };
      
      // Call the method
      const result = await openaiService.generateStructuredData('Test prompt', schema);
      
      // Check that OpenAI was called with the correct parameters
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Test prompt' }),
        ]),
        response_format: { type: 'json_object' },
      }));
      
      // Check the result
      expect(result).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle errors gracefully', async () => {
      // Set up the mock to throw an error
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API error'));
      
      // Define a schema
      const schema = {
        name: { type: 'string' },
        value: { type: 'number' },
      };
      
      // Call the method and expect it to throw
      await expect(openaiService.generateStructuredData('Test prompt', schema)).rejects.toThrow('Failed to generate structured data: API error');
    });
  });

  describe('analyzeText', () => {
    it('should call generateText with the correct prompt', async () => {
      // Mock the generateText method
      const generateTextSpy = jest.spyOn(openaiService, 'generateText').mockResolvedValue('Analysis result');
      
      // Call the method
      const result = await openaiService.analyzeText('Sample text', 'Analyze the sentiment');
      
      // Check that generateText was called with the correct parameters
      expect(generateTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analyze the sentiment'),
        expect.any(Object)
      );
      expect(generateTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sample text'),
        expect.any(Object)
      );
      
      // Check the result
      expect(result).toBe('Analysis result');
    });

    it('should handle errors gracefully', async () => {
      // Mock the generateText method to throw an error
      jest.spyOn(openaiService, 'generateText').mockRejectedValue(new Error('API error'));
      
      // Call the method and expect it to throw
      await expect(openaiService.analyzeText('Sample text', 'Analyze the sentiment')).rejects.toThrow('Failed to analyze text: API error');
    });
  });
});
