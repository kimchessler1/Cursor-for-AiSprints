import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/d1-client";
import { MCQService, PaginationParams } from "@/lib/services/mcq-service";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/mcqs
 * List MCQs with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const created_by = searchParams.get("created_by") || undefined;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Build pagination parameters
    const params: PaginationParams = {
      page,
      limit,
      search,
      created_by: created_by || userId, // Default to current user's MCQs
    };

    // Get MCQs
    const result = await mcqService.getMCQs(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get MCQs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcqs
 * Create a new MCQ
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as {
      title: string;
      description?: string;
      question: string;
      choices: {
        choice_text: string;
        is_correct: boolean;
        order_index: number;
      }[];
    };

    // Validate required fields
    if (!body.title || !body.question || !body.choices) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Validate description length
    if (body.description && body.description.length > 500) {
      return NextResponse.json(
        { error: "Description must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Validate question length
    if (body.question.length > 1000) {
      return NextResponse.json(
        { error: "Question must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Validate choices
    if (body.choices.length < 2 || body.choices.length > 6) {
      return NextResponse.json(
        { error: "MCQ must have between 2 and 6 choices" },
        { status: 400 }
      );
    }

    // Validate choice text
    for (const choice of body.choices) {
      if (!choice.choice_text.trim()) {
        return NextResponse.json(
          { error: "All choices must have text" },
          { status: 400 }
        );
      }
    }

    // Validate exactly one correct choice
    const correctChoices = body.choices.filter((choice) => choice.is_correct);
    if (correctChoices.length !== 1) {
      return NextResponse.json(
        { error: "MCQ must have exactly one correct choice" },
        { status: 400 }
      );
    }

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Create MCQ
    const mcq = await mcqService.createMCQ(body, userId);

    return NextResponse.json(mcq, { status: 201 });
  } catch (error) {
    console.error("Create MCQ error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
