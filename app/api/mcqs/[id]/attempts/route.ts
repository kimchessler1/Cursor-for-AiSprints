import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/d1-client";
import { MCQService } from "@/lib/services/mcq-service";
import { getCurrentUserId } from "@/lib/auth";

/**
 * POST /api/mcqs/[id]/attempts
 * Record an attempt for an MCQ
 */
export async function POST(
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

    const { id: mcqId } = await params;

    // Parse request body
    const body = (await request.json()) as {
      selected_choice_id: string;
    };

    // Validate required fields
    if (!body.selected_choice_id) {
      return NextResponse.json(
        { error: "Selected choice ID is required" },
        { status: 400 }
      );
    }

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Record attempt
    const result = await mcqService.recordAttempt(
      mcqId,
      userId,
      body.selected_choice_id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Record attempt error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "MCQ or choice not found" },
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
 * GET /api/mcqs/[id]/attempts
 * Get user's attempts for an MCQ
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

    const { id: mcqId } = await params;

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const mcqService = new MCQService(db);

    // Get user's attempts
    const attempts = await mcqService.getUserAttempts(mcqId, userId);

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error("Get attempts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
