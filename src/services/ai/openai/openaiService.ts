import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export class OpenAIService {
  /**
   * Generate text using OpenAI's API
   * @param prompt The prompt to send to OpenAI
   * @param options Configuration options for the API call
   * @returns The generated text
   */
  public async generateText(
    prompt: string,
    options: OpenAIOptions = {}
  ): Promise<string> {
    try {
      const {
        model = 'gpt-4',
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
      } = options;

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate structured data using OpenAI's API
   * @param prompt The prompt to send to OpenAI
   * @param schema The JSON schema for the expected response
   * @param options Configuration options for the API call
   * @returns The generated structured data
   */
  public async generateStructuredData<T>(
    prompt: string,
    schema: Record<string, any>,
    options: OpenAIOptions = {}
  ): Promise<T> {
    try {
      const {
        model = 'gpt-4',
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
      } = options;

      // Create a system message that instructs the model to follow the schema
      const systemMessage = `You are a helpful assistant that generates structured data. 
      Your response must be valid JSON that follows this schema: ${JSON.stringify(schema)}. 
      Do not include any explanations or text outside of the JSON object.`;

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      console.error('Error generating structured data with OpenAI:', error);
      throw new Error(`Failed to generate structured data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze text using OpenAI's API
   * @param text The text to analyze
   * @param instructions Specific instructions for the analysis
   * @param options Configuration options for the API call
   * @returns The analysis result
   */
  public async analyzeText(
    text: string,
    instructions: string,
    options: OpenAIOptions = {}
  ): Promise<string> {
    try {
      const prompt = `${instructions}\n\nText to analyze:\n${text}`;
      return await this.generateText(prompt, options);
    } catch (error) {
      console.error('Error analyzing text with OpenAI:', error);
      throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
