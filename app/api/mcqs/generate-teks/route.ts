import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  TeksGenerationRequestSchema,
  MCQGenerationSchema,
  generateTeksPrompt,
  SYSTEM_PROMPT,
  validateTeksRequest,
  validateGeneratedMCQ,
} from "@/lib/mcq-generation-schema";

/**
 * POST /api/mcqs/generate-teks
 * Generate MCQ aligned to TEKS standards using AI
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate request data using Zod schema
    const validatedData = TeksGenerationRequestSchema.parse(body);

    // 3. Additional validation using helper function
    const validationErrors = validateTeksRequest(validatedData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // 4. Get environment variables (works for both local dev and Cloudflare Workers)
    let apiKey: string;
    let modelName: string;

    try {
      // Try Cloudflare environment first (for production)
      const { env } = getCloudflareContext();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloudflareEnv = env as any;
      apiKey = cloudflareEnv.OPENAI_API_KEY;
      // Use gpt-4o-mini for structured output support
      modelName = cloudflareEnv.OPENAI_MODEL || "gpt-4o-mini";
    } catch {
      // Fallback to process.env for local development
      apiKey = process.env.OPENAI_API_KEY || "";
      // Use gpt-4o-mini for structured output support
      modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    }

    if (!apiKey) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }
    console.log(`Using OpenAI model: ${modelName}`);

    // 5. Generate structured prompt
    const prompt = generateTeksPrompt(validatedData);
    console.log("Generated prompt for TEKS:", {
      subject: validatedData.subject,
      grade_level: validatedData.grade_level,
      standard_code: validatedData.standard_code,
    });

    // 6. Call OpenAI with structured output
    const startTime = Date.now();

    // Set the API key in process.env for the OpenAI client
    process.env.OPENAI_API_KEY = apiKey;

    const { object } = await generateObject({
      model: openai(modelName),
      schema: MCQGenerationSchema,
      system: SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7, // Slight creativity for engaging questions
    });
    const generationTime = Date.now() - startTime;

    console.log(`MCQ generated in ${generationTime}ms`);

    // 7. Validate generated MCQ
    const mcqValidationErrors = validateGeneratedMCQ(object);
    if (mcqValidationErrors.length > 0) {
      console.error("Generated MCQ validation failed:", mcqValidationErrors);
      return NextResponse.json(
        {
          error: "Generated content validation failed",
          details: mcqValidationErrors,
        },
        { status: 500 }
      );
    }

    // 8. Log successful generation
    console.log("Successfully generated MCQ:", {
      title: object.title,
      question_length: object.question.length,
      choices_count: object.choices.length,
      correct_choice: object.choices.findIndex((c) => c.is_correct),
    });

    // 9. Return generated MCQ
    return NextResponse.json(object);
  } catch (error) {
    console.error("TEKS MCQ generation error:", error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Handle OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service authentication failed" },
          { status: 401 }
        );
      }
      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return NextResponse.json(
          { error: "AI service rate limit exceeded" },
          { status: 429 }
        );
      }
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "AI service timeout" },
          { status: 504 }
        );
      }
      if (error.message.includes("OpenAI") || error.message.includes("AI")) {
        return NextResponse.json(
          { error: "AI generation service unavailable" },
          { status: 503 }
        );
      }
    }

    // Generic error handling
    return NextResponse.json(
      { error: "Failed to generate MCQ" },
      { status: 500 }
    );
  }
}
