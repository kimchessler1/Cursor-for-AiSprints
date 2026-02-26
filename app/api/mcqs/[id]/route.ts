import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/d1-client";
import { MCQService } from "@/lib/services/mcq-service";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/mcqs/[id]
 * Get a single MCQ by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Get MCQ
    const mcq = await mcqService.getMCQById(id);

    if (!mcq) {
      return NextResponse.json({ error: "MCQ not found" }, { status: 404 });
    }

    return NextResponse.json(mcq);
  } catch (error) {
    console.error("Get MCQ error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mcqs/[id]
 * Update an MCQ
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // Update MCQ
    const mcq = await mcqService.updateMCQ(id, body, userId);

    return NextResponse.json(mcq);
  } catch (error) {
    console.error("Update MCQ error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "MCQ not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcqs/[id]
 * Delete an MCQ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Delete MCQ
    await mcqService.deleteMCQ(id, userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete MCQ error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "MCQ not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
