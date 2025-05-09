import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/services/ai/openai/openaiService';
import { isAuthenticated } from '@/lib/auth';
import { z } from 'zod';

// Define validation schema for request body
const requestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  options: z
    .object({
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      topP: z.number().min(0).max(1).optional(),
      frequencyPenalty: z.number().min(-2).max(2).optional(),
      presencePenalty: z.number().min(-2).max(2).optional(),
    })
    .optional(),
  structured: z.boolean().optional(),
  schema: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await isAuthenticated(request);
    if (authError) return authError;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, options, structured, schema } = validationResult.data;

    // Initialize OpenAI service
    const openaiService = new OpenAIService();

    // Generate response based on request type
    let response;
    if (structured && schema) {
      response = await openaiService.generateStructuredData(prompt, schema, options);
    } else {
      response = await openaiService.generateText(prompt, options);
    }

    return NextResponse.json({ result: response });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: `OpenAI API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
